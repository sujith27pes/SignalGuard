# A product HR could evaluate for a pilot

**Positioning:** a verification companion for high-impact requests—salary destinations, recruitment payments, identity documents, and access—not a system that rates candidates or promises perfect phishing detection.

The implemented differentiation is an understandable decision workflow: local evidence, a challengeable model brief, a known-channel playbook, related-message context, and a minimized incident packet. All are concrete interactions. Their business impact must still be measured.

## Pilot questions and acceptance evidence

| Decision | Evidence needed before approval |
|---|---|
| Does it catch meaningful threats without warning fatigue? | Independently labeled consented real mail, campaign/time-separated holdout, class-specific precision/recall, false-positive rate, abstention, missed high-impact requests |
| Are explanations useful and grounded? | Quote-grounding rate plus human review of interpretation, benign alternatives, and inappropriate recommendations |
| Can HR complete verification faster? | Consented task study: time to independent verification, comprehension, overrides, confusion, and false confidence; not invented saved-loss estimates |
| Does the Outlook connection behave reliably? | Authorized Outlook.com and work-account tests, delta pagination/removals/expiry, reconnect, volume bursts, restricted policies, offline recovery, p50/p95/p99 event-to-assessment latency |
| Is data handling approved? | Vendor terms, explicit mailbox/model consent, HR sensitivity review, retention/deletion policy, tenant ownership, protected credentials, and approved exports |
| Can IT deploy and operate it? | Signed installer/updater, verified team app identity, suitable authentication flow, tenant controls, revoke/disable workflow, support ownership, dependency/SBOM review |
| Are reviewers accountable? | Organizational authentication, role-based review, durable integrity-protected audit records, clear human ownership; local checkboxes are insufficient |
| Does it scale safely? | Durable event queue, shared quotas/circuit state, backpressure, idempotent workers, tenant-isolated storage, reconciliation and controlled retry budgets |

No quantitative target in this document is represented as achieved. Choose thresholds and rollout criteria with HR and security using measured costs of false positives and misses.

## A sensible staged rollout

1. **Hackathon demonstration:** synthetic scenarios and manual paste, then an authorized test mailbox after app registration and provider smoke tests. Clearly disclose which results are local, mocked, or live.
2. **Consented shadow pilot:** a small designated test group, read-only assessment, no automatic blocking/reporting, reviewed datasets, account-level kill switch, and privacy approval.
3. **Workflow integration:** approved contact/HRIS sources, authenticated review and protected case export; evaluate workload, accessibility, and missed events.
4. **Production candidate:** signed deployment, operational ownership, tenant isolation, durable processing, retention controls, incident response, and independently reviewed evaluation.

Do not use the tool for selection, hiring, promotion, or termination decisions. It assesses requests in messages; it does not infer a person's integrity or employability. Avoid employee-security rankings based on warnings or quiz responses.
