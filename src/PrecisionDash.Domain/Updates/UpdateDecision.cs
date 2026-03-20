namespace PrecisionDash.Domain.Updates;

public enum UpdateStatus
{
    UpToDate,
    UpdateAvailable,
    Ineligible,
    CheckFailed
}

/// <summary>
/// Result of evaluating installed state against the newest compatible release.
/// </summary>
public sealed record UpdateDecision
{
    public required UpdateStatus Status { get; init; }
    public required string CurrentVersion { get; init; }
    public string? AvailableVersion { get; init; }
    public string? Reason { get; init; }
    public required string CheckedAtUtc { get; init; }

    public static UpdateDecision UpToDate(string currentVersion) => new()
    {
        Status = UpdateStatus.UpToDate,
        CurrentVersion = currentVersion,
        CheckedAtUtc = DateTimeOffset.UtcNow.ToString("O")
    };

    public static UpdateDecision Available(string currentVersion, string availableVersion) => new()
    {
        Status = UpdateStatus.UpdateAvailable,
        CurrentVersion = currentVersion,
        AvailableVersion = availableVersion,
        CheckedAtUtc = DateTimeOffset.UtcNow.ToString("O")
    };

    public static UpdateDecision Failed(string currentVersion, string reason) => new()
    {
        Status = UpdateStatus.CheckFailed,
        CurrentVersion = currentVersion,
        Reason = reason,
        CheckedAtUtc = DateTimeOffset.UtcNow.ToString("O")
    };

    public static UpdateDecision Ineligible(string currentVersion, string reason) => new()
    {
        Status = UpdateStatus.Ineligible,
        CurrentVersion = currentVersion,
        Reason = reason,
        CheckedAtUtc = DateTimeOffset.UtcNow.ToString("O")
    };
}
