using PrecisionDash.Application.Ports;
using PrecisionDash.Application.UseCases;
using PrecisionDash.Domain.Updates;
using Xunit;

namespace PrecisionDash.Adapters.Integration;

/// <summary>
/// Integration tests verifying safe failure recovery across the full update pipeline.
/// Covers T029: offline, invalid-signature, and failed-install recovery scenarios.
/// </summary>
public sealed class UpdateFailureRecoveryTests
{
    [Fact]
    public async Task Feed_Failure_Results_In_CheckFailed_Not_Exception()
    {
        var service = BuildService(feedClient: new ThrowingFeedClient());

        var decision = await service.CheckForUpdatesAsync();

        Assert.Equal(UpdateStatus.CheckFailed, decision.Status);
        Assert.NotNull(decision.Reason);
    }

    [Fact]
    public async Task Download_Failure_Results_In_Failed_Transaction_Not_Exception()
    {
        var service = BuildService(downloader: new ThrowingDownloader());
        var release = MakeRelease("1.1.0");

        var tx = await service.DownloadUpdateAsync(release);

        Assert.Equal(TransactionState.Failed, tx.State);
    }

    [Fact]
    public async Task Invalid_Signature_Prevents_Install()
    {
        var installer = new TrackingInstaller();
        var service = BuildService(
            verifier: new AlwaysInvalidVerifier(),
            installer: installer,
            prompt: new InstallNowPrompt());

        var tx = UpdateTransaction.Begin("1.1.0")
            .WithState(TransactionState.Downloaded)
            .WithStagedAsset("/tmp/pkg.msix");

        var trust = await service.VerifyUpdateAsync(tx);
        Assert.False(trust.IsVerified);

        await service.PromptAndInstallAsync(tx, trust);
        Assert.False(installer.WasCalled);
    }

    [Fact]
    public async Task Install_Failure_Leaves_App_Usable()
    {
        var service = BuildService(
            installer: new FailingInstaller(),
            prompt: new InstallNowPrompt());

        var tx = UpdateTransaction.Begin("1.1.0")
            .WithState(TransactionState.Downloaded)
            .WithStagedAsset("/tmp/pkg.msix");

        var trust = UpdateTrustEnvelope.Verified("/tmp/pkg.msix", "CN=Test", null);

        var result = await service.PromptAndInstallAsync(tx, trust);

        // App must remain usable: transaction is Failed, but no exception propagated
        Assert.Equal(TransactionState.Failed, result.State);
    }

    [Fact]
    public async Task RunAutoUpdate_Does_Not_Throw_When_All_Steps_Fail()
    {
        var service = BuildService(
            feedClient: new ThrowingFeedClient());

        var ex = await Record.ExceptionAsync(() => service.RunAutoUpdateAsync());
        Assert.Null(ex);
    }

    // ── Builder ───────────────────────────────────────────────────────────────

    private static IUpdateService BuildService(
        IReleaseFeedClient? feedClient = null,
        IPackageDownloader? downloader = null,
        ISignatureVerifier? verifier = null,
        IPackageInstaller? installer = null,
        IUpdatePrompt? prompt = null)
    {
        var store = new NullStore();
        var logger = new NullLogger();

        var check = new CheckForUpdatesUseCase(store, feedClient ?? new NullFeedClient(), logger);
        var download = new DownloadAndStageUpdateUseCase(downloader ?? new SuccessDownloader("/tmp/pkg.msix"), logger);
        var verify = new VerifyUpdateUseCase(verifier ?? new AlwaysVerifiedVerifier(), logger);
        var promptInstall = new PromptAndInstallUpdateUseCase(
            prompt ?? new DeferPrompt(),
            installer ?? new NullInstaller(),
            store,
            logger);

        return new UpdateService(check, download, verify, promptInstall);
    }

    private static ReleaseDescriptor MakeRelease(string version) => new()
    {
        Version = version,
        PublishedAtUtc = "2026-03-20T00:00:00Z",
        ReleaseUrl = "https://example.com",
        Channel = "stable",
        InstallerAssetName = $"PrecisionDash-{version}.0-win-x64.msix",
        InstallerAssetUrl = "https://example.com/pkg.msix",
        AppInstallerManifestUrl = "https://example.com/PrecisionDash.appinstaller"
    };

    // ── Stubs ─────────────────────────────────────────────────────────────────

    private sealed class NullStore : IInstalledApplicationStore
    {
        public Task<InstalledApplicationRecord?> LoadAsync(CancellationToken ct = default) => Task.FromResult<InstalledApplicationRecord?>(null);
        public Task SaveAsync(InstalledApplicationRecord r, CancellationToken ct = default) => Task.CompletedTask;
        public Task SaveTransactionAsync(UpdateTransaction t, CancellationToken ct = default) => Task.CompletedTask;
    }

    private sealed class NullFeedClient : IReleaseFeedClient
    {
        public Task<ReleaseDescriptor?> GetLatestReleaseAsync(string channel, CancellationToken ct = default) =>
            Task.FromResult<ReleaseDescriptor?>(null);
    }

    private sealed class ThrowingFeedClient : IReleaseFeedClient
    {
        public Task<ReleaseDescriptor?> GetLatestReleaseAsync(string channel, CancellationToken ct = default) =>
            throw new HttpRequestException("simulated offline state");
    }

    private sealed class SuccessDownloader(string path) : IPackageDownloader
    {
        public Task<string> DownloadToStagingAsync(string url, string fn, CancellationToken ct = default) =>
            Task.FromResult(path);
    }

    private sealed class ThrowingDownloader : IPackageDownloader
    {
        public Task<string> DownloadToStagingAsync(string url, string fn, CancellationToken ct = default) =>
            throw new IOException("simulated download failure");
    }

    private sealed class AlwaysVerifiedVerifier : ISignatureVerifier
    {
        public Task<UpdateTrustEnvelope> VerifyAsync(string path, string fp = "", CancellationToken ct = default) =>
            Task.FromResult(UpdateTrustEnvelope.Verified(path, "CN=Test", null));
    }

    private sealed class AlwaysInvalidVerifier : ISignatureVerifier
    {
        public Task<UpdateTrustEnvelope> VerifyAsync(string path, string fp = "", CancellationToken ct = default) =>
            Task.FromResult(UpdateTrustEnvelope.Invalid(path));
    }

    private sealed class NullInstaller : IPackageInstaller
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
        public Task<bool> InstallAsync(string path, CancellationToken ct = default) { WasCalled = true; return Task.FromResult(true); }
    }

    private sealed class InstallNowPrompt : IUpdatePrompt
    {
        public Task<UserDecision> AskAsync(string v, string n, CancellationToken ct = default)
            => Task.FromResult(UserDecision.InstallNow);
    }

    private sealed class DeferPrompt : IUpdatePrompt
    {
        public Task<UserDecision> AskAsync(string v, string n, CancellationToken ct = default)
            => Task.FromResult(UserDecision.Defer);
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
}
