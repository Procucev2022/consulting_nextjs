# ABC TEXTILE LTD — 952 EXACT DUPLICATE ROWS INVESTIGATION REPORT

**Assessment ID:** AIC-2026-0002
**Customer Name:** ABC Textile Ltd
**Source File:** Textile1.xlsx (Sheet: OpPack)
**Total Ingested Rows:** 23,570
**Review Disposition:** DUPLICATE_REVIEW_REQUIRED

---

## 1. Executive Summary

A forensic analysis across all 27 columns of the uploaded workbook Textile1.xlsx confirms the presence of **952 duplicate groups**, comprising **1,904 total rows** (each group containing exactly 2 identical rows across every column, including purchasing document, line item, material description, quantity, price, and amounts).

- **Total Rows in Duplicate Groups:** 1,904 rows
- **Unique Duplicate Signatures:** 952 distinct transaction patterns
- **Redundant Row Copies:** 952 rows
- **Total Converted Spend of Flagged Rows:** ₹138.9425 Cr (all 1,904 rows)
- **Spend Associated with Redundant Instances:** ₹69.4712 Cr (694,712,468.28 INR)
- **Provisional ERP-Converted Baseline Spend:** ₹613.8805 Cr (all 23,570 rows preserved)
- **Hypothetical Spend if Deduplicated:** ₹544.4093 Cr

> [!IMPORTANT]
> **CONTROLLED SAFEGUARD COMPLIANCE:**
> In accordance with Section 4 of the Controlled Correction Mandate, **NONE of these 952 rows have been deleted, deduplicated, excluded, or quarantined**. The provisional ERP-converted baseline spend remains **₹613.8805 Cr**. The records are flagged as DUPLICATE_REVIEW_REQUIRED pending explicit client confirmation.

## 2. Root Cause Analysis & Transaction Identifier Evaluation

| Identifier Field | Present in Source? | Evaluation & Findings |
|---|---|---|
| Purchasing Document (Purch.Doc.) | YES | Identical between matching pairs (e.g. PO 4200031686, PO 1002400566) |
| PO Line Item (Item) | YES | Identical between matching pairs (e.g. Item 1, Item 2) |
| Document Date (Doc. Date) | YES | Identical between matching pairs |
| Net Value & Net Value In INR | YES | Identical amounts |
| Material Document Number (MBLNR) | NO | **Absent from export.** Cannot verify physical goods receipts vs duplicate export. |
| Accounting Document Number (BELNR) | NO | **Absent from export.** Cannot verify invoice posting references. |
| Line Entry Timestamp / UUID | NO | **Absent from export.** Cannot establish system export provenance. |

### Verdict on Evidentiary Sufficiency:
**INSUFFICIENT EVIDENCE FOR AUTOMATIC PURGE.** Without internal SAP receipt references (MBLNR) or invoice numbers (BELNR), the system cannot distinguish between:
1. A multi-query export artifact where the same table was dumped twice with overlapping date ranges.
2. Legitimate sequential call-offs or milestone releases booked under identical PO lines.

Therefore, preserving all 23,570 rows while providing this review audit ledger is the only legally defensible and auditable approach.

## 3. Sample Duplicate Groups (Top 15 Groups by Spend)

| Duplicate Group | Row 1 (Excel) | Row 2 (Excel) | PO Number | Item | Material Group | Vendor Name | Description | Converted INR | Redundant Spend (Cr) |
|---|---|---|---|---|---|---|---|---|---|
| DUP-0009 | 10 | 3568 | 4200032257 | 1 | P06 | HARIWANSH PACKAGING PRIV | 5 PLY CORROGATED BOX WITH | ₹1,20,00,000 | ₹1.2 Cr |
| DUP-0440 | 445 | 9568 | 4200032062 | 1 | P01 | SHREYANS PACKAGING | DTY5 PLY CORRUGATED BOX 6 | ₹99,17,950 | ₹0.991795 Cr |
| DUP-0420 | 425 | 22331 | 4200031699 | 1 | P01 | SHREYANS PACKAGING | DTY5 PLY CORRUGATED BOX 6 | ₹94,39,920 | ₹0.943992 Cr |
| DUP-0424 | 429 | 18729 | 4200031792 | 1 | P01 | SHREYANS PACKAGING | DTY5 PLY CORRUGATED BOX 6 | ₹86,97,050 | ₹0.869705 Cr |
| DUP-0446 | 451 | 6783 | 4200032157 | 1 | P01 | HARIWANSH PACKAGING PRIV | DTY5 PLY CORRUGATED BOX 6 | ₹74,97,350 | ₹0.749735 Cr |
| DUP-0012 | 13 | 2167 | 4200032318 | 1 | P06 | SHREYANS PACKAGING | 5 PLY CORROGATED BOX WITH | ₹74,40,000 | ₹0.744 Cr |
| DUP-0439 | 444 | 9573 | 4200032063 | 1 | P01 | AVADHOOT PACKAGING SOLUT | DTY5 PLY CORRUGATED BOX 6 | ₹73,80,800 | ₹0.73808 Cr |
| DUP-0429 | 434 | 14463 | 4200031896 | 1 | P01 | SHREYANS PACKAGING | DTY5 PLY CORRUGATED BOX 6 | ₹70,29,126 | ₹0.702913 Cr |
| DUP-0011 | 12 | 2173 | 4200032319 | 1 | P06 | AVADHOOT PACKAGING SOLUT | 5 PLY CORROGATED BOX WITH | ₹62,31,000 | ₹0.6231 Cr |
| DUP-0423 | 428 | 18731 | 4200031793 | 1 | P01 | AVADHOOT PACKAGING SOLUT | DTY5 PLY CORRUGATED BOX 6 | ₹61,72,100 | ₹0.61721 Cr |
| DUP-0434 | 439 | 11611 | 4200031992 | 1 | P01 | SHREYANS PACKAGING | DTY5 PLY CORRUGATED BOX 6 | ₹61,56,600 | ₹0.61566 Cr |
| DUP-0438 | 443 | 9577 | 4200032064 | 1 | P01 | GONDWANA PACKERS PVT. LT | DTY5 PLY CORRUGATED BOX 6 | ₹57,66,250 | ₹0.576625 Cr |
| DUP-0641 | 646 | 1025 | 4200032364 | 1 | P11 | KAMAL PACKAGING (P) LTD. | PAPER TUBE- 57X280X122 GM | ₹56,78,400 | ₹0.56784 Cr |
| DUP-0642 | 647 | 1026 | 4200032365 | 1 | P11 | GONDWANA ENTERPRISES (P) | PAPER TUBE- 57X280X122 GM | ₹56,78,400 | ₹0.56784 Cr |
| DUP-0427 | 432 | 14473 | 4200031898 | 1 | P01 | AVADHOOT PACKAGING SOLUT | DTY5 PLY CORRUGATED BOX 6 | ₹56,25,477 | ₹0.562548 Cr |

---
*Report generated: 2026-10-12T11:03:24.508Z*
