# Architecture & Database Documentation

> **⚠️ IMPORTANT: Documentation Maintenance Rule**
> 
> **This documentation MUST be updated whenever:**
> - Database schema changes (tables, columns, indexes, RLS policies, triggers)
> - Application flow changes (data flow, component interactions, API routes)
> - New features are added or major functionality is modified
> - Component architecture changes
> 
> **See `.cursorrules` for detailed guidelines.**
> 
> **Last Updated:** January 2026

## Table of Contents
1. [Database Schema](#database-schema)
2. [Application Architecture](#application-architecture)
3. [Data Flow](#data-flow)
4. [Key Components](#key-components)
5. [Features](#features)

---

## Database Schema

### Overview
The application uses **Supabase** (PostgreSQL) for data persistence. The schema is designed to be flexible, supporting both the current LeetCode-focused roadmap and future extensibility for custom learning paths.

### Entity Relationship Diagram

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   profiles  │────────<│   roadmaps   │         │  categories │
│             │         │              │         │             │
│ - id (PK)   │         │ - id (PK)    │         │ - id (PK)   │
│ - email     │         │ - user_id    │         │ - name      │
│ - display_ │         │ - title      │         │ - icon      │
│   name      │         │ - roadmap_   │         │ - order_    │
│ - created_  │         │   type       │         │   index     │
│   at        │         │ - config     │         └─────────────┘
└─────────────┘         │ - is_active  │                │
                        └──────────────┘                │
                                │                       │
                                │                       │
                        ┌───────┴────────┐             │
                        │                │             │
                        ▼                ▼             ▼
                ┌──────────────┐  ┌─────────────┐
                │user_progress │  │  problems   │
                │              │  │             │
                │ - id (PK)    │  │ - id (PK)   │
                │ - user_id    │  │ - category_ │
                │ - roadmap_id │  │   id        │
                │ - problem_id │  │ - created_  │
                │ - status     │  │   by        │
                │ - completed_ │  │ - title     │
                │   at         │  │ - difficulty│
                └──────────────┘  │ - leetcode_ │
                                  │   number    │
                                  │ - is_default│
                                  │ - order_    │
                                  │   index     │
                                  └─────────────┘
```

### Tables

#### 1. `profiles`
Stores user profile information linked to Supabase Auth.

**Columns:**
- `id` (uuid, PK) - References `auth.users(id)`
- `email` (text, nullable) - User email
- `display_name` (text, nullable) - User display name
- `created_at` (timestamptz) - Account creation timestamp

**Relationships:**
- One-to-many with `roadmaps`
- One-to-many with `problems` (for custom problems)
- One-to-many with `user_progress`

**RLS Policies:**
- Users can view and update their own profile only

---

#### 2. `categories`
Pre-seeded problem categories (Arrays, Trees, DP, etc.).

**Columns:**
- `id` (uuid, PK) - Unique identifier
- `name` (text) - Category name (e.g., "Arrays & Hashing")
- `icon` (text) - Emoji icon for UI display
- `order_index` (int) - Display order in sidebar

**Relationships:**
- One-to-many with `problems`

**RLS Policies:**
- Public read access (everyone can view categories)

---

#### 3. `problems`
Stores coding problems (pre-seeded LeetCode Top 150 + user-created).

**Columns:**
- `id` (uuid, PK) - Unique identifier
- `category_id` (uuid, FK) - References `categories(id)`
- `created_by` (uuid, FK, nullable) - References `profiles(id)` for custom problems
- `title` (text) - Problem title
- `difficulty` (text) - "Easy", "Medium", or "Hard" (CHECK constraint)
- `leetcode_number` (int, nullable) - LeetCode problem number
- `is_default` (boolean) - `true` for pre-seeded problems, `false` for user-created
- `order_index` (int) - Display order within category
- `created_at` (timestamptz) - Creation timestamp

**Relationships:**
- Many-to-one with `categories`
- Many-to-one with `profiles` (for custom problems)
- One-to-many with `user_progress`

**RLS Policies:**
- Users can view default problems OR their own custom problems
- Users can create/update/delete only their own custom problems (not default ones)

---

#### 4. `roadmaps`
User learning roadmaps (currently supports LeetCode, extensible for future).

**Columns:**
- `id` (uuid, PK) - Unique identifier
- `user_id` (uuid, FK) - References `profiles(id)`
- `title` (text) - Roadmap title (e.g., "LeetCode Top 150")
- `roadmap_type` (text) - Type identifier (default: "leetcode")
- `config` (jsonb) - Flexible configuration for future roadmap types
- `is_active` (boolean) - Whether this roadmap is currently active
- `created_at` (timestamptz) - Creation timestamp

**Relationships:**
- Many-to-one with `profiles`
- One-to-many with `user_progress`

**RLS Policies:**
- Users can view and manage only their own roadmaps

**Auto-creation:**
- A default roadmap is automatically created when a user signs up (via trigger)

---

#### 5. `user_progress`
Tracks which problems a user has completed in their active roadmap.

**Columns:**
- `id` (uuid, PK) - Unique identifier
- `user_id` (uuid, FK) - References `profiles(id)`
- `roadmap_id` (uuid, FK) - References `roadmaps(id)`
- `problem_id` (uuid, FK) - References `problems(id)`
- `status` (text) - Completion status (default: "completed")
- `completed_at` (timestamptz) - Completion timestamp

**Constraints:**
- `UNIQUE(user_id, roadmap_id, problem_id)` - Prevents duplicate progress entries

**Relationships:**
- Many-to-one with `profiles`
- Many-to-one with `roadmaps`
- Many-to-one with `problems`

**RLS Policies:**
- Users can view and manage only their own progress

---

### Indexes

For performance optimization:
- `idx_problems_category` - Fast category filtering
- `idx_problems_created_by` - Fast user problem queries
- `idx_roadmaps_user` - Fast user roadmap queries
- `idx_progress_user` - Fast user progress queries
- `idx_progress_roadmap` - Fast roadmap progress queries
- `idx_progress_problem` - Fast problem progress queries

---

### Triggers

#### `handle_new_user()`
**Trigger:** `on_auth_user_created` (AFTER INSERT on `auth.users`)

**Functionality:**
1. Automatically creates a `profiles` entry for the new user
2. Creates a default roadmap ("LeetCode Top 150") for the user
3. Sets the roadmap as active

**Security:** Uses `SECURITY DEFINER` to bypass RLS when inserting into `profiles` and `roadmaps`.

---

## Application Architecture

### Tech Stack
- **Frontend:** Next.js 16 (App Router), React, TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **AI:** Google Generative AI (Gemini 2.5 Flash)
- **Code Editor:** Monaco Editor

### Project Structure

```
practice/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # AI chat API endpoint
│   ├── components/
│   │   ├── ui/                    # Reusable UI components (shadcn-style)
│   │   ├── ApiKeyModal.tsx        # Bring-your-own API key settings
│   │   ├── AuthModal.tsx          # Login/signup modal
│   │   ├── ChatInterface.tsx      # AI chat interface
│   │   ├── CodeEditor.tsx          # Monaco code editor
│   │   ├── ResizablePanels.tsx    # Resizable split view
│   │   └── Sidebar.tsx            # Problem list sidebar
│   ├── contexts/
│   │   ├── ApiKeyContext.tsx      # User API key (localStorage, BYOK)
│   │   ├── AuthContext.tsx        # Authentication state
│   │   ├── CodeContext.tsx        # Code editor state
│   │   └── ProgressContext.tsx    # Progress & problem state
│   ├── globals.css                # Global styles
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Main page
├── lib/
│   ├── database.types.ts          # TypeScript types from Supabase
│   ├── supabase.ts                # Supabase client
│   └── utils.ts                   # Utility functions
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql # Database schema
│       └── 002_seed_data.sql      # Seed data (categories & problems)
└── docs/
    └── ARCHITECTURE.md            # This file
```

---

## Data Flow

### 1. User Authentication Flow

```
User Action → AuthModal → AuthContext → Supabase Auth
                                    ↓
                            Auth State Change
                                    ↓
                            ProgressContext fetches:
                            - Active roadmap
                            - User progress
```

### 2. Problem Selection Flow

```
User clicks problem in Sidebar
        ↓
ProgressContext.setSelectedProblem()
        ↓
ChatInterface detects change
        ↓
- Resets chat messages
- Fetches boilerplate code from API
        ↓
CodeEditor updates with template
```

### 3. Progress Tracking Flow

```
User submits code → AI evaluates → [PASS] detected
        ↓
ChatInterface.markComplete(problemId)
        ↓
ProgressContext.markComplete()
        ↓
- Updates local state (optimistic)
- Saves to Supabase (user_progress table)
        ↓
Sidebar updates progress bar
```

### 4. AI Chat Flow

```
User sends message → ChatInterface.handleSend()
        ↓
POST /api/chat (optional header: x-google-api-key from ApiKeyContext)
        ↓
- Uses user’s key if provided, else server GOOGLE_API_KEY
- Determines mode (Mentor vs Interviewer)
- Calls Google Gemini API
- Extracts code template if present
- Detects [PASS]/[FAIL] status
        ↓
Returns response + codeTemplate + passed flag
        ↓
ChatInterface updates messages & code editor
```

---

## Key Components

### Context Providers

#### `AuthContext`
**Purpose:** Manages user authentication state

**State:**
- `user` - Current authenticated user
- `session` - Active session
- `isLoading` - Loading state

**Methods:**
- `signUp(email, password)` - Create new account
- `signIn(email, password)` - Sign in existing user
- `signOut()` - Sign out current user

**Usage:** Wraps entire app in `page.tsx`

---

#### `ApiKeyContext`
**Purpose:** Bring-your-own API key (BYOK) for Google AI (Gemini)

**State:**
- `googleApiKey` - User’s key (or null)
- `hasUserApiKey` - Whether a key is stored
- `maskedKeyHint` - Masked preview (e.g. `••••••••xyz1`)

**Methods:**
- `setGoogleApiKey(key)` - Save or clear key (persisted in localStorage)

**Storage:** Key is stored only in the browser (`localStorage`). It is sent per-request in the `x-google-api-key` header to `/api/chat` and is never stored on the server.

**Usage:** Wraps the practice app (with AuthProvider). Sidebar opens `ApiKeyModal`; `ChatInterface` sends the key in chat requests when set.

---

#### `ProgressContext`
**Purpose:** Manages problem data, progress tracking, and current selection

**State:**
- `categories` - All categories with problems
- `completedProblems` - Set of completed problem IDs
- `selectedProblem` - Currently selected problem
- `mode` - "roadmap" or "interview"
- `activeRoadmapId` - User's active roadmap ID

**Methods:**
- `markComplete(problemId)` - Mark problem as complete
- `markIncomplete(problemId)` - Remove completion
- `setSelectedProblem(problem)` - Select a problem
- `setMode(mode)` - Switch between roadmap/interview
- `refreshData()` - Refetch from Supabase

**Data Fetching:**
- On mount: Fetches categories, problems, and user progress
- When user changes: Refetches progress for new user

---

#### `CodeContext`
**Purpose:** Manages code editor state

**State:**
- `code` - Current code content
- `language` - Current language (javascript, python, java, cpp)
- `onSubmit` - Callback for submit button

**Methods:**
- `setCode(code)` - Update code
- `setLanguage(lang)` - Change language
- `resetCode()` - Clear editor

---

### UI Components

#### `Sidebar`
**Purpose:** Displays problem list and navigation

**Features:**
- Two tabs: "Roadmap" and "Interview"
- Category accordion with progress bars
- Problem list with difficulty badges
- User authentication UI (login button or user info)
- **"Add API key" / "API key saved"** button to open API key settings (BYOK)
- Progress summary at top

**Data Source:** `ProgressContext`, `useApiKey` for BYOK state

---

#### `ApiKeyModal`
**Purpose:** Configure bring-your-own Google AI (Gemini) API key

**Features:**
- Password-style input for API key
- Link to Google AI Studio to obtain a key
- Save key (stored in localStorage via `ApiKeyContext`)
- Remove key
- Masked hint when a key is already saved

**Usage:** Opened from Sidebar when user clicks "Add API key" / "API key saved".

---

#### `ChatInterface`
**Purpose:** AI chat interface for mentor/interviewer

**Features:**
- Message history display
- Input field with send button
- Loading indicators
- Code template injection
- Progress tracking (marks complete on [PASS])
- Sends `x-google-api-key` header when user has set a key (BYOK)

**Modes:**
- **Roadmap (Mentor):** Teaching-focused, step-by-step guidance
- **Interview:** Evaluative, simulates real interview

**API Integration:** Calls `/api/chat` with problem context and optional API key header

---

#### `CodeEditor`
**Purpose:** Monaco-based code editor

**Features:**
- Syntax highlighting
- Language selection dropdown
- Submit button (triggers `onSubmit` from CodeContext)
- Full-screen editing

**Languages Supported:** JavaScript, Python, Java, C++

---

#### `ResizablePanels`
**Purpose:** Split view with draggable divider

**Features:**
- Left panel: ChatInterface
- Right panel: CodeEditor
- Resizable divider (default: 45% left, 55% right)
- Min/max width constraints

---

### API Routes

#### `POST /api/chat`
**Purpose:** AI chat endpoint

**Request Headers:**
- `x-google-api-key` (optional): User’s Google AI (Gemini) API key. When present and non-empty, it is used instead of the server’s `GOOGLE_API_KEY`. Enables bring-your-own-api-key (BYOK).

**Request Body:**
```typescript
{
  messages: Array<{ role: 'user' | 'assistant', content: string }>,
  code?: string,
  language: string,
  problemContext?: {
    title: string,
    category: string,
    difficulty: string
  },
  requestBoilerplateOnly?: boolean
}
```

**Response:**
```typescript
{
  response: string,           // AI response text
  codeTemplate?: string,       // Extracted code template
  templateLanguage?: string,   // Language of template
  passed?: boolean            // Whether solution passed
}
```

**Key resolution:** Uses `x-google-api-key` header if provided and non-empty; otherwise uses `GOOGLE_API_KEY` env. If neither is set, returns 400 with a message asking the user to add an API key or for the app to be configured.

**AI Personas:**
- **Mentor Mode** (when `problemContext` provided): Teaching-focused, explains concepts
- **Interview Mode** (no `problemContext`): Evaluative, simulates interview

**Code Template Extraction:**
- Parses markdown code blocks from AI response
- Maps language names (js → javascript, py → python, etc.)
- Returns template for code editor

**Pass/Fail Detection:**
- Looks for `[PASS]` or `[FAIL]` tags in response
- Used to automatically mark problems complete

---

## Features

### 1. Dual Mode System

#### Roadmap Mode
- **Purpose:** Learning-focused practice
- **AI Persona:** Patient mentor
- **Behavior:**
  - Explains concepts step-by-step
  - Provides hints and guidance
  - Teaches problem-solving patterns
  - Celebrates learning milestones

#### Interview Mode
- **Purpose:** Interview simulation
- **AI Persona:** Professional interviewer
- **Behavior:**
  - Presents problems without hints
  - Evaluates solutions rigorously
  - Asks follow-up questions
  - Simulates interview pressure

---

### 2. Progress Tracking

- **Visual Indicators:**
  - Progress bars per category
  - Checkmarks on completed problems
  - Overall progress summary

- **Persistence:**
  - Logged-in users: Saved to Supabase
  - Guest users: Stored in localStorage

- **Auto-tracking:**
  - Automatically marks complete when AI detects `[PASS]`
  - Can manually toggle completion

---

### 3. Problem Management

- **Pre-seeded Problems:**
  - 149 LeetCode Top 150 problems
  - 18 categories
  - Organized by difficulty and topic

- **Custom Problems:**
  - Users can add their own problems
  - Stored with `is_default = false`
  - Only visible to creator

---

### 4. Code Editor Features

- **Multi-language Support:**
  - JavaScript
  - Python
  - Java
  - C++

- **Auto-boilerplate:**
  - Automatically loads starter code when problem selected
  - Cached templates for common problems
  - AI-generated templates for others

- **Submit & Evaluate:**
  - Submit button sends code to AI
  - AI evaluates correctness, complexity, edge cases
  - Returns detailed feedback

---

### 5. Authentication

- **Email/Password Auth:**
  - Sign up with email verification
  - Sign in with credentials
  - Session persistence

- **Auto-setup:**
  - Profile auto-created on signup
  - Default roadmap auto-created
  - Seamless onboarding

---

### 6. Bring Your Own API Key (BYOK)

- **Purpose:** Users can supply their own Google AI (Gemini) API key so usage is billed to their Google Cloud / AI Studio account.
- **Storage:** Key is stored only in the browser (`localStorage`). It is never persisted on the server.
- **Usage:** When set, the key is sent in the `x-google-api-key` header on every `/api/chat` request. The server uses it for that request instead of `GOOGLE_API_KEY`.
- **UI:** Sidebar shows “Add API key” or “API key saved”; opening it shows `ApiKeyModal` with input, link to [Google AI Studio](https://aistudio.google.com/apikey), and options to save or remove the key.
- **Fallback:** If no user key is provided, the app uses the server’s `GOOGLE_API_KEY` when configured.

---

## Future Extensibility

The database schema is designed to support future features:

1. **Custom Roadmaps:**
   - `roadmaps.config` (jsonb) can store roadmap-specific settings
   - `roadmap_type` allows different roadmap types (e.g., "react", "system-design")

2. **AI-Generated Roadmaps:**
   - Users can request custom learning paths
   - Roadmap structure stored in `config` field
   - Problems dynamically assigned to roadmaps

3. **Problem Sharing:**
   - Future: Share custom problems with community
   - Future: Problem ratings and reviews

4. **Advanced Progress:**
   - `user_progress.status` can support "in-progress", "reviewed", etc.
   - Time tracking per problem
   - Difficulty progression tracking

---

## Environment Variables

Required environment variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Google AI (optional if users bring their own key via Settings → API key)
GOOGLE_API_KEY=your-google-api-key
```

When `GOOGLE_API_KEY` is not set, the app works for users who add their own key in **Settings → API key** in the sidebar. If neither the header nor the env key is present, `/api/chat` returns 400 with an explanatory message.

---

## Database Migrations

Migrations are located in `supabase/migrations/`:

1. **001_initial_schema.sql** - Creates all tables, indexes, RLS policies, and triggers
2. **002_seed_data.sql** - Seeds categories and problems (LeetCode Top 150)

To apply migrations:
- Use Supabase MCP tools: `apply_migration`
- Or run SQL directly in Supabase dashboard

---

## Security Considerations

### Client-Side Supabase Calls

**Is it safe to call Supabase directly from the client?**

**Yes, it's safe** when RLS (Row Level Security) is properly configured, which it is in this application.

**How it works:**
1. **Anon Key Exposure:** The `NEXT_PUBLIC_SUPABASE_ANON_KEY` is intentionally public and safe to expose because:
   - It's designed to be used client-side
   - RLS policies enforce security at the database level
   - Without a valid JWT token, users can only access public data (categories, default problems)

2. **Row Level Security (RLS):**
   - All tables have RLS enabled
   - Every query is automatically filtered by `auth.uid()`
   - Users can only access/modify their own data
   - Even if someone intercepts the anon key, they cannot access other users' data

3. **JWT Token Security:**
   - User authentication generates a JWT token
   - This token is automatically included in all Supabase requests
   - The token contains the user ID, which RLS policies use to filter data
   - Tokens are stored securely by Supabase client

**Example of RLS Protection:**
```sql
-- This policy ensures users can only see their own progress
CREATE POLICY "Users view own progress" 
ON user_progress FOR SELECT 
USING (auth.uid() = user_id);
```

Even if a malicious user tries to query:
```javascript
supabase.from('user_progress').select('*')
```

They will only get rows where `user_id = auth.uid()` (their own user ID).

### When to Use Server-Side Routes

While client-side calls are safe for most operations, use **Next.js API routes** (`app/api/*`) for:

1. **Sensitive Operations:**
   - Admin actions
   - Bulk data operations
   - Data migrations

2. **External API Calls:**
   - When you need to use secret API keys (like `GOOGLE_API_KEY`)
   - Third-party service integrations

3. **Complex Business Logic:**
   - Multi-step operations
   - Data validation/transformation
   - Cross-table operations that need server-side validation

4. **Rate Limiting:**
   - Custom rate limiting beyond Supabase's defaults
   - Per-user operation limits

**Current Implementation:**
- ✅ Client-side: User progress, problem selection, authentication (all protected by RLS)
- ✅ Server-side: AI chat API (uses `GOOGLE_API_KEY` which must be secret)

### Security Best Practices

1. **Row Level Security (RLS):**
   - ✅ All tables have RLS enabled
   - ✅ Users can only access their own data
   - ✅ Public read access only for categories and default problems

2. **Authentication:**
   - ✅ Supabase Auth handles password hashing
   - ✅ JWT tokens for session management
   - ✅ Secure cookie storage

3. **API Security:**
   - ✅ Secret API keys (GOOGLE_API_KEY) stored server-side only
   - ✅ Anon key is public by design (safe with RLS)
   - ✅ Rate limiting handled by Supabase

4. **Environment Variables:**
   - ✅ `NEXT_PUBLIC_*` variables are safe to expose (designed for client)
   - ✅ Non-prefixed variables are server-only (never exposed)

---

## Performance Optimizations

1. **Database Indexes:**
   - All foreign keys indexed
   - Common query paths optimized

2. **Client-side Caching:**
   - Progress state cached in context
   - Optimistic updates for better UX

3. **Code Template Caching:**
   - Common problem templates cached in API route
   - Reduces AI API calls

---

## Troubleshooting

### Common Issues

1. **"relation profiles does not exist"**
   - Solution: Ensure migrations have been run
   - Check trigger function uses `public.` prefix

2. **Progress not saving**
   - Check: User is logged in
   - Check: Active roadmap exists
   - Check: RLS policies allow insert

3. **Boilerplate not loading**
   - Check: Problem selected in roadmap mode
   - Check: API route has cached template or can call AI
   - Check: Network tab for API errors

---

## Contributing

When adding new features:

1. **Database Changes:**
   - Create new migration file
   - Update `database.types.ts` (or regenerate from Supabase)
   - Test RLS policies

2. **New Components:**
   - Follow existing patterns
   - Use TypeScript types from `database.types.ts`
   - Add to appropriate context if stateful

3. **API Changes:**
   - Update request/response types
   - Document in this file
   - Handle errors gracefully

---

## Documentation Maintenance

**This file must be kept up-to-date!**

When making changes to:
- **Database Schema** → Update the "Database Schema" section
- **Data Flow** → Update the "Data Flow" section  
- **Components** → Update the "Key Components" section
- **Features** → Update the "Features" section
- **API Routes** → Update the "API Routes" subsection

See `.cursorrules` in the project root for detailed maintenance guidelines.

---

*Last updated: January 2026*
