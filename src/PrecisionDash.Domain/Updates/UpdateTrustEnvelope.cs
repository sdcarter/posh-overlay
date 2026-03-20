namespace PrecisionDash.Domain.Updates;

public enum SignatureState
{
    Verified,
    Invalid,
    Missing,
    UntrustedPublisher
}

/// <summary>
/// Trust and verification data attached to a downloaded update payload.
/// </summary>
public sealed record UpdateTrustEnvelope
{
    public required string AssetPath { get; init; }
    public required SignatureState SignatureState { get; init; }
    public string? PublisherSubject { get; init; }
    public string? Fingerprint { get; init; }
    public required string VerifiedAtUtc { get; init; }

    public bool IsVerified => SignatureState == SignatureState.Verified;

    public static UpdateTrustEnvelope Verified(string assetPath, string? publisherSubject, string? fingerprint) => new()
    {
        AssetPath = assetPath,
        SignatureState = SignatureState.Verified,
        PublisherSubject = publisherSubject,
        Fingerprint = fingerprint,
        VerifiedAtUtc = DateTimeOffset.UtcNow.ToString("O")
    };

    public static UpdateTrustEnvelope Invalid(string assetPath) => new()
    {
        AssetPath = assetPath,
        SignatureState = SignatureState.Invalid,
        VerifiedAtUtc = DateTimeOffset.UtcNow.ToString("O")
    };

    public static UpdateTrustEnvelope Missing(string assetPath) => new()
    {
        AssetPath = assetPath,
        SignatureState = SignatureState.Missing,
        VerifiedAtUtc = DateTimeOffset.UtcNow.ToString("O")
    };
}
