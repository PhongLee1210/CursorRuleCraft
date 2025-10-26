import { type ClassValue, clsx } from 'clsx';
import dayjs from 'dayjs';
import { twMerge } from 'tailwind-merge';
import { z } from 'zod';

import { ApiError } from './api-client';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const dateSchema = z.union([z.date(), z.string().datetime()]).transform((value) => {
  if (typeof value === 'string') return dayjs(value).toDate();
  return value;
});

export const sortByDate = <T>(a: T, b: T, key: keyof T, desc = true) => {
  if (!a[key] || !b[key]) return 0;
  if (!(a[key] instanceof Date) || !(b[key] instanceof Date)) return 0;

  if (dayjs(a[key] as Date).isSame(dayjs(b[key] as Date))) return 0;
  if (desc) return dayjs(a[key] as Date).isBefore(dayjs(b[key] as Date)) ? 1 : -1;
  else return dayjs(a[key] as Date).isBefore(dayjs(b[key] as Date)) ? -1 : 1;
};

export function normalizeServiceError(error: unknown, defaultStatus = 500): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  if (error instanceof Error) {
    return new ApiError(error.message, defaultStatus);
  }
  // unknown non-Error, string/number/etc
  return new ApiError(`Unknown error: ${String(error)}`, defaultStatus);
}

/**
 * Sample cursor rule templates
 */
export interface CursorRuleTemplate {
  id: string;
  name: string;
  category: string;
  tags: string[];
  content: string;
}

