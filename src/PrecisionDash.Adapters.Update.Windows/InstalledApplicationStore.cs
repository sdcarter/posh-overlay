using System.Text.Json;
using PrecisionDash.Application.Ports;
using PrecisionDash.Domain.Updates;

namespace PrecisionDash.Adapters.Update.Windows;

/// <summary>
/// Reads and writes the installed application record and last update transaction
/// as JSON files in %LOCALAPPDATA%\PrecisionDash\.
/// Gracefully handles missing or unreadable metadata (T039) by returning null.
/// </summary>
public sealed class InstalledApplicationStore : IInstalledApplicationStore
{
    private static readonly string BaseDir = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "PrecisionDash");

    private static readonly string RecordPath = Path.Combine(BaseDir, "install-record.json");
    private static readonly string TransactionPath = Path.Combine(BaseDir, "update-transaction.json");

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        PropertyNameCaseInsensitive = true
    };

    public async Task<InstalledApplicationRecord?> LoadAsync(CancellationToken cancellationToken = default)
    {
        if (!File.Exists(RecordPath)) return null;

        try
        {
            var json = await File.ReadAllTextAsync(RecordPath, cancellationToken);
            return JsonSerializer.Deserialize<InstalledApplicationRecord>(json, JsonOptions);
        }
        catch (Exception)
        {
            // T039: unreadable/corrupt metadata — treat as unknown install, return null
            return null;
        }
    }

    public async Task SaveAsync(InstalledApplicationRecord record, CancellationToken cancellationToken = default)
    {
        Directory.CreateDirectory(BaseDir);
        var json = JsonSerializer.Serialize(record, JsonOptions);
        await File.WriteAllTextAsync(RecordPath, json, cancellationToken);
    }

    public async Task SaveTransactionAsync(UpdateTransaction transaction, CancellationToken cancellationToken = default)
    {
        Directory.CreateDirectory(BaseDir);
        var json = JsonSerializer.Serialize(transaction, JsonOptions);
        await File.WriteAllTextAsync(TransactionPath, json, cancellationToken);
    }

    /// <summary>
    /// Bootstrap the install record from the executing assembly's version on first launch.
    /// No-op if the record already exists.
    /// </summary>
    public async Task EnsureBootstrappedAsync(CancellationToken cancellationToken = default)
    {
        if (File.Exists(RecordPath)) return;

        var assemblyVersion = System.Reflection.Assembly
            .GetEntryAssembly()?.GetName().Version?.ToString(3) ?? "0.0.0";

        var bootstrapped = new InstalledApplicationRecord
        {
            ProductId = "PrecisionDash",
            InstalledVersion = assemblyVersion,
            InstallLocation = AppContext.BaseDirectory,
            PackageIdentity = $"PrecisionDash_{assemblyVersion}_x64",
            InstalledAtUtc = DateTimeOffset.UtcNow.ToString("O")
        };

        await SaveAsync(bootstrapped, cancellationToken);
    }
}
