#if WINDOWS
using System;
using System.Drawing;
using System.Windows.Forms;

namespace PrecisionDash.App;

internal sealed class WindowsStartup : IDisposable
{
    private readonly NotifyIcon _trayIcon;
    private readonly OverlayForm _overlayForm;

    public WindowsStartup()
    {
        StartupLog.Write("Windows startup initializing.");

        global::System.Windows.Forms.Application.EnableVisualStyles();
        global::System.Windows.Forms.Application.SetCompatibleTextRenderingDefault(false);

        _overlayForm = new OverlayForm();
        _overlayForm.Show();

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
        _trayIcon.Dispose();
        _overlayForm.Dispose();
        StartupLog.Write("Windows startup disposed.");
    }
}

internal sealed class OverlayForm : Form
{
    public OverlayForm()
    {
        FormBorderStyle = FormBorderStyle.None;
        ShowInTaskbar = false;
        TopMost = true;
        StartPosition = FormStartPosition.Manual;
        Width = 900;
        Height = 120;
        Left = 80;
        Top = 40;
        BackColor = Color.Black;
        Opacity = 0.65;

        var label = new Label
        {
            Dock = DockStyle.Fill,
            TextAlign = ContentAlignment.MiddleCenter,
            ForeColor = Color.White,
            BackColor = Color.Transparent,
            Font = new Font("Segoe UI", 16, FontStyle.Bold),
            Text = "PrecisionDash Overlay Running"
        };

        Controls.Add(label);
        StartupLog.Write("Overlay form created.");
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
}
#endif