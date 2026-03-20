using System.Collections.Generic;

namespace PrecisionDash.App.Composition;

public sealed class LoggingConfig
{
    private readonly List<string> _events = new();

    public IReadOnlyList<string> Events => _events;

    public void LogAttach() => _events.Add("attach");
    public void LogDetach() => _events.Add("detach");
    public void LogReconnect() => _events.Add("reconnect");
    public void LogProviderHealth(string health) => _events.Add($"provider-health:{health}");
}