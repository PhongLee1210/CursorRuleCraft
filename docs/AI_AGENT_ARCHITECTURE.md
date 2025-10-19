# AI Agent Architecture & Database Design

## 1. Database Schema - Entity Relationship Diagram

```mermaid
erDiagram
    %% NOTE: No users table - Clerk is the source of truth
    %% All user_id fields are TEXT containing Clerk user IDs from JWT (auth.jwt()->>'sub')
    %%
    %% UNIQUE CONSTRAINTS (not shown in diagram):
    %% - git_integrations: UNIQUE(user_id, provider)
    %% - repositories: UNIQUE(workspace_id, provider_repo_id)
    %% - user_ai_preferences: PRIMARY KEY(user_id)

    workspaces ||--o{ workspace_members : "has"
    workspaces ||--o{ repositories : "contains"
    workspaces ||--o{ repository_ai_sessions : "has"
    workspaces ||--o{ cursor_rules : "has"
    workspaces ||--o{ ai_usage_statistics : "tracks usage"

    git_integrations ||--o{ repositories : "connects"

    repositories ||--o| repository_ai_sessions : "has one active"
    repositories ||--o{ cursor_rules : "has many"
    repositories ||--o{ workspace_rule_snapshots : "has snapshots"
    repositories ||--o{ ai_usage_statistics : "tracks usage"

    repository_ai_sessions ||--o{ ai_chat_messages : "contains"
    repository_ai_sessions ||--o{ ai_usage_statistics : "tracks usage"

    ai_chat_messages ||--o| cursor_rules : "generates"
    ai_chat_messages ||--o{ ai_usage_statistics : "tracks usage"

    cursor_rules ||--o| cursor_rules : "versions"
    cursor_rules ||--o{ rule_versions : "has history (optional)"

    workspace_rule_snapshots ||--o{ cursor_rules : "captures state of"

    workspaces {
        uuid id PK
        text owner_id "Clerk user ID from JWT"
        text name
        timestamptz created_at
    }

    workspace_members {
        uuid workspace_id PK,FK
        text user_id PK "Clerk user ID from JWT"
        workspace_role role
    }

    git_integrations {
        uuid id PK
        text user_id "Clerk user ID from JWT"
        git_provider provider
        text provider_user_id
        text provider_username
        text access_token
        text refresh_token
        timestamptz token_expires_at
        text[] scopes
        timestamptz created_at
        timestamptz updated_at
    }

    repositories {
        uuid id PK
        uuid workspace_id FK
        uuid git_integration_id FK
        text name
        text full_name
        text description
        text url
        git_provider provider
        text provider_repo_id
        text default_branch
        boolean is_private
        text language
        text[] topics
        int stars_count
        int forks_count
        timestamptz last_synced_at
        text sync_status
        text sync_error
        timestamptz created_at
        timestamptz updated_at
    }

    repository_ai_sessions {
        uuid id PK
        uuid repository_id FK
        text user_id "Clerk user ID from JWT"
        boolean is_active
        int message_count
        jsonb context_snapshot
        timestamptz created_at
        timestamptz updated_at
        timestamptz last_message_at
    }

    ai_chat_messages {
        uuid id PK
        uuid session_id FK
        text role
        text content
        jsonb metadata
        timestamptz created_at
    }

    cursor_rules {
        uuid id PK
        uuid repository_id FK
        text user_id "Clerk user ID from JWT"
        uuid source_message_id FK
        rule_type type
        text file_name
        text content
        boolean is_active
        int current_version
        timestamptz deleted_at "soft delete"
        timestamptz created_at
        timestamptz updated_at
    }

    rule_versions {
        uuid id PK
        uuid rule_id FK
        int version_number
        text content
        timestamptz created_at
    }

    workspace_rule_snapshots {
        uuid id PK
        uuid repository_id FK
        text user_id "Clerk user ID from JWT"
        int snapshot_number
        text description
        text change_type
        jsonb rules_snapshot "Complete state"
        timestamptz created_at
    }

    user_ai_preferences {
        text user_id PK "Clerk user ID from JWT"
        text default_provider "groq, openai, etc"
        text default_model
        numeric default_temperature
        int default_max_tokens
        bigint total_tokens_used
        bigint total_requests_count
        timestamptz last_used_at
        timestamptz created_at
        timestamptz updated_at
    }

    ai_usage_statistics {
        uuid id PK
        text user_id "Clerk user ID from JWT"
        uuid workspace_id FK
        uuid repository_id FK
        uuid session_id FK
        uuid message_id FK
        text provider "groq, openai, etc"
        text model "model name"
        int prompt_tokens
        int completion_tokens
        int total_tokens
        numeric estimated_cost "in USD"
        int generation_time_ms
        timestamptz created_at
    }
```

