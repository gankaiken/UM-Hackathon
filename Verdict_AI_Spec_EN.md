# TalentBridge AI — Authentic Talent Verification & Closed-Loop Talent Hub
### Version 11.1 | Final Architecture Specification (7-Agent Agentic Pipeline)

> **One-Line Definition:** Malaysia's first hiring platform where no one gets ghosted, every shortlisting decision is explainable, and every "No" comes with a "Here's how."

---

## Table of Contents
1. Problem & Mission
2. System Overview: Why 7 Agents, Not 1
3. The 7-Agent Architecture (Detailed)
   - Agent 1: Mapper (v1.2)
   - Agent 2: Dimension QA Agent (v1.1) *(new)*
   - Agent 3: Strategist (v1.1)
   - Agent 4: Inquisitor (v1.3)
   - Agent 5: Sentinel *(pure code, no AI)*
   - Agent 6: Language Style Analyzer (v1.1) *(new — conditional)*
   - Agent 7: Auditor (v1.2) + Schema Validator *(pure code)*
4. Complete Data Flow Diagram
5. Anti-Cheat Design: Why This Is Sophisticated
6. Prompt Versions & Scores
7. Token Economy (Cost Minimisation Strategy)
8. B40 Internet Resilience Design
9. The Triage System (Green / Amber / Red)
10. Candidate Experience
11. Employer Experience & HR Reputation Score
12. Business Model
13. Tech Stack
14. Hackathon MoSCoW Execution Plan

---

## Chapter 1: Problem & Mission

### The Numbers
Every year, over **200,000** Malaysian fresh graduates and B40 job seekers send applications and receive no reply.
*(Source: triangulated from MOHE Graduate Tracer Study response-rate data and Jobstreet Malaysia applicant feedback surveys.)*

- **73% never hear back.** Not a rejection — silence.
- HR teams receive hundreds of AI-generated CVs daily, indistinguishable from genuine ones.
- Rejected candidates receive no feedback and cannot improve.

### The Three Failures No Existing Tool Fixes Simultaneously
| Failure | Existing Tools | TalentBridge AI |
|---|---|---|
| CV inauthenticity (AI-generated) | Not addressed | Multi-layer behavioural + style analysis |
| Candidate ghosting | Not addressed | HR Reputation Score |
| No feedback on rejection | Not addressed | Amber upskill path / Red career redirect |

### Mission Statement
> Technology is the instrument. Dignity is the purpose.
> TalentBridge AI does not replace human judgment — it makes the hiring process fair, explainable, and responsive for every candidate, regardless of background, education level, or language.

---

## Chapter 2: System Overview — Why 7 Agents, Not 1

### The Core Problem with a Single AI
A single model asked to simultaneously design the test, conduct the interview, and grade the result will suffer **Role Drift** over a 15–20 minute conversation:
- It starts favouring candidates it has built rapport with
- It forgets initial evaluation constraints
- It leaks scoring signals into its questions (inadvertently helping the candidate)

### The Design Principle: Separation of Concerns
Inspired by production AI editorial pipelines (Editor → Writer → Reviewer), we separate every distinct cognitive task into an isolated agent with a narrow, non-overlapping responsibility.

### The 7 Agents at a Glance

| Agent | Name | Type | Triggered | Responsibility |
|---|---|---|---|---|
| 1 | **Mapper** | AI (GLM-4) | Once per JD | Extract competency dimensions from JD |
| 2 | **Dimension QA** | AI (GLM-4) | Once per JD (after Mapper) | Validate Mapper output before it enters the pipeline |
| 3 | **Strategist** | AI (GLM-4) | Per turn | Decide what to probe next; direct Inquisitor |
| 4 | **Inquisitor** | AI (GLM-4) | Per turn | Deliver questions in natural language; zero decision authority |
| 5 | **Sentinel** | **Pure Code (JS)** | Continuous | Monitor behavioural signals; trigger alerts; zero AI tokens |
| 6 | **Language Style Analyzer** | AI (GLM-4) | **Conditional only** | Detect style shift when Sentinel Stage 2 alert fires |
| 7 | **Auditor + Validator** | AI (GLM-4) + **Pure Code** | Once per session end | Score transcript; code validates output completeness |

**Total AI Prompts: 6** (Mapper, Dimension QA, Strategist, Inquisitor, Language Style Analyzer, Auditor)
**Pure code components: 2** (Sentinel, Schema Validator)

Everything that can be done in code is done in code. AI is only called where language understanding is genuinely required.

---

## Chapter 3: The 7-Agent Architecture (Detailed)

---

### Agent 1: The Mapper (v1.2)
**Role:** Intelligence analyst. Reads the employer's JD and extracts the competency dimensions that genuinely need testing for this role.

**Triggered:** Once per JD upload. Output is **cached** and reused for every candidate applying to that role. Not re-called per interview. *(Token cost optimisation)*

**Input:** Employer's raw JD text (BM, English, or mixed — the Mapper handles all three)

