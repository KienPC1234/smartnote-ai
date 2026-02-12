# SmartNote AI (MVP) — Full Design Doc (React + Next.js + Tailwind + SQLite + Auth + LLM via ai.fptoj.com/v1)

**Goal:** Build a web app where users paste study notes and instantly get:
- Clean **Outline** (Markdown)
- **Flashcards** (JSON → UI flip cards)
- **Quiz** (JSON → interactive MCQ) + **Weak Spots**

**Constraints:**
- Database: **SQLite**
- Frontend: **React + Next.js** (neobrutalism design, https://github.com/ekmas/neobrutalism-components)
- Auth: **Google account** *or* **normal account (email/password)**
- LLM: **OpenAI-compatible** endpoint `https://ai.fptoj.com/v1` (API key in `.env`)
- MVP-first (fast to demo), but structured so you can extend.

---

## 0) Tech Stack Choices

### Recommended stack
- **Next.js (App Router)** + React 18
- **TailwindCSS** for UI
- **NextAuth v5** (Auth.js) for:
  - Google OAuth
  - Credentials (email/password)
- **Prisma + SQLite** (fast, stable migrations)
- Server-side calls to LLM using `fetch` (Node runtime) to keep API key safe.

> Alternative: Drizzle + better-sqlite3. Prisma is easiest for MVP.

---

## 1) User Stories (MVP)

### Authentication
1. As a user, I can sign in using **Google**.
2. As a user, I can sign up/sign in using **email + password**.
3. As a signed-in user, I can log out.

### Notes & Generation
4. As a user, I can create a note by pasting text and giving it a title.
5. As a user, I can click **Generate** to create Outline / Flashcards / Quiz.
6. As a user, I can open past notes and see the latest generation.
7. As a user, I can re-generate (new version) and compare if needed (optional for MVP).

---

## 2) Information Architecture (Pages)

### Public
- `/` — Landing page (value prop + CTA)
- `/auth/signin` — Sign in/up screen (Google + email/password)

### Protected (requires login)
- `/app` — Dashboard: list notes, “New Note”
- `/app/new` — Create note (textarea)
- `/app/n/[id]` — Note detail with tabs:
  - **Outline**
  - **Flashcards**
  - **Quiz**
  - **Weak Spots**

---

## 3) UI/UX (Tailwind Layout)

### Dashboard `/app`
- Header: App name + profile dropdown
- Main: 
  - Search bar (optional)
  - “New Note” button
  - Notes list (title, updated time, preview snippet)
  - Click to open note detail

### New Note `/app/new`
- Title input
- Textarea (paste notes)
- Buttons:
  - Save
  - Save & Generate

### Note Detail `/app/n/[id]`
- Top: Title + actions
  - “Generate / Regenerate”
  - “Edit source”
- Tabs:
  - Outline (render Markdown)
  - Flashcards (flip cards, next/prev)
  - Quiz (MCQ, score)
  - Weak Spots (list)

---

## 4) Database Design (SQLite + Prisma)

### Entities
- **User**: identity
- **Account**: OAuth link (NextAuth)
- **Session**: NextAuth session
- **VerificationToken**: (optional; email verification; can skip in MVP)
- **Note**: user’s pasted content
- **Generation**: AI outputs per note

### Prisma schema (recommended)
Create `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?

  // For credentials auth
  passwordHash  String?

  notes         Note[]
  accounts      Account[]
  sessions      Session[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Note {
  id          String       @id @default(cuid())
  userId      String
  title       String
  sourceText  String
  language    String       @default("auto")
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  generations Generation[]
}

model Generation {
  id            String   @id @default(cuid())
  noteId        String
  model         String
  promptVersion String   @default("v1")

  outlineMd      String
  flashcardsJson String
  quizJson       String
  weakspotsMd    String?

  tokenUsageJson String?

  createdAt      DateTime @default(now())

  note          Note     @relation(fields: [noteId], references: [id], onDelete: Cascade)

  @@index([noteId, createdAt])
}

// NextAuth models (standard)
model Account {
  id                 String  @id @default(cuid())
  userId             String
  type               String
  provider           String
  providerAccountId  String
  refresh_token      String?
  access_token       String?
  expires_at         Int?
  token_type         String?
  scope              String?
  id_token           String?
  session_state      String?

  user               User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

### Why store JSON as TEXT?
Fast MVP. Parse JSON in UI. Later you can normalize flashcards/quiz to tables if you want analytics.

---

## 5) Authentication Design (Google + Credentials)

### Provider 1: Google OAuth
- Use NextAuth Google provider.
- Requires:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`

### Provider 2: Credentials (email/password)
- Store `passwordHash` in `User`.
- Use bcrypt or argon2.

**MVP rules:**
- No email verification required (optional).
- Rate-limit login endpoint (recommended).

---

## 6) Environment Variables (`.env.local`)

```env
# App
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace_with_long_random

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# SQLite
DATABASE_URL="file:./dev.db"

# LLM (OpenAI-compatible)
FPT_OJ_BASE_URL=https://ai.fptoj.com/v1
FPT_OJ_API_KEY=YOUR_KEY_HERE
LLM_MODEL=llama3.1:8b
LLM_TEMPERATURE=0.3
LLM_MAX_TOKENS=1800
```

---

## 7) Folder Structure (App Router)

```
app/
  (public)/
    page.tsx                 # landing
    auth/
      signin/page.tsx
  (protected)/
    app/
      layout.tsx             # auth guard layout
      page.tsx               # dashboard
      new/page.tsx           # create note
      n/[id]/page.tsx        # note detail
api/
  auth/[...nextauth]/route.ts
  notes/route.ts             # POST create, GET list
  notes/[id]/route.ts        # GET detail, PATCH update
  notes/[id]/generate/route.ts # POST generate
lib/
  auth.ts                    # NextAuth config
  prisma.ts                  # Prisma client singleton
  llm.ts                     # LLM client
  prompts.ts                 # prompt strings (v1)
  sanitize.ts                # trimming, validations
components/
  Navbar.tsx
  NoteEditor.tsx
  Tabs.tsx
  MarkdownView.tsx
  FlashcardsView.tsx
  QuizView.tsx
  WeakSpotsView.tsx
```

---

## 8) Authorization Rules (Important)

All note endpoints must ensure:
- The requester is authenticated
- `note.userId === session.user.id`

Never allow cross-user access.

---

## 9) API Design (Routes & Payloads)

### `POST /api/notes`
Create note.

**Request**
```json
{ "title": "My note", "sourceText": "..." }
```

**Response**
```json
{ "id": "noteId" }
```

Validation:
- `title`: 1..120 chars
- `sourceText`: 50..20000 chars (trim to max)

### `GET /api/notes`
List user notes.

**Response**
```json
{
  "notes": [
    { "id":"...", "title":"...", "updatedAt":"...", "preview":"..." }
  ]
}
```

### `GET /api/notes/:id`
Detail note.

**Response**
```json
{
  "note": { "id":"...", "title":"...", "sourceText":"...", "updatedAt":"..." }
}
```

### `POST /api/notes/:id/generate`
Generate AI outputs; store new Generation row.

**Request (optional)**
```json
{ "promptVersion": "v1" }
```

**Response**
```json
{
  "generation": {
    "id":"...",
    "outlineMd":"...",
    "flashcardsJson":"{...}",
    "quizJson":"{...}",
    "weakspotsMd":"..."
  }
}
```

### `GET /api/notes/:id/latest`
Get latest generation only.

---

## 10) LLM Client (OpenAI-compatible)

Create `lib/llm.ts`:

**Key behaviors**
- Use server-side `fetch`
- Provide:
  - `chatJson(system, user)` → returns parsed JSON
  - `chatText(system, user)` → returns string

**Recommended request body**
- `model`: `process.env.LLM_MODEL`
- `temperature`: 0.3
- `max_tokens`: 1800 (or use env)

**Parsing strategy**
- First attempt: parse response as JSON
- On failure: retry once with strict “return valid JSON” repair prompt
- If still fail: return error to UI with “Try again”.

---

## 11) Prompt Pack (FULL ENGLISH PROMPTS — v1)

Create `lib/prompts.ts` and export strings.

### Shared SYSTEM prompt (use for all calls)
```text
You are SmartNote AI, an assistant that turns messy study notes into structured learning materials.

Hard requirements:
- Output must be strictly in the format requested by the user message (Markdown or JSON).
- If JSON is requested: return ONLY valid JSON (no markdown fences, no commentary).
- Do not invent facts that are not present or strongly implied in the provided notes.
- If the notes are unclear, add a short "Assumptions" section (or field) and keep it minimal.
- Keep language consistent with the input language unless the user explicitly asks for English.
- Prefer clarity and correctness over verbosity.
```

---

### CALL 1 — Outline (Markdown)
```text
Task: Create a clean, study-ready outline from the notes below.

Constraints:
- Preserve the original language of the notes.
- Use Markdown.
- Produce:
  1) A short title (one line, Markdown H1).
  2) A 5–10 bullet "Key Takeaways" section.
  3) A structured outline with headings (H2/H3) and concise bullets.
  4) A short glossary of important terms (5–15 items).
  5) If there are gaps/ambiguities, add a final "Assumptions" section (max 5 bullets).

Notes:
{{SOURCE_TEXT}}
```

---

### CALL 2 — Flashcards (JSON only)
```text
Task: Generate flashcards from the notes below.

Return ONLY valid JSON with this exact schema:
{
  "flashcards": [
    {
      "id": "fc_001",
      "front": "string",
      "back": "string",
      "tags": ["string"],
      "difficulty": 1
    }
  ]
}

Rules:
- Preserve the original language of the notes.
- Make 12 to 25 flashcards depending on note length.
- "front" should be a clear question or prompt.
- "back" should be a concise, correct answer (1–5 sentences).
- "difficulty" is an integer 1 (easy) to 5 (hard).
- "tags" should be 1–3 short tags (e.g., topic names).
- Do not include any extra keys outside the schema.
- Do not use markdown fences.

Notes:
{{SOURCE_TEXT}}
```

---

### CALL 3 — Quiz + Weak Spots (JSON only)
```text
Task: Create a short quiz and identify weak spots from the notes.

Return ONLY valid JSON with this exact schema:
{
  "quiz": [
    {
      "id": "q_001",
      "type": "mcq",
      "question": "string",
      "choices": ["string", "string", "string", "string"],
      "answer_index": 0,
      "explanation": "string",
      "difficulty": 1,
      "tags": ["string"]
    }
  ],
  "weak_spots": [
    {
      "topic": "string",
      "why_confusing": "string",
      "quick_fix": "string"
    }
  ]
}

Rules:
- Preserve the original language of the notes.
- Quiz length: 8 to 12 MCQ questions.
- Each question must have exactly 4 choices.
- "answer_index" must be 0..3 and match the correct choice.
- "explanation" should be 1–3 sentences, referencing the notes.
- difficulty: 1..5
- tags: 1–3 items
- weak_spots: 3 to 7 items, concise but useful.
- Do not include any extra keys outside the schema.
- Do not use markdown fences.

Notes:
{{SOURCE_TEXT}}
```

---

### JSON Repair Prompt (use only on retry)
```text
Your previous response was not valid JSON.

Return ONLY valid JSON that matches the exact schema requested. 
- No extra keys.
- No markdown.
- No commentary.
```

---

## 12) Generation Pipeline (Server)

When user clicks “Generate”:
1. Fetch note (validate ownership)
2. Trim `sourceText` (max chars)
3. Call LLM:
   - Outline call (markdown)
   - Flashcards call (json)
   - Quiz call (json; contains weak_spots)
4. Convert weak_spots into Markdown if you want `weakspotsMd` (optional)
5. Insert `Generation` row
6. Return new generation.

**Trimming suggestion**
- `MAX_CHARS = 16000` (safe MVP)
- If > MAX_CHARS: cut tail and add marker:
  - `"...[TRUNCATED]"`

---

## 13) Security & Abuse Controls (MVP-friendly)

- Keep LLM API key server-side only
- Basic limits:
  - Max note length
  - Max regenerate per minute per user (simple in-memory or DB counter)
- Sanitize stored text (just store raw; escape in UI when rendering)
- Use `markdown` renderer that prevents XSS (e.g., `react-markdown` + `rehype-sanitize`)

---

## 14) Implementation Notes (NextAuth + Prisma)

### NextAuth session strategy
- Use database sessions (default with Prisma adapter) or JWT.
- MVP: JWT is simpler. DB sessions also fine.

### Credentials flow
- Sign up: custom route `POST /api/auth/signup`
  - validate email
  - hash password
  - create user
- Sign in: NextAuth Credentials provider calls authorize()
  - verify password

---

## 15) Suggested Components (React)

- `NoteEditor`
  - title input, textarea
  - Save & Generate buttons
- `MarkdownView`
  - render outline
- `FlashcardsView`
  - current index state
  - flip animation (Tailwind)
- `QuizView`
  - track answers
  - show explanation
  - compute score
- `WeakSpotsView`
  - list topics and quick fixes

---

## 16) Acceptance Criteria (MVP)

✅ User can sign in with Google or email/password  
✅ User can create a note (title + text)  
✅ User can generate and view outline/flashcards/quiz  
✅ Data persists in SQLite  
✅ Auth prevents cross-user access  
✅ Demo: paste notes → get learning materials within ~10–30 seconds  

---

## 17) Future Extensions (Nice-to-have)
- File upload (PDF → text extraction)
- RAG over multiple notes
- Spaced repetition scheduling
- Export to Anki
- Shareable link (read-only)
- Multi-language UI

---

## 18) Quick Setup Commands (for README)

```bash
npm i
npx prisma migrate dev
npm run dev
```

---

## 19) Minimal API Error Contract

All API routes return:
```json
{ "error": "..." }
```
with appropriate status:
- 400 validation
- 401 unauthenticated
- 403 unauthorized
- 500 internal/LLM failure

---

## 20) Testing Checklist (Manual)
- Sign in with Google works
- Sign up with email/password works
- Create note persists
- Generate persists and reload shows latest generation
- Another user cannot access your note by URL
- JSON outputs render correctly

---

**End of doc.**
