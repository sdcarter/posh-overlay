using PrecisionDash.Domain.Updates;

namespace PrecisionDash.Application.Ports;

/// <summary>
/// Retrieves release metadata from the upstream release feed (GitHub Releases).
/// </summary>
public interface IReleaseFeedClient
{
    /// <summary>
    /// Fetch the latest stable release descriptor for the given channel.
    /// Returns null when no compatible release is found.
    /// Throws on unrecoverable feed access errors after retries.
    /// </summary>
    Task<ReleaseDescriptor?> GetLatestReleaseAsync(string channel, CancellationToken cancellationToken = default);
}
