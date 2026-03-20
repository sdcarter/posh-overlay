namespace PrecisionDash.Application.Ports;

/// <summary>
/// Downloads a release asset from the upstream URL to a local staging directory.
/// </summary>
public interface IPackageDownloader
{
    /// <summary>
    /// Download the file at <paramref name="url"/> and persist it to the platform staging location.
    /// Returns the absolute path of the staged file on success.
    /// Throws on unrecoverable network or I/O failures after retries.
    /// </summary>
    Task<string> DownloadToStagingAsync(string url, string fileName, CancellationToken cancellationToken = default);
}