## 2. AI Agent Architecture - High Level Overview

```mermaid
graph TB
    subgraph "Frontend"
        UI[AI Chat Panel]
        Hook[useAIChat Hook]
        Store[React State]
    end

    subgraph "Backend API"
        Controller[AI Agent Controller]
        Service[AI Agent Service]
        Tools[Tool Registry]
    end

    subgraph "AI Agent Core"
        Agent[Single AI Agent]
        ToolExecutor[Tool Executor]
        Context[Context Manager]
        Stream[Stream Manager]
    end

    subgraph "Tools"
        T1[Analyze Repository]
        T2[Get File Content]
        T3[Analyze Patterns]
        T4[Search Rules]
        T5[Generate Rule]
        T6[Validate Rule]
    end

    subgraph "External Services"
        LLM[Claude/GPT-4]
        GitHub[GitHub API]
        Cache[Redis Cache]
    end

    subgraph "Database"
        Sessions[(Sessions)]
        Messages[(Messages)]
        Rules[(Generated Rules)]
    end

    UI -->|Send Message| Hook
    Hook -->|POST /ai/chat| Controller
    Controller -->|Process Request| Service
    Service -->|Initialize Agent| Agent

    Agent -->|Call Tools| ToolExecutor
    ToolExecutor -->|Execute| Tools

    T1 --> GitHub
    T2 --> GitHub
    T3 --> LLM
    T4 --> Rules
    T5 --> LLM
    T6 --> LLM

    Agent -->|Query| LLM
    Agent -->|Get Context| Context
    Context --> Sessions
    Context --> Rules

    Service -->|Save Messages| Messages
    Service -->|Save Rules| Rules

    Service -->|SSE Stream| Controller
    Controller -->|EventSource| Hook
    Hook -->|Update State| Store
    Store -->|Render| UI

    style Agent fill:#4CAF50
    style LLM fill:#2196F3
    style UI fill:#FF9800
```

## 3. AI Agent Processing Flow - Detailed

```mermaid
sequenceDiagram
    participant U as User (Frontend)
    participant API as API Controller
    participant Service as AI Agent Service
    participant DB as Database
    participant Agent as AI Agent
    participant LLM as Claude/GPT-4
    participant Tools as Tool Executor
    participant GitHub as GitHub API

    U->>API: POST /ai/chat (message)
    API->>Service: processRequest()

    Service->>DB: getOrCreateSession(repositoryId)
    DB-->>Service: session + messages + context

    Service->>DB: getActiveRules(repositoryId)
    DB-->>Service: activeRules[]

    Service->>DB: saveMessage(user, content)

    Service->>Agent: initialize(context, messages)
    Agent->>Agent: buildSystemPrompt(context)

    Note over Agent,LLM: Agent Loop (max 5 iterations)

    Agent->>U: STREAM: thinking_step_1
    Agent->>LLM: chat(messages, tools)

    alt Tool Call Required
        LLM-->>Agent: tool_call: analyze_repository
        Agent->>U: STREAM: tool_execution
        Agent->>Tools: execute(analyze_repository)
        Tools->>GitHub: getRepoStructure()
        GitHub-->>Tools: structure
        Tools-->>Agent: analysis_result
        Agent->>U: STREAM: tool_result

        Agent->>LLM: continue_with_tool_result
        LLM-->>Agent: next_action or content
    end

    alt Generate Rule
        Agent->>U: STREAM: thinking_step_2
        LLM-->>Agent: content + rule_artifact
        Agent->>Agent: extractArtifact()
        Agent->>U: STREAM: artifact (rule)

        Agent->>DB: saveGeneratedRule()
        DB-->>Agent: rule_id
    end

    Agent->>U: STREAM: content_chunks
    Agent->>U: STREAM: complete

    Service->>DB: saveMessage(assistant, content)
    Service->>DB: updateSession(last_message_at)

    Service-->>API: stream_complete
    API-->>U: EventSource closed

    U->>U: Display messages + artifacts
```