**Key Design Rules:**
- Extracts **exactly 5** core competency dimensions (not 4, not 6)
- Dimensions must be **behavioural and testable** through text conversation — no credential-based dimensions ("has a degree")
- Identifies **2–3 probe targets** — things the JD implies but doesn't explicitly state
- If JD is vague or under 50 words: `truncated_input: true`, dimensions inferred from Malaysian SME norms for that role type
- **If Dimension QA returns correction feedback**, Mapper revises and outputs once more (max 1 retry)

**Output (strict JSON only — never dialogue):**
```json
{
  "role_title": "Junior Marketing Executive",
  "core_dimensions": [
    "Social media content creation and publishing",
    "Campaign execution and performance tracking",
    "Customer growth and community engagement",
    "Platform-specific knowledge (TikTok / Instagram)",
    "Creative output under constraints (budget, brand guidelines)"
  ],
  "probe_targets": [
    "Preferred experience is vague — determine if candidate has run a page or only consumed content",
    "No analytics mentioned — probe whether candidate has ever measured results numerically"
  ],
  "truncated_input": false
}
```

**Version:** v1.2 | **Prompt Score:** 88/100

---

### Agent 2: Dimension QA Agent (v1.1) *(New)*
**Role:** Quality gatekeeper. Sits between Mapper and Strategist. Validates that the Mapper's extracted dimensions are accurate, complete, and testable before any candidate is interviewed with them.

**Why this exists:** A bad Mapper extraction that goes undetected produces an entire interview that tests the wrong things. This agent catches that failure before it reaches the candidate.

**Triggered:** Once per JD, immediately after Mapper output. Result cached alongside Mapper JSON.

**Three Checks (applied to all 5 dimensions):**
1. **JD Support** — Is this dimension traceable to the JD text or a reasonable one-step inference from the role type? Fail: fabricated dimension with no JD connection.
2. **Testability** — Can this be probed through text conversation about real past experience? Fail: credential-based or purely attitudinal ("has good attitude").
3. **Distinctness** — Is this dimension meaningfully different from the other 4? Fail: two dimensions so similar a single question would cover both.

**Three Possible Outputs:**
- `PASS` → Approve Mapper JSON, pass downstream to Strategist
- `REVISE` → Return structured `qa_feedback` to Mapper, trigger retry
- `PASS_WITH_WARNING` → Second pass (retry limit reached), pass with `warning_flag: true` and a QA WARNING appended to `probe_targets` for the Strategist

**Constraint:** Validates only — never rewrites dimensions itself.

**Version:** v1.1 | **Prompt Score:** 93/100

---

### Agent 3: The Strategist (v1.1)
**Role:** The hidden brain of every interview. Reads the full conversation history, the QA-approved Mapper JSON, and any Sentinel signals. Maintains a live **Dimension Coverage Map** and decides the exact next move each turn.

**Triggered:** After every candidate response (real-time, per turn). Never visible to the candidate.

**The Dimension Coverage Map (4 States):**
| State | Meaning |
|---|---|
| `UNEXPLORED` | Never discussed. Zero candidate turns touched it. |
| `TOUCHED` | Mentioned once. Generic response. No Action Nodes yet. |
| `DEVELOPING` | At least 1 specific Action Node observed. |
| `SUFFICIENT` | 2+ Action Nodes OR 1 very strong Action Node (quantified + cause-effect). |

Session closes when all 5 dimensions reach `SUFFICIENT`, or at turn 20 (forced close).

**Priority Decision Logic (in order — stop at first match):**

1. **Sentinel Anomaly (Priority 1):** If Sentinel flags focus loss >30s AND `turns_since_last_reality_check ≥ 3` → inject `reality_check`. *(Rate limiter prevents interrogation mode.)*
2. **Contradiction Detected (Priority 2):** If current answer directly contradicts an earlier claim → `resolve_contradiction`. *(Max 2 per session.)*
3. **Probe Deeper (Priority 3):** Current dimension still TOUCHED, or DEVELOPING with unaddressed probe targets, and turn ≤ 18 → `probe_deeper`.
4. **Change Dimension (Priority 4):** Current dimension SUFFICIENT, or probed 3× with zero new Action Nodes → `change_dimension` to highest-priority unexplored dimension.
5. **Close Session (Priority 5):** All SUFFICIENT or turn 20 → `close_session`.

**Sentinel Rate Limiter:** `reality_check` only fires if `turns_since_last_reality_check ≥ 3`. If Sentinel triggers during the cooldown, anomaly is logged internally and normal priority logic continues.

**Output (instruction JSON — never dialogue):**
```json
{
  "turn_number": 7,
  "turns_since_last_reality_check": 0,
  "next_action": "reality_check",
  "target_dimension": "social_media_content_creation",
  "probe_angle": "Ask for the very first product they ever posted on TikTok...",
  "contradiction_context": null,
  "sentinel_override": true,
  "coverage_map": {
    "social_media_content_creation": "DEVELOPING",
    "campaign_execution_and_tracking": "SUFFICIENT",
    "customer_complaint_handling": "SUFFICIENT",
    "platform_specific_knowledge": "DEVELOPING",
    "creative_output_under_constraints": "UNEXPLORED"
  },
  "forced_close_log": null,
  "reasoning": "Sentinel: 52s focus loss. Rate limiter cleared. Candidate answer abnormally long. Inserting reality_check anchored to their TikTok claim."
}
```

