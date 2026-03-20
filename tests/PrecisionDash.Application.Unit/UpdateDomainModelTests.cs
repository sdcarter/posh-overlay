using PrecisionDash.Domain.Updates;
using Xunit;

namespace PrecisionDash.Application.Unit;

public sealed class UpdateDomainModelTests
{
    // InstalledApplicationRecord validation
    [Fact]
    public void InstalledApplicationRecord_Requires_All_Mandatory_Fields()
    {
        var record = new InstalledApplicationRecord
        {
            ProductId = "PrecisionDash",
            InstalledVersion = "1.0.0",
            InstallLocation = @"C:\Program Files\WindowsApps\PrecisionDash",
            InstalledAtUtc = DateTimeOffset.UtcNow.ToString("O"),
            PackageIdentity = "PrecisionDash_1.0.0.0_x64"
        };

        Assert.Equal("PrecisionDash", record.ProductId);
        Assert.Equal("stable", record.Channel);
    }

    // ReleaseDescriptor validation
    [Fact]
    public void ReleaseDescriptor_Exposes_All_Required_Metadata()
    {
        var desc = new ReleaseDescriptor
        {
            Version = "1.1.0",
            PublishedAtUtc = "2026-03-20T00:00:00Z",
            ReleaseUrl = "https://github.com/sdcarter/posh-overlay/releases/tag/v1.1.0",
            Channel = "stable",
            InstallerAssetName = "PrecisionDash-1.1.0.0-win-x64.msix",
            InstallerAssetUrl = "https://github.com/sdcarter/posh-overlay/releases/download/v1.1.0/PrecisionDash-1.1.0.0-win-x64.msix",
            AppInstallerManifestUrl = "https://github.com/sdcarter/posh-overlay/releases/download/v1.1.0/PrecisionDash.appinstaller"
        };

        Assert.Equal("1.1.0", desc.Version);
        Assert.False(desc.IsPrerelease);
        Assert.Equal(string.Empty, desc.SignatureFingerprint);
    }

    // UpdateDecision factory methods
    [Fact]
    public void UpdateDecision_UpToDate_Sets_Correct_Status()
    {
        var decision = UpdateDecision.UpToDate("1.0.0");

        Assert.Equal(UpdateStatus.UpToDate, decision.Status);
        Assert.Equal("1.0.0", decision.CurrentVersion);
        Assert.Null(decision.AvailableVersion);
    }

    [Fact]
    public void UpdateDecision_Available_Sets_AvailableVersion()
    {
        var decision = UpdateDecision.Available("1.0.0", "1.1.0");

        Assert.Equal(UpdateStatus.UpdateAvailable, decision.Status);
        Assert.Equal("1.1.0", decision.AvailableVersion);
    }

    [Fact]
    public void UpdateDecision_Failed_Sets_Reason()
    {
        var decision = UpdateDecision.Failed("1.0.0", "network timeout");

        Assert.Equal(UpdateStatus.CheckFailed, decision.Status);
        Assert.Equal("network timeout", decision.Reason);
    }

    [Fact]
    public void UpdateDecision_Ineligible_Sets_Reason()
    {
        var decision = UpdateDecision.Ineligible("1.0.0", "no compatible asset");

        Assert.Equal(UpdateStatus.Ineligible, decision.Status);
        Assert.NotNull(decision.Reason);
    }

    // UpdateTransaction state transitions
    [Fact]
    public void UpdateTransaction_Begin_Produces_Started_State()
    {
        var tx = UpdateTransaction.Begin("1.1.0");

        Assert.Equal(TransactionState.Started, tx.State);
        Assert.Equal("1.1.0", tx.TargetVersion);
        Assert.NotEmpty(tx.TransactionId);
    }

    [Fact]
    public void UpdateTransaction_WithState_Creates_Immutable_Copy()
    {
        var tx = UpdateTransaction.Begin("1.1.0");
        var downloaded = tx.WithState(TransactionState.Downloaded);

        Assert.Equal(TransactionState.Started, tx.State);
        Assert.Equal(TransactionState.Downloaded, downloaded.State);
        Assert.Equal(tx.TransactionId, downloaded.TransactionId);
    }

    [Fact]
    public void UpdateTransaction_WithFailure_Sets_FailureReason_And_CompletedAt()
    {
        var tx = UpdateTransaction.Begin("1.1.0");
        var failed = tx.WithFailure("download error");

        Assert.Equal(TransactionState.Failed, failed.State);
        Assert.Equal("download error", failed.FailureReason);
        Assert.NotNull(failed.CompletedAtUtc);
    }

    [Fact]
    public void UpdateTransaction_Completed_Transitions_To_Installed()
    {
        var tx = UpdateTransaction.Begin("1.1.0")
            .WithState(TransactionState.Installing)
            .Completed();

        Assert.Equal(TransactionState.Installed, tx.State);
        Assert.NotNull(tx.CompletedAtUtc);
    }

    [Fact]
    public void UpdateTransaction_WithDecision_Records_User_Choice()
    {
        var tx = UpdateTransaction.Begin("1.1.0").WithDecision(UserDecision.Defer);

        Assert.Equal(UserDecision.Defer, tx.UserDecision);
    }

    // UpdateTrustEnvelope factory methods
    [Fact]
    public void UpdateTrustEnvelope_Verified_IsVerified_Returns_True()
    {
        var trust = UpdateTrustEnvelope.Verified("/tmp/update.msix", "CN=Publisher", "abc123");

        Assert.True(trust.IsVerified);
        Assert.Equal(SignatureState.Verified, trust.SignatureState);
    }

    [Fact]
    public void UpdateTrustEnvelope_Invalid_IsVerified_Returns_False()
    {
        var trust = UpdateTrustEnvelope.Invalid("/tmp/update.msix");

        Assert.False(trust.IsVerified);
        Assert.Equal(SignatureState.Invalid, trust.SignatureState);
    }

    [Fact]
    public void UpdateTrustEnvelope_Missing_IsVerified_Returns_False()
    {
        var trust = UpdateTrustEnvelope.Missing("/tmp/update.msix");

        Assert.False(trust.IsVerified);
        Assert.Equal(SignatureState.Missing, trust.SignatureState);
    }

    // AppInstallerManifest defaults
    [Fact]
    public void AppInstallerManifest_Defaults_To_ShowPrompt_And_24h_Check()
    {
        var manifest = new AppInstallerManifest
        {
            Uri = "https://example.com/PrecisionDash.appinstaller",
            MainPackageName = "PrecisionDash",
            MainPackageVersion = "1.0.0.0",
            Publisher = "CN=PrecisionDash"
        };

        Assert.True(manifest.ShowPrompt);
        Assert.Equal(24, manifest.HoursBetweenUpdateChecks);
    }
}
