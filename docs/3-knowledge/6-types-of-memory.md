# Types of Agent Memory

Just like humans, agents need to remember things to be effective. Below is a concise list of the key memory types involved in building reliable AI agents, without grouping into primary/secondary.

## System and policy prompt

Persistent instructions and policies that steer behavior (role, capabilities, safety and business rules). This is not Cache Augmented Generation (CAG).

## Conversation history (episodic)

Message transcript (often summarized) that preserves context and coherence across turns.

## Working memory / scratchpad

Internal reasoning artifacts (plans, intermediate computations). Sometimes persisted for traceability.

## Tool and capability memory

- Tool request/response transcript included in context for grounding.
- Short-lived tool state (pagination cursors, partial results).
- Capability schemas/affordances; see `3-capabilities.md`.

## Goal and plan state

Current objectives, subgoals, and plan-of-action, whether explicit (state machine/flow engine) or implicit (prompted plan).

## Knowledge memory (RAG)

External knowledge indexed for retrieval (documents, code, KBs).

- Index types: vector, keyword/lexical, and graph (often combined).
- Consider freshness, provenance, and retrieval accuracy.
- See `2-accessing-knowledge.md` and `5-document-store.md`.

## User profile and preferences

Identity, roles, preferences, and constraints for personalization. Requires consent, retention controls, and audit.

### Self-improving profile memory

A governed mechanism to learn and update user traits over time.

- Signals: explicit inputs, in-chat confirmations, choice history, engagement signals, and tool outcomes.
- Representation: typed key–value traits with confidence (0–1), evidence pointers, and last_seen_at timestamps.
- Updating: online updates with decay; add traits only after a confidence threshold; resolve conflicts by lowering confidence and requesting confirmation when needed.
- Personalization: include only high-confidence traits in prompts or retrieval filters; prefer structured context over free text.
- Controls: user consent, view/edit/reset UI, per-field TTL/retention, scope (per-user, per-agent, or org), and full audit trail.
- Safety: avoid sensitive/protected attributes unless strictly necessary; minimize PII; encrypt at rest and in transit; consider differential privacy for aggregated learning.

## Episodic summaries (past sessions)

Summaries of prior interactions and outcomes to maintain continuity without storing full transcripts.

## Organizational/shared memory

Team- or org-level facts, standards, and decisions accessible to multiple agents.

## Safety and policy memory

Compliance constraints and allow/deny lists, maintained separately from prompts for auditable updates.

## Model-embedded (parametric) memory

What the model “knows” from pretraining or fine-tuning (including adapters/LoRA).

- Pros: fast and compact at inference.
- Cons: hard to update; may hallucinate without external grounding.

## Operational memory and caches

Mechanisms that accelerate or stabilize behavior.

- Caches (Cache Augmented Generation, CAG): prompt/output and embedding caches with invalidation to avoid staleness.
- Transformer KV cache: ephemeral per generation to speed decoding.
- Checkpoints and flow state: persisted progress for long-running or resumable processes.

## Governance, privacy, and security

Cross-cutting concerns for any memory that contains user or sensitive data.

- Retention/TTL and redaction; per-field sensitivity classes.
- Encryption in transit and at rest; see `../n-encyclopedia/chat-message-encryption.md`.
- Access control, consent, and purpose limitation.
- Auditing and observability; see `../n-encyclopedia/logging.md`.

## Quick reference: dimensions

- Parametric vs external: in-model vs in a store (RAG, profiles, summaries).
- Ephemeral vs persistent: within one run/session vs across sessions.
- Private vs shared: per-user/agent vs organizational/multi-agent.
- Grounded vs generative: retrieved facts vs model’s internal knowledge/synthesis.
