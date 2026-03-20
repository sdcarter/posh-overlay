namespace PrecisionDash.Domain.Updates;

/// <summary>
/// Normalized metadata for the latest compatible GitHub release.
/// </summary>
public sealed record ReleaseDescriptor
{
    public required string Version { get; init; }
    public required string PublishedAtUtc { get; init; }
    public required string ReleaseUrl { get; init; }
    public required string Channel { get; init; }
    public required string InstallerAssetName { get; init; }
    public required string InstallerAssetUrl { get; init; }
    public required string AppInstallerManifestUrl { get; init; }
    public string SignatureFingerprint { get; init; } = string.Empty;
    public bool IsPrerelease { get; init; }
    public string ReleaseNotes { get; init; } = string.Empty;
}
