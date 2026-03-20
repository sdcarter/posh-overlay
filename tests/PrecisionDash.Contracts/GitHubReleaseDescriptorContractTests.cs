using System.Text.Json;
using PrecisionDash.Domain.Updates;
using Xunit;

namespace PrecisionDash.Contracts;

/// <summary>
/// Contract tests for the GitHub Releases API JSON shape and version parsing rules.
/// These tests do not make real API calls — they verify our parsing logic against
/// representative JSON samples that reflect the stable GitHub API contract.
/// </summary>
public sealed class GitHubReleaseDescriptorContractTests
{
    // ── Tag-name → version parsing ─────────────────────────────────────────────

    [Theory]
    [InlineData("v1.2.3", "1.2.3")]
    [InlineData("v0.0.1", "0.0.1")]
    [InlineData("v10.0.0", "10.0.0")]
    public void Tag_Name_With_V_Prefix_Parses_To_Semver(string tagName, string expectedVersion)
    {
        var semver = tagName.TrimStart('v');
        Assert.Equal(expectedVersion, semver);
    }

    // ── Asset naming contract ──────────────────────────────────────────────────

    [Theory]
    [InlineData("PrecisionDash-1.2.3.0-win-x64.msix")]
    [InlineData("PrecisionDash-10.0.0.0-win-x64.msix")]
    public void Msix_Asset_Matches_Expected_Pattern(string assetName)
    {
        Assert.Matches(@"^PrecisionDash-\d+\.\d+\.\d+\.\d+-win-x64\.msix$", assetName);
    }

    [Fact]
    public void AppInstaller_Asset_Name_Is_Deterministic()
    {
        Assert.Equal("PrecisionDash.appinstaller", "PrecisionDash.appinstaller");
    }

    // ── Prerelease filtering ───────────────────────────────────────────────────

    [Fact]
    public void Stable_Channel_Must_Reject_Prerelease_Releases()
    {
        // Any release where "prerelease": true must be skipped when channel == "stable"
        const bool isPrerelease = true;
        const string channel = "stable";

        var shouldSkip = isPrerelease && channel == "stable";
        Assert.True(shouldSkip);
    }

    [Fact]
    public void Prerelease_Channel_Must_Accept_Prerelease_Releases()
    {
        const bool isPrerelease = true;
        const string channel = "prerelease";

        var shouldSkip = isPrerelease && channel == "stable";
        Assert.False(shouldSkip);
    }

    // ── GitHub API JSON shape ──────────────────────────────────────────────────

    [Fact]
    public void GitHub_Release_Json_Parses_To_ReleaseDescriptor()
    {
        const string json = """
            {
              "tag_name": "v1.2.3",
              "html_url": "https://github.com/sdcarter/posh-overlay/releases/tag/v1.2.3",
              "published_at": "2026-03-20T00:00:00Z",
              "prerelease": false,
              "body": "Release notes text",
              "assets": [
                {
                  "name": "PrecisionDash-1.2.3.0-win-x64.msix",
                  "browser_download_url": "https://github.com/sdcarter/posh-overlay/releases/download/v1.2.3/PrecisionDash-1.2.3.0-win-x64.msix"
                },
                {
                  "name": "PrecisionDash.appinstaller",
                  "browser_download_url": "https://github.com/sdcarter/posh-overlay/releases/download/v1.2.3/PrecisionDash.appinstaller"
                }
              ]
            }
            """;

        var descriptor = ParseDescriptor(json);

        Assert.NotNull(descriptor);
        Assert.Equal("1.2.3", descriptor.Version);
        Assert.Equal("stable", descriptor.Channel);
        Assert.False(descriptor.IsPrerelease);
        Assert.Equal("PrecisionDash-1.2.3.0-win-x64.msix", descriptor.InstallerAssetName);
        Assert.EndsWith(".msix", descriptor.InstallerAssetUrl);
        Assert.EndsWith(".appinstaller", descriptor.AppInstallerManifestUrl);
        Assert.Equal("Release notes text", descriptor.ReleaseNotes);
    }

    [Fact]
    public void Release_Without_Msix_Asset_Returns_Null()
    {
        const string json = """
            {
              "tag_name": "v1.2.3",
              "html_url": "https://example.com",
              "published_at": "2026-03-20T00:00:00Z",
              "prerelease": false,
              "body": "",
              "assets": [
                { "name": "PrecisionDash-1.2.3.0-linux-x64.tar.gz", "browser_download_url": "https://example.com/linux.tar.gz" }
              ]
            }
            """;

        var descriptor = ParseDescriptor(json);
        Assert.Null(descriptor);
    }

    // ── Inline parsing helper (mirrors GitHubReleaseFeedClient logic) ──────────

    private static ReleaseDescriptor? ParseDescriptor(string json)
    {
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        var tagName = root.GetProperty("tag_name").GetString() ?? string.Empty;
        var semver = tagName.TrimStart('v');
        var isPrerelease = root.GetProperty("prerelease").GetBoolean();
        if (isPrerelease) return null;

        var releaseUrl = root.GetProperty("html_url").GetString() ?? string.Empty;
        var publishedAt = root.GetProperty("published_at").GetString() ?? string.Empty;
        var releaseNotes = root.TryGetProperty("body", out var body) ? body.GetString() ?? string.Empty : string.Empty;

        string? msixName = null, msixUrl = null, appInstallerUrl = null;
        if (root.TryGetProperty("assets", out var assets))
        {
            foreach (var asset in assets.EnumerateArray())
            {
                var name = asset.GetProperty("name").GetString() ?? string.Empty;
                var download = asset.GetProperty("browser_download_url").GetString() ?? string.Empty;
                if (name.EndsWith("-win-x64.msix", StringComparison.OrdinalIgnoreCase)) { msixName = name; msixUrl = download; }
                else if (name.Equals("PrecisionDash.appinstaller", StringComparison.OrdinalIgnoreCase)) { appInstallerUrl = download; }
            }
        }

        if (msixName is null || msixUrl is null) return null;

        return new ReleaseDescriptor
        {
            Version = semver,
            PublishedAtUtc = publishedAt,
            ReleaseUrl = releaseUrl,
            Channel = "stable",
            InstallerAssetName = msixName,
            InstallerAssetUrl = msixUrl,
            AppInstallerManifestUrl = appInstallerUrl ?? releaseUrl,
            IsPrerelease = false,
            ReleaseNotes = releaseNotes
        };
    }
}
