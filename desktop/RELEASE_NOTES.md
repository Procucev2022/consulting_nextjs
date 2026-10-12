# aiCEV Windows Desktop Application — Release Notes

## Release Identity
- **Application Name**: aiCEV – Internal Assessment
- **Application Version**: `1.0.0`
- **Build Number**: `E2E-001-CERTIFIED`
- **Git Commit**: `2378cd054fdcd528ec2815362a44a6461c72fa8e`
- **Build Date / Timestamp**: `2026-10-08T17:15:00.000Z`
- **Operating Mode**: `INTERNAL_ASSESSMENT` (Public SaaS Strictly Disabled)
- **Certification Status**: `CERTIFIED`
- **E2E Certification Identifier**: `E2E-GOLD-001`
- **Installer Package**: `aiCEV-Internal-Assessment-Setup.exe` (115 MB)
- **Installer SHA-256**: `9B9544F4F8AD8A36D94B2842A1FD0BC52B4958A101375B8CA23C42C105E2C5A5`

---

## Executive Summary
This release packages the certified Procucev aiCEV procurement intelligence platform into a self-contained, enterprise Windows desktop application. It establishes a native operational environment for Procucev consulting analysts during the 30-day controlled internal customer assessment phase.

### Core Capabilities
1. **Native Windows Desktop Shell**:
   - Packaged with an embedded Electron Chromium runtime.
   - Suppresses external browsers (Chrome/Edge) and terminal windows.
   - Hides URL address bars and developer server indicators.
   - Enforces single-instance application locking.
2. **Automated Process Lifecycle Management**:
   - Automatically initializes and manages the local Node.js Express backend (`http://localhost:5000`) and Next.js frontend (`http://localhost:3001`).
   - Polls health endpoints before presenting the user interface.
   - Prevents duplicate server spawns by reusing existing healthy endpoints.
   - Gracefully shuts down all child processes upon window exit with zero orphan processes.
3. **Controlled Versioned Release Architecture**:
   - Development builds and certified released builds are strictly isolated.
   - Source code modifications in development do not alter installed application binaries.
   - Updates are manual, controlled, and gated by full E2E certification.
4. **Certified Financial Integrity**:
   - Fully certified against `E2E-GOLD-001` (130/130 checks passed, ₹0.00 deterministic variance).
   - Preserves authoritative VGT regression baseline (20,505 source rows, ₹4,073.8307 Cr spend, ₹0.00 variance).
   - Authoritative Master Data frozen:
     - FX Master `v2.0` (`7b88719dbd11e89e2ecffb68fe7398166c248ec77998c4fa9e9c6ec4f2c3f40f`)
     - PCBI Master `v2.0` (`df4299ffa183cb21c59d80f66e258604f5c376615d83a7a7d075dd53787e1411`)
