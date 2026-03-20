using System;
using System.Threading;
using System.Threading.Tasks;
using PrecisionDash.Application.Ports;

namespace PrecisionDash.Adapters.Telemetry.Mock;

public sealed class MockTelemetryProvider : ITelemetryProvider
{
    public ValueTask StartAsync(CancellationToken cancellationToken) => ValueTask.CompletedTask;

    public ValueTask StopAsync(CancellationToken cancellationToken) => ValueTask.CompletedTask;

    public bool TryReadSnapshot(out TelemetrySnapshot snapshot)
    {
        snapshot = new TelemetrySnapshot(
            TimestampTicks: DateTime.UtcNow.Ticks,
            DriverCarId: 1,
            Rpm: 5500f,
            MaxRpm: 9000f,
            PitLimiterActive: false,
            SessionLapsRemain: 11f,
            SessionLapsTotal: 20f,
            SessionTimeRemainSeconds: null,
            SessionLastLapTimeSeconds: 92.3f,
            IncidentCount: 2,
            IncidentLimit: 17,
            BrakeBiasPercent: 54.2f,
            TractionControlLevel: 2
        );
        return true;
    }
}