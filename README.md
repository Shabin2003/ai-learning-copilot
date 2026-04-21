# 🎓 LearnOS — AI Learning Copilot

An adaptive, multi-agent AI tutoring system inspired by Cuemath. Six specialized LangChain agents collaborate in real time to deliver personalized learning — diagnosing gaps, planning paths, generating questions, evaluating answers, explaining concepts, and adapting difficulty.

---

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                       │
│  Onboarding → Session Loop → Analytics Dashboard               │
│  Deployed on: Vercel                                            │
└────────────────────────┬────────────────────────────────────────┘
                         │  REST API (JSON)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (FastAPI)                          │
│                                                                 │
│  ┌──────────────────── AGENT PIPELINE ─────────────────────┐   │
│  │                                                          │   │
│  │  ① Diagnostic      → Identifies knowledge gaps          │   │
│  │  ② Planner         → Generates personalized path        │   │
│  │  ③ QuestionGen     → Creates adaptive questions         │   │
│  │  ④ Evaluator       → Partial scoring + feedback         │   │
│  │  ⑤ Explainer       → Level-based concept explanation    │   │
│  │  ⑥ Engagement      → Tracks & adapts learning flow      │   │
│  │                                                          │   │
│  └─────────────────────────┬────────────────────────────────┘   │
│                            │ LangChain / LangGraph               │
│  ┌─────────────────────────▼────────────────────────────────┐   │
│  │              LLM Layer (OpenAI / Groq)                   │   │
│  └─────────────────────────┬────────────────────────────────┘   │
│                            │                                     │
│  ┌──────────┐  ┌───────────▼──────┐  ┌────────────────────┐    │
│  │ MongoDB  │  │  Vector DB        │  │  Session Memory    │    │
│  │ (Atlas)  │  │  (Pinecone)       │  │  (In-session)      │    │
│  └──────────┘  └──────────────────┘  └────────────────────┘    │
│  Deployed on: Railway / Render                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🤖 The Six Agents

| Agent | Role | Key Logic |
|-------|------|-----------|
| **Diagnostic** | Identifies weak concepts from student responses | Analyzes last 10 attempts, tags misconceptions and prerequisite gaps |
| **Planner** | Generates personalized learning path | Sequences topics by prerequisite order, interleaves weak areas, uses diagnostic output |
| **QuestionGenerator** | Creates adaptive questions | Varies type (MCQ/short/fill-blank), targets weak concepts 30% of the time, avoids repeats |
| **Evaluator** | Scores answers with partial credit | 0-1 scoring scale, concept-level feedback, LLM-powered reasoning assessment |
| **Explainer** | Level-appropriate concept explanations | Three depth modes: brief / detailed / eli5, with analogies and examples |
| **Engagement** | Tracks accuracy, time, adapts flow | Vygotsky ZPD algorithm, frustration/boredom detection, streak tracking |

---

## 🔄 The Adaptive Loop

```
Student answers question
         │
         ▼
   Evaluator Agent
   ├─ Correct? → score = 1.0
   ├─ Partial? → score = 0.4–0.9
   └─ Wrong?   → score = 0.0, tag weak concepts
         │
         ▼
   Engagement Agent
   ├─ Update streak / consecutive correct/wrong
   ├─ Calculate new difficulty score (0–1)
   ├─ Check for frustration (3 consecutive wrong)
   ├─ Check for boredom (5 consecutive correct)
   └─ Check topic mastery (75% accuracy over 5 attempts → advance)
         │
         ▼
   QuestionGenerator Agent
   ├─ Pick topic (current or weak area, 30% chance)
   ├─ Set difficulty (beginner / intermediate / advanced)
   └─ Generate fresh question
         │
         ▼
   Back to student ↑
```

---

## 📁 Project Structure

