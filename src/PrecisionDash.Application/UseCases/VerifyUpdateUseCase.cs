using PrecisionDash.Application.Ports;
using PrecisionDash.Domain.Updates;

namespace PrecisionDash.Application.UseCases;

/// <summary>
/// Verifies the cryptographic integrity of a staged installer payload.
/// Fail-closed: a missing or invalid signature returns an Invalid envelope rather than throwing.
/// </summary>
public sealed class VerifyUpdateUseCase
{
    private readonly ISignatureVerifier _verifier;
    private readonly IUpdateLifecycleLogger _logger;

    public VerifyUpdateUseCase(ISignatureVerifier verifier, IUpdateLifecycleLogger logger)
    {
        _verifier = verifier;
        _logger = logger;
    }

    public async Task<UpdateTrustEnvelope> ExecuteAsync(
        UpdateTransaction transaction,
        CancellationToken cancellationToken = default)
    {
        var path = transaction.StagedAssetPath
            ?? throw new InvalidOperationException("Transaction has no staged asset path. DownloadAndStageUpdateUseCase must succeed first.");

        _logger.LogVerificationStarted(path);
        var trust = await _verifier.VerifyAsync(path, expectedFingerprint: "", cancellationToken);
        _logger.LogVerificationCompleted(trust);
        return trust;
    }
}
