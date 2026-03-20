namespace PrecisionDash.Domain.Updates;

/// <summary>
/// Local representation of an installed PrecisionDash instance.
/// </summary>
public sealed record InstalledApplicationRecord
{
    public required string ProductId { get; init; }
    public required string InstalledVersion { get; init; }
    public required string InstallLocation { get; init; }
    public string Channel { get; init; } = "stable";
    public required string InstalledAtUtc { get; init; }
    public required string PackageIdentity { get; init; }
}
