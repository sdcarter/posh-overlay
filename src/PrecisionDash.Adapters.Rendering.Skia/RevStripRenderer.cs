using PrecisionDash.Application.Ports;
using PrecisionDash.Domain.RevStrip;

namespace PrecisionDash.Adapters.Rendering.Skia;

public sealed class RevStripRenderer : IRevStripPresenter
{
    public int LastRenderedSegments { get; private set; }

    public void Present(RevStripState state)
    {
        LastRenderedSegments = state.ActiveSegments;
    }
}