**Key Design Benefit:** Candidates can try to charm the Inquisitor — but the Inquisitor has zero decision power. The Strategist, which they cannot see or influence, controls every move. **This makes the interview structurally resistant to social engineering.**

**Version:** v1.1 | **Prompt Score:** 93/100

---

### Agent 4: The Inquisitor (v1.3)
**Role:** The only agent that speaks directly to the candidate. Converts the Strategist's cold JSON instruction into warm, natural, human-sounding text messages. Has zero decision authority — it never decides what to ask.

**Triggered:** Immediately after Strategist outputs its instruction.

**Language Adaptation:**
- Detects candidate's language register from their first message
- Follows code-switching in real time (Manglish → BM → English → Manglish)
- Never corrects candidate's language; mirrors it
- Default when unclear: Manglish

**5 Action Types it handles:**
| Action | What it does |
|---|---|
| `probe_deeper` | Asks a follow-up grounded in candidate's exact last words |
| `change_dimension` | Opens a new topic with a broad, inviting question |
| `reality_check` | Asks a specific detail question; no indication it's a check |
| `resolve_contradiction` | Gently asks candidate to clarify inconsistency; never accuses |
| `close_session` | Warmly closes the session, thanks candidate by name |

**Strict Rules:**
- Exactly ONE question per turn. Never two.
- Maximum 2 sentences (except `close_session`: max 3).
- NEVER evaluative praise ("Great answer!", "Impressive!")
- NEVER hint at what a good answer looks like
- If candidate asks meta-questions ("Is this recorded?"): fixed response — *"This conversation helps us understand your experience better — nothing is used outside of this process. Ready to continue?"*

**Response Streaming:** Inquisitor output streams character-by-character via SSE. First character appears within 1 second of the Strategist's output. Candidate sees natural typing and feels no latency gap from the two-step process.

**Version:** v1.3 | **Prompt Score:** 92/100

---

### Agent 5: Sentinel *(Pure Code — Zero AI Tokens)*
**Role:** Real-time behavioural watchdog. Operates entirely in JavaScript — no AI involved. Detects physical signals that suggest the candidate has left the interview page to consult external sources.

**Why pure code, not AI?**
- AI-based "language entropy" detection is unreliable (OpenAI shut down their own classifier due to accuracy issues)
- Physical behavioural signals are objective, deterministic, and 100% defensible to judges
- No false positive risk from model hallucination
- Costs zero tokens

**Front-end signals monitored:**
```javascript
document.addEventListener('visibilitychange', recordFocusLoss);
window.addEventListener('blur', recordTabSwitch);
document.addEventListener('paste', recordPasteEvent);
// Timer tracks per-question elapsed time
```

**Two Alert Tiers:**
| Tier | Condition | Action |
|---|---|---|
| **Stage 1** (soft) | Tab switch >2× per question OR focus loss >30s | Append to Sentinel metadata; Strategist may inject `reality_check` (subject to rate limiter) |
| **Stage 2** (hard) | `focus_loss_events > 3` AND `paste_events > 1` | Append to metadata + **trigger Language Style Analyzer** |

**Sentinel never auto-rejects.** All signals are metadata. The human HR professional makes the final call.

---

### Agent 6: Language Style Analyzer (v1.1) *(New — Conditional)*
**Role:** Forensic text analyst. Only activated when Sentinel fires a Stage 2 alert. Compares the candidate's early-session and late-session writing style across 5 signals to detect if the writing style shifted in ways consistent with AI proxy use or copy-paste from prepared content.

**Triggered:** Conditionally — only when `focus_loss_events > 3 AND paste_events > 1`.

**Inspired by:** Academic anti-plagiarism research on how AI-generated text differs from human writing. Known signals include: sudden length spikes, appearance of structured discourse markers ("Furthermore,"), vocabulary formality jumps, loss of personal detail specificity, and collapse of natural code-switching patterns.

**5 Style Signals:**
| Signal | What it detects | Max Penalty |
|---|---|---|
| **Response Length Shift** | Late-half answers ≥2.5× longer than early-half with no question complexity increase | -20 |
| **Formality Shift** | Structured discourse markers ("Firstly,", "In conclusion,") appear in late half, absent in early half | -20 |
| **Language Register Shift** | Candidate using Manglish suddenly switches to perfect formal English (complete: ≥80% of late turns) | -20 |
| **Personal Detail Density Shift** | Early half has specific names/numbers/dates; late half is generic and universal | -20 |
| **Colloquial Marker Retention** | "lah", "lor", "kan" present early, completely absent late (Malaysia-specific signal) | -20 |

**Scoring:**
```
style_consistency_score = 100 − (sum of all signal penalties)
```
- **80–100:** Consistent style — clean
- **60–79:** Minor variation — normal
- **40–59:** Moderate shift — flag to Auditor
- **<40:** Significant shift → `PASS_TO_AUDITOR_STRONG_FLAG`

**Future Signal Slots:** The Signal Registry is designed for expansion. When you complete research on additional AI-vs-human writing differences, new signals can be added following the existing structure. A threshold adjustment formula prevents score inflation when signals are added.

