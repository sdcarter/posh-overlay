namespace PrecisionDash.Domain.Updates;

/// <summary>
/// Published Windows update manifest describing install source and update behavior.
/// </summary>
public sealed record AppInstallerManifest
{
    public required string Uri { get; init; }
    public required string MainPackageName { get; init; }
    public required string MainPackageVersion { get; init; }
    public required string Publisher { get; init; }
    public int HoursBetweenUpdateChecks { get; init; } = 24;
    public bool ShowPrompt { get; init; } = true;
}
