using PrecisionDash.Application.Ports;
using PrecisionDash.Domain.Updates;

namespace PrecisionDash.Application.UseCases;

/// <summary>
/// Downloads the installer asset for a discovered release to the local staging directory.
/// </summary>
public sealed class DownloadAndStageUpdateUseCase
{
    private readonly IPackageDownloader _downloader;
    private readonly IUpdateLifecycleLogger _logger;

    public DownloadAndStageUpdateUseCase(IPackageDownloader downloader, IUpdateLifecycleLogger logger)
    {
        _downloader = downloader;
        _logger = logger;
    }

    public async Task<UpdateTransaction> ExecuteAsync(
        ReleaseDescriptor release,
        CancellationToken cancellationToken = default)
    {
        var tx = UpdateTransaction.Begin(release.Version);
        _logger.LogDownloadStarted(release);

        try
        {
            var stagedPath = await _downloader.DownloadToStagingAsync(
                release.InstallerAssetUrl,
                release.InstallerAssetName,
                cancellationToken);

            tx = tx.WithStagedAsset(stagedPath).WithState(TransactionState.Downloaded);
        }
        catch (Exception ex)
        {
            tx = tx.WithFailure(ex.Message);
            _logger.LogFailure("download", ex.Message, ex);
        }

        _logger.LogDownloadCompleted(tx);
        return tx;
    }
}
