using PrecisionDash.Application.Ports;
using PrecisionDash.Domain.Ribbon;

namespace PrecisionDash.Application.UseCases;

public sealed class ComposeRibbonUseCase
{
    public RibbonState Compose(TelemetrySnapshot snapshot)
    {
        var progress = LapProgressCalculator.Calculate(snapshot);
        var incidents = IncidentFormatter.Format(snapshot);
        var brakeBias = ControlDialMapper.BrakeBias(snapshot);
        var tc = ControlDialMapper.TractionControl(snapshot);
        return new RibbonState(progress, incidents, brakeBias, tc);
    }
}