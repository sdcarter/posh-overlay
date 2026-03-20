namespace PrecisionDash.Adapters.Update.GitHub;

/// <summary>
/// Raised when the GitHub release feed returns an unrecoverable error (e.g., rate limiting after all retries).
/// </summary>
public sealed class UpdateFeedException : Exception
{
    public UpdateFeedException(string message) : base(message) { }
    public UpdateFeedException(string message, Exception inner) : base(message, inner) { }
}
