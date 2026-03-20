using System.IO;
using PrecisionDash.App.Composition;
using Xunit;

namespace PrecisionDash.Adapters.Integration;

public sealed class TelemetryLifecycleLoggingTests
{
    private static readonly string WindowsStartupPath = Path.Combine(GetRepositoryRoot(), "src/PrecisionDash.App/WindowsStartup.cs");

    [Fact]
    public void LoggingConfig_Records_Attach_Detach_Reconnect_And_Health()
    {
        var config = new LoggingConfig();
        config.LogAttach();
        config.LogProviderHealth("ok");
        config.LogReconnect();
        config.LogDetach();

        Assert.Contains("attach", config.Events);
        Assert.Contains("provider-health:ok", config.Events);
        Assert.Contains("reconnect", config.Events);
        Assert.Contains("detach", config.Events);
    }

    [Fact]
    public void WindowsStartup_Logs_Update_Check_As_NonBlocking_Background_Work()
    {
        var source = File.ReadAllText(WindowsStartupPath);

        Assert.Contains("private async Task RunUpdateCheckAsync(CancellationToken cancellationToken)", source);
        Assert.Contains("StartupLog.Write(\"Automatic update check starting.\");", source);
        Assert.Contains("StartupLog.Write(\"Automatic update check completed.\");", source);
        Assert.Contains("StartupLog.Write($\"Update check failed (non-blocking): {ex.Message}\");", source);
        Assert.Contains("catch (OperationCanceledException) { }", source);
    }

    private static string GetRepositoryRoot()
    {
        var current = new DirectoryInfo(AppContext.BaseDirectory);

        while (current is not null)
        {
            if (File.Exists(Path.Combine(current.FullName, "PrecisionDash.sln")))
            {
                return current.FullName;
            }

            current = current.Parent;
        }

        throw new DirectoryNotFoundException("Could not locate repository root from test runtime directory.");
    }
}