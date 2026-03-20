namespace PrecisionDash.Domain.Ribbon;

public readonly record struct RibbonState(
    string LapProgressText,
    string IncidentsText,
    string? BrakeBiasText,
    string? TractionControlText
);