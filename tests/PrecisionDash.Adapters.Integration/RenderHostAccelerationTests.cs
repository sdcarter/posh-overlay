using PrecisionDash.Adapters.Rendering.Skia;
using Xunit;

namespace PrecisionDash.Adapters.Integration;

public sealed class RenderHostAccelerationTests
{
    [Fact]
    public void RenderHost_Initializes_GrContext_For_Hardware_Acceleration()
    {
        var host = new SkiaRenderHost();

        Assert.True(host.IsHardwareAccelerated);
    }
}