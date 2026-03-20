using PrecisionDash.Application.Ports;
using PrecisionDash.Application.UseCases;
using PrecisionDash.Domain.Updates;
using Xunit;

namespace PrecisionDash.Application.Unit;

/// <summary>
/// Verifies failure-safe behaviour across CheckForUpdates, Download, Verify, and PromptAndInstall use cases.
/// Uses inline stubs in place of real adapters so no Windows or network dependencies are required.
/// </summary>
public sealed class UpdateFailureHandlingTests
{
    // ── CheckForUpdatesUseCase ────────────────────────────────────────────────

    [Fact]
    public async Task CheckForUpdates_Returns_CheckFailed_When_Feed_Throws()
    {
        var useCase = new CheckForUpdatesUseCase(
            store: new NullStore(),
            feedClient: new ThrowingFeedClient("network timeout"),
            logger: new NullLogger());

        var (decision, release) = await useCase.ExecuteAsync();

        Assert.Equal(UpdateStatus.CheckFailed, decision.Status);
        Assert.Contains("network timeout", decision.Reason);
        Assert.Null(release);
    }

    [Fact]
    public async Task CheckForUpdates_Returns_Ineligible_When_No_Compatible_Asset()
    {
        var useCase = new CheckForUpdatesUseCase(
            store: new NullStore(),
            feedClient: new NullFeedClient(),
            logger: new NullLogger());

        var (decision, release) = await useCase.ExecuteAsync();

        Assert.Equal(UpdateStatus.Ineligible, decision.Status);
        Assert.Null(release);
    }

    [Fact]
    public async Task CheckForUpdates_Returns_UpToDate_When_Installed_Is_Latest()
    {
        var useCase = new CheckForUpdatesUseCase(
            store: new FixedVersionStore("2.0.0"),
            feedClient: new FixedReleaseFeedClient("1.0.0"),
            logger: new NullLogger());

        var (decision, release) = await useCase.ExecuteAsync();

        Assert.Equal(UpdateStatus.UpToDate, decision.Status);
        Assert.Null(release);
    }

    // ── DownloadAndStageUpdateUseCase ──────────────────────────────────────────

    [Fact]
    public async Task Download_Returns_Failed_Transaction_When_Downloader_Throws()
    {
        var useCase = new DownloadAndStageUpdateUseCase(
            downloader: new ThrowingDownloader("I/O error"),
            logger: new NullLogger());

        var release = MakeRelease("1.1.0");
        var tx = await useCase.ExecuteAsync(release);

        Assert.Equal(TransactionState.Failed, tx.State);
        Assert.Contains("I/O error", tx.FailureReason);
    }

    [Fact]
    public async Task Download_Returns_Downloaded_Transaction_On_Success()
    {
        var useCase = new DownloadAndStageUpdateUseCase(
            downloader: new SuccessDownloader("/tmp/pkg.msix"),
            logger: new NullLogger());

        var release = MakeRelease("1.1.0");
        var tx = await useCase.ExecuteAsync(release);

        Assert.Equal(TransactionState.Downloaded, tx.State);
        Assert.Equal("/tmp/pkg.msix", tx.StagedAssetPath);
    }

    // ── PromptAndInstallUpdateUseCase ──────────────────────────────────────────

    [Fact]
    public async Task PromptInstall_Rejects_Invalid_Trust_Without_Installing()
    {
        var installer = new TrackingInstaller();
        var useCase = new PromptAndInstallUpdateUseCase(
            prompt: new InstallNowPrompt(),
            installer: installer,
            store: new NullStore(),
            logger: new NullLogger());

        var tx = UpdateTransaction.Begin("1.1.0")
            .WithState(TransactionState.Downloaded)
            .WithStagedAsset("/tmp/pkg.msix");

        var trust = UpdateTrustEnvelope.Invalid("/tmp/pkg.msix");

        var result = await useCase.ExecuteAsync(tx, trust);

        Assert.Equal(TransactionState.Failed, result.State);
        Assert.False(installer.WasCalled);
    }

    [Fact]
    public async Task PromptInstall_Records_Deferred_State_When_User_Defers()
    {
        var useCase = new PromptAndInstallUpdateUseCase(
            prompt: new DeferPrompt(),
            installer: new SuccessInstaller(),
            store: new NullStore(),
            logger: new NullLogger());

        var tx = UpdateTransaction.Begin("1.1.0")
            .WithState(TransactionState.Downloaded)
            .WithStagedAsset("/tmp/pkg.msix");

        var trust = UpdateTrustEnvelope.Verified("/tmp/pkg.msix", "CN=Test", null);

        var result = await useCase.ExecuteAsync(tx, trust);

        Assert.Equal(TransactionState.Deferred, result.State);
        Assert.Equal(UserDecision.Defer, result.UserDecision);
    }

