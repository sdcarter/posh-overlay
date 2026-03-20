using System.Threading;
using System.Threading.Tasks;
using PrecisionDash.Domain.Telemetry;

namespace PrecisionDash.Application.Ports;

public interface ITelemetryProvider
{
    ValueTask StartAsync(CancellationToken cancellationToken);
    ValueTask StopAsync(CancellationToken cancellationToken);
    bool TryReadSnapshot(out TelemetrySnapshot snapshot);
}