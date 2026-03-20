using PrecisionDash.Domain.Updates;

namespace PrecisionDash.Application.Ports;

/// <summary>
/// Presents the install-now-or-defer prompt to the user and returns their decision.
/// </summary>
public interface IUpdatePrompt
{
    /// <summary>
    /// Show the prompt for <paramref name="targetVersion"/> with the supplied release notes.
    /// Returns <see cref="UserDecision.InstallNow"/> or <see cref="UserDecision.Defer"/>.
    /// Must not throw; return Defer on unrecoverable prompt failure so the app stays usable.
    /// </summary>
    Task<UserDecision> AskAsync(
        string targetVersion,
        string releaseNotes,
        CancellationToken cancellationToken = default);
}
