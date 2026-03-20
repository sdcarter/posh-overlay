namespace PrecisionDash.App;

public static class Program
{
    public static void Main()
    {
#if WINDOWS
    using var startup = new WindowsStartup();
    startup.Run();
#else
    StartupLog.Write("Application started on non-Windows target. Interactive overlay is Windows-only.");
    Console.WriteLine("PrecisionDash interactive startup is available on Windows builds.");
#endif
    }
}