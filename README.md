# Cogniscope: Multi-Engine Knowledge Diagnostic Platform

Cogniscope is an adaptive learning diagnostic platform that evaluates conceptual mastery in foundational Machine Learning. Instead of relying on static right/wrong scoring, Cogniscope uses real-time multi-LLM inference to detect *why* a student got something wrong, map that gap back to prerequisite concepts, and dynamically author a personalized explanation and a brand-new verification question — then proves the intervention worked by measuring the mastery change.

---

## The Problem

Most AI tutoring tools answer questions. Very few figure out *why a specific student* is stuck. A generic explanation of "regularization" doesn't help someone whose real issue is a shaky understanding of overfitting one concept earlier — they need the actual gap named and closed, then a way to confirm it's actually closed.

## The Solution

Cogniscope runs a closed diagnostic loop:

```
Diagnose → Detect Misconception → Personalized Intervention → Retest → Prove Improvement
```

1. A student takes a short diagnostic quiz across a set of connected ML concepts.
2. Cogniscope scores mastery **per concept**, not just overall — weighted by question difficulty.
3. For any weak concept, an LLM analyzes the student's specific wrong answers (and the mastery of the *prerequisite* concept) to identify the likely misconception in plain language.
4. A second LLM call generates a short, targeted explanation aimed at that exact misconception — not a generic textbook definition.
5. A brand-new, never-seen verification question is generated live to test whether the misconception is actually resolved.
6. The student's mastery score updates in real time, showing a before → after comparison.

---

## Architecture Overview

```
[ Frontend: React + Tailwind CSS + Framer Motion ]
                          │
                   REST API Calls
                          ▼
             [ FastAPI Diagnostic Core ]
              ├── SQLite Persistence Layer (session-scoped)
              └── Multi-LLM Cascade Engine
                     ├── Primary:  Gemini-3.6-flash
                     └── Failover: Groq LPU (openai/gpt-oss-120b → openai/gpt-oss-20b → qwen/qwen3.6-27b)
```

* **Multi-LLM Failover Routing:** Requests route to Gemini as the primary diagnostician. If Gemini hits a rate limit or quota boundary, the engine automatically escalates inference to Groq's LPUs without any frontend interruption — the student never sees the switch.
* **Live Dynamic Generation:** No static fallback templates or mock dictionaries. Every misconception detection, remediation explanation, and retest question is synthesized live by the model. A structured fallback response only activates if *both* providers fail, so the app degrades gracefully instead of crashing during a demo.
* **Session-Scoped State:** Each browser session gets a generated session ID, so multiple people can try the demo at once without their answers or mastery scores mixing together. This is lightweight session separation for demo purposes, not a full authentication system.
* **Weighted Mastery & Dependency Analysis:** Concept proficiency is scored dynamically based on question difficulty weighting (1× easy, 2× medium, 3× hard), combined with prerequisite mastery tracking across the concept graph.

---

## Core Features

* **Adaptive Concept Diagnostic** — evaluates foundational ML modules (e.g. Training vs. Testing, Overfitting, Regularization, Bias–Variance Tradeoff, Gradient Descent).
* **Deep Misconception Detection** — analyzes *which specific wrong answer* a student chose to isolate their actual mental model gap, not just that they got it wrong.
* **Targeted Mentor Interventions** — generates a personalized, 3–5 sentence conceptual explanation aimed directly at the diagnosed gap, using an intuitive analogy rather than a textbook definition.
* **Live Verification Retesting** — dynamically generates a unique, never-duplicated verification question with a single-use token to confirm the misconception was actually resolved.
* **Before/After Mastery Proof** — shows the concrete mastery percentage change resulting from the intervention, turning "did this help?" into a measurable number.
* **Telemetry Console UI** — deep-slate (`#080B14`) and electric cyan (`#22D3EE`) console palette, with semantic success/warning/error states, frosted glassmorphic containers, ambient background glows, and spring-based motion throughout.

---

## How AI Was Used

AI is not a bolt-on chat widget in this project — it's the core diagnostic engine:

| Where | What the AI does | What the app does with it |
|---|---|---|
| Misconception detection | Analyzes wrong answers + prerequisite mastery, returns structured JSON naming the likely misconception | App stores it, flags the concept, feeds it into the next two stages |
| Intervention | Writes a short, targeted explanation addressing that exact misconception | App displays it in the mentor UI, tied to the diagnosed concept |
| Retest generation | Authors a brand-new question specifically targeting the same misconception, avoiding duplicate questions | App scores the answer, recalculates mastery, and shows the before/after result |