**Output passed to Auditor:**
```json
{
  "style_consistency_score": 25,
  "anomaly_detected": true,
  "primary_anomaly_type": "Complete register switch at session midpoint...",
  "recommendation": "PASS_TO_AUDITOR_STRONG_FLAG"
}
```

**Version:** v1.1 | **Prompt Score:** 95/100

---

### Agent 7: Auditor (v1.2) + Schema Validator *(Pure Code)*

#### 7A: The Auditor
**Role:** The invisible final judge. Reads the complete session transcript after the conversation ends. Outputs one Verdict JSON. Never visible to the candidate during the interview.

**Triggered:** Once, at the end of the complete session.

**Inputs (all four):**
1. Full conversation transcript (all turns)
2. QA-approved Mapper dimension JSON
3. Sentinel's complete behavioural metadata report
4. Language Style Analyzer report (if present — only when Sentinel Stage 2 fired)

**BIAS STRIPPING — Applied Before Any Scoring:**
These factors have **zero influence** on any score:
- Grammar errors, typos, non-standard sentence structure
- Manglish, Bahasa Melayu, or mixed-language responses
- Short, informal sentences (style ≠ capability)
- Response time on a text interface (relevant for B40 candidates on slow connections)
- Absence of corporate vocabulary
- Educational background or credentials
- Any demographic inference

Score ONLY on: **what decisions did the candidate make, what actions did they take, and what depth of real experience does their account show?**

**Action Node Scoring (score only these):**
- ✅ Quantified a result ("sales up 30%", "12,000 followers")
- ✅ Sought resources or help when stuck
- ✅ Adapted strategy after failure or setback
- ✅ Demonstrated awareness of impact on others
- ✅ Took independent initiative without being told
- ✅ Showed cause-and-effect reasoning ("I did X because Y")

**4 Human Review Triggers (any → `human_review_required: true`):**
1. Sentinel: `focus_loss_events > 3 AND paste_events > 1`
2. Self-check: 3+ dimensions with `confidence: "low"` → possible Mapper dimension error
3. Contradiction: candidate gave directly conflicting accounts of the same event
4. Style Analysis: `style_consistency_score < 40` → significant style shift mid-session

**Triage Logic:**
| Result | Condition |
|---|---|
| 🟢 GREEN | Average score ≥ 75, no more than 1 dimension < 50 |
| 🟡 AMBER | Average ≥ 55, at least 2 dimensions ≥ 75, gap is a specific learnable hard skill |
| 🔴 RED | Average < 55 OR all dimensions < 60 with zero personal texture |

Note: Sentinel flags alone never produce Red. A nervous candidate who left briefly while thinking gets `human_review_required: true` — not Red.

**Output (strict JSON):**
```json
{
  "authenticity_status": "clean",
  "triage_result": "AMBER",
  "dimension_scores": {
    "social_media_content_creation": {
      "score": 88, "confidence": "high",
      "key_evidence": "Described pivot: 'lepas algorithm tukar, saya stop trending video, focus balik kat loyal customer'"
    },
    "campaign_execution_and_tracking": {
      "score": 42, "confidence": "medium",
      "key_evidence": "Tracked revenue manually but never used a structured analytics platform"
    }
  },
  "verified_strengths": ["Community commerce", "Customer relationship management", "Independent strategic adaptation"],
  "identified_gaps": ["Structured digital analytics tools (e.g. Google Analytics, Meta Business Suite)"],
  "upskill_path": [
    { "week": 1, "topic": "GA4 Fundamentals", "resource": "Google Analytics Academy (Free)" },
    { "week": 2, "topic": "Social media analytics interpretation", "resource": "Meta Blueprint (Free)" },
    { "week": 3, "topic": "Data-to-decision practice", "resource": "TalentBridge in-platform exercise" }
  ],
  "career_orientation": null,
  "sentinel_metadata": {
    "focus_loss_events": 1,
    "total_away_duration_seconds": 14,
    "paste_events": 0
  },
  "style_consistency_score": null,
  "human_review_required": false,
  "human_review_reason": null,
  "ai_summary": "Strong foundational qualities with one specific tooling gap. Recommend upskill path before re-evaluation. Probe for learning speed in final interview if Green after upskilling."
}
```

**Version:** v1.2 | **Prompt Score:** 91/100

#### 7B: Schema Validator (Pure Code)
Runs immediately after Auditor output. Validates structural completeness before the Verdict Card is released to the employer.

```python
def validate_auditor_output(verdict, mapper_json, sentinel_data, style_data):
    errors = []

    # Rule 1: All Mapper dimensions must be scored
    for dim in mapper_json["core_dimensions"]:
        if dim not in verdict["dimension_scores"]:
            errors.append(f"MISSING DIMENSION SCORE: {dim}")

    # Rule 2: Amber must have upskill_path
    if verdict["triage_result"] == "AMBER":
        if not verdict.get("upskill_path"):
            errors.append("AMBER verdict missing upskill_path")

    # Rule 3: Red must NOT have upskill_path
    if verdict["triage_result"] == "RED":
        if verdict.get("upskill_path"):
            errors.append("RED verdict must not contain upskill_path")

    # Rule 4: Sentinel Stage 2 must trigger human review
    if sentinel_data["focus_loss_events"] > 3 and sentinel_data["paste_events"] > 1:
        if not verdict.get("human_review_required"):
            errors.append("Sentinel Stage 2 fired but human_review_required not set")

    # Rule 5: Style score must be present if Style Analyzer was triggered
    if style_data and verdict.get("style_consistency_score") is None:
        errors.append("Style Analyzer triggered but style_consistency_score is null")

    if errors:
        return {"valid": False, "retry_feedback": errors}
    return {"valid": True}
```

