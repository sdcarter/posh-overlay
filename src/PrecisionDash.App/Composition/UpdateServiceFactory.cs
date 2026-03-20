#if WINDOWS
using PrecisionDash.Adapters.Update.GitHub;
using PrecisionDash.Adapters.Update.Windows;
using PrecisionDash.Application.Ports;
using PrecisionDash.Application.UseCases;

namespace PrecisionDash.App.Composition;

/// <summary>
/// Wires the full update service graph: GitHub adapter → Windows adapter → Application use cases.
/// </summary>
public static class UpdateServiceFactory
{
    private const string Owner = "sdcarter";
    private const string Repo = "posh-overlay";

    public static IUpdateService Create(WinFormsUpdatePrompt prompt)
    {
        var store = new InstalledApplicationStore();
        var feedClient = new GitHubReleaseFeedClient(Owner, Repo);
        var downloader = new UpdatePackageDownloader();
        var verifier = new SignatureVerifier();
        var installer = new PackageInstaller();
        var logger = new UpdateLifecycleLogger();

        var check = new CheckForUpdatesUseCase(store, feedClient, logger);
        var download = new DownloadAndStageUpdateUseCase(downloader, logger);
        var verify = new VerifyUpdateUseCase(verifier, logger);
        var promptInstall = new PromptAndInstallUpdateUseCase(prompt, installer, store, logger);

        return new UpdateService(check, download, verify, promptInstall);
    }

    /// <summary>
    /// Bootstrap the install record from the executing assembly version on first launch.
    /// </summary>
    public static async Task EnsureInstalledRecordAsync(CancellationToken cancellationToken = default)
    {
        var store = new InstalledApplicationStore();
        await store.EnsureBootstrappedAsync(cancellationToken);
    }
}
#endif
