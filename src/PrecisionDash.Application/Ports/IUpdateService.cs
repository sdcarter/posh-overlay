using PrecisionDash.Domain.Updates;

namespace PrecisionDash.Application.Ports;

/// <summary>
/// Application-facing contract for release discovery, download, verification, and install orchestration.
/// </summary>
public interface IUpdateService
{
    /// <summary>
    /// Compare installed version against the latest compatible GitHub release.
    /// Returns CheckFailed rather than throwing for expected release-fetch failures.
    /// </summary>
    Task<UpdateDecision> CheckForUpdatesAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Download the payload for a previously identified update.
    /// Returns an UpdateTransaction in Downloaded or Failed state.
    /// </summary>
    Task<UpdateTransaction> DownloadUpdateAsync(ReleaseDescriptor release, CancellationToken cancellationToken = default);

    /// <summary>
    /// Validate cryptographic trust for the downloaded payload.
    /// Verification is fail-closed: installation is forbidden unless result is Verified.
    /// </summary>
    Task<UpdateTrustEnvelope> VerifyUpdateAsync(UpdateTransaction transaction, CancellationToken cancellationToken = default);

    /// <summary>
    /// Prompt user to install now or defer, and execute install if approved.
    /// Install failure leaves current app usable.
    /// </summary>
    Task<UpdateTransaction> PromptAndInstallAsync(UpdateTransaction transaction, UpdateTrustEnvelope trust, CancellationToken cancellationToken = default);

    /// <summary>
    /// Run the full check → download → verify → prompt → install flow in one call.
    /// Non-blocking: all failures are logged and swallowed; the current app is always left usable.
    /// </summary>
    Task RunAutoUpdateAsync(CancellationToken cancellationToken = default);
}
