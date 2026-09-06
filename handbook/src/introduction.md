# GreenChillyz Platform Handbook

**Prepared by:** WideAngle Media & Technologies  
**Platform:** GreenChillyz Digital Experience Platform  
**Documentation Date:** September 2026  
**Codebase Commit:** `e93e9ef2` (branch: `main`)

---

## About This Handbook

This handbook is the authoritative engineering reference for the GreenChillyz Digital Experience Platform. It covers every layer of the system — frontend, backend, database, infrastructure, and business flows — documented from the **actual codebase**, not from the project plan alone.

Where the original project document (`GreenChillyz_Digital_Experience_Platform.docx`) describes intended behaviour that has not yet been implemented, this handbook explicitly marks the difference. Where the implementation differs from the plan, the actual implementation is documented.

## How to Use This Handbook

| Reader | Recommended Starting Point |
|---|---|
| New developer onboarding | Part II → Part XII → Part XV |
| Technical lead / architect | Part II → Part III → Part X |
| Product / business stakeholder | Part I → Part XVII → Part XIX |
| Operations / DevOps | Part XII → Part XVIII → Part XIV |
| Frontend developer | §5 → §11 → §12 → §36 |
| Backend developer | §6 → §8 → §23 → §24 |

## Source of Truth Rule

This handbook documents two sources:

- **Project Plan** (`GreenChillyz_Digital_Experience_Platform.docx`) — intended business architecture and scope.
- **Actual Codebase** — what is implemented as of the documentation date.

Every feature is labelled with one of:

| Label | Meaning |
|---|---|
| ✅ Implemented | Present and working in the codebase |
| 🔶 Partial | Started but incomplete |
| 📋 Planned | In the project plan, not found in the codebase |
| ⚠️ Differs | Implemented differently from the plan |
| ❓ Unconfirmed | Cannot be verified without runtime access |

## Repository Location

The codebase lives at `C:\WideAngle\Green Chillyz\` and is a Git monorepo on branch `main`.
