using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.Text;
using System.Text;

namespace PrecisionDash.Build.SourceGenerators;

[Generator]
public sealed class LovelyCarLookupGenerator : IIncrementalGenerator
{
    public void Initialize(IncrementalGeneratorInitializationContext context)
    {
        context.RegisterPostInitializationOutput(static output =>
        {
            const string source = """
            namespace PrecisionDash.Generated;

            public static class CarLookup
            {
                public static bool HasProfile(int driverCarId) => driverCarId > 0;
            }
            """;

            output.AddSource("CarLookup.g.cs", SourceText.From(source, Encoding.UTF8));
        });
    }
}