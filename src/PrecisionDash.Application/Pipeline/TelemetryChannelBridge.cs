using System.Threading;
using System.Threading.Channels;
using System.Threading.Tasks;
using PrecisionDash.Application.Ports;

namespace PrecisionDash.Application.Pipeline;

public sealed class TelemetryChannelBridge
{
    private readonly Channel<TelemetrySnapshot> _channel;

    public TelemetryChannelBridge(int capacity = 2)
    {
        var options = new BoundedChannelOptions(capacity)
        {
            FullMode = BoundedChannelFullMode.DropOldest,
            SingleReader = true,
            SingleWriter = true,
            AllowSynchronousContinuations = false
        };
        _channel = Channel.CreateBounded<TelemetrySnapshot>(options);
    }

    public ValueTask PublishAsync(TelemetrySnapshot snapshot, CancellationToken cancellationToken) =>
        _channel.Writer.WriteAsync(snapshot, cancellationToken);

    public ValueTask<TelemetrySnapshot> ReadAsync(CancellationToken cancellationToken) =>
        _channel.Reader.ReadAsync(cancellationToken);
}