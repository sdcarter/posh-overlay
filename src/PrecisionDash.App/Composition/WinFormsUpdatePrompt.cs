#if WINDOWS
using System.Windows.Forms;
using PrecisionDash.Application.Ports;
using PrecisionDash.Domain.Updates;

namespace PrecisionDash.App.Composition;

/// <summary>
/// Presents the install-now/defer update prompt as a Windows Forms MessageBox.
/// Must be invoked on the UI thread (handled internally via Invoke).
/// </summary>
public sealed class WinFormsUpdatePrompt : IUpdatePrompt
{
    private readonly Control _uiControl;

    public WinFormsUpdatePrompt(Control uiControl)
    {
        _uiControl = uiControl;
    }

    public Task<UserDecision> AskAsync(
        string targetVersion,
        string releaseNotes,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var notes = string.IsNullOrWhiteSpace(releaseNotes)
                ? string.Empty
                : $"\n\nWhat's new:\n{releaseNotes.Trim()}";

            var message = $"PrecisionDash {targetVersion} is ready to install.{notes}\n\nInstall now?";
            const string caption = "PrecisionDash Update";

            DialogResult result;
            if (_uiControl.InvokeRequired)
            {
                result = (DialogResult)_uiControl.Invoke(
                    () => MessageBox.Show(_uiControl, message, caption, MessageBoxButtons.YesNo, MessageBoxIcon.Information));
            }
            else
            {
                result = MessageBox.Show(_uiControl, message, caption, MessageBoxButtons.YesNo, MessageBoxIcon.Information);
            }

            return Task.FromResult(result == DialogResult.Yes ? UserDecision.InstallNow : UserDecision.Defer);
        }
        catch
        {
            return Task.FromResult(UserDecision.Defer);
        }
    }
}
#endif
