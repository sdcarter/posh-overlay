using PrecisionDash.Domain.Ribbon;

namespace PrecisionDash.Application.Ports;

public interface IRibbonPresenter
{
    void Present(RibbonState state);
}