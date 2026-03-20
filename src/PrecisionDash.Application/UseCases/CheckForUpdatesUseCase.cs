using PrecisionDash.Application.Ports;
using PrecisionDash.Domain.Updates;

namespace PrecisionDash.Application.UseCases;

/// <summary>
/// Compares the locally installed version against the latest release from the feed.
/// Returns both the decision and the release descriptor needed for subsequent download.
/// </summary>
public sealed class CheckForUpdatesUseCase
{
    private readonly IInstalledApplicationStore _store;
    private readonly IReleaseFeedClient _feedClient;
    private readonly IUpdateLifecycleLogger _logger;

    public CheckForUpdatesUseCase(
        IInstalledApplicationStore store,
        IReleaseFeedClient feedClient,
        IUpdateLifecycleLogger logger)
    {
        _store = store;
        _feedClient = feedClient;
        _logger = logger;
    }

    public async Task<(UpdateDecision Decision, ReleaseDescriptor? Release)> ExecuteAsync(
        CancellationToken cancellationToken = default)
    {
        InstalledApplicationRecord? record;
        try
        {
            record = await _store.LoadAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogFailure("check-read-metadata", ex.Message, ex);
            record = null;
        }

        var installed = record?.InstalledVersion ?? "0.0.0";
        _logger.LogCheckStarted(installed);

        ReleaseDescriptor? release;
        try
        {
            release = await _feedClient.GetLatestReleaseAsync("stable", cancellationToken);
        }
        catch (Exception ex)
        {
            var failed = UpdateDecision.Failed(installed, ex.Message);
            _logger.LogCheckCompleted(failed);
            return (failed, null);
        }

        if (release is null)
        {
            var ineligible = UpdateDecision.Ineligible(installed, "No compatible Windows installer asset found in the latest release.");
            _logger.LogCheckCompleted(ineligible);
            return (ineligible, null);
        }

        UpdateDecision decision;
        if (IsNewerVersion(release.Version, installed))
        {
            decision = UpdateDecision.Available(installed, release.Version);
        }
        else
        {
            decision = UpdateDecision.UpToDate(installed);
            release = null;
        }

        _logger.LogCheckCompleted(decision);
        return (decision, release);
    }

    private static bool IsNewerVersion(string available, string installed)
    {
        if (!TryParseNormalized(available, out var avail)) return false;
        if (!TryParseNormalized(installed, out var curr)) return true;
        return avail > curr;
    }

    private static bool TryParseNormalized(string versionStr, out Version version)
    {
        var parts = versionStr.Split('.');
        var normalized = string.Join(".", parts.Take(3));
        return Version.TryParse(normalized, out version!);
    }
}