The AI produces structured learner intelligence; the application layer (mastery formulas, session tracking, prerequisite graph) decides what to do with it. This keeps the LLM central to the functionality rather than a wrapper around a static app.

---

## Tech Stack

### Frontend
- **Framework:** React (Vite)
- **Styling:** Tailwind CSS (v4, custom theme tokens)
- **Animation:** Framer Motion (spring transitions, modals, progress indicators)
- **Icons:** Lucide React
- **Typography:** Space Grotesk, Inter, JetBrains Mono

### Backend
- **API Framework:** FastAPI (Python 3.10+)
- **Inference Pipeline:** Google GenAI SDK (`gemini-2.5-flash`), Groq SDK (`openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `qwen/qwen3.6-27b`)
- **Data Layer:** SQLite3 with relational foreign keys and session-scoped state
- **Validation:** Pydantic

> **Note on model choice:** this project uses the current, actively-supported `google-genai` SDK and Gemini/Groq model IDs. Both providers deprecate models periodically — if a model listed here stops working, check [Google's model list](https://ai.google.dev/gemini-api/docs/libraries) or [Groq's deprecations page](https://console.groq.com/docs/deprecations) for current replacements.

---

## Getting Started

### Prerequisites
- Python 3.10 or higher
- Node.js 18+ and npm / pnpm
- Valid API keys for:
  - [Google AI Studio](https://aistudio.google.com/) (`GEMINI_API_KEY`)
  - [Groq Cloud Console](https://console.groq.com/) (`GROQ_API_KEY`)

### Backend Setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
# Windows (cmd/PowerShell):
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install fastapi uvicorn pydantic python-dotenv google-genai groq
```

Create a `.env` file in `backend/`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
```

Start the server:

```bash
uvicorn main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend   # or project root, wherever package.json lives
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Verifies active status of Gemini and Groq providers. |
| `GET` | `/api/quiz` | Retrieves all seeded diagnostic questions, grouped by concept. |
| `POST` | `/api/answer` | Submits an answer, updates mastery, tracks session state. |
| `GET` | `/api/mastery` | Returns overall mastery and confidence scores across all concepts. |
| `GET` | `/api/misconception/{concept_id}` | Runs multi-LLM analysis to detect the student's specific knowledge gap. |
| `GET` | `/api/intervention/{concept_id}` | Generates a targeted explanation resolving the diagnosed misconception. |
| `GET` | `/api/retest/{concept_id}` | Dynamically generates a novel verification question and issues a single-use token. |
| `POST` | `/api/retest/{concept_id}/answer` | Evaluates the retest submission, recalculates mastery, returns before/after comparison. |

All endpoints (except `/api/quiz` and `/api/health`) require a `session_id` so concurrent demo sessions don't mix state.

---

## Project Structure

```
Cogniscope/
├── backend/
│   ├── database.py                 # SQLite schema initialization & question seeding
│   ├── main.py                     # FastAPI server & Multi-LLM cascade routing
│   └── .env                        # LLM API credentials (git-ignored)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── GlassCard.jsx       # Frosted glassmorphism container
│   │   │   ├── PrimaryButton.jsx   # Spring-animated CTA button
│   │   │   ├── QuizView.jsx        # Adaptive assessment interface
│   │   │   ├── ResultsView.jsx     # Mastery matrix & concept breakdown
│   │   │   ├── InterventionModal.jsx # Live diagnostic mentor modal
│   │   │   └── RetestModal.jsx     # Live dynamic verification retest
│   │   ├── App.jsx                 # Core orchestrator & view state machine
│   │   ├── index.css               # Tailwind v4 theme, ambient glows, typography
│   │   └── main.jsx                # Application entry point
│   └── package.json
├── .gitignore
└── README.md
```

---

## Why This Design

| Goal | How Cogniscope addresses it |
|---|---|
| **Real educational value** | Diagnoses the *specific* misconception behind a wrong answer instead of generic re-teaching, and proves the fix worked with a measurable mastery change. |
| **Meaningful use of AI/ML** | AI is the core mechanism — structured misconception detection, targeted explanation generation, and live question authoring — not a chat wrapper bolted onto a static app. |
| **Solid technical execution** | Full working closed loop (diagnose → intervene → retest → prove), session-scoped state, and a resilient multi-provider LLM fallback so the app degrades gracefully instead of breaking. |
| **Clear, demonstrable results** | The before/after mastery jump is a concrete, visual, provable result — not a claim. |

---

## Acknowledgments

Built by Swagath BL. 