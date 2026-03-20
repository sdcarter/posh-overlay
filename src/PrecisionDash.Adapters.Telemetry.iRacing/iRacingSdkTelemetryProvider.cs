using System;
using System.Threading;
using System.Threading.Tasks;
using Polly;
using PrecisionDash.Application.Ports;
using PrecisionDash.Domain.Telemetry;

namespace PrecisionDash.Adapters.Telemetry.iRacing;

public sealed class iRacingSdkTelemetryProvider : ITelemetryProvider
{
    private readonly ResiliencePipeline _reconnectPolicy = new ResiliencePipelineBuilder()
        .AddRetry(new Polly.Retry.RetryStrategyOptions
        {
            MaxRetryAttempts = 3,
            Delay = TimeSpan.FromMilliseconds(200)
        })
        .Build();

    public ValueTask StartAsync(CancellationToken cancellationToken) => ValueTask.CompletedTask;

    public ValueTask StopAsync(CancellationToken cancellationToken) => ValueTask.CompletedTask;

    public bool TryReadSnapshot(out TelemetrySnapshot snapshot)
    {
        snapshot = default;
        return false;
    }
}