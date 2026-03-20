using System;
using System.Threading.Channels;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging.Abstractions;
using Polly;
using PrecisionDash.Application.Ports;
using PrecisionDash.Domain.Telemetry;
using SVappsLAB.iRacingTelemetrySDK;

namespace PrecisionDash.Adapters.Telemetry.iRacing;

public sealed class iRacingSdkTelemetryProvider : ITelemetryProvider
{
    private readonly object _sync = new();
    private readonly ResiliencePipeline _reconnectPolicy = new ResiliencePipelineBuilder()
        .AddRetry(new Polly.Retry.RetryStrategyOptions
        {
            MaxRetryAttempts = 3,
            Delay = TimeSpan.FromMilliseconds(200)
        })
        .Build();
    private CancellationTokenSource? _monitorCancellation;
    private Task? _monitorTask;
    private Task? _subscriptionTask;
    private ITelemetryClient<TelemetryData>? _client;
    private TelemetrySnapshot _latestSnapshot;
    private int _driverCarId = 1;
    private float? _lastBrakeBiasPercent;
    private int? _lastTractionControlLevel;
    private int _hasSnapshot;

    public async ValueTask StartAsync(CancellationToken cancellationToken)
    {
        if (_client is not null)
        {
            return;
        }

        await _reconnectPolicy.ExecuteAsync(async _ =>
        {
            var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            var client = TelemetryClient<TelemetryData>.Create(NullLogger.Instance, ibtOptions: null);

            _subscriptionTask = client.SubscribeToAllStreams(
                onTelemetryUpdate: data =>
                {
                    var snapshot = MapSnapshot(data, Volatile.Read(ref _driverCarId), ref _lastBrakeBiasPercent, ref _lastTractionControlLevel);
                    lock (_sync)
                    {
                        _latestSnapshot = snapshot;
                        _hasSnapshot = 1;
                    }

                    return Task.CompletedTask;
                },
                onSessionInfoUpdate: session =>
                {
                    var driverIndex = session.DriverInfo?.DriverCarIdx ?? 0;
                    var drivers = session.DriverInfo?.Drivers;

                    if (drivers is not null && driverIndex >= 0 && driverIndex < drivers.Count)
                    {
                        Volatile.Write(ref _driverCarId, drivers[driverIndex].CarID);
                    }

                    return Task.CompletedTask;
                },
                onError: error =>
                {
                    Interlocked.Exchange(ref _hasSnapshot, 0);
                    return Task.CompletedTask;
                },
                cancellationToken: linkedCts.Token);

            _monitorTask = client.Monitor(linkedCts.Token);
            _monitorCancellation = linkedCts;
            _client = client;
        });
    }

    public async ValueTask StopAsync(CancellationToken cancellationToken)
    {
        var client = _client;
        var monitorCancellation = _monitorCancellation;
        var monitorTask = _monitorTask;
        var subscriptionTask = _subscriptionTask;

        _client = null;
        _monitorCancellation = null;
        _monitorTask = null;
        _subscriptionTask = null;
        Interlocked.Exchange(ref _hasSnapshot, 0);

        if (monitorCancellation is not null)
        {
            await monitorCancellation.CancelAsync();
        }

        if (monitorTask is not null)
        {
            try
            {
                await monitorTask.WaitAsync(cancellationToken);
            }
            catch (OperationCanceledException)
            {
            }
            catch (ChannelClosedException)
            {
            }
        }

        if (subscriptionTask is not null)
        {
            try
            {
                await subscriptionTask.WaitAsync(cancellationToken);
            }
            catch (OperationCanceledException)
            {
            }
            catch (ChannelClosedException)
            {
            }
        }

        if (client is not null)
        {
            await client.DisposeAsync();
        }

        monitorCancellation?.Dispose();
    }

    public bool TryReadSnapshot(out TelemetrySnapshot snapshot)
    {
        if (Interlocked.CompareExchange(ref _hasSnapshot, 0, 0) == 0)
        {
            snapshot = default;
            return false;
        }

        lock (_sync)
        {
            snapshot = _latestSnapshot;
            return true;
        }
    }

    private static TelemetrySnapshot MapSnapshot(
        TelemetryData data,
        int driverCarId,
        ref float? lastBrakeBiasPercent,
        ref int? lastTractionControlLevel)
    {
        var maxRpm = data.PlayerCarSLShiftRPM
            ?? data.PlayerCarSLLastRPM
            ?? data.PlayerCarSLBlinkRPM
            ?? MathF.Max((data.RPM ?? 0f) * 1.05f, 1f);

        if (data.dcBrakeBias.HasValue)
        {
            lastBrakeBiasPercent = data.dcBrakeBias.Value;
        }

        if (data.dcTractionControl.HasValue)
        {
            lastTractionControlLevel = (int)MathF.Round(data.dcTractionControl.Value);
        }

        var incidentCount = data.PlayerCarMyIncidentCount
            ?? data.PlayerCarDriverIncidentCount
            ?? data.PlayerIncidents
            ?? 0;

        return new TelemetrySnapshot(
            TimestampTicks: DateTime.UtcNow.Ticks,
            DriverCarId: driverCarId,
            Rpm: data.RPM ?? 0f,
            MaxRpm: maxRpm,
            PitLimiterActive: false,
            SessionLapsRemain: data.SessionLapsRemain,
            SessionLapsTotal: data.SessionLapsTotal,
            SessionTimeRemainSeconds: data.SessionTimeRemain.HasValue ? (float)data.SessionTimeRemain.Value : null,
            SessionLastLapTimeSeconds: data.LapLastLapTime,
            IncidentCount: incidentCount,
            IncidentLimit: null,
            BrakeBiasPercent: lastBrakeBiasPercent,
            TractionControlLevel: lastTractionControlLevel);
    }
}