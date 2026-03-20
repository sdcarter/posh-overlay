using PrecisionDash.Application.Ports;
using PrecisionDash.Application.UseCases;
using PrecisionDash.Domain.Ribbon;
using PrecisionDash.Domain.Telemetry;

namespace PrecisionDash.Application.Pipeline;

public sealed class FrameComposer
{
    private readonly ComposeRevStripUseCase _useCase = new();
    private readonly ComposeRibbonUseCase _ribbonUseCase = new();
    private readonly IRevStripPresenter _revStripPresenter;
    private readonly IRibbonPresenter _ribbonPresenter;

    public FrameComposer(IRevStripPresenter revStripPresenter, IRibbonPresenter ribbonPresenter)
    {
        _revStripPresenter = revStripPresenter;
        _ribbonPresenter = ribbonPresenter;
    }

    public void ComposeAndRender(TelemetrySnapshot snapshot, CarShiftProfile profile)
    {
        var revStripState = _useCase.Compose(snapshot, profile);
        _revStripPresenter.Present(revStripState);

        RibbonState ribbonState = _ribbonUseCase.Compose(snapshot);
        _ribbonPresenter.Present(ribbonState);
    }
}