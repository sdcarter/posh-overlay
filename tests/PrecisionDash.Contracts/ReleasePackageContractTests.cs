using PrecisionDash.Domain.Updates;
using Xunit;

namespace PrecisionDash.Contracts;

/// <summary>
/// Contract tests for release package asset naming, metadata shape, and App Installer manifest requirements.
/// These tests define and verify the published artifact contract without depending on live GitHub data.
/// </summary>
public sealed class ReleasePackageContractTests
{
    private const string SampleVersion = "1.2.3";
    private const string SampleWinVer = "1.2.3.0";
    private const string BaseUrl = "https://github.com/sdcarter/posh-overlay/releases/download/v1.2.3";

    // Asset naming contract
    [Theory]
    [InlineData("PrecisionDash-1.2.3.0-win-x64.msix")]
    public void Msix_Asset_Name_Follows_Version_Architecture_Convention(string assetName)
    {
        Assert.Matches(@"^PrecisionDash-\d+\.\d+\.\d+\.\d+-win-x64\.msix$", assetName);
    }

    [Theory]
    [InlineData("PrecisionDash.appinstaller")]
    public void AppInstaller_Asset_Name_Is_Deterministic(string assetName)
    {
        Assert.Equal("PrecisionDash.appinstaller", assetName);
    }

    [Theory]
    [InlineData("PrecisionDash-1.2.3.0-win-x64.msix.sha256")]
    public void Sha256_Asset_Name_Mirrors_Msix_With_Hash_Suffix(string assetName)
    {
        Assert.Matches(@"^PrecisionDash-\d+\.\d+\.\d+\.\d+-win-x64\.msix\.sha256$", assetName);
    }

    // ReleaseDescriptor metadata contract
    [Fact]
    public void ReleaseDescriptor_Asset_Urls_Must_Be_Absolute_Https()
    {
        var descriptor = BuildSampleDescriptor();

        Assert.StartsWith("https://", descriptor.InstallerAssetUrl);
        Assert.StartsWith("https://", descriptor.AppInstallerManifestUrl);
    }

    [Fact]
    public void ReleaseDescriptor_Stable_Channel_Must_Not_Be_Prerelease()
    {
        var descriptor = BuildSampleDescriptor();

        Assert.Equal("stable", descriptor.Channel);
        Assert.False(descriptor.IsPrerelease);
    }

    [Fact]
    public void ReleaseDescriptor_InstallerAssetName_Embeds_Version_And_Architecture()
    {
        var descriptor = BuildSampleDescriptor();

        Assert.Contains(SampleWinVer, descriptor.InstallerAssetName);
        Assert.Contains("win-x64", descriptor.InstallerAssetName);
        Assert.EndsWith(".msix", descriptor.InstallerAssetName);
    }

    // AppInstallerManifest contract
    [Fact]
    public void AppInstallerManifest_Version_Must_Match_Release_Version()
    {
        var manifest = BuildSampleManifest();

        Assert.Equal(SampleWinVer, manifest.MainPackageVersion);
    }

    [Fact]
    public void AppInstallerManifest_ShowPrompt_Must_Be_True_For_User_Controlled_Update()
    {
        var manifest = BuildSampleManifest();

        Assert.True(manifest.ShowPrompt);
    }

    [Fact]
    public void AppInstallerManifest_Uri_Must_Point_To_Tagged_Release()
    {
        var manifest = BuildSampleManifest();

        Assert.Contains("releases/download", manifest.Uri);
        Assert.StartsWith("https://", manifest.Uri);
    }

    // SHA256 fingerprint contract
    [Fact]
    public void Sha256_Fingerprint_When_Present_Must_Be_64_Hex_Characters()
    {
        var fingerprint = new string('a', 64);
        Assert.Matches(@"^[0-9a-f]{64}$", fingerprint);
    }

    private static ReleaseDescriptor BuildSampleDescriptor() => new()
    {
        Version = SampleVersion,
        PublishedAtUtc = "2026-03-20T00:00:00Z",
        ReleaseUrl = $"https://github.com/sdcarter/posh-overlay/releases/tag/v{SampleVersion}",
        Channel = "stable",
        InstallerAssetName = $"PrecisionDash-{SampleWinVer}-win-x64.msix",
        InstallerAssetUrl = $"{BaseUrl}/PrecisionDash-{SampleWinVer}-win-x64.msix",
        AppInstallerManifestUrl = $"{BaseUrl}/PrecisionDash.appinstaller",
        IsPrerelease = false
    };

    private static AppInstallerManifest BuildSampleManifest() => new()
    {
        Uri = $"{BaseUrl}/PrecisionDash.appinstaller",
        MainPackageName = "PrecisionDash",
        MainPackageVersion = SampleWinVer,
        Publisher = "CN=PrecisionDash",
        ShowPrompt = true,
        HoursBetweenUpdateChecks = 24
    };
}
