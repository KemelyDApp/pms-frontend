Design one change in Kemely's internal admin console (pm-system in frontend-mono, apps/pm-system): opening KYC documents from a KYC case. Match the existing visual language exactly; do not invent a new style.

## Visual language (from the current code, frontend-mono main, 2026-11-05)
- The app: dark UI, font Montserrat, brand purple #A648FF (primary actions, active states), red #FF474A (errors, rejected), orange #FF822F (warnings, pending, "needs attention").
- pm-system (staff): dense, table-first admin console. Reuse its components: PmsTable (uppercase small column headers, mono refs like D-…), RoundTag status pills, PmsModal ("Confirm change" style: title, body, 6-digit verification code field, Cancel / primary Save), PmsButton (primary purple / ghost). Desktop only (1440).
- Tone: short, plain, neutral sentences. Never show a person's full name, email or address on public pages; show masked names (initials like "T. P.") and shortened wallet addresses (0x12ab…9f3c, full address in a tooltip).

## Screen: Open a KYC document (pm-system, KYC case page, Evidence > Documents table)
Today the Documents table lists document type, ref (D-…), person, status pill, file type and size, uploaded date, but an officer cannot open the file, so they cannot evidence the review checklist.
Design:
- A row action "Open" (and "Download") on each document with a file.
- Opening shows a large PmsModal or side panel viewer: PDF pages or the image, zoom, page navigation, the document ref, type, person, uploaded date, and a "Download" button. Footer note: "Opening a document is logged."
- States: loading (streaming, with progress); error "Couldn't open the document" with Retry; limit reached ("Download limit reached for this hour. Try again in 23 min.", from a 429 with Retry-After); no permission (403: hide the action for users without the KYC approve role, show a tooltip on hover explaining why); unsupported or missing file.
- Next to the case Checklist, each checklist item that needs a document gets a small "View document" link that opens the same viewer on the matching document, so the officer can tick the item while looking at the evidence.

## Deliverables
The main frame plus every listed state, desktop (1440) only, with short annotations naming the API field or error code each element maps to. Keep the copy in English. Use realistic but fake data only (masked names like "T. P.", addresses like 0x12ab…9f3c, document refs like D-0042).
