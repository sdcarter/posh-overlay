namespace PrecisionDash.Adapters.Windowing.Win32;

public static class OverlayWindow
{
    public const int WS_EX_TOPMOST = 0x00000008;
    public const int WS_EX_TRANSPARENT = 0x00000020;
    public const int WS_EX_LAYERED = 0x00080000;

    public static int CombinedExtendedStyles => WS_EX_TOPMOST | WS_EX_TRANSPARENT | WS_EX_LAYERED;
}