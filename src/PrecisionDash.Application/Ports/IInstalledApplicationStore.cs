using PrecisionDash.Domain.Updates;

namespace PrecisionDash.Application.Ports;

/// <summary>
/// Reads and writes the installed application identity record from durable local storage.
/// </summary>
public interface IInstalledApplicationStore
{
    /// <summary>
    /// Load the current install record.
    /// Returns null when metadata is absent or unreadable.
    /// </summary>
    Task<InstalledApplicationRecord?> LoadAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Persist the current install record.
    /// </summary>
    Task SaveAsync(InstalledApplicationRecord record, CancellationToken cancellationToken = default);

    /// <summary>
    /// Persist the last update transaction outcome (deferred, failed, installed).
    /// </summary>
    Task SaveTransactionAsync(UpdateTransaction transaction, CancellationToken cancellationToken = default);
}
