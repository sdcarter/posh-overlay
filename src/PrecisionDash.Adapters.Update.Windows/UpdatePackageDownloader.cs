using Polly;
using Polly.Retry;
using PrecisionDash.Application.Ports;

namespace PrecisionDash.Adapters.Update.Windows;

/// <summary>
/// Downloads a release asset via HTTPS with Polly exponential backoff.
/// Staged files are written to %LOCALAPPDATA%\PrecisionDash\staging\.
/// </summary>
public sealed class UpdatePackageDownloader : IPackageDownloader, IDisposable
{
    private static readonly string StagingDir = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "PrecisionDash", "staging");

    private readonly HttpClient _http;
    private readonly ResiliencePipeline<HttpResponseMessage> _pipeline;

    public UpdatePackageDownloader()
    {
        _http = new HttpClient();
        _http.DefaultRequestHeaders.UserAgent.ParseAdd("PrecisionDash/1.0");

        _pipeline = new ResiliencePipelineBuilder<HttpResponseMessage>()
            .AddRetry(new RetryStrategyOptions<HttpResponseMessage>
            {
                ShouldHandle = new PredicateBuilder<HttpResponseMessage>()
                    .Handle<HttpRequestException>()
                    .HandleResult(r => (int)r.StatusCode >= 500),
                MaxRetryAttempts = 3,
                Delay = TimeSpan.FromSeconds(3),
                BackoffType = DelayBackoffType.Exponential,
                UseJitter = true
            })
            .Build();
    }

    public async Task<string> DownloadToStagingAsync(
        string url,
        string fileName,
        CancellationToken cancellationToken = default)
    {
        Directory.CreateDirectory(StagingDir);
        var destPath = Path.Combine(StagingDir, fileName);

        var response = await _pipeline.ExecuteAsync(
            async ct => await _http.GetAsync(url, HttpCompletionOption.ResponseHeadersRead, ct),
            cancellationToken);

        response.EnsureSuccessStatusCode();

        await using var contentStream = await response.Content.ReadAsStreamAsync(cancellationToken);
        await using var fileStream = new FileStream(destPath, FileMode.Create, FileAccess.Write, FileShare.None, bufferSize: 81920, useAsync: true);
        await contentStream.CopyToAsync(fileStream, cancellationToken);

        return destPath;
    }

    public void Dispose() => _http.Dispose();
}
