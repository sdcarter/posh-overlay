using PrecisionDash.Application.Ports;
using Xunit;

namespace PrecisionDash.Adapters.Integration;

/// <summary>
/// Structural and contract tests for the installed packaging startup path.
/// Covers T014: verifies that IUpdateService contract shape is satisfied and that
/// the composition root can create a working update service with stub adapters.
/// Real Windows packaging install expectations are validated during manual T019 evidence capture.
/// </summary>
public sealed class InstalledPackagingStartupTests
{
    [Fact]
    public void IUpdateService_Contract_Exposes_All_Required_Methods()
    {
        var methods = typeof(IUpdateService).GetMethods();
        var names = methods.Select(m => m.Name).ToHashSet();

        Assert.Contains("CheckForUpdatesAsync", names);
        Assert.Contains("DownloadUpdateAsync", names);
        Assert.Contains("VerifyUpdateAsync", names);
        Assert.Contains("PromptAndInstallAsync", names);
        Assert.Contains("RunAutoUpdateAsync", names);
    }

    [Fact]
    public void UpdateService_Can_Be_Constructed_With_Stub_Adapters()
    {
        var service = StubUpdateServiceBuilder.Build();
        Assert.NotNull(service);
    }

    [Fact]
    public async Task CheckForUpdates_With_Null_Store_Returns_Ineligible_Or_CheckFailed()
    {
        var service = StubUpdateServiceBuilder.Build();
        var decision = await service.CheckForUpdatesAsync();

        // Null feed returns no release → Ineligible
        Assert.True(
            decision.Status is PrecisionDash.Domain.Updates.UpdateStatus.Ineligible
                            or PrecisionDash.Domain.Updates.UpdateStatus.CheckFailed);
    }
}

/// <summary>
/// Minimal stub service builder for packaging integration tests.
/// </summary>
internal static class StubUpdateServiceBuilder
{
    public static IUpdateService Build()
    {
        var store = new NullStore();
        var feed = new NullFeedClient();
        var downloader = new NullDownloader();
        var verifier = new NullVerifier();
        var installer = new NullInstaller();
        var prompt = new NullPrompt();
        var logger = new NullLogger();

        var check = new PrecisionDash.Application.UseCases.CheckForUpdatesUseCase(store, feed, logger);
        var download = new PrecisionDash.Application.UseCases.DownloadAndStageUpdateUseCase(downloader, logger);
        var verify = new PrecisionDash.Application.UseCases.VerifyUpdateUseCase(verifier, logger);
        var promptInstall = new PrecisionDash.Application.UseCases.PromptAndInstallUpdateUseCase(prompt, installer, store, logger);

        return new PrecisionDash.Application.UseCases.UpdateService(check, download, verify, promptInstall);
    }

    private sealed class NullStore : IInstalledApplicationStore
    {
        public Task<PrecisionDash.Domain.Updates.InstalledApplicationRecord?> LoadAsync(CancellationToken ct = default) => Task.FromResult<PrecisionDash.Domain.Updates.InstalledApplicationRecord?>(null);
        public Task SaveAsync(PrecisionDash.Domain.Updates.InstalledApplicationRecord r, CancellationToken ct = default) => Task.CompletedTask;
        public Task SaveTransactionAsync(PrecisionDash.Domain.Updates.UpdateTransaction t, CancellationToken ct = default) => Task.CompletedTask;
    }

    private sealed class NullFeedClient : IReleaseFeedClient
    {
        public Task<PrecisionDash.Domain.Updates.ReleaseDescriptor?> GetLatestReleaseAsync(string channel, CancellationToken ct = default) =>
            Task.FromResult<PrecisionDash.Domain.Updates.ReleaseDescriptor?>(null);
    }

    private sealed class NullDownloader : IPackageDownloader
    {
        public Task<string> DownloadToStagingAsync(string url, string fn, CancellationToken ct = default) => Task.FromResult(string.Empty);
    }

    private sealed class NullVerifier : ISignatureVerifier
    {
        public Task<PrecisionDash.Domain.Updates.UpdateTrustEnvelope> VerifyAsync(string p, string fp = "", CancellationToken ct = default) =>
            Task.FromResult(PrecisionDash.Domain.Updates.UpdateTrustEnvelope.Verified(p, null, null));
    }

    private sealed class NullInstaller : IPackageInstaller
    {
        public bool HasInstallPrivileges() => true;
        public Task<bool> InstallAsync(string path, CancellationToken ct = default) => Task.FromResult(true);
    }

    private sealed class NullPrompt : IUpdatePrompt
    {
        public Task<PrecisionDash.Domain.Updates.UserDecision> AskAsync(string v, string n, CancellationToken ct = default) =>
            Task.FromResult(PrecisionDash.Domain.Updates.UserDecision.Defer);
    }

    private sealed class NullLogger : IUpdateLifecycleLogger
    {
        public void LogCheckStarted(string v) { }
        public void LogCheckCompleted(PrecisionDash.Domain.Updates.UpdateDecision d) { }
        public void LogDownloadStarted(PrecisionDash.Domain.Updates.ReleaseDescriptor r) { }
        public void LogDownloadCompleted(PrecisionDash.Domain.Updates.UpdateTransaction t) { }
        public void LogVerificationStarted(string p) { }
        public void LogVerificationCompleted(PrecisionDash.Domain.Updates.UpdateTrustEnvelope t) { }
        public void LogPromptShown(string v, string n) { }
        public void LogUserDecision(PrecisionDash.Domain.Updates.UserDecision d, string v) { }
        public void LogInstallStarted(string v) { }
        public void LogInstallCompleted(string v) { }
        public void LogFailure(string phase, string reason, Exception? ex = null) { }
    }
}
