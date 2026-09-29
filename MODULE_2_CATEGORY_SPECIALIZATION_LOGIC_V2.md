# MODULE 2 — CATEGORY SPECIALIZATION & RE-SOURCING SPECIFICATION V2.0
**Document ID**: `MODULE_2_CATEGORY_SPECIALIZATION_LOGIC_V2.md`  
**Direction**: Direction A (Multi-Category Generalist $\to$ Verified Category Specialist)

---

## 1. Multi-Category Vendor Architecture
Suppliers are classified by breadth and distribution of procurement categories served:
- **Single-Category Specialist**: $\ge 80\%$ spend within 1 primary category.
- **Multi-Category Supplier**: Supplies 2 to 4 distinct categories.
- **Cross-Category Generalist**: Supplies $\ge 5$ unrelated categories.

### Core Principle
A multi-category supplier is **never** penalized or targeted for consolidation merely because of supplying multiple categories.
Instead, the engine audits every supplied category independently:
$$\text{Supplier } V \longrightarrow \text{Category } C \longrightarrow \text{Items } I \longrightarrow \text{Unit Prices } P_{V, I}$$

---

## 2. Category Specialist Re-Sourcing Formulation
For each item $I$ supplied by generalist $V$ in category $C$:
1. Query customer historical transactions for dedicated single-category specialists $S \in \text{Specialists}_C$.
2. Compute the specialist benchmark price $\bar{P}_{S, I}$.
3. If $\bar{P}_{V, I} > \bar{P}_{S, I}$:
   $$\text{Specialist Realignment Opportunity} = (\bar{P}_{V, I} - \bar{P}_{S, I}) \times Q_{V, I}$$
4. If $\bar{P}_{V, I} \le \bar{P}_{S, I}$:
   $$\text{Specialist Realignment Opportunity} = ₹0.00$$
   *(Generalist is competitively positioned; recommend retaining dedicated relationship).*

---

## 3. Four Actionable Strategic Outcomes
Every category supplied by a multi-category supplier receives one of four data-driven recommendations:
1. `MAINTAIN_RELATIONSHIP`: Supplier price is lower or equal to category specialists.
2. `INITIATE_SPECIALIST_RESOURCING`: Demonstrated lower pricing from category specialists supports migration.
3. `CONSOLIDATE_WITH_SAME_CATEGORY`: Tail category spend can be pooled into primary specialist contract.
4. `STRATEGIC_OPPORTUNITY_UNQUANTIFIED`: Specialist alternative identified, but missing empirical item-level pricing evidence.
