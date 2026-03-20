using PrecisionDash.Application.Ports;
using PrecisionDash.Application.UseCases;
using PrecisionDash.Domain.Updates;
using Xunit;

namespace PrecisionDash.Adapters.Integration;

/// <summary>
/// Integration tests covering the full automatic update flow.
/// Uses stub adapters — no network or Windows packaging dependencies required.
/// Covers T021: update discovery, staged download, verification, and install-now/defer prompt.
/// </summary>
public sealed class AutoUpdateFlowTests
{
    [Fact]
    public async Task Full_Update_Flow_Installs_When_User_Confirms()
    {
        var installer = new TrackingInstaller();
        var service = BuildService(
            installedVersion: "1.0.0",
            availableVersion: "1.1.0",
            userDecision: UserDecision.InstallNow,
            installer: installer);

        await service.RunAutoUpdateAsync();

        Assert.True(installer.WasCalled, "Installer must be invoked when user selects Install Now.");
    }

    [Fact]
    public async Task Full_Update_Flow_Skips_Install_When_User_Defers()
    {
        var installer = new TrackingInstaller();
        var service = BuildService(
            installedVersion: "1.0.0",
            availableVersion: "1.1.0",
            userDecision: UserDecision.Defer,
            installer: installer);

        await service.RunAutoUpdateAsync();

        Assert.False(installer.WasCalled, "Installer must NOT be invoked when user defers.");
    }

    [Fact]
    public async Task Full_Update_Flow_Skips_Install_When_Already_UpToDate()
    {
        var installer = new TrackingInstaller();
        var service = BuildService(
            installedVersion: "1.1.0",
            availableVersion: "1.1.0",
            userDecision: UserDecision.InstallNow,
            installer: installer);

        await service.RunAutoUpdateAsync();

        Assert.False(installer.WasCalled, "Installer must NOT be invoked when already up-to-date.");
    }

    [Fact]
    public async Task Full_Update_Flow_Does_Not_Throw_When_Feed_Is_Down()
    {
        var service = BuildServiceWithBrokenFeed();
        var ex = await Record.ExceptionAsync(() => service.RunAutoUpdateAsync());
        Assert.Null(ex);
    }

    [Fact]
    public async Task Full_Update_Flow_Does_Not_Throw_When_Download_Fails()
    {
        var service = BuildServiceWithBrokenDownloader();
        var ex = await Record.ExceptionAsync(() => service.RunAutoUpdateAsync());
        Assert.Null(ex);
    }

    // ── Builder helpers ───────────────────────────────────────────────────────

    private static IUpdateService BuildService(
        string installedVersion,
        string availableVersion,
        UserDecision userDecision,
        TrackingInstaller installer)
    {
        var store = new FixedVersionStore(installedVersion);
        var feed = new FixedReleaseFeedClient(availableVersion);
        var downloader = new SuccessDownloader("/tmp/pkg.msix");
        var verifier = new AlwaysVerifiedSignatureVerifier();
        var prompt = new FixedPrompt(userDecision);
        var logger = new NullLogger();

        var check = new CheckForUpdatesUseCase(store, feed, logger);
        var download = new DownloadAndStageUpdateUseCase(downloader, logger);
        var verify = new VerifyUpdateUseCase(verifier, logger);
        var promptInstall = new PromptAndInstallUpdateUseCase(prompt, installer, store, logger);

        return new UpdateService(check, download, verify, promptInstall);
    }

    private static IUpdateService BuildServiceWithBrokenFeed()
    {
        var store = new FixedVersionStore("1.0.0");
        var feed = new ThrowingFeedClient();
        var downloader = new SuccessDownloader("/tmp/pkg.msix");
        var verifier = new AlwaysVerifiedSignatureVerifier();
        var prompt = new FixedPrompt(UserDecision.InstallNow);
        var logger = new NullLogger();

        var check = new CheckForUpdatesUseCase(store, feed, logger);
        var download = new DownloadAndStageUpdateUseCase(downloader, logger);
        var verify = new VerifyUpdateUseCase(verifier, logger);
        var promptInstall = new PromptAndInstallUpdateUseCase(prompt, new TrackingInstaller(), store, logger);

        return new UpdateService(check, download, verify, promptInstall);
    }

    private static IUpdateService BuildServiceWithBrokenDownloader()
    {
        var store = new FixedVersionStore("1.0.0");
        var feed = new FixedReleaseFeedClient("1.1.0");
        var downloader = new ThrowingDownloader();
        var verifier = new AlwaysVerifiedSignatureVerifier();
        var prompt = new FixedPrompt(UserDecision.InstallNow);
        var logger = new NullLogger();

        var check = new CheckForUpdatesUseCase(store, feed, logger);
        var download = new DownloadAndStageUpdateUseCase(downloader, logger);
        var verify = new VerifyUpdateUseCase(verifier, logger);
        var promptInstall = new PromptAndInstallUpdateUseCase(prompt, new TrackingInstaller(), store, logger);

        return new UpdateService(check, download, verify, promptInstall);
    }

    // ── Stubs ─────────────────────────────────────────────────────────────────

    private sealed class FixedVersionStore(string version) : IInstalledApplicationStore
    {
        public Task<InstalledApplicationRecord?> LoadAsync(CancellationToken ct = default) =>
            Task.FromResult<InstalledApplicationRecord?>(new InstalledApplicationRecord
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

    private sealed class FixedReleaseFeedClient(string version) : IReleaseFeedClient
    {
        public Task<ReleaseDescriptor?> GetLatestReleaseAsync(string channel, CancellationToken ct = default) =>
            Task.FromResult<ReleaseDescriptor?>(new ReleaseDescriptor
            {
                Version = version,
                PublishedAtUtc = "2026-03-20T00:00:00Z",
                ReleaseUrl = "https://example.com",
                Channel = "stable",
                InstallerAssetName = $"PrecisionDash-{version}.0-win-x64.msix",
                InstallerAssetUrl = "https://example.com/PrecisionDash.msix",
                AppInstallerManifestUrl = "https://example.com/PrecisionDash.appinstaller"
            });
    }

    private sealed class ThrowingFeedClient : IReleaseFeedClient
    {
        public Task<ReleaseDescriptor?> GetLatestReleaseAsync(string channel, CancellationToken ct = default) =>
            throw new HttpRequestException("simulated network failure");
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

    private sealed class AlwaysVerifiedSignatureVerifier : ISignatureVerifier
    {
        public Task<UpdateTrustEnvelope> VerifyAsync(string path, string fp = "", CancellationToken ct = default) =>
            Task.FromResult(UpdateTrustEnvelope.Verified(path, "CN=Test", null));
    }

    private sealed class FixedPrompt(UserDecision decision) : IUpdatePrompt
    {
        public Task<UserDecision> AskAsync(string v, string n, CancellationToken ct = default) =>
            Task.FromResult(decision);
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
