using System.IO;
using PrecisionDash.App.Composition;
using Xunit;

namespace PrecisionDash.Adapters.Integration;

public sealed class DeterministicStartupTests
{
    private static readonly string WindowsStartupPath = Path.Combine(GetRepositoryRoot(), "src/PrecisionDash.App/WindowsStartup.cs");

    [Fact]
    public void ProviderFactory_Creates_Mock_Provider_Without_Live_Process()
    {
        var provider = TelemetryProviderFactory.Create(useMock: true);
        Assert.NotNull(provider);
    }

    [Fact]
    public void WindowsStartup_Schedules_Update_Check_Off_The_Refresh_Loop()
    {
        var source = File.ReadAllText(WindowsStartupPath);

        Assert.Contains("_ = Task.Run(() => RunUpdateCheckAsync(_updateCts.Token));", source);
        Assert.Contains("_refreshTimer.Tick += (_, _) => RefreshOverlay();", source);

        var refreshOverlayStart = source.IndexOf("private void RefreshOverlay()", StringComparison.Ordinal);
        var overlayFormStart = source.IndexOf("internal sealed class OverlayForm", StringComparison.Ordinal);
        var refreshOverlayBody = source.Substring(refreshOverlayStart, overlayFormStart - refreshOverlayStart);

        Assert.DoesNotContain("RunAutoUpdateAsync", refreshOverlayBody);
        Assert.DoesNotContain("UpdateServiceFactory", refreshOverlayBody);
    }

    [Fact]
    public void WindowsStartup_Preserves_ClickThrough_Window_Styles()
    {
        var source = File.ReadAllText(WindowsStartupPath);

        Assert.Contains("const int WsExTransparent = 0x00000020;", source);
        Assert.Contains("const int WsExLayered = 0x00080000;", source);
        Assert.Contains("const int WsExTopMost = 0x00000008;", source);
        Assert.Contains("cp.ExStyle |= WsExTransparent | WsExLayered | WsExTopMost;", source);
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