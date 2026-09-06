# Mandatory Strictest Linter Configuration & Code Style Standards

## 1. Zero-Warning and Zero-Error Policy
- Every file across all workspace packages (backend and frontend) must strictly pass linting with **ZERO errors and ZERO warnings** (`npm run lint`).
- Suppressing linter warnings or errors using directives (such as `/* eslint-disable */`, `@ts-ignore`, or loose type casting like `as any`) is strictly prohibited.

## 2. Strong Typing & Error Prevention
- **Disallow Any (`@typescript-eslint/no-explicit-any`)**: Prohibit the `any` type in all application code. Use strongly typed domain models, generics, or `unknown` with runtime narrowing.
- **Explicit Return Types (`@typescript-eslint/explicit-function-return-type`)**: Require explicit return type annotations on all exported, public, and top-level functions and methods.
- **Disallow Non-Null Assertions (`@typescript-eslint/no-non-null-assertion`)**: Prohibit the `!` assertion operator. Use optional chaining (`?.`), nullish coalescing (`??`), or explicit runtime checks.
- **Consistent Type Imports (`@typescript-eslint/consistent-type-imports`)**: Enforce `import type { ... }` for all type-only imports to optimize compilation and prevent circular module dependency graphs.
- **Prefer Optional Chaining (`@typescript-eslint/prefer-optional-chain`)**: Enforce concise optional chaining (`a?.b?.c`) over verbose logical AND chains (`a && a.b && a.b.c`).
- **No Unused Identifiers (`@typescript-eslint/no-unused-vars`)**: Zero unused imports, variables, arguments, or functions. Allowed unused arguments must strictly follow the `^_` prefix pattern.
- **Strict Naming Conventions (`@typescript-eslint/naming-convention`)**:
  - Types, interfaces, classes, enums, and React components: `PascalCase`.
  - Variables, functions, and methods: `camelCase` or `UPPER_CASE` for global constants.

## 3. React & Next.js Standards
- **Hook Rules & Dependencies**: Strictly follow React Hooks rules (`react-hooks/rules-of-hooks` and `react-hooks/exhaustive-deps`).
- **Prohibit Unsafe Rendering**: Disallow `dangerouslySetInnerHTML` (`react/no-danger: 'error'`).
- **Clean Boolean Attributes**: Prohibit redundant boolean literals in JSX (`react/jsx-boolean-value: ['error', 'never']`).
- **Accessibility (a11y)**: Enforce core accessibility rules (`jsx-a11y/alt-text`, `jsx-a11y/no-redundant-roles`, `jsx-a11y/anchor-is-valid`).

## 4. Code Quality & Maintainability
- **Cyclomatic Complexity**: Functions must not exceed a cyclomatic complexity of **10** (`complexity: ['error', 10]`).
- **File Length Budget**: Files must not exceed **300 lines** (`max-lines: ['error', { max: 300 }]`).
- **Line Length Budget**: Lines must not exceed **120 characters** (`max-len: ['error', { code: 120 }]`).
- **Formatting**: Enforce single quotes (`quotes: ['error', 'single']`), mandatory semicolons (`semi: ['error', 'always']`), and no trailing commas (`comma-dangle: ['error', 'never']`).
- **Modern Syntax**: Enforce `prefer-const`, prohibit `var` (`no-var: 'error'`), and require object shorthand (`object-shorthand: ['error', 'always']`).
- **Zero Hardcoded Strings**: All user-facing strings must reside in `UI_STRINGS` (`frontend/src/constants/uiStrings.ts`).

## 5. Integration into Primary Build & CI/CD Pipelines
- **Primary Build**: Integrated directly into `npm run build` (`npm run lint && npm --prefix backend run build && npm --prefix frontend run build`).
- **Git Pre-Commit**: Validated in git pre-commit checks (`npm run pre-commit`).
- **CI/CD Quality Gate**: Enforced as Quality Gate 1 in GitHub Actions CI/CD (`.github/workflows/ci.yml`).

## 6. Strict 90% Unit Test Code Coverage
- Every refactored file and helper function created for linter compliance must maintain >= 90% unit test code coverage individually across statements, branches, functions, and lines (`perFile: true`).
