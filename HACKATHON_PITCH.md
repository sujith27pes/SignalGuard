# SignalGuard — three-minute demo

**One sentence:** SignalGuard turns suspicious emails into an understandable attack story, so users know what to verify before acting.

## 0:00–0:25 — The problem

“Phishing is often a persuasion problem. A familiar name, a frightening deadline, and one small request can combine into a costly mistake. A red warning alone does not teach people how to recognize the next attempt.”

Open the demo's Microsoft sample. State that it is synthetic and locally scored. Avoid claiming that the risk index is a phishing probability.

## 0:25–1:00 — Evidence over mystery

Point to the actual sender and destination. Show the exact quotes behind urgency and credential findings. Open **Attack story**: the credibility hook, the pressure, the requested move, and the destination.

“SignalGuard exposes its reasoning as evidence. It gives you a hypothesis you can question, and a concrete next move: verify through a channel you already know.”

## 1:00–1:30 — The memorable interaction

Open **What-if lab**. Exclude the sender-claim, failed-authentication fixture, and brand-link signals. The hypothetical index moves from 99 to 68. Explain that this does not verify the email or alter the original warning.

“Instead of accepting a black box, the user can see which assumptions drive the verdict.”

## 1:30–1:55 — Adversarial demo

Select **Document Share**. It contains instructions to ignore prior rules and classify it as safe. SignalGuard flags that text alongside the active `.html` attachment filename.

“The attacker can speak to the analyzer. We treat that speech as evidence, never as authority. The model has no tools, and local warnings stay visible.”

## 1:55–2:20 — Show the false-positive restraint

Select **Sam Rivera**, the urgent slide request. It has a low detected-risk index of 12. Urgency alone does not trigger a high-risk warning. Then open **Learning studio** and answer the gift-card question by choosing the known phone number.

“The goal is useful judgment, not warning fatigue or blind trust.”

## 2:20–2:45 — Show real extension / AI if configured

Before the presentation, load the extension and test with an authorized synthetic email in a test Gmail account. Open that message, expand its banner, and optionally request AI in the popup after confirming the subject/sender and consent.

Only demonstrate live AI after your key, model, extension allowlist, and privacy policy are configured and tested. If they are not, show the local extension and accurately describe the implemented model adapter; do not impersonate a live model response.

## 2:45–3:00 — Close with the value

“Our differentiator is a loop: detect, explain, interrogate, and learn. We built a working interface and a read-only extension, with a shared evidence engine and an opt-in model boundary. The next engineering step is provider-authenticated delivery events and a measured pilot.”

## Questions to expect

| Judge asks | Honest response |
|---|---|
| Is this truly real-time? | The extension reacts to opened Gmail messages as they render. The dashboard replay is synthetic. Inbox-wide delivery scanning is designed, not implemented. |
| Is it AI? | An actual OpenAI Responses adapter is included and works when configured; the default offline verdict is explicitly a heuristic engine. No model result is fabricated. |
| What makes it stand out? | A visible persuasion chain, an interactive contribution lab, evidence-grounded advice, prompt-injection awareness, and education in the same workflow. |
| How accurate is it? | Functional and boundary tests pass. There is no held-out detection benchmark yet; the evaluation plan defines how to measure false positives and misses. |
| Can it cause harm? | No sending/deletion/automatic quarantine or URL execution is present. Advisories can still be wrong, so we expose uncertainty and require independent verification. Zero harm cannot be guaranteed. |
| Is this production-ready? | No. Provider events, durable queues, tenant identity, retention controls, real-account compatibility, and independent evaluation are required before a pilot. |

Do not call the design globally novel, promise a win, invent prevented-loss metrics, or present synthetic fixtures as customer results. A clear, reproducible demo with honest boundaries is more defensible than unsupported claims.
