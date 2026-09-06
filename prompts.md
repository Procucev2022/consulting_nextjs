# User Prompt History

## Prompt 1
Migrate the tech stack:
Backend: Node.js in a new folder named “backend”
A common command to run both frontend & backend application at once “npm run dev”

---

## Prompt 2
Migrate the tech stack:
Frontend: Next.js in a new folder named “frontend”
Backend: Node.js in a new folder named “backend”
A common command to run both frontend & backend application at once “npm run dev”
Database: PostgresSQL
A common command “npm run db: view” to view the database.

---

## Prompt 3
90% Unit test Code Configuration: Add unit test configuration in this code & AI coding agents (e.g., antigravity, cursor, Claude, codex, kiro, etc.) instructions, also add 90% unit test code coverage each file wise & achieve this unit test coverage across the application. Do not skip any file. Also make sure to add a global timeout for all unit tests. Also add the configuration whenever doing any change, make sure to check for unit test coverage. Apart from just adding the configuration, please add unit tests as well to achieve this coverage. In case if per file wise unit test coverage is below 90% across any parameters such as lines, statement, branch, functions, it should throw an error. 

Please improve the unit test coverage & achieve the required benchmark of 90% across all parameters. In the end print the overall coverage & per file coverage without skipping any file. Do not stop till you achieve 90% unit test code coverage across all parameters each file wise

---

## Prompt 4
Logs Storage: Implement a structured and centralized logging system for persistence, searchability, and automatic purging to manage storage and compliance. In case the code is running locally, store all logs in the file system for future reference and debugging.

Detailed Logs: Add the configuration in assistant instructions to add detailed logs in the application.  Also, apply this configuration across the application.

---

## Prompt 5
CI/CD configuration: Set up a CI/CD workflow to run on pull requests. This workflow must check for all quality requirements for the application, including linting, building, typechecking, and ensuring all unit tests pass with the required code coverage of 90% across each file across all parameters.

Also each github actions CI/CD pipeline should have a timeout.

Also, print overall unit tests summary PR comments such as number of unit test failure or success etc, overall unit test code coverage.

---

## Prompt 6
User Prompt History: Add configuration in assistant instructions to maintain a file in workspace “prompts.md” for saving user provided prompts. Save only user provided prompts in a file named prompts.md. Not AI generated conversations.

---

## Prompt 7
i18 Language internationalisation: Add a comprehensive configuration in assistant instructions to implement internationalization (i18n) across the application. Ensure that all user-facing literal strings are moved from components into dedicated constants modules, and referenced via a centralized UI_STRINGS object. This configuration must enforce that no user-facing strings & literals are hardcoded or embedded directly in the code, using template placeholders for runtime substitution to ensure the application is fully i18n-ready. Additionally, update all tests to assert against these constants instead of hardcoded text to maintain consistency and prevent brittle matches during UI changes.

---

## Prompt 8
Separate constant file configuration: Add the configuration in assistant instructions to keep all constants in a separate file. Apply this configuration across the application & shift all constants to a separate file. Refactor the complete application to meet this configuration.
Types & interfaces: Add the configuration in assistant instructions to keep all data types & interfaces in a separate file. Refactor the complete application to meet this configuration.

---

## Prompt 9
Types & interfaces: Add the configuration in assistant instructions to keep all data types & interfaces in a separate file. Refactor the complete application to meet this configuration.

---

## Prompt 10
Input Schema Validation: Add a comprehensive configuration in assistant instructions to enforce strict input validation across the entire application. This configuration must mandate the addition of input schema validation whenever any code change touches user or system inputs, including frontend forms, API routes, controller bodies, query parameters, and headers. Additionally, all validation schemas must be defined in dedicated constants modules, rather than being declared inline, ensuring they serve as a single source of truth for data integrity throughout the projects. Also refactor the code & apply these validation changes across the complete projects.

---

## Prompt 11
Comprehensive and Descriptive UI Error Messaging: Add a comprehensive configuration in assistant instructions to always Implement user-facing error messages that clearly present actionable context and specific failure details across different error categories.

---

## Prompt 12
Database Optimization & GraphQL Integration: Configure assistant instructions to audit database queries for efficiency and integrate GraphQL to streamline data fetching across the application. 

Additionally, implement optimizations to minimize database compute hours, reduce resource usage, and enhance overall infrastructure efficiency.

---

## Prompt 13
AES Encryption: Incorporate AES encryption algorithms to guarantee the protection and secure processing of data.

---

