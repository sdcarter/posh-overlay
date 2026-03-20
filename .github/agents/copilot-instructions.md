# posh-overlay Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-20

## Active Technologies
- C# 14 on .NET 10.0.x LTS + Existing overlay stack (`SVappsLAB.iRacingTelemetrySDK`, `SkiaSharp`, `Polly`, `System.Threading.Channels`) plus Windows packaging/update components built around signed MSIX + App Installer delivery, GitHub Releases metadata access, and Windows signature-validation APIs (002-packaged-auto-update)
- Local install metadata in packaged app state or Windows install metadata; remote release metadata from GitHub Releases; packaged artifacts in release assets (002-packaged-auto-update)
- C# 14 on .NET 10.0.x LTS + Polly 8.4.1, SkiaSharp 3.119.0, SVappsLAB.iRacingTelemetrySDK 1.1.0, System.Threading.Channels 8.0.0, GitHub Releases HTTP access, Windows MSIX/App Installer tooling, Windows signing toolchain (002-packaged-auto-update)
- Local filesystem for downloaded update payloads, App Installer/MSIX artifacts, install metadata, and startup/update logs (002-packaged-auto-update)

- C# 14 on .NET 10.0.x LTS + `SVappsLAB.iRacingTelemetrySDK` v1.1+, `SkiaSharp` 3.119+, `Polly`, `System.Threading.Channels`, `System.Text.Json` source generators (001-core-overlay)

## Project Structure

```text
src/
tests/
```

## Commands

# Add commands for C# 14 on .NET 10.0.x LTS

## Code Style

C# 14 on .NET 10.0.x LTS: Follow standard conventions

## Recent Changes
- 002-packaged-auto-update: Added C# 14 on .NET 10.0.x LTS + Polly 8.4.1, SkiaSharp 3.119.0, SVappsLAB.iRacingTelemetrySDK 1.1.0, System.Threading.Channels 8.0.0, GitHub Releases HTTP access, Windows MSIX/App Installer tooling, Windows signing toolchain
- 002-packaged-auto-update: Added C# 14 on .NET 10.0.x LTS + Existing overlay stack (`SVappsLAB.iRacingTelemetrySDK`, `SkiaSharp`, `Polly`, `System.Threading.Channels`) plus Windows packaging/update components built around signed MSIX + App Installer delivery, GitHub Releases metadata access, and Windows signature-validation APIs
- 002-packaged-auto-update: Added [if applicable, e.g., PostgreSQL, CoreData, files or N/A]


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
