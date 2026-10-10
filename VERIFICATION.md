# Verification

Repository cleanup recheck on **11 October 2026**: all **56 tests passed** with local loopback access. Documentation links and Git whitespace checks passed. No common credential patterns were found in the current source or the single existing historical revision; this is a pattern scan, not a comprehensive security audit.

## Recorded checks — 9 October 2026

The development suite passed **56 tests, zero failures**: 13 local-engine, 6 HR, 13 Nemotron contract/resilience, 14 Outlook adapter/coordinator, and 10 HTTP boundary checks. Providers and mailbox readers are mocked.

Coverage includes consent, server-only credentials, exact AI quotations, prompt-injection handling, request budgets, loopback authorization, bounded sync, replay/deduplication, retained records, and disconnect races.

Run the retained development suite with:

```sh
npm test
```

## Live validation

- Initial Outlook.com authorization and Inbox retrieval were independently verified during setup. Subsequent successful synchronization was observed.
- The supplied screenshots show 27 messages, followed by 28 messages and a phishing-style test message with local index 70.
- The user reported successful NVIDIA API-key testing. The supplied screenshots show local mode, not an AI response.
- Microsoft's personal-account flow returned its verification URL at `https://www.microsoft.com/link`; the adapter preserves approved provider URLs.

Demo evidence is kept in [docs/images](docs/images/01-dashboard.png) and explained in the [README](README.md).

## Browser smoke checks

Manual analysis, separate synthetic/personal workspaces, inert message rendering, HR verification, campaign correlation, hypothetical signal removal, and local evidence during missing-key failures were exercised.

Financial account changes and credential requests were checked as distinct signals. Review checkmarks and hypothetical exclusions preserved original warnings.

These are functional checks, not a full accessibility audit, accuracy benchmark, or sustained-load test.

## Supported public setup

Start the Node service and use Microsoft Graph or manual input. No PowerShell helper or batch launcher is required. The local Classic Outlook extraction helper is excluded from version control and has not been validated against a live Classic Outlook mailbox.

## Limits

Detection accuracy, precision/recall, model quality, sustained latency, long-running synchronization, and unseen provider response variants require evaluation.

Only the default Inbox and a bounded recent window are covered. Delivery uses polling while the UI is open. Tokens, imported mail, and review state are session-only. Full MIME decoding, attachment scanning, QR/OCR, sender-authentication verification, and live URL reputation are not implemented.

No mailbox modifications or employment decisions are performed. Grounded AI quotations can still support an incorrect interpretation. See [Production readiness](PRODUCTION_READINESS.md) for pilot requirements.
