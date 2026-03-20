using System.IO;
using PrecisionDash.Domain.TelemetryMath;
using Xunit;

namespace PrecisionDash.Domain.Unit;

public sealed class CoverageGateTests
{
    [Fact]
    public void TelemetryMath_NormalizedRpm_Returns_Zero_When_MaxRpm_Is_Not_Positive()
    {
        var state = new TelemetryState
        {
            Rpm = 6000f,
            MaxRpm = 0f,
            PitLimiter = false
        };

        Assert.Equal(0f, state.NormalizedRpm());
    }

    [Fact]
    public void TelemetryMath_NormalizedRpm_Returns_Ratio_When_MaxRpm_Is_Valid()
    {
        var state = new TelemetryState
        {
            Rpm = 4500f,
            MaxRpm = 9000f,
            PitLimiter = true
        };

        Assert.Equal(0.5f, state.NormalizedRpm(), 3);
        Assert.True(state.PitLimiter);
    }

    [Fact]
    public void PhysicsEngine_Source_Must_Not_Appear_Without_A_Real_Coverage_Gate_Update()
    {
        var physicsEnginePath = Path.Combine(GetRepositoryRoot(), "src/PrecisionDash.Domain/PhysicsEngine");

        if (!Directory.Exists(physicsEnginePath))
        {
            return;
        }

        var sourceFiles = Directory.GetFiles(physicsEnginePath, "*.cs", SearchOption.AllDirectories)
            .Where(path => !path.Contains("obj", StringComparison.OrdinalIgnoreCase)
                && !path.Contains("bin", StringComparison.OrdinalIgnoreCase))
            .ToArray();

        Assert.True(
            sourceFiles.Length == 0,
            "PhysicsEngine source files now exist. Replace this placeholder gate with explicit unit coverage checks before merge.");
    }

    private static string GetRepositoryRoot()
    {
        var current = new DirectoryInfo(AppContext.BaseDirectory);

        while (current is not null)
        {
            if (File.Exists(Path.Combine(current.FullName, "PrecisionDash.sln")))
            {
                return current.FullName;
            }

            current = current.Parent;
        }

        throw new DirectoryNotFoundException("Could not locate repository root from test runtime directory.");
    }
}