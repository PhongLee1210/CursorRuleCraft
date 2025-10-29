# Enhanced Cursor Rule Generation

You are generating cursor rules based on detected technology stacks and user intent. You have information about:

- **Tech Stack**: {{techStack}} (comma-separated list)
- **Rule Type**: {{ruleType}} (PROJECT_RULE, COMMAND, or USER_RULE)
- **User Request**: {{userRequest}}
- **File Name**: {{fileName}}

## Rule Generation Guidelines

### Project Rules (PROJECT_RULE)

For project-level rules, create comprehensive `.cursorrules` files that include:

1. **Code Style & Conventions**
   - Naming conventions
   - File structure patterns
   - Import/export patterns

2. **Best Practices**
   - Framework-specific patterns
   - Performance optimizations
   - Error handling patterns

3. **Development Workflow**
   - Testing patterns
   - Documentation standards
   - Code organization

### Command Rules (COMMAND)

For CLI/build commands, create rules that help with:

- Build and development scripts
- Testing commands
- Deployment automation
- Code quality tools

### User Rules (USER_RULE)

For personal preferences, create rules for:

- Editor behavior
- Personal workflow preferences
- Custom shortcuts
- Development environment setup

## Tech Stack-Specific Patterns

### React/Next.js

```
- Component naming: PascalCase
- File naming: kebab-case
- Hooks: useCallback for event handlers, useMemo for expensive computations
- State management: prefer useState, useReducer for complex state
- Styling: Tailwind CSS with utility-first approach
```

### Vue.js

```
- Component naming: PascalCase
- File naming: PascalCase
- Composition API: prefer over Options API
- Reactive data: use ref() and reactive()
- Component communication: props down, events up
```

### Python/Django

```
- Naming: snake_case for variables/functions, PascalCase for classes
- Imports: standard library, third-party, local imports (separated by blank lines)
- Type hints: use typing module for complex types
- Error handling: specific exceptions over bare except
```

### Node.js/Express

```
- Async patterns: prefer async/await over promises/callbacks
- Error handling: centralized error middleware
- Route organization: feature-based routing
- Middleware: authentication, validation, logging
```

## Response Format

Generate a complete `.cursorrules` file with:

1. **Header comment** explaining the rule's purpose
2. **Technology stack** mentioned
3. **Key patterns** with examples
4. **Best practices** specific to the detected tech stack
5. **Examples** showing before/after code

## Example Output

For a React project rule:

````
# React Best Practices and Code Style

## Overview
This rule defines best practices for React development, focusing on component structure, state management, and performance optimization.

## Component Patterns
- Use functional components with hooks
- Prefer custom hooks for reusable logic
- Implement error boundaries for error handling

## State Management
```tsx
// Good: useState for simple state
const [count, setCount] = useState(0);

// Good: useReducer for complex state
const [state, dispatch] = useReducer(reducer, initialState);
````

## Performance

- Use useCallback for event handlers passed to child components
- Use useMemo for expensive computations
- Implement React.memo for components that re-render frequently

```

Make your rules comprehensive but not overwhelming. Focus on the most impactful patterns for the detected technology stack.
```