## 5. User Interaction Flow

```mermaid
stateDiagram-v2
    [*] --> RepositoryView: User opens repository

    RepositoryView --> LoadSession: Load AI Chat Panel

    LoadSession --> CheckSession: GET /ai/session

    CheckSession --> ExistingSession: Session exists
    CheckSession --> NewSession: No session

    ExistingSession --> DisplayMessages: Load messages & context
    NewSession --> BuildContext: Build fresh context
    BuildContext --> DisplayEmpty: Show empty state

    DisplayMessages --> ChatReady: Ready
    DisplayEmpty --> ChatReady: Ready

    ChatReady --> UserSends: User types message
    UserSends --> Streaming: POST /ai/chat

    Streaming --> ThinkingPhase: AI Planning
    ThinkingPhase --> ToolPhase: Execute tools
    ToolPhase --> GeneratingPhase: Generate content
    GeneratingPhase --> ArtifactPhase: Create rule artifact

    ArtifactPhase --> MessageComplete: Stream complete
    MessageComplete --> ChatReady: Ready for next message

    ChatReady --> ResetFlow: User clicks Reset
    ResetFlow --> ConfirmReset: Confirm dialog
    ConfirmReset --> ClearMessages: POST /ai/session/reset
    ClearMessages --> RefreshContext: Rebuild context with active rules
    RefreshContext --> DisplayEmpty: Show empty state

    ChatReady --> ApplyRule: User clicks Apply Rule
    ApplyRule --> SaveRule: POST /ai/rules/:id/apply
    SaveRule --> UpdateContext: Rule marked active
    UpdateContext --> ChatReady: Context updated

    ChatReady --> [*]: User exits
```

## 5. Session Lifecycle Management

```mermaid
graph LR
    subgraph "Session Creation"
        A[User Opens Repository] --> B{Session Exists?}
        B -->|No| C[Create Session]
        B -->|Yes| D[Load Session]
        C --> E[Build Initial Context]
        E --> F[Save Context Snapshot]
        D --> G[Load Messages]
        F --> H[Display Chat]
        G --> H
    end

    subgraph "Active Session"
        H --> I[User Sends Message]
        I --> J[AI Processes]
        J --> K[Generate Response]
        K --> L{Rule Generated?}
        L -->|Yes| M[Save Rule]
        L -->|No| N[Save Message Only]
        M --> O[Update Active Rules]
        N --> H
        O --> H
    end

    subgraph "Session Reset"
        H --> P[User Clicks Reset]
        P --> Q[Confirm Action]
        Q --> R[Delete All Messages]
        R --> S[Rebuild Context]
        S --> T[Include Active Rules]
        T --> U[Keep Session ID]
        U --> H
    end

    subgraph "Session Persistence"
        H --> V[User Exits]
        V --> W[Session Saved]
        W --> X[Messages Saved]
        X --> Y[Context Snapshot Saved]
    end

    style A fill:#4CAF50
    style P fill:#FF9800
    style V fill:#2196F3
```

## 6. Tool Execution Pipeline

