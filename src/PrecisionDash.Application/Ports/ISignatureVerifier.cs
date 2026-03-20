using PrecisionDash.Domain.Updates;

namespace PrecisionDash.Application.Ports;

/// <summary>
/// Verifies the cryptographic integrity and Authenticode trust of a downloaded installer asset.
/// Implementations are fail-closed: an unreadable or unsigned file must return Invalid or Missing.
/// </summary>
public interface ISignatureVerifier
{
    /// <summary>
    /// Verify the Authenticode signature of the asset at <paramref name="assetPath"/>.
    /// When <paramref name="expectedFingerprint"/> is non-empty the certificate SHA-256 fingerprint
    /// is compared; an empty string skips fingerprint pinning and only checks for a valid signature.
    /// Never throws for expected cryptographic failures — those are returned as Invalid/Missing envelopes.
    /// </summary>
    Task<UpdateTrustEnvelope> VerifyAsync(
        string assetPath,
        string expectedFingerprint = "",
        CancellationToken cancellationToken = default);
}