## Prompt 14
Auto upgrade tech stack & libraries: Configure assistant instructions to automatically identify, upgrade, and maintain all core tech stack components, runtime environments, framework dependencies, and third-party libraries to their latest Long-Term Support (LTS) or stable versions. Ensure that breaking changes, deprecation notices, and updated library APIs are systematically refactored across the entire codebase. Validate every upgrade through the complete quality check pipeline—including build execution, typechecking, linting, and running unit tests—to prevent regressions and maintain stability.

---

## Prompt 15
Auto performance optimization: Configure assistant instructions to continuously audit, identify, and apply automated performance optimizations across the entire codebase. Ensure the system proactively optimizes critical paths, implements efficient code-splitting, lazy-loading, and resource caching. Validate all performance improvements against established bundle size and latency benchmarks via the quality check pipeline.

Auto-resolve bugs & errors in logs: Configure assistant instructions to continuously monitor, analyze, and resolve application bugs and errors captured in log files. The system must automatically parse runtime log outputs, stack traces, and error codes to diagnose underlying issues, implement verified bug fixes, and prevent recurring failures. Validate all bug fixes through the quality check pipeline, including linting, typechecking, and test suite execution, ensuring no regressions are introduced.

---

## Prompt 16
Auto resolve warnings: Configure assistant instructions to automatically identify, analyze, and resolve all compiler, linter, runtime, and dependency warnings across the entire project. Ensure that the assistant proactively applies safe refactoring and fixes for deprecation notices, unused imports, type mismatches, and syntax warnings without breaking core functionality or introducing regression issues. Validate all dynamic warning fixes by running the complete quality check pipeline, including linting, typechecking, and test suites.

---

## Prompt 17
Pre-commits check: Add assistant instructions to run git pre-commit hooks that execute all quality checks—such as linting, typechecking, building, and running tests—before allowing any commit.

---

## Prompt 18
DOM Manipulation: Add a comprehensive configuration in assistant instructions to strictly prohibit direct DOM manipulation using low-level libraries within the application framework. All UI updates must be handled through the framework's state management patterns. This ensures that the framework's view engine remains the single source of truth, preventing reconciliation issues and maintaining application performance. Refactor the complete application to ensure all existing direct DOM interactions are converted to declarative patterns.

---

## Prompt 19
Performance Budget Enforcement: Configure build tools to enforce strict performance budgets for the client-side bundle.
Budget: Set a limit on the total JavaScript bundle size (e.g., 250 KB) and critical CSS size.
Check: Integrate the check into the quality check command to fail if the budgets are exceeded, ensuring the application remains fast and lightweight.

---

## Prompt 20
Quality Check Configuration such as build, typecheck, lint etc: Add configuration in assistant instructions to ensure that after every change the system runs the appropriate quality check commands where AI coding agents such as antigravity, Kiro, github copilot, claude, etc will check for build issues, typecheck issues, lint issues, unit test code coverage, apply any pending database schema migrations etc. In case of multiple projects in the workspace, use global commands to check all issues in the workspace. Build & unit test coverage should be checked first. Also add a command which can check only changes in fast ways.

---

## Prompt 21
Strictest Linter configuration: Add a comprehensive linter configuration in assistant instructions to enforce code quality, consistent formatting, and best practices across the project. The configuration should include rules to detect potential errors, ensure proper typing, and maintain a unified coding style. Ensure that linting checks are integrated into the primary build command and the CI/CD workflow to prevent code with linting errors from being committed or merged. Refactor the complete application to meet this configuration.
A. Strong Typing and Error Prevention
Strict Typing: Enforce @typescript-eslint/no-explicit-any (disallow any), @typescript-eslint/explicit-function-return-type (require return types), @typescript-eslint/no-non-null-assertion (disallow !), @typescript-eslint/consistent-type-imports (enforce import type), and @typescript-eslint/prefer-optional-chain.
Quality: Enforce @typescript-eslint/no-unused-vars and @typescript-eslint/naming-convention (PascalCase for types/interfaces, camelCase for variables/functions).
B. React/Next.js Rules
Functional Components & Security: Enforce best practices for component hooks, dependency management, and prohibit unsafe rendering methods. Ensure consistent handling of boolean properties.
Accessibility (jsx-a11y): Enforce jsx-a11y/alt-text, jsx-a11y/no-redundant-roles, and jsx-a11y/anchor-is-valid.
C. General Code Quality and Style
Maintainability: Limit complexity (max 10), max-lines (300 per file), and max-len (120 chars). Prohibit hardcoded strings via no-literal-strings to ensure UI_STRINGS usage.
Formatting & ES6+: Enforce single quotes, semi (colons), and comma-dangle. Require prefer-const, no-var, and object-shorthand.



