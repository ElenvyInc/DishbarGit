# DishBar — Ontario Food Marketplace Launch Safety & Risk Register
**Date:** 2026-10-21 | **Status:** proposed controls, NOT evidence of regulatory approval.  
**Owner:** DishBar business owner + appointed safety/compliance lead.  
**Scope:** Ontario pilot, local independent cooks, pickup first.  
**Environment:** All real-money checkout remains disabled until documented sign-offs and tested release authorization.

## Binding interim policy
1. Do not accept real money or publicly offer any unverified seller/listing as orderable.
2. Review **seller + physical preparation premises + specific food/process + jurisdiction**, not just seller name or cuisine.
3. No blanket claim that home kitchens may produce and sell all prepared meals.
4. Never represent self-attestation alone as "verified", "inspected", or "safe".
5. Suspend affected listings immediately for loss/expiry of eligibility, safety concerns, suspected contamination, unreported material changes, or regulator action.
6. Owner approval, professional assessment, and validated technical controls are all required prior to live commerce. A database boolean is not a legal clearance.

## Seller/premises eligibility decision matrix (product policy, not a legal conclusion)
| Scenario | Interim decision | Needed evidence |
|---|---|---|
| Shelf-stable low-risk food from home | **Review; not automatically allowed** | Food list/recipes; local PHU notification/review and any required inspection; municipal zoning/home business conditions; applicable training and insurance |
| Prepared complete meals (e.g. cooked rice, meat, fish, dairy, temperature-controlled foods) from commercially permitted or shared kitchen | **Review; not automatically allowed** | Facility address; authority inspection/approval status where required; permitted processes and food categories; kitchen use agreement; food handler and food-safety evidence; food transport and temperature controls; insurance |
| Time-temperature-controlled meals prepared in a residential kitchen | **Hold, ask the relevant PHU and municipality** | Written determination whether this specific premise + recipe/process may operate, and proof all required controls are satisfied; do not import assumptions from other Ontario municipalities |
| Prepackaged food from a supplier | **Review** | Seller/supplier identity, traceability, applicable label and allergen compliance and source documentation |
| Unknown kitchen, unsupported recipe, unresolved allergen hazard, invalid/expired documentation, regulatory prohibition or active safety incident | **REJECT/HOLD** | Resolution and re-review by authorized administrator |

**Local differences matter:** e.g. Ottawa's June 2026 guidance restricts moderate/high-risk home food businesses at residentially zoned locations; other PHUs describe requirements for higher-risk home premises. Always obtain the relevant local authority's answer for the actual address and foods. Do not misstate either rule as universal Ontario law.

## Minimum onboarding evidence (private admin-only storage)
- Legal person/business and verified contact, operating name, entity type and business identifier if applicable.
- Actual preparation premises address, municipality, relevant PHU and kitchen type (home, shared commercial, dedicated commercial).
- Menu, recipe/process and risk classifications; ingredients, allergen declarations, cross-contact controls and packaging/labelling review.
- Copies or references to notification, inspection outcomes and municipal permissions **as applicable**, with issuing body, scope, effective/expiry dates and verifier notes.
- Proof of ability to use the kitchen and to prepare the specific dishes.
- Food safety plan proportional to risk; temperature/time controls for hazardous foods; sourcing and transportation controls.
- Applicable food-handler certifications or written exemption analysis; do not presume a general exemption.
- Liability insurance evidence (policy, insured name, expiry, coverage); platform coverage separately assessed by broker; requirements set by insurer/legal counsel.
- Signed seller agreement covering truth of disclosures, incident cooperation, product recall, refunds, delivery/pickup, privacy and insurance responsibilities.
- Document reviewer, decision date, scope of approval, next verification date, change log. Do **not** rely on a single is_approved flag.

## Listing eligibility / automatic fail-closed rules (requirements for Grok)
- Each sellable listing must reference exactly one approved **seller+premises+product/process** eligibility record.
- Seller "approved" alone is insufficient.
- All unreviewed listings start DRAFT and NOT ORDERABLE.
- Product categories requiring temperature controls stay blocked pending **documented specific approval**.
- Any expiry, change in premises, process, ingredients, inspection condition or regulatory status sets affected listings to HOLD until re-reviewed.
- Enforce rules on PUBLIC listing/search, cart pricing, checkout creation, order acceptance, payments and payout eligibility (as relevant), not just UI.
- All status changes require role-scoped admin permissions and auditable logs; keep sensitive evidence hidden from public routes.
- No fake compliance badges, certifications or claims. Internal audit status is not a public certification.

## Food safety and emergency-response minimum SOP
1. Establish an emergency contact owner and backup available to act on urgent food-safety concerns.
2. Accept and triage reports: illness/allergic reaction, contamination, temperature breach, undeclared allergen, foreign body, regulatory notice, unsafe handling.
3. For suspected serious risk, **immediately HOLD affected seller/listings/orders**, isolate the implicated batch and preserve evidence; escalate to PHU/CFIA and emergency services as appropriate. Never wait for routine support hours for potential life-threatening illness.
4. Preserve traceability: prep location, item/recipe version, ingredient suppliers/lots when feasible, preparation date/time, batch/lot identifier, order IDs, fulfillment and recipient contact; restrict access.
5. Identify all orders exposed and contact affected customers promptly using approved messaging and regulator guidance. Escalate suspected unsafe product to CFIA without delay when required.
6. Record incident timeline, complaint source, impacted products, actions, authorities contacted, containment, refunds, corrective actions and release approval.
7. Do not reopen seller/listings until the relevant authority and authorized safety reviewer permit it, and root cause/corrective actions are documented.
8. Test one simulated recall before pilot launch; arrange practical after-hours escalation.

