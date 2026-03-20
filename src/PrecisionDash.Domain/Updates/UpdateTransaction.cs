namespace PrecisionDash.Domain.Updates;

public enum TransactionState
{
    Started,
    Downloaded,
    Verified,
    Prompted,
    Deferred,
    Installing,
    Installed,
    Failed
}

public enum UserDecision
{
    None,
    InstallNow,
    Defer
}

/// <summary>
/// One lifecycle instance of downloading, validating, and installing an update.
/// </summary>
public sealed record UpdateTransaction
{
    public required string TransactionId { get; init; }
    public required string TargetVersion { get; init; }
    public required TransactionState State { get; init; }
    public required string StartedAtUtc { get; init; }
    public string? CompletedAtUtc { get; init; }
    public string? FailureReason { get; init; }
    public UserDecision UserDecision { get; init; } = UserDecision.None;
    public string? StagedAssetPath { get; init; }

    public UpdateTransaction WithState(TransactionState state) =>
        this with { State = state };

    public UpdateTransaction WithFailure(string reason) =>
        this with { State = TransactionState.Failed, FailureReason = reason, CompletedAtUtc = DateTimeOffset.UtcNow.ToString("O") };

    public UpdateTransaction WithDecision(UserDecision decision) =>
        this with { UserDecision = decision };

    public UpdateTransaction WithStagedAsset(string path) =>
        this with { StagedAssetPath = path };

    public UpdateTransaction Completed() =>
        this with { State = TransactionState.Installed, CompletedAtUtc = DateTimeOffset.UtcNow.ToString("O") };

    public static UpdateTransaction Begin(string targetVersion) => new()
    {
        TransactionId = Guid.NewGuid().ToString("N"),
        TargetVersion = targetVersion,
        State = TransactionState.Started,
        StartedAtUtc = DateTimeOffset.UtcNow.ToString("O")
    };
}
