using PrecisionDash.Domain.Telemetry;

namespace PrecisionDash.Application.Ports;

public interface ICarProfileProvider
{
    bool TryGetProfile(int driverCarId, out CarShiftProfile profile);
}