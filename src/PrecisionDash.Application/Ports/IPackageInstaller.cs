using PrecisionDash.Domain.Updates;

namespace PrecisionDash.Application.Ports;

/// <summary>
/// Installs a staged and verified MSIX package on the current platform.
/// </summary>
public interface IPackageInstaller
{
    /// <summary>
    /// Install the package at the given local path.
    /// Returns true on success. Returns false (rather than throwing) when the
    /// install cannot proceed due to insufficient privileges or platform mismatch.
    /// Throws on unexpected adapter-level errors.
    /// </summary>
    Task<bool> InstallAsync(string assetPath, CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns true if the current process has sufficient privileges to install packages.
    /// </summary>
    bool HasInstallPrivileges();
}