```mermaid
flowchart TD
    Start[AI Agent Receives Request] --> Analyze{Analyze Request}

    Analyze -->|Need Repo Info| T1[Tool: analyze_repository_structure]
    Analyze -->|Need Files| T2[Tool: get_file_content]
    Analyze -->|Need Patterns| T3[Tool: analyze_code_patterns]
    Analyze -->|Need Similar Rules| T4[Tool: search_similar_rules]
    Analyze -->|Generate Rule| T5[Tool: generate_cursor_rule]
    Analyze -->|Validate| T6[Tool: validate_rule_syntax]

    T1 --> Cache1{In Cache?}
    Cache1 -->|Yes| Return1[Return Cached Data]
    Cache1 -->|No| Fetch1[Fetch from GitHub]
    Fetch1 --> Store1[Store in Cache]
    Store1 --> Return1

    T2 --> GitHub1[GitHub API: Get File]
    GitHub1 --> Return2[Return Content]

    T3 --> Analyze1[Parse Code Files]
    Analyze1 --> Pattern1[Detect Patterns]
    Pattern1 --> Return3[Return Analysis]

    T4 --> Search1[Vector Search]
    Search1 --> Match1[Find Similar Rules]
    Match1 --> Return4[Return Matches]

    T5 --> LLM1[Call LLM]
    LLM1 --> Format1[Format as Rule]
    Format1 --> Return5[Return Rule]

    T6 --> Validate1[Syntax Check]
    Validate1 --> Return6[Return Validation]

    Return1 --> Aggregate[Aggregate Results]
    Return2 --> Aggregate
    Return3 --> Aggregate
    Return4 --> Aggregate
    Return5 --> Aggregate
    Return6 --> Aggregate

    Aggregate --> Context[Build Context]
    Context --> LLMFinal[Final LLM Call]
    LLMFinal --> StreamResult[Stream to User]
    StreamResult --> End[Complete]

    style Start fill:#4CAF50
    style LLMFinal fill:#2196F3
    style End fill:#4CAF50
```

## 7. Context Management Flow

```mermaid
graph TB
    subgraph "Context Building"
        Init[Initialize Context] --> GetRepo[Get Repository Data]
        GetRepo --> GetRules[Get Active Rules]
        GetRules --> GetAnalysis[Get Cached Analysis]
        GetAnalysis --> BuildSnapshot[Build Context Snapshot]
    end

    subgraph "Context Snapshot"
        BuildSnapshot --> S1[Repository Structure]
        BuildSnapshot --> S2[Languages & Frameworks]
        BuildSnapshot --> S3[Active Rules]
        BuildSnapshot --> S4[Code Patterns]
        BuildSnapshot --> S5[Dependencies]
    end

    subgraph "Context Usage"
        S1 --> SystemPrompt[Build System Prompt]
        S2 --> SystemPrompt
        S3 --> SystemPrompt
        S4 --> SystemPrompt
        S5 --> SystemPrompt

        SystemPrompt --> ConvHistory[Add Conversation History]
        ConvHistory --> LLMRequest[Send to LLM]
    end

    subgraph "Context Update"
        LLMRequest --> Response[LLM Response]
        Response --> NewRule{New Rule Generated?}
        NewRule -->|Yes| UpdateRules[Add to Active Rules]
        NewRule -->|No| Keep[Keep Current Context]
        UpdateRules --> SaveSnapshot[Update Context Snapshot]
        Keep --> SaveSnapshot
    end

    subgraph "Reset Context"
        Reset[User Resets] --> LoadActive[Load Current Active Rules]
        LoadActive --> Rebuild[Rebuild Fresh Context]
        Rebuild --> S1
    end

    style BuildSnapshot fill:#4CAF50
    style SystemPrompt fill:#FF9800
    style UpdateRules fill:#2196F3
```

## 8. Streaming Architecture