    [Fact]
    public async Task PromptInstall_Leaves_App_Usable_When_Installer_Fails()
    {
        var useCase = new PromptAndInstallUpdateUseCase(
            prompt: new InstallNowPrompt(),
            installer: new FailingInstaller(),
            store: new NullStore(),
            logger: new NullLogger());

        var tx = UpdateTransaction.Begin("1.1.0")
            .WithState(TransactionState.Downloaded)
            .WithStagedAsset("/tmp/pkg.msix");

        var trust = UpdateTrustEnvelope.Verified("/tmp/pkg.msix", "CN=Test", null);

        var result = await useCase.ExecuteAsync(tx, trust);

        // App must stay usable: transaction is Failed, but no exception propagated
        Assert.Equal(TransactionState.Failed, result.State);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static ReleaseDescriptor MakeRelease(string version) => new()
    {
        Version = version,
        PublishedAtUtc = "2026-03-20T00:00:00Z",
        ReleaseUrl = "https://example.com",
        Channel = "stable",
        InstallerAssetName = $"PrecisionDash-{version}.0-win-x64.msix",
        InstallerAssetUrl = "https://example.com/PrecisionDash.msix",
        AppInstallerManifestUrl = "https://example.com/PrecisionDash.appinstaller"
    };

    // ── Stubs ─────────────────────────────────────────────────────────────────

    private sealed class NullStore : IInstalledApplicationStore
    {
        public Task<InstalledApplicationRecord?> LoadAsync(CancellationToken ct = default) => Task.FromResult<InstalledApplicationRecord?>(null);
        public Task SaveAsync(InstalledApplicationRecord r, CancellationToken ct = default) => Task.CompletedTask;
        public Task SaveTransactionAsync(UpdateTransaction t, CancellationToken ct = default) => Task.CompletedTask;
    }

    private sealed class FixedVersionStore(string version) : IInstalledApplicationStore
    {
        public Task<InstalledApplicationRecord?> LoadAsync(CancellationToken ct = default) => Task.FromResult<InstalledApplicationRecord?>(new InstalledApplicationRecord
        {
            ProductId = "PrecisionDash",
            InstalledVersion = version,
            InstallLocation = "/",
            PackageIdentity = $"PrecisionDash_{version}_x64",
            InstalledAtUtc = DateTimeOffset.UtcNow.ToString("O")
        });
        public Task SaveAsync(InstalledApplicationRecord r, CancellationToken ct = default) => Task.CompletedTask;
        public Task SaveTransactionAsync(UpdateTransaction t, CancellationToken ct = default) => Task.CompletedTask;
    }

    private sealed class ThrowingFeedClient(string message) : IReleaseFeedClient
    {
        public Task<ReleaseDescriptor?> GetLatestReleaseAsync(string channel, CancellationToken ct = default) =>
            throw new HttpRequestException(message);
    }

    private sealed class NullFeedClient : IReleaseFeedClient
    {
        public Task<ReleaseDescriptor?> GetLatestReleaseAsync(string channel, CancellationToken ct = default) =>
            Task.FromResult<ReleaseDescriptor?>(null);
    }

    private sealed class FixedReleaseFeedClient(string version) : IReleaseFeedClient
    {
        public Task<ReleaseDescriptor?> GetLatestReleaseAsync(string channel, CancellationToken ct = default)
        {
            return Task.FromResult<ReleaseDescriptor?>(new ReleaseDescriptor
            {
                Version = version,
                PublishedAtUtc = "2026-01-01T00:00:00Z",
                ReleaseUrl = "https://example.com",
                Channel = "stable",
                InstallerAssetName = $"PrecisionDash-{version}.0-win-x64.msix",
                InstallerAssetUrl = "https://example.com/pkg.msix",
                AppInstallerManifestUrl = "https://example.com/PrecisionDash.appinstaller"
            });
        }
    }

    private sealed class NullLogger : IUpdateLifecycleLogger
    {
        public void LogCheckStarted(string v) { }
        public void LogCheckCompleted(UpdateDecision d) { }
        public void LogDownloadStarted(ReleaseDescriptor r) { }
        public void LogDownloadCompleted(UpdateTransaction t) { }
        public void LogVerificationStarted(string p) { }
        public void LogVerificationCompleted(UpdateTrustEnvelope t) { }
        public void LogPromptShown(string v, string n) { }
        public void LogUserDecision(UserDecision d, string v) { }
        public void LogInstallStarted(string v) { }
        public void LogInstallCompleted(string v) { }
        public void LogFailure(string phase, string reason, Exception? ex = null) { }
    }

    private sealed class ThrowingDownloader(string message) : IPackageDownloader
    {
        public Task<string> DownloadToStagingAsync(string url, string fn, CancellationToken ct = default) =>
            throw new IOException(message);
    }

    private sealed class SuccessDownloader(string path) : IPackageDownloader
    {
        public Task<string> DownloadToStagingAsync(string url, string fn, CancellationToken ct = default) =>
            Task.FromResult(path);
    }

    private sealed class InstallNowPrompt : IUpdatePrompt
    {
        public Task<UserDecision> AskAsync(string v, string n, CancellationToken ct = default) =>
            Task.FromResult(UserDecision.InstallNow);
    }

    private sealed class DeferPrompt : IUpdatePrompt
    {
        public Task<UserDecision> AskAsync(string v, string n, CancellationToken ct = default) =>
            Task.FromResult(UserDecision.Defer);
    }

    private sealed class SuccessInstaller : IPackageInstaller
    {
        public bool HasInstallPrivileges() => true;
        public Task<bool> InstallAsync(string path, CancellationToken ct = default) => Task.FromResult(true);
    }

    private sealed class FailingInstaller : IPackageInstaller
    {
        public bool HasInstallPrivileges() => true;
        public Task<bool> InstallAsync(string path, CancellationToken ct = default) => Task.FromResult(false);
    }

    private sealed class TrackingInstaller : IPackageInstaller
    {
        public bool WasCalled { get; private set; }
        public bool HasInstallPrivileges() => true;
        public Task<bool> InstallAsync(string path, CancellationToken ct = default)
        {
            WasCalled = true;
            return Task.FromResult(true);
        }
    }
}
