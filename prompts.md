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

---

## Prompt 22
run local in chrome

---

## Prompt 23
let us refresh

---

## Prompt 24
In this area, let us show the document summary like Material group wise summary, plant wise summary and month wise summary and spends in INR/ USD etc. The existing analysis to be shown in the AI categorization page. First page should be summary of the data that is uploaded by the client

---

## Prompt 25
check the data is not matching except total lines. He you should show unique items, unique vendors as well from the data uploaded

---

## Prompt 26
For month wise, show it in a graphical form about the changes month wise for 3 years

---

## Prompt 27
Make it a line graph each line showing every year. X-axis Months and Y-Axis amounts

---

## Prompt 28
here you need to highlight about the conversion related issues for fixing and then any duplication of vendors for merging and duplication of items for merging to be highlighted here. Once the user gives the fix or confirmation, please proceed and show the revised numbers from the start of the sheet after refreshing and updating the numbers

---

## Prompt 29
Plz take the currency conversion as on the date of that particular transaction. Even in the entire technology, use the currency oncersions as on that date as per Yahoo finance dats integrated through APIs

---

## Prompt 30
Before the multi currency validation, show data like this for 80% of the spend with first vendor and then item and sepnd. In another tab, first item and then vendor names and then spend. The second column should be created in a collapsible way, so I can see only the vendors and spend and another tab only the items and the spend.

---

## Prompt 31
run local host on chrome

---

## Prompt 32
change the description to Base Data Upload (Upto 3 years)

---

## Prompt 33
change the text 3- year upload to Data Upload

---

## Prompt 34
Both supplier name and short text i.e item names are coming wrongly. Review and update

---

## Prompt 35
This is how I am getting the data analysis but you are giving wrongly. I have attached your image as well which is showing wrongly

---

## Prompt 36
I am getting error in refreshing the page

---

## Prompt 37
This is the error

---

## Prompt 38
it is showing 2 lists here. plz check and correct

---

## Prompt 39
In this area, plz give the description of the issue and also a button to ignore as well

---

## Prompt 40
Keep an option to refresh with these fixes and see the final numbers again

---

## Prompt 41
all numbers changed after refreshing it with fixes. Plz check ensure it is always correct. Plz keep some validations again after the fixes without going wrong

---

## Prompt 42
Plz check the plants and material groups. Numbers are not matching. Plz align the numbers perfectly and show any deviations or gaps in a separate note. even if we show only the top 10 numbers, show that only these numbers considered etc.

---

## Prompt 43
If a new file is uploaded, plz era se the old data and consider it as a completely new and revise the complete data. Erase the complete old data and consider only new file

---

## Prompt 44
Let us give a button here to start AI Categorization as per UNSPSC. Remove Enterprise Qua and Public Qua buttons here

---

## Prompt 45
show the categories here based on UNSPSC. First try to consider values based on Commodity Title and if the values are less, consider showing them as per Class Title. The objective is to understand major spend categories and their vendors in this segment. Don't clutter the UI too much

---

## Prompt 46
In this area, let us categorise vendors based on their material supply categories. For example, if a vendor is supplying irrelavant categories of materials, mark them as a multi category vendor and if the vendor is supplying only single category of items, show them a single category vendor. Show this trend for top 50 vendors here based on spend value. If there are multiple category vendors are more for higher spends, raise an alarm for key observation here

---

## Prompt 47
Show the loader with analyzing in a nice pictorial way across the application

---

## Prompt 48
Let us give an option for industry by Major sector and minor sector to understand the type of materials and their categories easily. This should also be considered while categorizing the materials

---

## Prompt 49
Here along with vendor entity, show the Material code and description, PO number  and UNSPSC commodity/class title

---

## Prompt 50
Here also show the Commodity Title / Class Title and then show more details over a pop up

---

## Prompt 51
broaden the major and minor sectors across various industries and add service sectors as well

---

## Prompt 52
In this area, let us highlight that the spend increased (Year On Year)YOY with the vendor against his items and quantity also increased and prices also increased YOY to be highlighted here for all the 50 top vendors instead of year wise spend separately. Show increase in green colour with a red mark of observation and decrease in amber colour with a remark in blue colour

---

## Prompt 53
plz start now

---

## Prompt 54

deploy in cloudflare with url name procucev consulting portal

---

## Prompt 55

deplooy in cloudflare with procucev Consulting portal

---

## Prompt 56

Whenever you deploy these kinds of applications, please just any one backend related operation & one data base related operation & one file uploading operation

---

## Prompt 57

Also, please setup CI/CD in github to automatically deploy these application in cloudflare

---

## Prompt 58

this code is the latest code pull from the main and build this application?

---

## Prompt 59

don't deploy this changes in main and git also just commit in this cloudflare branch only

---

## Prompt 60

the latest code in git is not deploy at coludflare please and fix it

---

## Prompt 61

not deploy my cloudflare code in git and main i want early 1 hr new code pull from main branch and deploy in cloudflare  in this url  
https://procucev-consulting-portal.pages.dev/

Also, please setup CI/CD in github to automatically deploy these application in cloudflare