If validation fails: Auditor is retried with specific errors as feedback (max 2 retries). Persistent failure escalates to a human moderation queue — never shown to the candidate as broken output.

---

## Chapter 4: Complete Data Flow Diagram

```
[Employer uploads JD]
        ↓
┌──── MAPPER v1.2 (once per JD, cached) ────┐
│ Extracts 5 dimensions + probe targets       │
└─────────────────────────────────────────────┘
        ↓
┌──── DIMENSION QA v1.1 (once per JD) ────────┐
│ Check 1: JD Support                          │
│ Check 2: Testability                          │
│ Check 3: Distinctness                         │
│ PASS → forward to Strategist                  │
│ REVISE → send qa_feedback to Mapper (1 retry) │
│ PASS_WITH_WARNING → forward + flag            │
└──────────────────────────────────────────────┘
        ↓ (QA-approved JSON cached, reused per candidate)

════════════ PER CANDIDATE SESSION ════════════

[Candidate enters via unique link]
        ↓
[Inquisitor: opening welcome in candidate's language]
        ↓
┌──────────── CONVERSATION LOOP (per turn) ─────────────────────┐
│                                                                  │
│  SENTINEL (JS) — monitoring continuously                        │
│  Stage 1: focus_loss >30s OR tab switch >2× → metadata flag    │
│  Stage 2: focus_loss >3 AND paste >1 → trigger Style Analyzer  │
│                                                                  │
│  [Candidate submits answer]                                      │
│         ↓                                                        │
│  STRATEGIST v1.1                                                 │
│  ├─ Priority 1: Sentinel alert + rate limiter → reality_check   │
│  ├─ Priority 2: Contradiction detected → resolve_contradiction   │
│  ├─ Priority 3: Dimension TOUCHED/DEVELOPING → probe_deeper     │
│  ├─ Priority 4: Dimension SUFFICIENT or 3× no Action Node       │
│  │              → change_dimension                              │
│  └─ Priority 5: All SUFFICIENT or turn 20 → close_session       │
│         ↓ (instruction JSON)                                     │
│  INQUISITOR v1.3                                                 │
│  Converts instruction → warm natural dialogue                    │
│  Streams via SSE to candidate (first char <1s)                  │
│                                                                  │
│  [If Sentinel Stage 2 fires mid-session]                        │
│         ↓                                                        │
│  LANGUAGE STYLE ANALYZER v1.1 (async)                           │
│  Scores 5 style signals → style_consistency_score               │
│  Passes score to Auditor input package                           │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
        ↓ (Strategist signals: close_session)

[Session ends]
        ↓
┌──── AUDITOR v1.2 (once, end of session) ─────────────────────┐
│ Input: transcript + Mapper JSON + Sentinel data + Style score  │
│ Output: Verdict JSON (bias-stripped Action Node scoring)       │
└───────────────────────────────────────────────────────────────┘
        ↓
┌──── SCHEMA VALIDATOR (pure code) ────────────────────────────┐
│ Validates all 5 dimensions scored                              │
│ Validates AMBER has upskill_path, RED does not                 │
│ Validates style_consistency_score present if triggered         │
│ Pass → Verdict Card released to employer                       │
│ Fail → Retry Auditor with specific error feedback (max 2×)    │
└───────────────────────────────────────────────────────────────┘
        ↓
[Employer HR Dashboard: Verdict Card]
        ↓
(GREEN)  → Employer notified, 48hr response window tracked
(AMBER)  → Candidate receives upskill path + re-evaluation offer
(RED)    → Career orientation suggestion. No colour label shown.
```

---

## The 3 State Machines Running Simultaneously

TalentBridge maintains three parallel state layers across every session. Each is owned by a different agent. Making them visible is what separates "AI chatbot" from "production Agentic system."

| State Layer | Owner Agent | States (in order) |
|---|---|---|
| **Dimension Coverage State** | Strategist | `UNEXPLORED` → `TOUCHED` → `DEVELOPING` → `SUFFICIENT` |
| **Session Integrity State** | Sentinel | `clean` → `stage_1_alert` → `stage_2_alert` |
| **Output Validity State** | Schema Validator | `pending` → `valid` → `retry` → `escalated` |

All three state machines run concurrently. The Strategist reads the first, receives signals from the second, and the third runs as a post-process gate. No single agent sees the full picture — which is precisely what makes the system robust.

---

## Chapter 5: Anti-Cheat Design — Why This Is Sophisticated

### Philosophy: Prevent > Detect > Review
The most effective anti-cheat strategy is not catching cheaters after the fact — it is making the interview structurally hard to cheat in the first place.

