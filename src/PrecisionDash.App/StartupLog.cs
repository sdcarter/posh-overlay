using System;
using System.IO;

namespace PrecisionDash.App;

internal static class StartupLog
{
    private static readonly string LogDirectory = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "PrecisionDash",
        "logs");

    private static readonly string LogPath = Path.Combine(LogDirectory, "startup.log");

    public static void Write(string message)
    {
        Directory.CreateDirectory(LogDirectory);
        var line = $"{DateTimeOffset.Now:O} {message}{Environment.NewLine}";
        File.AppendAllText(LogPath, line);
    }
}