```mermaid
sequenceDiagram
    participant UI as Frontend UI
    participant ES as EventSource
    participant SSE as SSE Endpoint
    participant Service as AI Service
    participant LLM as Claude API

    UI->>ES: Create EventSource
    ES->>SSE: Connect (POST /ai/chat)
    SSE->>Service: processRequest()

    Service->>LLM: stream: true

    loop Streaming Loop
        LLM-->>Service: chunk: thinking
        Service->>SSE: emit: { type: 'thinking', data }
        SSE-->>ES: Server-Sent Event
        ES-->>UI: Update: Show thinking step

        LLM-->>Service: chunk: tool_use
        Service->>SSE: emit: { type: 'tool', data }
        SSE-->>ES: Server-Sent Event
        ES-->>UI: Update: Show tool execution

        Service->>Service: Execute tool
        Service->>SSE: emit: { type: 'tool_result', data }
        SSE-->>ES: Server-Sent Event
        ES-->>UI: Update: Show tool result

        LLM-->>Service: chunk: content_delta
        Service->>SSE: emit: { type: 'content', data }
        SSE-->>ES: Server-Sent Event
        ES-->>UI: Update: Append content

        LLM-->>Service: chunk: artifact
        Service->>SSE: emit: { type: 'artifact', data }
        SSE-->>ES: Server-Sent Event
        ES-->>UI: Update: Display rule card
    end

    LLM-->>Service: stream complete
    Service->>SSE: emit: { type: 'complete' }
    SSE-->>ES: Server-Sent Event
    ES-->>UI: Update: Mark complete

    ES->>SSE: Close connection
    SSE->>Service: cleanup
```

## 9. Data Flow Summary

```mermaid
graph LR
    subgraph "Input Layer"
        User[User Input]
        Files[File Mentions]
        Context[Repository Context]
    end

    subgraph "Processing Layer"
        Session[Session Manager]
        Agent[AI Agent]
        Tools[Tool Executor]
    end

    subgraph "Intelligence Layer"
        LLM[Language Model]
        Memory[Conversation Memory]
        RuleEngine[Rule Generator]
    end

    subgraph "Storage Layer"
        SessionDB[(Sessions DB)]
        MessageDB[(Messages DB)]
        RulesDB[(Rules DB)]
        CacheDB[(Cache DB)]
    end

    subgraph "Output Layer"
        Stream[SSE Stream]
        Artifacts[Generated Rules]
        Feedback[User Feedback]
    end

    User --> Session
    Files --> Session
    Context --> Session

    Session --> Agent
    Agent --> Tools
    Agent --> LLM

    Tools --> LLM
    LLM --> Memory
    Memory --> RuleEngine

    Session --> SessionDB
    Agent --> MessageDB
    RuleEngine --> RulesDB
    Tools --> CacheDB

    Agent --> Stream
    RuleEngine --> Artifacts
    Artifacts --> Feedback

    Feedback --> RulesDB

    style Agent fill:#4CAF50
    style LLM fill:#2196F3
    style RuleEngine fill:#FF9800
```

## Key Design Principles

### 1. **Single Session Per Repository**

- One active conversation per repository per user
- Simplifies state management
- Easy to load and resume
- Clear reset functionality

### 2. **Context Preservation**

- Active rules always included in context
- Repository structure cached
- Code patterns analyzed once
- Context snapshot saved with session

### 3. **Streaming First**

- Real-time feedback to user
- Show thinking process
- Display tool executions
- Stream rule generation

### 4. **Tool-Based Architecture**

- Modular tool system
- Each tool has single responsibility
- Easy to add new tools
- Tools can be cached

### 5. **State Management**

```
Repository → Session (1:1) → Messages (1:N) → Rules (N:N)
```

### 6. **Cache Strategy**

- Repository structure: 24 hours (via GitHub API)
- File content: 1 hour (via GitHub API)
- Similar rules: Real-time search

### 7. **Performance Optimization**

- Lazy load messages (last 20)
- Cache repository structure
- Debounce user input
- Stream responses incrementally

