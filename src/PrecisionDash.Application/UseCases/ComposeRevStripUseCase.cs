using PrecisionDash.Application.Ports;
using PrecisionDash.Domain.RevStrip;

namespace PrecisionDash.Application.UseCases;

public sealed class ComposeRevStripUseCase
{
    public RevStripState Compose(TelemetrySnapshot snapshot, CarShiftProfile profile)
    {
        var activeSegments = RevSegmentEvaluator.EvaluateActiveSegments(snapshot, profile);
        var flashMode = FlashModeResolver.Resolve(snapshot);
        return new RevStripState(activeSegments, profile.SegmentColors, flashMode);
    }
}