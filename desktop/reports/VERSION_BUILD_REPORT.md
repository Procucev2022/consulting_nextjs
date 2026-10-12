# aiCEV Version & Build Identity Certification Report

## 1. Application Build Metadata
| Property | Certified Value | Source / Verification |
| :--- | :--- | :--- |
| **Application Name** | `aiCEV – Internal Assessment` | `release-manifest.json` |
| **Application Version** | `1.0.0` | `SYSTEM_BUILD_IDENTITY.APP_VERSION` |
| **Build Number** | `E2E-001-CERTIFIED` | `SYSTEM_BUILD_IDENTITY.BUILD_NUMBER` |
| **Git Commit** | `2378cd054fdcd528ec2815362a44a6461c72fa8e` | Git repository HEAD |
| **Build Timestamp** | `2026-10-08T17:15:00.000Z` | Release freeze timestamp |
| **Operating Mode** | `INTERNAL_ASSESSMENT` | `APP_OPERATING_MODES.INTERNAL_ASSESSMENT` |
| **Public SaaS Status** | `DISABLED` | `OperatingModeService.getConfig()` |
| **Certification Status**| `CERTIFIED` | `SYSTEM_BUILD_IDENTITY.CERTIFICATION_STATUS` |
| **E2E Test ID** | `E2E-GOLD-001` | Golden test harness reference |

---

## 2. Cryptographic Reference Master Data
| Master Data | Version | Frozen SHA-256 Checksum | Invariant Status |
| :--- | :--- | :--- | :--- |
| **FX Master** | `v2.0` | `7b88719dbd11e89e2ecffb68fe7398166c248ec77998c4fa9e9c6ec4f2c3f40f` | MATCHED / FROZEN |
| **PCBI Master** | `v2.0` | `df4299ffa183cb21c59d80f66e258604f5c376615d83a7a7d075dd53787e1411` | MATCHED / FROZEN |

---

## 3. Diagnostic API Endpoint
- **URL**: `GET /api/assessment/system-info`
- **Access**: Internal authenticated / localhost
- **Payload Schema**:
```json
{
  "success": true,
  "data": {
    "applicationVersion": "1.0.0",
    "buildNumber": "E2E-001-CERTIFIED",
    "gitCommit": "2378cd054fdcd528ec2815362a44a6461c72fa8e",
    "buildTimestamp": "2026-10-08T17:15:00.000Z",
    "operatingMode": "INTERNAL_ASSESSMENT",
    "certificationStatus": "CERTIFIED",
    "e2eCertificationId": "E2E-GOLD-001",
    "fxMaster": {
      "version": "v2.0",
      "checksum": "7b88719dbd11e89e2ecffb68fe7398166c248ec77998c4fa9e9c6ec4f2c3f40f"
    },
    "pcbiMaster": {
      "version": "v2.0",
      "checksum": "df4299ffa183cb21c59d80f66e258604f5c376615d83a7a7d075dd53787e1411"
    }
  }
}
```
Zero cryptographic secrets or credentials exposed.