export const cursorRuleTemplates: CursorRuleTemplate[] = [
  {
    id: 'react-typescript',
    name: 'React + TypeScript',
    category: 'Frontend',
    tags: ['typescript', 'react', 'frontend'],
    content: `
  You are an expert in TypeScript, Node.js, Next.js App Router, React, Shadcn UI, Radix UI and Tailwind.
  
  Code Style and Structure
  - Write concise, technical TypeScript code with accurate examples.
  - Use functional and declarative programming patterns; avoid classes.
  - Prefer iteration and modularization over code duplication.
  - Use descriptive variable names with auxiliary verbs (e.g., isLoading, hasError).
  - Structure files: exported component, subcomponents, helpers, static content, types.
  
  Naming Conventions
  - Use lowercase with dashes for directories (e.g., components/auth-wizard).
  - Favor named exports for components.
  
  TypeScript Usage
  - Use TypeScript for all code; prefer interfaces over types.
  - Avoid enums; use maps instead.
  - Use functional components with TypeScript interfaces.
  
  Syntax and Formatting
  - Use the "function" keyword for pure functions.
  - Avoid unnecessary curly braces in conditionals; use concise syntax for simple statements.
  - Use declarative JSX.
  
  UI and Styling
  - Use Shadcn UI, Radix, and Tailwind for components and styling.
  - Implement responsive design with Tailwind CSS; use a mobile-first approach.
  
  Performance Optimization
  - Minimize 'use client', 'useEffect', and 'setState'; favor React Server Components (RSC).
  - Wrap client components in Suspense with fallback.
  - Use dynamic loading for non-critical components.
  - Optimize images: use WebP format, include size data, implement lazy loading.
  
  Key Conventions
  - Use 'nuqs' for URL search parameter state management.
  - Optimize Web Vitals (LCP, CLS, FID).
  - Limit 'use client':
    - Favor server components and Next.js SSR.
    - Use only for Web API access in small components.
    - Avoid for data fetching or state management.
  
  Follow Next.js docs for Data Fetching, Rendering, and Routing.`,
  },
  {
    id: 'python-fastapi',
    name: 'Python + FastAPI',
    category: 'Backend',
    tags: ['python', 'fastapi', 'backend', 'api'],
    content: `
  You are an expert in Python, FastAPI, and scalable API development.
  
  Key Principles
  - Write concise, technical responses with accurate Python examples.
  - Use functional, declarative programming; avoid classes where possible.
  - Prefer iteration and modularization over code duplication.
  - Use descriptive variable names with auxiliary verbs (e.g., is_active, has_permission).
  - Use lowercase with underscores for directories and files (e.g., routers/user_routes.py).
  - Favor named exports for routes and utility functions.
  - Use the Receive an Object, Return an Object (RORO) pattern.
  
  Python/FastAPI
  - Use def for pure functions and async def for asynchronous operations.
  - Use type hints for all function signatures. Prefer Pydantic models over raw dictionaries for input validation.
  - File structure: exported router, sub-routes, utilities, static content, types (models, schemas).
  - Avoid unnecessary curly braces in conditional statements.
  - For single-line statements in conditionals, omit curly braces.
  - Use concise, one-line syntax for simple conditional statements (e.g., if condition: do_something()).
  
  Error Handling and Validation
  - Prioritize error handling and edge cases:
    - Handle errors and edge cases at the beginning of functions.
    - Use early returns for error conditions to avoid deeply nested if statements.
    - Place the happy path last in the function for improved readability.
    - Avoid unnecessary else statements; use the if-return pattern instead.
    - Use guard clauses to handle preconditions and invalid states early.
    - Implement proper error logging and user-friendly error messages.
    - Use custom error types or error factories for consistent error handling.
  
  Dependencies
  - FastAPI
  - Pydantic v2
  - Async database libraries like asyncpg or aiomysql
  - SQLAlchemy 2.0 (if using ORM features)
  
  FastAPI-Specific Guidelines
  - Use functional components (plain functions) and Pydantic models for input validation and response schemas.
  - Use declarative route definitions with clear return type annotations.
  - Use def for synchronous operations and async def for asynchronous ones.
  - Minimize @app.on_event("startup") and @app.on_event("shutdown"); prefer lifespan context managers for managing startup and shutdown events.
  - Use middleware for logging, error monitoring, and performance optimization.
  - Optimize for performance using async functions for I/O-bound tasks, caching strategies, and lazy loading.
  - Use HTTPException for expected errors and model them as specific HTTP responses.
  - Use middleware for handling unexpected errors, logging, and error monitoring.
  - Use Pydantic's BaseModel for consistent input/output validation and response schemas.
  
  Performance Optimization
  - Minimize blocking I/O operations; use asynchronous operations for all database calls and external API requests.
  - Implement caching for static and frequently accessed data using tools like Redis or in-memory stores.
  - Optimize data serialization and deserialization with Pydantic.
  - Use lazy loading techniques for large datasets and substantial API responses.
  
  Key Conventions
  1. Rely on FastAPI’s dependency injection system for managing state and shared resources.
  2. Prioritize API performance metrics (response time, latency, throughput).
  3. Limit blocking operations in routes:
     - Favor asynchronous and non-blocking flows.
     - Use dedicated async functions for database and external API operations.
     - Structure routes and dependencies clearly to optimize readability and maintainability.
  
  Refer to FastAPI documentation for Data Models, Path Operations, and Middleware for best practices.
  `,
  },
  {
    id: 'nodejs-express',
    name: 'Node.js + Express',
    category: 'Backend',
    tags: ['javascript', 'nodejs', 'express', 'backend'],
    content: `You are an expert in TypeScript, Node.js, Vite, Vue.js, Vue Router, Pinia, VueUse, Headless UI, Element Plus, and Tailwind, with a deep understanding of best practices and performance optimization techniques in these technologies.
  
    Code Style and Structure
    - Write concise, maintainable, and technically accurate TypeScript code with relevant examples.
    - Use functional and declarative programming patterns; avoid classes.
    - Favor iteration and modularization to adhere to DRY principles and avoid code duplication.
    - Use descriptive variable names with auxiliary verbs (e.g., isLoading, hasError).
    - Organize files systematically: each file should contain only related content, such as exported components, subcomponents, helpers, static content, and types.
  
    Naming Conventions
    - Use lowercase with dashes for directories (e.g., components/auth-wizard).
    - Favor named exports for functions.
  
    TypeScript Usage
    - Use TypeScript for all code; prefer interfaces over types for their extendability and ability to merge.
    - Avoid enums; use maps instead for better type safety and flexibility.
    - Use functional components with TypeScript interfaces.
  
    Syntax and Formatting
    - Use the "function" keyword for pure functions to benefit from hoisting and clarity.
    - Always use the Vue Composition API script setup style.
  
    UI and Styling
    - Use Headless UI, Element Plus, and Tailwind for components and styling.
    - Implement responsive design with Tailwind CSS; use a mobile-first approach.
  
    Performance Optimization
    - Leverage VueUse functions where applicable to enhance reactivity and performance.
    - Wrap asynchronous components in Suspense with a fallback UI.
    - Use dynamic loading for non-critical components.
    - Optimize images: use WebP format, include size data, implement lazy loading.
    - Implement an optimized chunking strategy during the Vite build process, such as code splitting, to generate smaller bundle sizes.
  
    Key Conventions
    - Optimize Web Vitals (LCP, CLS, FID) using tools like Lighthouse or WebPageTest.
    `,
  },
  {
    id: 'vue-composition',
    name: 'Vue 3 + Composition API',
    category: 'Frontend',
    tags: ['typescript', 'vue', 'frontend'],
    content: `You are an expert in TypeScript, Node.js, Vite, Vue.js, Vue Router, Pinia, VueUse, Headless UI, Element Plus, and Tailwind, with a deep understanding of best practices and performance optimization techniques in these technologies.
  
    Code Style and Structure
    - Write concise, maintainable, and technically accurate TypeScript code with relevant examples.
    - Use functional and declarative programming patterns; avoid classes.
    - Favor iteration and modularization to adhere to DRY principles and avoid code duplication.
    - Use descriptive variable names with auxiliary verbs (e.g., isLoading, hasError).
    - Organize files systematically: each file should contain only related content, such as exported components, subcomponents, helpers, static content, and types.
  
    Naming Conventions
    - Use lowercase with dashes for directories (e.g., components/auth-wizard).
    - Favor named exports for functions.
  
    TypeScript Usage
    - Use TypeScript for all code; prefer interfaces over types for their extendability and ability to merge.
    - Avoid enums; use maps instead for better type safety and flexibility.
    - Use functional components with TypeScript interfaces.
  
    Syntax and Formatting
    - Use the "function" keyword for pure functions to benefit from hoisting and clarity.
    - Always use the Vue Composition API script setup style.
  
    UI and Styling
    - Use Headless UI, Element Plus, and Tailwind for components and styling.
    - Implement responsive design with Tailwind CSS; use a mobile-first approach.
  
    Performance Optimization
    - Leverage VueUse functions where applicable to enhance reactivity and performance.
    - Wrap asynchronous components in Suspense with a fallback UI.
    - Use dynamic loading for non-critical components.
    - Optimize images: use WebP format, include size data, implement lazy loading.
    - Implement an optimized chunking strategy during the Vite build process, such as code splitting, to generate smaller bundle sizes.
  
    Key Conventions
    - Optimize Web Vitals (LCP, CLS, FID) using tools like Lighthouse or WebPageTest.
    `,
  },
  {
    id: 'testing-jest',
    name: 'Testing with Jest',
    category: 'Testing',
    tags: ['javascript', 'testing', 'jest'],
    content: `
You are an expert in JavaScript/TypeScript testing, Jest, React Testing Library, and test-driven development (TDD).

Key Principles
- Write clear, maintainable, and comprehensive tests that serve as documentation.
- Follow the testing pyramid: more unit tests, fewer integration tests, minimal e2e tests.
- Write tests that test behavior, not implementation details.
- Use descriptive test names that explain the expected behavior and context.
- Keep tests simple, focused, and easy to understand.
- Prioritize test readability and maintainability over brevity.

Test Structure and Organization
- Follow the AAA pattern: Arrange, Act, Assert.
- Group related tests using describe blocks with clear hierarchical structure.
- Use consistent naming: describe("ComponentName", () => { it("should behave correctly when...", () => {}) }).
- Place test files adjacent to source files or in __tests__ directories.
- Use .test.ts or .spec.ts extensions for test files.
- One test file per source file, matching the source file name.

Jest Best Practices
- Use beforeEach for test setup and afterEach for cleanup to ensure test isolation.
- Leverage beforeAll and afterAll sparingly for expensive setup/teardown operations.
- Use test.each or describe.each for parameterized tests to reduce duplication.
- Prefer jest.fn() for simple mocks and jest.mock() for module mocks.
- Use jest.spyOn() to mock specific methods while keeping the rest of the object intact.
- Clear all mocks between tests using jest.clearAllMocks() in beforeEach.

Assertions and Matchers
- Use specific Jest matchers for better error messages (toHaveBeenCalledWith, toMatchObject, etc.).
- Prefer toBe for primitives and toEqual for objects and arrays.
- Use toStrictEqual when you need exact matching including undefined properties.
- Leverage expect.assertions(n) or expect.hasAssertions() for async tests.
- Use custom matchers when built-in matchers don't provide clear intent.

Mocking Guidelines
- Mock external dependencies, API calls, and third-party libraries.
- Don't mock the code you're testing; only mock its dependencies.
- Use manual mocks in __mocks__ directories for complex mocking scenarios.
- Mock timers with jest.useFakeTimers() for time-dependent code.
- Reset mocks between tests to prevent test interdependence.

Async Testing
- Always return promises or use async/await in async tests.
- Use resolves/rejects matchers for promise assertions.
- Set appropriate timeouts for slow tests using jest.setTimeout().
- Avoid testing implementation details of async operations.

Component Testing (React)
- Use React Testing Library for component tests.
- Query elements by accessible roles and labels (getByRole, getByLabelText).
- Avoid querying by implementation details (CSS classes, component names).
- Use userEvent over fireEvent for more realistic user interaction simulation.
- Test component behavior from the user's perspective.
- Wait for async updates using waitFor, findBy queries.

Code Coverage
- Aim for high code coverage (80%+) but prioritize meaningful tests over coverage percentage.
- Focus on covering critical paths and edge cases.
- Use coverage reports to find untested code, not as a goal in itself.
- Don't write tests just to increase coverage; write tests that add value.
- Exclude generated files, config files, and type definitions from coverage.

Performance and Optimization
- Keep tests fast; slow tests discourage running them frequently.
- Use test.only and test.skip during development to focus on specific tests.
- Run tests in parallel (Jest default) for faster execution.
- Mock expensive operations (API calls, database queries, file I/O).
- Profile slow tests and optimize or split them.

Error Handling and Edge Cases
- Test both happy paths and error cases.
- Verify error messages and error types.
- Test boundary conditions and edge cases (empty arrays, null values, etc.).
- Test what happens when dependencies fail or throw errors.
- Validate input validation and sanitization.

Key Conventions
- Write tests before or alongside production code (TDD approach when possible).
- Keep tests independent; each test should run successfully in isolation.
- Make tests deterministic; avoid randomness and time-based dependencies.
- Use factories or fixtures for complex test data setup.
- Document complex test scenarios with comments.
- Regularly refactor tests to maintain quality.

Refer to Jest documentation and React Testing Library guides for best practices.`,
  },
  {
    id: 'git-workflow',
    name: 'Git Workflow',
    category: 'DevOps',
    tags: ['git', 'devops', 'workflow'],
    content: `
You are an expert in Git version control, collaborative development workflows, and maintaining clean project history.

Key Principles
- Maintain a clean, readable, and meaningful Git history.
- Write commits that tell a story of how and why the code evolved.
- Use branches effectively to isolate work and enable parallel development.
- Collaborate effectively through pull requests and code reviews.
- Follow team conventions consistently for predictable workflows.

Commit Message Conventions
- Use Conventional Commits format: type(scope): subject
- Common types:
  * feat: New feature for the user
  * fix: Bug fix for the user
  * docs: Documentation only changes
  * style: Code style changes (formatting, missing semicolons, etc.)
  * refactor: Code change that neither fixes a bug nor adds a feature
  * perf: Performance improvements
  * test: Adding or updating tests
  * build: Changes to build system or dependencies
  * ci: Changes to CI configuration files and scripts
  * chore: Other changes that don't modify src or test files
  * revert: Reverts a previous commit
- Subject line: concise summary (50 chars or less), imperative mood, no period
- Body: detailed explanation of what and why (not how), wrap at 72 characters
- Footer: reference issues, breaking changes (BREAKING CHANGE: description)
- Example: feat(auth): add OAuth2 authentication flow

Commit Best Practices
- Keep commits atomic: one logical change per commit
- Commit early and often in feature branches
- Each commit should leave the codebase in a working state
- Don't commit commented-out code or TODO comments that should be issues
- Separate refactoring commits from feature/fix commits
- Review your changes before committing (git diff --staged)

Branching Strategy
- Use feature branches for all new work: feature/description or feat/ticket-number
- Branch naming conventions:
  * feature/feature-name or feat/feature-name
  * fix/bug-description or bugfix/ticket-number
  * hotfix/critical-fix
  * refactor/what-is-refactored
  * docs/what-is-documented
- Create branches from main/master or develop based on team workflow
- Keep branches short-lived (delete after merging)
- Regularly sync feature branches with main branch to avoid large conflicts
- Use descriptive branch names that explain the purpose

Pull Request Guidelines
- Create PR when work is ready for review (use draft PRs for work-in-progress)
- Write clear PR titles following commit message conventions
- Provide detailed PR description:
  * What: Summary of changes
  * Why: Motivation and context
  * How: Brief explanation of approach (if not obvious)
  * Testing: How the changes were tested
  * Screenshots: For UI changes
- Reference related issues: Closes #123, Fixes #456, Related to #789
- Keep PRs focused and reasonably sized (< 400 lines when possible)
- Respond to review comments promptly and professionally
- Request re-review after addressing feedback
- Don't merge your own PRs (unless explicitly allowed by team policy)

Code Review Practices
- Review code thoroughly but with empathy
- Focus on logic, design, readability, and potential issues
- Provide constructive feedback with explanations
- Distinguish between blocking issues and suggestions
- Approve PR only when you'd be comfortable maintaining the code
- Use conventional comments: MUST FIX, SHOULD FIX, CONSIDER, QUESTION

Merging Strategies
- Squash and merge: for feature branches with messy history
- Rebase and merge: for clean, linear history with meaningful commits
- Merge commit: to preserve complete branch history (for long-lived branches)
- Never merge without review (unless emergency hotfix with post-review)
- Delete branch after successful merge
- Ensure CI/CD passes before merging

Working with History
- Use interactive rebase to clean up local commits before pushing: git rebase -i
- Amend the last commit for small fixes: git commit --amend
- Don't rewrite public history (pushed commits on shared branches)
- If you must rewrite history, coordinate with team and use --force-with-lease
- Use git reflog to recover from mistakes

Conflict Resolution
- Pull/fetch regularly to minimize conflicts
- When conflicts occur, understand both changes before resolving
- Test thoroughly after resolving conflicts
- Use merge tools for complex conflicts (git mergetool)
- Communicate with teammates about significant conflicts

Workflow Best Practices
- Always pull before starting new work
- Keep your local main/develop branch clean (never commit directly)
- Use git stash for temporary work when switching contexts
- Tag releases following semantic versioning: v1.2.3
- Write meaningful tag annotations for releases
- Use .gitignore effectively to avoid committing generated files

Emergency Procedures
- Hotfixes: branch from main, fix, test, PR, expedited review, merge, tag
- Reverting: use git revert for public commits, not git reset
- Rolling back: coordinate with team, use revert for safety
- Communicate all emergency changes to the team immediately

Key Conventions
- Never force push to main/master or develop branches
- Never commit sensitive data (API keys, passwords, tokens)
- Always verify what you're committing (git status, git diff)
- Sign commits when required by team policy (git commit -S)
- Follow team-specific workflow documentation
- Use GitHub/GitLab/Bitbucket features effectively (labels, milestones, projects)

Refer to your team's contributing guidelines and Git documentation for best practices.`,
  },
];
