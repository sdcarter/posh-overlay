using PrecisionDash.Domain.Updates;

namespace PrecisionDash.Application.Ports;

/// <summary>
/// Emits structured lifecycle events for update check, download, verify, prompt, install, defer, and failure steps.
/// </summary>
public interface IUpdateLifecycleLogger
{
    void LogCheckStarted(string installedVersion);
    void LogCheckCompleted(UpdateDecision decision);
    void LogDownloadStarted(ReleaseDescriptor release);
    void LogDownloadCompleted(UpdateTransaction transaction);
    void LogVerificationStarted(string assetPath);
    void LogVerificationCompleted(UpdateTrustEnvelope trust);
    void LogPromptShown(string targetVersion, string releaseNotes);
    void LogUserDecision(UserDecision decision, string targetVersion);
    void LogInstallStarted(string targetVersion);
    void LogInstallCompleted(string targetVersion);
    void LogFailure(string phase, string reason, Exception? exception = null);
}
