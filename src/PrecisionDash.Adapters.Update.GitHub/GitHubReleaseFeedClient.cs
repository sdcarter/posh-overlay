using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using Polly;
using Polly.Retry;
using PrecisionDash.Application.Ports;
using PrecisionDash.Domain.Updates;

namespace PrecisionDash.Adapters.Update.GitHub;

/// <summary>
/// Fetches release metadata from the GitHub Releases API with Polly-backed exponential backoff.
/// Handles rate limiting (T038) by surface an <see cref="UpdateFeedException"/> after all retries.
/// Returns null when no compatible Windows installer asset is found in the latest release (T040).
/// </summary>
public sealed class GitHubReleaseFeedClient : IReleaseFeedClient, IDisposable
{
    private const string MsixSuffix = "-win-x64.msix";
    private const string AppInstallerName = "PrecisionDash.appinstaller";

    private readonly HttpClient _http;
    private readonly ResiliencePipeline<HttpResponseMessage> _pipeline;
    private readonly string _owner;
    private readonly string _repo;

    public GitHubReleaseFeedClient(string owner, string repo)
    {
        _owner = owner;
        _repo = repo;

        _http = new HttpClient();
        _http.DefaultRequestHeaders.UserAgent.Add(new ProductInfoHeaderValue("PrecisionDash", "1.0"));
        _http.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/vnd.github+json"));
        _http.DefaultRequestHeaders.Add("X-GitHub-Api-Version", "2022-11-28");

        _pipeline = new ResiliencePipelineBuilder<HttpResponseMessage>()
            .AddRetry(new RetryStrategyOptions<HttpResponseMessage>
            {
                ShouldHandle = new PredicateBuilder<HttpResponseMessage>()
                    .Handle<HttpRequestException>()
                    .HandleResult(r => (int)r.StatusCode >= 500),
                MaxRetryAttempts = 3,
                Delay = TimeSpan.FromSeconds(2),
                BackoffType = DelayBackoffType.Exponential,
                UseJitter = true
            })
            .Build();
    }

    public async Task<ReleaseDescriptor?> GetLatestReleaseAsync(
        string channel,
        CancellationToken cancellationToken = default)
    {
        var url = $"https://api.github.com/repos/{_owner}/{_repo}/releases/latest";

        HttpResponseMessage response;
        try
        {
            response = await _pipeline.ExecuteAsync(
                async ct => await _http.GetAsync(url, ct),
                cancellationToken);
        }
        catch (HttpRequestException ex)
        {
            throw new UpdateFeedException($"Release feed unreachable after retries: {ex.Message}", ex);
        }

        // Rate limiting: 403 with X-RateLimit-Remaining: 0 or 429
        if (response.StatusCode == HttpStatusCode.TooManyRequests ||
            (response.StatusCode == HttpStatusCode.Forbidden &&
             response.Headers.TryGetValues("X-RateLimit-Remaining", out var remaining) &&
             remaining.FirstOrDefault() == "0"))
        {
            throw new UpdateFeedException("GitHub API rate limit reached. Update check will be retried on next launch.");
        }

        if (response.StatusCode == HttpStatusCode.NotFound)
        {
            // No releases published yet
            return null;
        }

        if (!response.IsSuccessStatusCode)
        {
            throw new UpdateFeedException($"GitHub Releases API returned {(int)response.StatusCode}.");
        }

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        return ParseRelease(json, channel);
    }

    private static ReleaseDescriptor? ParseRelease(string json, string channel)
    {
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        var tagName = root.GetProperty("tag_name").GetString() ?? string.Empty;
        var semver = tagName.TrimStart('v');

        var isPrerelease = root.GetProperty("prerelease").GetBoolean();
        if (isPrerelease && channel == "stable") return null;

        var releaseUrl = root.GetProperty("html_url").GetString() ?? string.Empty;
        var publishedAt = root.GetProperty("published_at").GetString() ?? string.Empty;
        var releaseNotes = root.TryGetProperty("body", out var body) ? body.GetString() ?? string.Empty : string.Empty;

        string? msixName = null;
        string? msixUrl = null;
        string? appInstallerUrl = null;

        if (root.TryGetProperty("assets", out var assets))
        {
            foreach (var asset in assets.EnumerateArray())
            {
                var name = asset.GetProperty("name").GetString() ?? string.Empty;
                var download = asset.GetProperty("browser_download_url").GetString() ?? string.Empty;

                if (name.EndsWith(MsixSuffix, StringComparison.OrdinalIgnoreCase))
                {
                    msixName = name;
                    msixUrl = download;
                }
                else if (name.Equals(AppInstallerName, StringComparison.OrdinalIgnoreCase))
                {
                    appInstallerUrl = download;
                }
            }
        }

        // T040: No compatible Windows installer asset → return null (ineligible, not an error)
        if (msixName is null || msixUrl is null) return null;

        return new ReleaseDescriptor
        {
            Version = semver,
            PublishedAtUtc = publishedAt,
            ReleaseUrl = releaseUrl,
            Channel = isPrerelease ? "prerelease" : "stable",
            InstallerAssetName = msixName,
            InstallerAssetUrl = msixUrl,
            AppInstallerManifestUrl = appInstallerUrl ?? releaseUrl,
            IsPrerelease = isPrerelease,
            ReleaseNotes = releaseNotes
        };
    }

    public void Dispose() => _http.Dispose();
}