### Layer 1 — Structural Prevention (Inquisitor Design)
Every question is anchored to what the candidate just said. Abstract or hypothetical questions are not used. The Inquisitor asks for:
- **Specific incidents** ("Tell me about the most difficult customer you handled")
- **Specific details** ("What exactly did you say to them?")
- **Specific numbers** ("How many posts did you manage?")

These cannot be answered well by generic AI-generated content. A chatbot giving generic "best practices" will score zero Action Nodes.

### Layer 2 — Process Tracking (Sentinel)
Inspired by academic anti-plagiarism practice (document edit history analysis). Sentinel monitors:
- Tab switching (leaving to look something up)
- Paste events (pasting pre-written content)
- Response timing anomalies (long delay followed by a very long, polished answer)

### Layer 3 — Personalization Probes (Strategist reality_check)
Inspired by the most reliable academic anti-cheating method: asking students to verbally explain their own answers. The Strategist's `reality_check` does exactly this — asks for a detail only someone with genuine lived experience would know.

### Layer 4 — Style Forensics (Language Style Analyzer)
Five signals derived from AI-vs-human writing research:
1. Sudden response length spike (AI answers are characteristically longer)
2. Appearance of discourse markers ("Furthermore,", "In conclusion,")
3. Complete language register switch (Manglish → perfect formal English)
4. Loss of personal texture (no names, numbers, or specific incidents)
5. Disappearance of Malaysian colloquial markers ("lah", "lor", "kan")

**Expandable:** Future signals can be added as more research is completed without restructuring the Prompt. A threshold adjustment formula prevents score inflation.

### What We Don't Do (and Why)
| Rejected Approach | Why Rejected |
|---|---|
| AI-based text entropy detection | OpenAI shut down their own classifier due to accuracy issues. Unreliable. |
| Blocking clipboard paste entirely | B40 candidates on mobile phones paste normally — false positives would discriminate |
| Auto-rejecting flagged candidates | Sentinel flags alone never produce Red. HR always has the final decision. |

### Failure Recovery Flow

Every failure mode has a defined resolution path. Nothing reaches the candidate or employer as broken output.

```
[Auditor outputs Verdict JSON]
        ↓
[Schema Validator — pure code check]
        ↓
   PASS ──────────────────────────── FAIL (returns specific error list)
    ↓                                         ↓
[Verdict Card                    [Auditor retried with error feedback]
 released to HR]                              ↓
                              PASS ─────────────── FAIL (2nd attempt)
                               ↓                       ↓
                          [Released]        [Human Moderation Queue]
                                            (never shown as broken output
                                             to candidate or employer)
```

**What this proves to judges:** This is not a prototype. This is a system designed for production failure modes — retry logic, escalation paths, and graceful degradation are all accounted for before a single line of frontend code is written.

---

## The Engine Behind TalentBridge

At its core, TalentBridge is powered by a **domain-agnostic Agentic Workflow Engine**. Its reusable capabilities:

| Capability | Agent Responsible |
|---|---|
| Decompose unstructured inputs into structured dimensions | Mapper |
| Validate extracted structure before execution | Dimension QA |
| Plan multi-step reasoning flows with stateful tracking | Strategist |
| Deliver adaptive, language-sensitive user interaction | Inquisitor |
| Monitor process integrity via objective behavioural signals | Sentinel |
| Detect anomalies in content pattern mid-session | Language Style Analyzer |
| Produce structured, bias-audited decisions | Auditor |

Hiring is the **first implementation**. The same pipeline architecture — with domain-specific Mapper dimensions and Auditor scoring rubrics — can serve:

| Domain | Input | Mapper extracts | Auditor produces |
|---|---|---|---|
| 🏥 **Healthcare Triage** | Patient symptoms (unstructured) | Risk dimensions, symptom clusters | Urgency level + care pathway |
| 💳 **Loan Risk Assessment** | Financial statements + history | Capability indicators, liability flags | Risk classification + conditions |
| 🛠️ **Customer Complaint Resolution** | Angry customer message | Issue category, severity signals | Resolution verdict + quality score |

> We chose hiring because **200,000 young Malaysians deserved to be first.**

*Note for presentation: This slide takes 30 seconds. State it. Let judges connect the dots themselves. Do not demo healthcare — demo hiring with full depth.*

---

## Chapter 6: Prompt Versions & Scores

All 6 AI prompts have been iteratively written, audited by a 5-dimension scoring rubric (Clarity/Practicality/Innovation/Consistency/Universality, max 100), and optimised.

| # | Agent | Version | Score | Key Innovation |
|---|---|---|---|---|
| 1 | Mapper | v1.2 | 88/100 | Fixed 5-7 vs exactly-5 contradiction; added QA retry handling |
| 2 | Dimension QA | v1.1 | 93/100 | Three-check validation system; RETRY_FLAG mechanism; QA WARNING in probe_targets |
| 3 | Strategist | v1.1 | 93/100 | 4-state Coverage Map; 5-priority decision tree; Sentinel rate limiter |
| 4 | Inquisitor | v1.3 | 92/100 | Added `resolve_contradiction` action type; neutral transition rules |
| 5 | Language Style Analyzer | v1.1 | 95/100 | 5-signal registry; Malaysia-specific Signal 5; Future Signal Slots with threshold formula |
| 6 | Auditor | v1.2 | 91/100 | 4 human review triggers; style_consistency_score integrated; 4th input (Style Analysis) |

