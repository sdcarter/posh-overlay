namespace PrecisionDash.Adapters.Rendering.Skia;

public sealed class SkiaRenderHost
{
    public object GRContext { get; } = new();

    public bool IsHardwareAccelerated => GRContext is not null;
}