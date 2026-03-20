using PrecisionDash.Application.Ports;
using PrecisionDash.Domain.Updates;

namespace PrecisionDash.Adapters.Update.Windows;

/// <summary>
/// Writes structured update lifecycle events to %LOCALAPPDATA%\PrecisionDash\logs\update.log.
/// </summary>
public sealed class UpdateLifecycleLogger : IUpdateLifecycleLogger
{
    private static readonly string LogPath = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "PrecisionDash", "logs", "update.log");

    public void LogCheckStarted(string installedVersion) =>
        Append($"[CHECK_STARTED] installed_version={installedVersion}");

    public void LogCheckCompleted(UpdateDecision decision) =>
        Append($"[CHECK_COMPLETED] status={decision.Status} available={decision.AvailableVersion ?? "N/A"} reason={decision.Reason ?? "N/A"}");

    public void LogDownloadStarted(ReleaseDescriptor release) =>
        Append($"[DOWNLOAD_STARTED] version={release.Version} asset={release.InstallerAssetName}");

    public void LogDownloadCompleted(UpdateTransaction transaction) =>
        Append($"[DOWNLOAD_COMPLETED] version={transaction.TargetVersion} state={transaction.State} path={transaction.StagedAssetPath ?? "N/A"}");

    public void LogVerificationStarted(string assetPath) =>
        Append($"[VERIFY_STARTED] path={assetPath}");

    public void LogVerificationCompleted(UpdateTrustEnvelope trust) =>
        Append($"[VERIFY_COMPLETED] state={trust.SignatureState} publisher={trust.PublisherSubject ?? "N/A"} fingerprint={trust.Fingerprint ?? "N/A"}");

    public void LogPromptShown(string targetVersion, string releaseNotes) =>
        Append($"[PROMPT_SHOWN] version={targetVersion}");

    public void LogUserDecision(UserDecision decision, string targetVersion) =>
        Append($"[USER_DECISION] decision={decision} version={targetVersion}");

    public void LogInstallStarted(string targetVersion) =>
        Append($"[INSTALL_STARTED] version={targetVersion}");

    public void LogInstallCompleted(string targetVersion) =>
        Append($"[INSTALL_COMPLETED] version={targetVersion}");

    public void LogFailure(string phase, string reason, Exception? exception = null) =>
        Append($"[FAILURE] phase={phase} reason={reason}{(exception is not null ? $" exception={exception.GetType().Name}" : string.Empty)}");

    private static void Append(string entry)
    {
        try
        {
            Directory.CreateDirectory(Path.GetDirectoryName(LogPath)!);
            File.AppendAllText(LogPath, $"{DateTimeOffset.UtcNow:O} {entry}{Environment.NewLine}");
        }
        catch
        {
            // Logging must not crash the update flow
        }
    }
}