**Average prompt score: 92/100**

---

## Chapter 7: Token Economy (Cost Minimisation)

Every design decision is optimised to minimise AI token spend without reducing quality.

| Optimisation | Implementation | Saving |
|---|---|---|
| **Mapper + QA caching** | Called once per JD, JSON reused for all candidates | ~95% Mapper/QA cost saving at scale |
| **Sentinel = pure code** | Zero AI tokens for all behavioural monitoring | 100% saving vs AI-based detection |
| **Style Analyzer conditional** | Only fires on Sentinel Stage 2 (focus_loss >3 AND paste >1) | ~90% session cost saving vs always-on |
| **Inquisitor rolling summarisation** | Oldest non-critical turns compressed; Mapper JSON preserved verbatim | ~40% Inquisitor per-turn cost reduction |
| **Auditor called once** | Single call at session end, not per turn | vs naïve per-turn approach: 20× saving |
| **Schema Validator = pure code** | Zero AI tokens for output validation | 100% saving vs AI self-checking |

**Estimated cost per complete candidate session:**
- Approximately 40k–70k input tokens + 8k–15k output tokens across all 6 AI agents
- Approximately **RM 0.80 – RM 1.50 per session** at current GLM-4 pricing (higher end only if Style Analyzer is triggered)
- Against a RM 30,000+ average bad-hire cost: **ROI is 1:20,000+**

---

## Chapter 8: B40 Internet Resilience Design

This platform must work on 3G or weak WiFi. Every architectural choice reflects this constraint.

| Risk | Mitigation |
|---|---|
| Connection drop mid-interview | Every completed turn persisted to Supabase immediately. Candidate can re-enter link and resume from exact last question |
| Slow first response (feels "broken") | SSE streaming: first character appears within 1 second. Candidate sees typing indicator — never a blank wait |
| Heavy assets killing load time | Zero images, zero animations, zero video in interview interface. Pure text conversation |
| Response failure | Silent auto-retry once. If second attempt fails: "Network is slow, please wait" — not a crash |
| Session timeout | Sessions persist for 7 days. Incomplete sessions after 7 days become partial profiles — never Red flags |
| Platform feels unfamiliar | UI styled after WhatsApp — the most familiar interface for every Malaysian regardless of background |

---

## Chapter 9: The Triage System (Green / Amber / Red)

### Triage Decision Logic
| Result | Condition | Candidate Sees | Employer Sees |
|---|---|---|---|
| 🟢 **Green** | Average dimension score ≥ 75, no more than 1 dimension < 50 | Verified strengths. "Expect a response within 48 hours." | Full Verdict Card + Green badge + AI summary |
| 🟡 **Amber** | Average ≥ 55, at least 2 dimensions ≥ 75, gap is a specific learnable hard skill | Verified strengths + specific gap + 3-week upskill path | Full Verdict Card + Amber badge + upskill plan |
| 🔴 **Red** | Average < 55 OR all dimensions < 60 with zero personal texture | General career direction suggestion. **No colour label. No "Red" word.** | Full Verdict Card + Red badge + human review flag if applicable |

**Sentinel flags alone never produce Red.** A nervous candidate who left briefly while genuinely thinking → `human_review_required: true`, not Red.

### Critical Design Rule: Candidates Never See Their Colour
Candidates see:
- ✅ Their verified strengths
- ✅ Their specific skill gap (if any)
- ✅ Their upskill path (if Amber)
- ❌ Their colour rating — employer only
- ❌ The Auditor's full scoring notes — employer only

*"No candidate is ever told they are Red. The outcome is always framed as actionable, never as a label."*

### Why Red Receives No Upskill Path
Red indicates fundamental mismatch — not a surface-level skill gap. Providing a 3-week course would:
1. Give false hope to the candidate
2. Dilute the quality of the Amber talent pool
3. Waste platform compute resources

Red candidates receive a **career orientation suggestion** — dignified, honest, forward-looking. It begins with a strength, never mentions rejection, and never uses "unable to", "failed to", "lacked", or "insufficient."

---

## Chapter 10: Candidate Experience (Full Journey)

1. **Entry:** Unique link (from employer or job post) → Enter name → No registration required → Session begins
2. **Opening:** Inquisitor greets in candidate's detected language — candidate sets tone naturally
3. **Interview:** 15–20 minutes total. 3–5 minutes per major dimension. Conversation-paced, never rushed.
4. **During Interview:** Session persisted per turn. If candidate drops connection, they can re-enter and resume.
5. **Session Close:** Candidate sees personalised strengths summary + gap + learning path (if Amber). No colour shown.
6. **Follow-up:**
   - **Green:** "Expect to hear from the employer within 48 hours."
   - **Amber:** "Complete this path to be re-evaluated for this and similar roles."
   - **Red:** "Thank you. Based on our conversation, here are some direction to consider: [career orientation]."
