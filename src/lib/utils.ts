import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes and tailwind-merge for conflicting classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Sample cursor rule templates
 */
export interface CursorRuleTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
}

export const cursorRuleTemplates: CursorRuleTemplate[] = [
  {
    id: 'react-typescript',
    name: 'React + TypeScript',
    description: 'Best practices for React with TypeScript development',
    category: 'Frontend',
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
    description: 'Guidelines for building APIs with FastAPI',
    category: 'Backend',
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
    description: 'Best practices for Express.js backend development',
    category: 'Backend',
    content: `
    You are an expert in TypeScript, Node.js, Vite, Vue.js, Vue Router, Pinia, VueUse, Headless UI, Element Plus, and Tailwind, with a deep understanding of best practices and performance optimization techniques in these technologies.
  
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
    description: 'Modern Vue.js development with Composition API',
    category: 'Frontend',
    content: `
    You are an expert in TypeScript, Node.js, Vite, Vue.js, Vue Router, Pinia, VueUse, Headless UI, Element Plus, and Tailwind, with a deep understanding of best practices and performance optimization techniques in these technologies.
  
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
    description: 'Comprehensive testing guidelines with Jest',
    category: 'Testing',
    content: `# Jest Testing Rules

- Write tests for all business logic and utilities
- Use descriptive test names that explain the behavior
- Follow AAA pattern: Arrange, Act, Assert
- Mock external dependencies and API calls
- Use beforeEach/afterEach for setup and teardown
- Aim for high code coverage but prioritize meaningful tests
- Use test.each for parameterized tests
- Keep tests isolated and independent of each other`,
  },
  {
    id: 'git-workflow',
    name: 'Git Workflow',
    description: 'Professional Git workflow and commit conventions',
    category: 'DevOps',
    content: `# Git Workflow Rules

- Use conventional commits format: type(scope): message
- Types: feat, fix, docs, style, refactor, test, chore
- Keep commits atomic and focused on single changes
- Write clear, descriptive commit messages
- Create feature branches from main/develop
- Use pull requests for code review
- Squash commits before merging to keep history clean
- Never force push to shared branches`,
  },
];
