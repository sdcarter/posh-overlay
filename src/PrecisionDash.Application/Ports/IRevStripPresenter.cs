using PrecisionDash.Domain.RevStrip;

namespace PrecisionDash.Application.Ports;

public interface IRevStripPresenter
{
    void Present(RevStripState state);
}