7. **Dispute:** Every outcome includes a visible "Dispute this result" button → 72-hour human review → verdict upheld, revised, or fresh interview scheduled.

---

## Chapter 11: Employer Experience & HR Reputation Score

### Employer Journey
1. Upload JD → Mapper + QA Agent process once, JSON cached
2. Receive unique interview link for this role
3. Distribute link to candidates (paste in job post, direct share, etc.)
4. Each completed interview auto-populates HR dashboard as a Verdict Card
5. HR reviews card, takes action (invite / flag / pass)
6. System records response time → feeds HR Reputation Score

### HR Reputation Score
**Cold-start grace period:** Score not activated until employer has received their first 5 Verdict Cards. Removes adoption friction.

After grace period:
- Response within 48 hours → neutral, no effect
- No response within 48 hours → Ghosting event logged, score decrements
- Score below threshold → Job posts labelled "⚠️ Low Response Rate" (visible to candidates)
- Score is a **private operational metric**, not a public leaderboard

---

## Chapter 12: Business Model

### Revenue
- **Candidates:** Free at point of use. No candidate ever pays to be evaluated.
- **Employers:** Pay-per-Verdict-View — RM 30 per full Verdict Card
- **SME Monthly:** RM 500 / month (up to 30 card views)
- **Enterprise API:** Custom pricing for ATS integration

### The Amber Pool (Second Revenue Stream)
As the platform accumulates thousands of actively upskilling Amber candidates, TalentBridge holds the world's most precisely targeted, time-indexed, skills-acquiring talent pool. Future: employers subscribe to specific skill-pools and are auto-notified when a candidate achieves their target milestone. Headhunting fee model.

### Government Partnership (B2G)
HRDC spends RM 1.5 billion annually on upskilling but has no objective tool to measure outcomes. TalentBridge provides objective workforce competency baselines. B2G revenue path.

---

## Chapter 13: Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | Next.js App Router | Fast, responsive, mobile-first |
| Styling | Vanilla CSS / Tailwind | WhatsApp-style chat UI |
| Real-time streaming | SSE (Server-Sent Events) | More resilient than WebSocket on unstable connections |
| AI Agents | GLM-4 via ZhipuAI API | Native BM/Manglish reasoning, JSON mode, 128k context |
| Sentinel | Vanilla JS (browser native events) | No library needed, works on any device |
| Database | Supabase (PostgreSQL) | Session persistence, Auth, Row-Level Security |
| Schema Validator | Python / Node.js function | Pure code, zero AI tokens |
| Deployment | Vercel | Instant CI/CD from GitHub, global CDN |

---

## Chapter 14: Hackathon MoSCoW Execution Plan

### Must Have (Live — real API, no hardcoding)
- [ ] Mapper processing a real JD → dimension JSON
- [ ] Dimension QA validating Mapper output before interview starts
- [ ] Strategist directing conversation per turn with Coverage Map
- [ ] Inquisitor conducting a live multi-language conversation (BM / Manglish / English)
- [ ] Sentinel front-end tracking (focus events, paste events)
- [ ] Auditor producing a Verdict Card at session end
- [ ] Schema Validator checking output before release
- [ ] Session persistence (candidate can re-enter and resume)
- [ ] Verdict Card displayed to HR (even if minimal UI)

### Should Have
- [ ] Language Style Analyzer triggering on Sentinel Stage 2
- [ ] Amber learning path auto-generated and delivered to candidate
- [ ] HR dashboard Verdict Card list view
- [ ] Graceful degradation on slow connection (auto-retry, loading state)
- [ ] Strategist `reasoning` field visible in debug panel for judges

### Could Have
- [ ] HR Reputation Score real-time tracking
- [ ] Candidate strengths radar chart
- [ ] Dispute submission flow

### Won't Have (Figma mockup for demo)
- [ ] Full employer JD management backend
- [ ] HRDC / SOCSO API integration
- [ ] Multi-tenant employer management
- [ ] Native mobile app
- [ ] Payment processing

### Demo Strategy
**Run the full candidate conversation live.** Judges will ask to type input — this must work.
Show the Strategist's `reasoning` field in a debug panel — it proves the AI is thinking, not scripted.
HR dashboard can be a high-fidelity Figma prototype playing alongside the live demo.
Pre-record a 60fps backup video for venue WiFi failure — but attempt live first.

---

## Agent Design Order (Recommended Build Sequence)
1. **Schema Validator (pure code)** — Write the output contract first. Everything else must satisfy it.
2. **Mapper v1.2** — Simplest AI prompt. Learn strict JSON output discipline.
3. **Dimension QA v1.1** — Solidify the QA loop before building the interview.
4. **Auditor v1.2** — Most important for fairness. Write bias-stripping list carefully.
5. **Inquisitor v1.3** — Practice writing for warmth and language sensitivity.
6. **Language Style Analyzer v1.1** — Conditional agent. Build after Sentinel is wired.
7. **Strategist v1.1** — Most complex. Build last when you understand the full system.
8. **Sentinel (pure code)** — Wire into frontend throughout the build.

---

> **Closing:** This is not a hackathon project. It is the reply owed to 200,000 young Malaysians who applied for jobs this year and heard nothing back.
