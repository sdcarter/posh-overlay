using PrecisionDash.Application.Ports;
using PrecisionDash.Application.UseCases;
using Xunit;

namespace PrecisionDash.Adapters.Integration;

public sealed class RevStripBehaviorTests
{
    [Fact]
    public void RevStrip_Composes_ActiveSegments_From_Profile_Thresholds()
    {
        var useCase = new ComposeRevStripUseCase();
        var snapshot = new TelemetrySnapshot(0, 1, 5000f, 10000f, false, null, null, null, null, 0, 17, null, null);
        var profile = new CarShiftProfile(
            1,
            new[] { 0.2f, 0.4f, 0.6f, 0.8f },
            new[] { "#00ff00", "#00ff00", "#ffff00", "#ff0000" });

        var state = useCase.Compose(snapshot, profile);

        Assert.Equal(2, state.ActiveSegments);
    }
}