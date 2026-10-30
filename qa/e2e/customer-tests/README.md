# Reusable Customer Dataset Validation Framework

This directory is designated for onboarding and certifying additional customer procurement datasets prior to production deployment.

## Usage
1. Drop customer Excel datasets (\`*.xlsx\`) into this directory (\`qa/e2e/customer-tests/\`).
2. Run validation using the reusable validator:
   \`\`\`bash
   npx tsx qa/e2e/customer-tests/run_customer_validation.ts
   \`\`\`
3. The framework outputs:
   - SHA-256 Checksum
   - Total / Valid / Excluded / Anomaly Counts
   - Module 1–4 Validations
   - Financial Bridge
   - Certification Status