### 8. **Error Handling**

- Graceful tool failures
- Fallback to cached data
- User-friendly error messages
- Automatic retry logic

## Why This Database Design is Optimal for Cursor Rules

### Understanding Cursor Rules Diversity

Cursor rules come in many forms:

- **Project-level**: `.cursorrules` in project root
- **Directory-level**: Multiple `.cursorrules` in subdirectories
- **User-level**: Global user preferences
- **Different formats**: Markdown, plain text, YAML-like structures
- **Team variations**: Different teams have different conventions

### The `cursor_rules` Table Design Philosophy

#### 1. **Content Flexibility (TEXT field)**

```sql
content TEXT NOT NULL
```

**Why**: Stores ANY format of cursor rules without imposing structure

- ✅ Supports markdown, plain text, YAML, or custom formats
- ✅ No character limits (TEXT can store up to 1GB in PostgreSQL)
- ✅ Preserves exact formatting, whitespace, and special characters
- ✅ Team-specific conventions are maintained exactly as written

**Example supported formats**:

```
# Format 1: Markdown
## Project Rules
- Use TypeScript
- Follow React patterns

# Format 2: YAML-like
project:
  language: typescript
  framework: react

# Format 3: Plain instructions
You are an expert in TypeScript and React.
Always use functional components.
```

#### 2. **Type Enum for Rule Categories**

```sql
type rule_type AS ENUM (
  'PROJECT_RULE',      -- Rules shown in .cursor/rules/ (virtual tree)
  'COMMAND',           -- Commands shown in .cursor/commands/ (virtual tree)
  'USER_RULE'          -- Root .cursorrules file (downloadable)
)
```

### API Response Example

```json
// GET /api/repositories/repo-123/rules/tree

{
  "name": ".cursor",
  "type": "directory",
  "path": ".cursor",
  "children": [
    {
      "name": "rules",
      "type": "directory",
      "path": ".cursor/rules",
      "children": [
        {
          "name": "api-integration.rules.mdc",
          "type": "file",
          "path": ".cursor/rules/api-integration.rules.mdc",
          "ruleId": "rule-001",
          "metadata": {
            "file_name": "api-integration",
            "type": "PROJECT_RULE",
            "createdAt": "2025-01-15T10:00:00Z",
            "updatedAt": "2025-01-15T10:00:00Z"
          }
        },
        {
          "name": "component-structure.rules.mdc",
          "type": "file",
          "path": ".cursor/rules/component-structure.rules.mdc",
          "ruleId": "rule-002",
          "metadata": {
            "file_name": "component-structure",
            "type": "PROJECT_RULE",
            "createdAt": "2025-01-15T11:00:00Z",
            "updatedAt": "2025-01-15T11:00:00Z"
          }
        }
      ]
    },
    {
      "name": "commands",
      "type": "directory",
      "path": ".cursor/commands",
      "children": [
        {
          "name": "code-review.md",
          "type": "file",
          "path": ".cursor/commands/code-review.md",
          "ruleId": "rule-004",
          "metadata": {
            "file_name": "code-review",
            "type": "COMMAND",
            "createdAt": "2025-01-15T12:00:00Z",
            "updatedAt": "2025-01-15T12:00:00Z"
          }
        }
      ]
    }
  ]
}
```

### File Naming Rules (Summary)

```typescript
// ONLY 3 RULE TYPES SUPPORTED

// Filename = file_name from DB + type-specific extension
PROJECT_RULE   → {file_name}.rules.mdc   (in .cursor/rules/)
COMMAND        → {file_name}.md          (in .cursor/commands/)
USER_RULE      → .cursorrules            (root file, not in .cursor/)

// Directory structure (FLAT - no subdirectories)
.cursor/rules/                           ← PROJECT_RULE (flat)
.cursor/commands/                        ← COMMAND (flat)
.cursorrules                             ← USER_RULE (root file)

// file_name is already normalized: lowercase, hyphens, no special chars
```
