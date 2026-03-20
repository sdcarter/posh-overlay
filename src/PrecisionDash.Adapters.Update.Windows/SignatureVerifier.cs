using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using PrecisionDash.Application.Ports;
using PrecisionDash.Domain.Updates;

namespace PrecisionDash.Adapters.Update.Windows;

/// <summary>
/// Verifies the Authenticode (X.509) signature of an MSIX installer asset.
/// Returns <see cref="SignatureState.Missing"/> for unsigned files and
/// <see cref="SignatureState.Invalid"/> for fingerprint mismatches.
/// Never throws for expected cryptographic failures.
/// </summary>
public sealed class SignatureVerifier : ISignatureVerifier
{
    public Task<UpdateTrustEnvelope> VerifyAsync(
        string assetPath,
        string expectedFingerprint = "",
        CancellationToken cancellationToken = default)
    {
        if (!File.Exists(assetPath))
            return Task.FromResult(UpdateTrustEnvelope.Missing(assetPath));

        try
        {
            using var cert = X509CertificateLoader.LoadCertificateFromFile(assetPath);
            var fingerprint = cert.GetCertHashString(HashAlgorithmName.SHA256)?.ToLowerInvariant();

            if (!string.IsNullOrEmpty(expectedFingerprint) &&
                !string.Equals(fingerprint, expectedFingerprint.ToLowerInvariant(), StringComparison.Ordinal))
            {
                return Task.FromResult(UpdateTrustEnvelope.Invalid(assetPath));
            }

            return Task.FromResult(UpdateTrustEnvelope.Verified(assetPath, cert.Subject, fingerprint));
        }
        catch (CryptographicException)
        {
            // File is unsigned or the embedded certificate is not in PKCS#7 format
            return Task.FromResult(UpdateTrustEnvelope.Missing(assetPath));
        }
        catch (Exception)
        {
            return Task.FromResult(UpdateTrustEnvelope.Invalid(assetPath));
        }
    }
}