## Additional platform risk register
| Priority | Risk | Required mitigation | Evidence before launch |
|---|---|---|---|
| P0 | Unlawful food preparation or unsanitary premises | PHU/municipal review matched to seller, actual premises and products | Written eligibility determinations, verified seller files |
| P0 | Foodborne illness / allergens / temperature abuse | Product-specific review, verified ingredient/cross-contact info, safe temperatures, recall procedure, no false safety claims | SOP, seller training, order traceability, incident drill |
| P0 | Food product/general/platform liability | Insurance broker + legal counsel assess platform liability, seller coverage, product liability, cyber and exclusions | Bound policies/coverage confirmation appropriate to actual operations |
| P0 | Unauthorized fees or unpaid/duplicate orders | Fix money arithmetic, Stripe paid state, refund idempotency, amount ownership, secured settings | E2E and negative test evidence |
| P0 | Incorrect tax/merchant of record | Ontario/Canadian tax advice on food, platform fees, seller tax status, processor model | Signed tax decisions; verified test invoices |
| P0 | Cross-seller privacy / sensitive document leak | Least privilege, private object storage, redacted logs, secret scans, access controls | Security review, authorization tests |
| P0 | Unreviewed listings still orderable | Server-side seller/premises/menu approval checks and default-off launch gates | Bypass tests across every API |
| P1 | Recall not possible due to missing traceability | Lot/batch and customer-order mapping, immutable key transaction data | Successful mock recall |
| P1 | Unsafe handoff/private residential address exposure | Pickup location disclosure only when needed, secure handling instructions | Privacy test and pickup SOP |
| P1 | Deceptive claims/consumer disputes | Verified ratings, honest pilot copy, clear pre-payment price and policies | Consumer-law review, acceptance tests |
| P1 | Marketing consent violations (CASL) | Separate opt-in for promotional email/SMS, consent evidence, unsubscribe | Messaging audit |
| P1 | Platform outage/data loss | Monitoring, backups/restore test, incident ownership, recovery procedure | Restore test and on-call SOP |
| P1 | Unlicensed cross-border expansion | Restrict geography; evaluate CFIA licensing/traceability if scope changes | Expansion-specific legal approval |
| P1 | Vendor/third-party dependence | Inventory hosting, auth, CDN, Stripe and email service; provider access and contingency | Vendor/dependency inventory |
| P1 | Refund/chargeback financial exposure | Written cancellation and payout offset policy, reserves as needed | Refund test and signed seller terms |

## Professional approval tracker — not completed
- [ ] **Local public health**: actual pilot municipalities; permissible foods and locations; notice, inspection and controls.
- [ ] **Municipality**: zoning/business licence at each preparation site, residential operation and customer pickups.
- [ ] **Ontario food-law lawyer**: platform responsibilities, seller/customer terms, advertising/consumer rights, incidents.
- [ ] **Insurance broker**: coverage for marketplace platform plus seller obligations, cyber, product/general liability, coverage amounts and exclusions.
- [ ] **Canadian accountant/tax specialist**: food vs fee tax logic, actual merchant-of-record, registrant obligations, payout records.
- [ ] **Privacy/security reviewer**: PIPEDA practices, sensitive doc security, breach process, CASL marketing consent.
- [ ] **Technical owner/Grok**: coded seller/premises/listing checks, global live-payment gate, tests, backup, monitoring and incident drill.
- [ ] **Business owner**: pilot municipality, eligible cuisine/food categories, seller entry criteria, support contact, policies and formal go-live sign-off.

## Release approval rule
**NO real-money orders until ALL P0 gates are supported by evidence.** Record review owner, date, links to private evidence (not in public GitHub), and owner authorization. Do not expose eligibility documents, medical/customer details, addresses, insurance policies, tax IDs or incident reports in this public repository.

## References (official; confirm locally, this is not legal advice)
- Ontario Food Premises Regulation: https://www.ontario.ca/laws/regulation/170493
- Ontario home-based food business guide: https://www.ontario.ca/files/2024-03/moh-guide-to-starting-home-based-food-business-en-2021-11-01.pdf
- Ottawa local rules (not province-wide): https://www.ottawapublichealth.ca/for-professionals-and-partners/operating-a-food-premise/starting-a-low-risk-home-based-food-business/
- Halton public-health examples of high-risk foods: https://www.halton.ca/for-business/food-safety-for-business/public-health-notification-of-business-opening%2C-re
- CFIA recall procedures: https://inspection.canada.ca/en/food-safety-industry/recall-procedure
- CFIA allergen labelling: https://inspection.canada.ca/en/food-labels/labelling/industry/food-allergen-labelling
- Privacy Commissioner business guide: https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/pipeda-compliance-help/guide_org/
- CASL consent: https://ised-isde.canada.ca/site/canada-anti-spam-legislation/en/getting-consent-send-email
- CRA digital economy: https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/digital-economy.html
