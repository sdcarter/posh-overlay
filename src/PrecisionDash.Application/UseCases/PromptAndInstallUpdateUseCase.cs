using PrecisionDash.Application.Ports;
using PrecisionDash.Domain.Updates;

namespace PrecisionDash.Application.UseCases;

/// <summary>
/// Presents the install-now/defer prompt, verifies privileges, executes the install, and persists the outcome.
/// Fail-safe: unverified payloads and privilege failures are rejected without leaving the app unusable.
/// </summary>
public sealed class PromptAndInstallUpdateUseCase
{
    private readonly IUpdatePrompt _prompt;
    private readonly IPackageInstaller _installer;
    private readonly IInstalledApplicationStore _store;
    private readonly IUpdateLifecycleLogger _logger;

    public PromptAndInstallUpdateUseCase(
        IUpdatePrompt prompt,
        IPackageInstaller installer,
        IInstalledApplicationStore store,
        IUpdateLifecycleLogger logger)
    {
        _prompt = prompt;
        _installer = installer;
        _store = store;
        _logger = logger;
    }

    public async Task<UpdateTransaction> ExecuteAsync(
        UpdateTransaction transaction,
        UpdateTrustEnvelope trust,
        string releaseNotes = "",
        CancellationToken cancellationToken = default)
    {
        if (!trust.IsVerified)
        {
            var rejected = transaction.WithFailure("Signature verification failed. Installation rejected.");
            await _store.SaveTransactionAsync(rejected, cancellationToken);
            _logger.LogFailure("verify-reject", rejected.FailureReason!);
            return rejected;
        }

        if (!_installer.HasInstallPrivileges())
        {
            var denied = transaction.WithFailure("Insufficient privileges to install the update.");
            await _store.SaveTransactionAsync(denied, cancellationToken);
            _logger.LogFailure("install-privileges", denied.FailureReason!);
            return denied;
        }

        _logger.LogPromptShown(transaction.TargetVersion, releaseNotes);

        UserDecision decision;
        try
        {
            decision = await _prompt.AskAsync(transaction.TargetVersion, releaseNotes, cancellationToken);
        }
        catch (Exception ex)
        {
            // Prompt failure defaults to defer so the app stays usable
            _logger.LogFailure("prompt", ex.Message, ex);
            decision = UserDecision.Defer;
        }

        transaction = transaction.WithDecision(decision);
        _logger.LogUserDecision(decision, transaction.TargetVersion);

        if (decision == UserDecision.Defer)
        {
            var deferred = transaction.WithState(TransactionState.Deferred);
            await _store.SaveTransactionAsync(deferred, cancellationToken);
            return deferred;
        }

        _logger.LogInstallStarted(transaction.TargetVersion);
        transaction = transaction.WithState(TransactionState.Installing);

        try
        {
            var success = await _installer.InstallAsync(transaction.StagedAssetPath!, cancellationToken);
            if (success)
            {
                var completed = transaction.Completed();
                await _store.SaveTransactionAsync(completed, cancellationToken);
                _logger.LogInstallCompleted(transaction.TargetVersion);
                return completed;
            }

            var failed = transaction.WithFailure("Installer returned failure. Check privilege levels and platform compatibility.");
            await _store.SaveTransactionAsync(failed, cancellationToken);
            _logger.LogFailure("install-failed", failed.FailureReason!);
            return failed;
        }
        catch (Exception ex)
        {
            var failed = transaction.WithFailure(ex.Message);
            await _store.SaveTransactionAsync(failed, cancellationToken);
            _logger.LogFailure("install-exception", ex.Message, ex);
            return failed;
        }
    }
}
