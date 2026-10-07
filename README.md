# SignalGuard

**See the threat. Understand the why.** An explainable email security hackathon prototype: a dashboard, a Chrome/Edge Manifest V3 Gmail extension, and an optional OpenAI-backed local service.

## Run the project

Requires Node.js 20 or later. There are no npm dependencies to install.

```powershell
cd "C:\Users\sujit\Documents\Codex\2026-10-07\we\outputs\signalguard"
npm start
```

Open `http://127.0.0.1:8787`. Run `npm test` for functional and security-boundary tests.

### Enable real AI

Configure `OPENAI_API_KEY` and `OPENAI_MODEL` in the process environment using your normal secret-management process, then restart `npm start`. `OPENAI_MODEL` must be a model available to your account that supports Responses API Structured Outputs. No key is included in the project. Never put a key in frontend code, an extension, a committed file, or a command shared with others.

The dashboard's **Ask AI for a second opinion** explicitly asks before transmitting the selected message to OpenAI. API keys stay on the server. `store: false` requests no stored response object; this is not a guarantee of zero provider retention. Consult your provider's data policy. Local analysis remains available if AI is unavailable.

AI findings must contain exact quotes found in the submitted message fields. Output is schema-constrained and validated. The model has no tools, URLs are not fetched, and its opinion cannot remove local warnings or lower the displayed local index. Grounding checks reduce hallucinated evidence; they do not guarantee correct reasoning.

### Install the browser extension

1. Open `chrome://extensions` (or `edge://extensions`) and enable Developer mode.
2. Choose **Load unpacked** and select this project's `extension` folder. Alternatively, unzip `signalguard-extension.zip` and load that folder.
3. Reload Gmail, open an email, and look for the expandable SignalGuard banner above the message.
4. For an optional model opinion from the extension, copy its ID from the extensions page or SignalGuard popup. Set `SIGNALGUARD_EXTENSION_ID` in the local service environment to that exact ID and restart the service. Configure the API key and model as above.
5. Open the extension popup. Check the displayed subject and sender, check the consent box, and click **Ask AI about this email**. The browser then requests optional access to `http://127.0.0.1:8787/*`. A threaded conversation selects the last visible message, which is identified in the popup.

The default extension has only a Gmail content script and no mail-modifying permissions, background process, email storage, or network calls. The optional localhost permission supports user-triggered model requests. Nothing is uploaded automatically.

## What works now

| Feature | Behavior |
|---|---|
| Evidence-linked risk assessment | Scores observed patterns with explicit weights and quoted evidence |
| Attack story | Groups detected identity, emotion, action, and destination clues into a labeled hypothesis |
| What-if lab | Excludes selected signal contributions to explain score changes; original verdict is retained |
| Link passport | Shows actual destinations, label mismatches, lookalike namespaces, shortened links, and unencrypted URLs without visiting them |
| AI manipulation detection | Flags email instructions aimed at suppressing analysis; the engine cannot obey them |
| Learning studio | Explains phishing habits and gives an interactive second-channel verification quiz |
| Session review queue | Holds messages in this demo only; no actual mailbox quarantine |
| Evidence export | Downloads sender/subject, quoted findings, limits, and engine version as JSON; review before sharing |
| Custom input | Analyzes pasted text and basic plain-text `.eml` files locally |
| Incoming demo replay | Clearly labeled synthetic arrivals analyzed when added |
| Gmail observer | Debounced analysis of visible opened messages when Gmail renders or changes them |
| Optional real AI | Schema-constrained Responses API integration through a loopback-only service |

## Exact coverage limits

- This is a prototype, not a production gateway or a guarantee of safety. The 0–99 risk index is a weighted heuristic, **not** a calibrated phishing probability.
- No real mailbox is connected to the dashboard. The extension sees rendered, opened Gmail messages, not unseen arrivals or mail received while Gmail is closed. Inbox-wide delivery-time scanning is a documented next stage, not an implemented feature.
- Gmail DOM selectors can change. Real-account extension compatibility still requires testing on your account. Mock adapter tests do not establish compatibility with every Gmail layout.
- SPF/DKIM/DMARC are unknown for pasted text and the extension. Demo authentication values are explicitly labeled fixtures. Raw `Authentication-Results` text is not trusted.
- No image OCR, QR decoding, attachment-content inspection, reputation lookup, domain-age check, ownership proof, redirect resolution, or MIME/base64 decoding is performed.
- Brand namespaces are a small explicit list; international aliases and legitimate partner domains can cause false positives. Attackers using compromised accounts or unfamiliar language can evade these patterns.
- AI requests require your own configured service and provider account. No live provider request was made during implementation; adapter behavior is tested with mocks. Functional tests are not a detection-accuracy benchmark.
- Current server controls are appropriate for an individual loopback demo. They do not replace production authentication, tenant isolation, credential management, or abuse protection.

## Files

`dist/`: hosted/local dashboard and shared engine. `extension/`: Gmail plugin. `server.cjs`: static server and opt-in model adapter. `tests/`: functional checks. `SYSTEM_DESIGN.md`: architecture and production plan. `HACKATHON_PITCH.md`: a concrete three-minute presentation.

## Primary references

- [Chrome content scripts and isolated worlds](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts)
- [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses)
- [OpenAI API data controls](https://developers.openai.com/api/docs/guides/your-data)

The deployed Site is a private static local-analysis demo. Its AI controls direct users to the local project, because the hosted static site has no model backend or key.
