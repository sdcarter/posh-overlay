using PrecisionDash.Application.Ports;
using PrecisionDash.Application.UseCases;
using Xunit;

namespace PrecisionDash.Adapters.Integration;

public sealed class RibbonLatencyTests
{
    [Fact]
    public void Ribbon_Composition_Completes_Within_2ms_P95_Bound_For_Test_Window()
    {
        var useCase = new ComposeRibbonUseCase();
        var timings = new long[50];
        var snapshot = new TelemetrySnapshot(0, 1, 5000f, 9000f, false, 10, 20, null, 90, 2, 17, 54.0f, 3);

        for (var i = 0; i < timings.Length; i++)
        {
            var start = System.Diagnostics.Stopwatch.GetTimestamp();
            _ = useCase.Compose(snapshot);
            var end = System.Diagnostics.Stopwatch.GetTimestamp();
            timings[i] = (end - start) * 1000 / System.Diagnostics.Stopwatch.Frequency;
        }

        System.Array.Sort(timings);
        var p95 = timings[(int)(timings.Length * 0.95) - 1];
        Assert.True(p95 <= 2);
    }
}