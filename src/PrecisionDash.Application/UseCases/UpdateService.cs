using PrecisionDash.Application.Ports;
using PrecisionDash.Domain.Updates;

namespace PrecisionDash.Application.UseCases;

/// <summary>
/// Implements <see cref="IUpdateService"/> by composing the individual update use cases.
/// Caches the last discovered release descriptor so callers may use the individual step methods
/// after an initial CheckForUpdatesAsync call.
/// </summary>
public sealed class UpdateService : IUpdateService
{
    private readonly CheckForUpdatesUseCase _check;
    private readonly DownloadAndStageUpdateUseCase _download;
    private readonly VerifyUpdateUseCase _verify;
    private readonly PromptAndInstallUpdateUseCase _promptInstall;

    private ReleaseDescriptor? _lastDiscoveredRelease;

    public UpdateService(
        CheckForUpdatesUseCase check,
        DownloadAndStageUpdateUseCase download,
        VerifyUpdateUseCase verify,
        PromptAndInstallUpdateUseCase promptInstall)
    {
        _check = check;
        _download = download;
        _verify = verify;
        _promptInstall = promptInstall;
    }

    public async Task<UpdateDecision> CheckForUpdatesAsync(CancellationToken cancellationToken = default)
    {
        var (decision, release) = await _check.ExecuteAsync(cancellationToken);
        _lastDiscoveredRelease = release;
        return decision;
    }

    public async Task<UpdateTransaction> DownloadUpdateAsync(
        ReleaseDescriptor release,
        CancellationToken cancellationToken = default)
    {
        var effectiveRelease = release ?? _lastDiscoveredRelease
            ?? throw new InvalidOperationException("No pending release. Call CheckForUpdatesAsync first, or provide a ReleaseDescriptor.");
        return await _download.ExecuteAsync(effectiveRelease, cancellationToken);
    }

    public async Task<UpdateTrustEnvelope> VerifyUpdateAsync(
        UpdateTransaction transaction,
        CancellationToken cancellationToken = default)
        => await _verify.ExecuteAsync(transaction, cancellationToken);

    public async Task<UpdateTransaction> PromptAndInstallAsync(
        UpdateTransaction transaction,
        UpdateTrustEnvelope trust,
        CancellationToken cancellationToken = default)
        => await _promptInstall.ExecuteAsync(transaction, trust, string.Empty, cancellationToken);

    public async Task RunAutoUpdateAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var (decision, release) = await _check.ExecuteAsync(cancellationToken);
            if (decision.Status != UpdateStatus.UpdateAvailable || release is null) return;

            var tx = await _download.ExecuteAsync(release, cancellationToken);
            if (tx.State == TransactionState.Failed) return;

            var trust = await _verify.ExecuteAsync(tx, cancellationToken);
            if (!trust.IsVerified) return;

            await _promptInstall.ExecuteAsync(tx, trust, release.ReleaseNotes, cancellationToken);
        }
        catch (OperationCanceledException)
        {
            // Expected on application shutdown — not an error.
        }
        catch (Exception)
        {
            // All per-step errors are already logged by each use case.
            // Swallow here so update failure is always non-blocking.
        }
    }
}
