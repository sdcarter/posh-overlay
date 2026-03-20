using System.Diagnostics;
using PrecisionDash.Application.Ports;

namespace PrecisionDash.Adapters.Update.Windows;

/// <summary>
/// Installs a signed MSIX package using PowerShell's <c>Add-AppPackage</c> cmdlet.
/// MSIX is a per-user format and does not require elevation (T041 privilege detection).
/// </summary>
public sealed class PackageInstaller : IPackageInstaller
{
    public bool HasInstallPrivileges()
    {
        // MSIX is per-user; no elevation required on Windows 10 (10.0.17134+) and later.
        // Fail if the minimum supported Windows version is not met.
        return OperatingSystem.IsWindowsVersionAtLeast(10, 0, 17134);
    }

    public async Task<bool> InstallAsync(string assetPath, CancellationToken cancellationToken = default)
    {
        // Sanitize the path to prevent command injection (OWASP: injection)
        if (string.IsNullOrWhiteSpace(assetPath) || assetPath.Contains('"'))
            throw new ArgumentException("Invalid asset path.", nameof(assetPath));

        var psi = new ProcessStartInfo
        {
            FileName = "powershell.exe",
            Arguments = $"-ExecutionPolicy Bypass -NoProfile -NonInteractive -Command \"Add-AppPackage -Path '{assetPath}'\"",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        using var process = Process.Start(psi);
        if (process is null) return false;

        await process.WaitForExitAsync(cancellationToken);
        return process.ExitCode == 0;
    }
}
