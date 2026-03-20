using PrecisionDash.Application.Ports;
using PrecisionDash.Domain.Ribbon;

namespace PrecisionDash.Adapters.Rendering.Skia;

public sealed class RibbonRenderer : IRibbonPresenter
{
    public RibbonState LastState { get; private set; }

    public void Present(RibbonState state)
    {
        LastState = state;
    }
}