```
ai-learning-copilot/
├── backend/
│   ├── main.py                 # FastAPI app entry point
│   ├── config.py               # Pydantic settings
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env.example
│   │
│   ├── agents/
│   │   ├── diagnostic.py       # Diagnostic Agent
│   │   ├── planner.py          # Planner Agent + difficulty algorithms
│   │   ├── question_generator.py  # Question Generator Agent
│   │   ├── evaluator.py        # Evaluator Agent
│   │   ├── explainer.py        # Explainer Agent
│   │   └── engagement.py       # Engagement Agent
│   │
│   ├── routes/
│   │   ├── sessions.py         # POST /api/sessions, GET /api/sessions/:id
│   │   ├── questions.py        # POST /generate, /submit, /explain
│   │   ├── analytics.py        # GET /api/analytics/:id
│   │   └── agents.py           # POST /api/agents/run
│   │
│   ├── services/
│   │   ├── database.py         # Motor (async MongoDB) service
│   │   └── llm.py              # LLM abstraction (OpenAI / Groq)
│   │
│   └── models/
│       ├── schemas.py          # Pydantic request/response models
│       └── documents.py        # MongoDB document models
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx                  # Landing page
    │   │   ├── onboarding/page.tsx       # 3-step onboarding flow
    │   │   ├── session/[id]/page.tsx     # Main learning session
    │   │   └── analytics/[id]/page.tsx  # Analytics dashboard
    │   │
    │   ├── components/session/
    │   │   ├── QuestionCard.tsx          # Renders MCQ/text/fill questions
    │   │   ├── EvaluationCard.tsx        # Shows scoring + explanation
    │   │   ├── SessionSidebar.tsx        # Progress + learning path
    │   │   ├── TopBar.tsx                # XP + accuracy header
    │   │   ├── ExplainerDrawer.tsx       # Slide-in concept explainer
    │   │   └── StreakCelebration.tsx     # Animated streak overlay
    │   │
    │   ├── lib/api.ts           # Typed API client
    │   ├── store/session.ts     # Zustand global state
    │   └── types/index.ts       # TypeScript type definitions
    │
    ├── tailwind.config.js
    ├── next.config.js
    └── vercel.json
```

---

