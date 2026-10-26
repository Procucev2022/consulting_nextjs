# aiCEV Windows Desktop Application — Installation & Update Guide

## 1. Overview
The **aiCEV – Internal Assessment** desktop application is distributed as a standalone Windows installer executable:
`aiCEV-Internal-Assessment-Setup.exe`

The application does **NOT** require Node.js, npm, or terminal access on the target workstation. All runtime execution dependencies are self-contained.

---

## 2. Installation Instructions

### Standard Installation (Interactive GUI)
1. Double-click `aiCEV-Internal-Assessment-Setup.exe`.
2. Follow the setup wizard prompts.
3. The installer installs to:
   `%LOCALAPPDATA%\Programs\aiCEV - Internal Assessment`
4. The installer automatically:
   - Creates a Start Menu program entry under `Programs\aiCEV`.
   - Creates exactly **ONE** Desktop shortcut: `aiCEV – Internal Assessment` with the official aiCEV icon.
   - Registers Windows Add/Remove Programs uninstall entries.
5. Launch the application by double-clicking the desktop shortcut.

### Silent Deployment (Enterprise Administrator)
For automated unattended installation:
```cmd
aiCEV-Internal-Assessment-Setup.exe /S
```

---

## 3. Operational Lifecycle
1. **Launch**:
   - Double-clicking `aiCEV – Internal Assessment` launches the native application window.
   - The shell displays a secure splash screen while backend (:5000) and frontend (:3001) services are verified.
   - Once `/api/health` returns HTTP 200, the full Assessment Centre UI renders.
2. **Close**:
   - Closing the native window automatically triggers graceful shutdown of all child server processes.
   - Zero orphan Node.js processes remain active.

---

## 4. Controlled Update & Upgrade Architecture
aiCEV operates under a **Strict Controlled Update Protocol**:
- **Automatic Updates**: Disabled by architecture.
- **Silent Background Downloads**: Prohibited.
- **Source Code Decoupling**: Changes in the developer workspace do NOT alter installed production binaries.

### Upgrade Procedure
When an approved, certified build is released (e.g. `v1.0.1` / `E2E-002-CERTIFIED`):
1. Download the certified `aiCEV-Internal-Assessment-Setup.exe` with its verified SHA-256 checksum.
2. Run the installer.
3. The installer replaces application binaries in `%LOCALAPPDATA%\Programs\aiCEV - Internal Assessment`.
4. **Data Preservation Guarantee**:
   - Customer assessment dossiers, data versions, analysis runs, and audit trails reside in `%APPDATA%\aiCEV` and are strictly preserved.
   - Reports, generated evidence workbooks, and configuration settings are never overwritten.
5. **Downgrade Policy**:
   - Version downgrades are not supported to prevent data schema and calculation regressions.
