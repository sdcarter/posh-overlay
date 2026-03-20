#if WINDOWS
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Windows.Forms;
using PrecisionDash.App.Composition;
using PrecisionDash.Application.Ports;
using PrecisionDash.Application.UseCases;
using PrecisionDash.Domain.RevStrip;
using PrecisionDash.Domain.Ribbon;
using PrecisionDash.Domain.Telemetry;

namespace PrecisionDash.App;

internal sealed class WindowsStartup : IDisposable
{
    private readonly ITelemetryProvider _telemetryProvider;
    private readonly NotifyIcon _trayIcon;
    private readonly OverlayForm _overlayForm;
    private readonly System.Windows.Forms.Timer _refreshTimer;
    private readonly ComposeRevStripUseCase _composeRevStripUseCase = new();
    private readonly ComposeRibbonUseCase _composeRibbonUseCase = new();
    private readonly bool _usingMockProvider;

    public WindowsStartup()
    {
        StartupLog.Write("Windows startup initializing.");

        global::System.Windows.Forms.Application.EnableVisualStyles();
        global::System.Windows.Forms.Application.SetCompatibleTextRenderingDefault(false);

        _usingMockProvider = string.Equals(Environment.GetEnvironmentVariable("PRECISIONDASH_USE_MOCK"), "1", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(Environment.GetEnvironmentVariable("PRECISIONDASH_USE_MOCK"), "true", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(Environment.GetEnvironmentVariable("PRECISIONDASH_USE_MOCK"), "yes", StringComparison.OrdinalIgnoreCase);
        _telemetryProvider = TelemetryProviderFactory.CreateFromEnvironment();
        _telemetryProvider.StartAsync(CancellationToken.None).GetAwaiter().GetResult();

        _overlayForm = new OverlayForm();
        _overlayForm.Show();
        _overlayForm.UpdateWaitingState(_usingMockProvider ? "Mock telemetry active." : "Waiting for iRacing telemetry.");

        _refreshTimer = new System.Windows.Forms.Timer { Interval = 16 };
        _refreshTimer.Tick += (_, _) => RefreshOverlay();
        _refreshTimer.Start();

        var menu = new ContextMenuStrip();
        menu.Items.Add("Show Overlay", null, (_, _) =>
        {
            _overlayForm.Show();
            _overlayForm.BringToFront();
            StartupLog.Write("Overlay shown from tray.");
        });
        menu.Items.Add("Hide Overlay", null, (_, _) =>
        {
            _overlayForm.Hide();
            StartupLog.Write("Overlay hidden from tray.");
        });
        menu.Items.Add("Exit", null, (_, _) =>
        {
            StartupLog.Write("Exit requested from tray.");
            if (_trayIcon is not null)
            {
                _trayIcon.Visible = false;
            }
            _overlayForm.Close();
            global::System.Windows.Forms.Application.ExitThread();
        });

        _trayIcon = new NotifyIcon
        {
            Text = "PrecisionDash",
            Icon = SystemIcons.Information,
            Visible = true,
            ContextMenuStrip = menu
        };

        _trayIcon.DoubleClick += (_, _) =>
        {
            _overlayForm.Show();
            _overlayForm.BringToFront();
        };

        StartupLog.Write("Tray icon initialized.");
    }

    public void Run()
    {
        StartupLog.Write("Entering Windows message loop.");
        global::System.Windows.Forms.Application.Run();
    }

    public void Dispose()
    {
        _refreshTimer.Stop();
        _refreshTimer.Dispose();
        _telemetryProvider.StopAsync(CancellationToken.None).GetAwaiter().GetResult();
        _trayIcon.Dispose();
        _overlayForm.Dispose();
        StartupLog.Write("Windows startup disposed.");
    }

    private void RefreshOverlay()
    {
        if (!_telemetryProvider.TryReadSnapshot(out var snapshot))
        {
            _overlayForm.UpdateWaitingState(_usingMockProvider ? "Mock telemetry starting." : "Waiting for iRacing telemetry.");
            return;
        }

        var profile = CarProfileComposition.ResolveProfile(snapshot.DriverCarId);
        var revStrip = _composeRevStripUseCase.Compose(snapshot, profile);
        var ribbon = _composeRibbonUseCase.Compose(snapshot);
        _overlayForm.UpdateTelemetry(snapshot, revStrip, ribbon, _usingMockProvider);
    }
}

internal sealed class OverlayForm : Form
{
    private readonly Font _titleFont = new("Segoe UI", 11, FontStyle.Bold);
    private readonly Font _metricFont = new("Segoe UI", 15, FontStyle.Bold);
    private readonly Font _ribbonFont = new("Segoe UI", 13, FontStyle.Regular);
    private readonly Font _statusFont = new("Segoe UI", 9, FontStyle.Regular);
    private RibbonState _ribbonState;
    private RevStripState _revStripState;
    private TelemetrySnapshot _snapshot;
    private string _statusText = "Waiting for iRacing telemetry.";
    private bool _hasTelemetry;
    private bool _usingMockProvider;

    public OverlayForm()
    {
        FormBorderStyle = FormBorderStyle.None;
        ShowInTaskbar = false;
        TopMost = true;
        StartPosition = FormStartPosition.Manual;
        Width = 960;
        Height = 150;
        Left = 80;
        Top = 40;
        BackColor = Color.Black;
        Opacity = 0.88;
        SetStyle(ControlStyles.AllPaintingInWmPaint | ControlStyles.UserPaint | ControlStyles.OptimizedDoubleBuffer, true);
        UpdateStyles();
        StartupLog.Write("Overlay form created.");
    }

    public void UpdateWaitingState(string statusText)
    {
        _hasTelemetry = false;
        _statusText = statusText;
        Invalidate();
    }

    public void UpdateTelemetry(TelemetrySnapshot snapshot, RevStripState revStripState, RibbonState ribbonState, bool usingMockProvider)
    {
        _snapshot = snapshot;
        _revStripState = revStripState;
        _ribbonState = ribbonState;
        _usingMockProvider = usingMockProvider;
        _statusText = usingMockProvider ? "Mock telemetry stream" : "Live iRacing telemetry stream";
        _hasTelemetry = true;
        Invalidate();
    }

    protected override void OnPaint(PaintEventArgs e)
    {
        base.OnPaint(e);

        e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
        e.Graphics.Clear(Color.FromArgb(12, 14, 18));

        using var backgroundBrush = new SolidBrush(Color.FromArgb(210, 18, 22, 28));
        using var borderPen = new Pen(Color.FromArgb(180, 90, 100, 115), 1.5f);
        var bounds = new RectangleF(8, 8, ClientSize.Width - 16, ClientSize.Height - 16);
        DrawRoundedPanel(e.Graphics, backgroundBrush, borderPen, bounds, 18f);

        DrawRevStrip(e.Graphics);
        DrawRibbon(e.Graphics);
        DrawStatus(e.Graphics);
    }

    protected override CreateParams CreateParams
    {
        get
        {
            const int WsExTransparent = 0x00000020;
            const int WsExLayered = 0x00080000;
            const int WsExTopMost = 0x00000008;

            var cp = base.CreateParams;
            cp.ExStyle |= WsExTransparent | WsExLayered | WsExTopMost;
            return cp;
        }
    }

    private void DrawRevStrip(Graphics graphics)
    {
        var segmentCount = Math.Max(_revStripState.SegmentColors?.Length ?? 0, 10);
        var stripBounds = new RectangleF(26, 24, ClientSize.Width - 52, 36);
        var gap = 6f;
        var segmentWidth = (stripBounds.Width - ((segmentCount - 1) * gap)) / segmentCount;
        var isAtRevLimiter = _snapshot.MaxRpm > 0f && _snapshot.Rpm >= (_snapshot.MaxRpm * 0.995f);
        var shouldFlash = (_revStripState.FlashMode != FlashMode.None || isAtRevLimiter) && DateTime.UtcNow.Millisecond < 160;

        for (var index = 0; index < segmentCount; index++)
        {
            var segmentX = stripBounds.X + (index * (segmentWidth + gap));
            var segmentRect = new RectangleF(segmentX, stripBounds.Y, segmentWidth, stripBounds.Height);
            var active = index < _revStripState.ActiveSegments;
            var color = active ? ResolveColor(_revStripState.SegmentColors, index) : Color.FromArgb(45, 56, 68);

            if (shouldFlash)
            {
                color = isAtRevLimiter || _revStripState.FlashMode == FlashMode.PitLimiter
                    ? Color.FromArgb(64, 196, 255)
                    : Color.FromArgb(255, 244, 92);
            }

            using var fillBrush = new SolidBrush(color);
            using var outlinePen = new Pen(Color.FromArgb(active ? 220 : 90, 255, 255, 255), active ? 1.4f : 1f);
            DrawRoundedPanel(graphics, fillBrush, outlinePen, segmentRect, 8f);
        }

        var rpmText = $"{_snapshot.Rpm:0} / {_snapshot.MaxRpm:0} RPM";
        using var titleBrush = new SolidBrush(Color.FromArgb(238, 240, 244));
        graphics.DrawString(rpmText, _titleFont, titleBrush, new PointF(28, 66));
    }

    private void DrawRibbon(Graphics graphics)
    {
        using var primaryBrush = new SolidBrush(Color.FromArgb(241, 243, 245));
        using var secondaryBrush = new SolidBrush(Color.FromArgb(180, 191, 203));

        var topLine = string.Join("   ", [
            _ribbonState.IncidentsText,
            _ribbonState.BrakeBiasText ?? "BB -",
            _ribbonState.TractionControlText ?? "TC -"
        ]);

        var source = _usingMockProvider ? "MOCK" : "LIVE";
        var bottomLine = $"{source}  Car {_snapshot.DriverCarId}  Pit {(_snapshot.PitLimiterActive ? "ON" : "OFF")}";

        graphics.DrawString(topLine, _metricFont, primaryBrush, new PointF(28, 90));
        graphics.DrawString(bottomLine, _ribbonFont, secondaryBrush, new PointF(28, 118));
    }

    private void DrawStatus(Graphics graphics)
    {
        using var brush = new SolidBrush(_hasTelemetry ? Color.FromArgb(148, 255, 209, 102) : Color.FromArgb(216, 255, 255, 255));
        var text = _hasTelemetry ? _statusText : $"PrecisionDash Overlay Running  |  {_statusText}";
        var size = graphics.MeasureString(text, _statusFont);
        graphics.DrawString(text, _statusFont, brush, new PointF(ClientSize.Width - size.Width - 26, 24));
    }

    private static Color ResolveColor(string[]? colors, int index)
    {
        if (colors is null || index >= colors.Length)
        {
            return Color.FromArgb(34, 197, 94);
        }

        try
        {
            return ColorTranslator.FromHtml(colors[index]);
        }
        catch (Exception)
        {
            return Color.FromArgb(34, 197, 94);
        }
    }

    private static void DrawRoundedPanel(Graphics graphics, Brush fillBrush, Pen borderPen, RectangleF bounds, float radius)
    {
        using var path = new GraphicsPath();
        path.AddArc(bounds.X, bounds.Y, radius, radius, 180, 90);
        path.AddArc(bounds.Right - radius, bounds.Y, radius, radius, 270, 90);
        path.AddArc(bounds.Right - radius, bounds.Bottom - radius, radius, radius, 0, 90);
        path.AddArc(bounds.X, bounds.Bottom - radius, radius, radius, 90, 90);
        path.CloseFigure();

        graphics.FillPath(fillBrush, path);
        graphics.DrawPath(borderPen, path);
    }
}
#endif