## 🚀 Local Development Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- MongoDB Atlas account (free tier: [mongodb.com/atlas](https://mongodb.com/atlas))
- OpenAI API key **or** Groq API key (free: [console.groq.com](https://console.groq.com))

### 1. Backend

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# Edit .env with your API keys and MongoDB URI

# Run development server
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.
Interactive docs at `http://localhost:8000/docs`.

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit: NEXT_PUBLIC_API_URL=http://localhost:8000

# Run development server
npm run dev
```

Frontend at `http://localhost:3000`.

---

## ☁️ Production Deployment — 100% Free on Vercel

Both backend and frontend deploy to Vercel's **free Hobby tier**. The key is enabling **Fluid Compute**, which raises the function timeout from 10s → **300 seconds** — more than enough for LangChain + LLM chains.

```
┌─────────────────────────────────────────┐
│         github.com/you/learnos          │
│  ├── backend/   → Vercel Project A      │
│  └── frontend/  → Vercel Project B      │
└─────────────────────────────────────────┘
```

> ⚠️ **Critical**: You must deploy backend and frontend as **two separate Vercel projects** pointing to their respective subdirectories.

---

### Step 1 — Enable Fluid Compute (fixes LLM timeouts)

The `backend/vercel.json` already sets `"maxDuration": 300`. After deploying, go to:

**Vercel Dashboard → Your Backend Project → Settings → Functions → Enable Fluid Compute**

This is what allows LangChain agent calls (which can take 5–20s) to complete without 504 errors.

---

### Step 2 — Deploy the Backend

**Option A: Vercel CLI**
```bash
cd backend

# Install Vercel CLI
npm i -g vercel

# Deploy (follow prompts — set root directory to backend/)
vercel

# Set environment variables
vercel env add OPENAI_API_KEY
vercel env add MONGODB_URI
vercel env add LLM_PROVIDER
# ... repeat for all vars in .env.example

# Redeploy with env vars
vercel --prod
```

**Option B: Vercel Dashboard**
1. Go to [vercel.com/new](https://vercel.com/new) → Import Git Repository
2. Select your repo, set **Root Directory** to `backend`
3. Framework Preset: **Other**
4. Build Command: *(leave empty)*
5. Install Command: `pip install -r requirements.txt`
6. Add all environment variables from `backend/.env.example`
7. Click **Deploy**

Note your backend URL: `https://learnos-api.vercel.app`

---

### Step 3 — Deploy the Frontend

**Option A: Vercel CLI**
```bash
cd frontend
vercel

# Set the backend URL
vercel env add NEXT_PUBLIC_API_URL
# Enter: https://learnos-api.vercel.app

vercel --prod
```

**Option B: Vercel Dashboard**
1. Go to [vercel.com/new](https://vercel.com/new) → Import the **same** Git repo
2. Set **Root Directory** to `frontend`
3. Framework Preset: **Next.js** (auto-detected)
4. Add env var: `NEXT_PUBLIC_API_URL` = `https://learnos-api.vercel.app`
5. Click **Deploy**

---

### Step 4 — Database → MongoDB Atlas (Free)

1. Create a free M0 cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a database user (username + password)
3. Under **Network Access** → Add `0.0.0.0/0` (allow all IPs for Vercel's dynamic IPs)
4. Get your connection string:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true
   ```
5. Set as `MONGODB_URI` in your Vercel backend environment variables

---

### Free Tier Summary

| Service | Plan | Cost | Limits |
|---------|------|------|--------|
| Vercel (Backend) | Hobby | **Free** | 150K invocations/mo, 300s timeout (Fluid Compute) |
| Vercel (Frontend) | Hobby | **Free** | 100GB bandwidth, unlimited deploys |
| MongoDB Atlas | M0 | **Free** | 512MB storage, shared cluster |
| OpenAI API | Pay-per-use | ~$0.01/session | gpt-4o-mini is very cheap |
| Groq API | Free tier | **Free** | 14,400 requests/day |

> 💡 **Tip**: Use **Groq** (`LLM_PROVIDER=groq`) for zero LLM cost during development — it's free up to 14,400 requests/day with Llama 3.1.

---

## 🔌 API Reference

### Sessions
```
POST   /api/sessions/                    Create new session
GET    /api/sessions/{id}                Get session info
POST   /api/sessions/{id}/learning-path  Regenerate learning path (Planner agent)
```

### Questions (Core Adaptive Loop)
```
POST   /api/questions/generate           Generate next adaptive question
POST   /api/questions/submit             Submit answer → evaluate → get next question
POST   /api/questions/explain            Get concept explanation (Explainer agent)
```

### Analytics
```
GET    /api/analytics/{id}               Full session analytics
GET    /api/analytics/{id}/summary       Quick stats summary
```

### Agents
```
POST   /api/agents/run                   Run specific agent directly
GET    /api/agents/{id}/health           Session health metrics
```

---

## 🧠 Adaptive Difficulty Algorithm

The system uses a continuous **difficulty score** (0.0 – 1.0) rather than discrete levels:

```python
# Vygotsky Zone of Proximal Development target: 70% accuracy
# If recent accuracy > 85% → increase difficulty score by 0.10
# If recent accuracy > 70% → increase by 0.05
# If recent accuracy < 50% → decrease by 0.10
# If recent accuracy < 60% → decrease by 0.05

# Score → Level mapping:
# 0.00–0.34 → Beginner
# 0.35–0.69 → Intermediate
# 0.70–1.00 → Advanced
```

**Engagement triggers:**
- 3 consecutive wrong → Frustration mode: drop difficulty, add encouragement
- 5 consecutive correct → Boredom mode: increase difficulty
- Time > 2.5× expected → Suggest hint on next question
- Time < 20% expected → Flag possible guessing

---

## 🔧 Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `LLM_PROVIDER` | `openai` or `groq` | `openai` |
| `LLM_MODEL` | Model name | `gpt-4o-mini` |
| `GROQ_MODEL` | Groq model | `llama-3.1-70b-versatile` |
| `MONGODB_URI` | MongoDB connection string | localhost |
| `PINECONE_API_KEY` | For vector search (optional) | — |

---

## 🎮 Demo Flow

1. **Onboarding** — Enter name, select subject (Math/Science/English/Coding), set starting difficulty
2. **Session starts** — Planner agent generates a 10-topic learning path
3. **Question loop** — Question Generator creates an adaptive question
4. **Answer** — Type text or select MCQ option
5. **Evaluation** — Evaluator agent scores with partial credit, Diagnostic agent tags weak concepts
6. **Feedback** — Explanation, encouragement, weak concept tags shown
7. **Next question** — Difficulty adjusted by Engagement agent, next question generated
8. **Analytics** — Real-time dashboard shows accuracy, trends, radar chart, weak/strong areas

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **LLM Orchestration** | LangChain (Python) |
| **LLM Providers** | OpenAI GPT-4o-mini / Groq Llama-3.1 |
| **Backend** | FastAPI + Uvicorn |
| **Database** | MongoDB (Motor async driver) |
| **Vector DB** | Pinecone (optional) |
| **Frontend** | Next.js 14 (App Router) |
| **State** | Zustand |
| **Charts** | Recharts |
| **Animation** | Framer Motion |
| **Styling** | Tailwind CSS |
| **Backend Deploy** | Railway / Render |
| **Frontend Deploy** | Vercel |

---

## 📄 License

MIT
