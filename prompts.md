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
In this area, let us show the high value items with single vendor through out the data base uploaded by them. Even if the second vendor is there but with a single digit percentage, let us highlight here. These are strategic items and needs an immediate attention to reduce the risk

---

## Prompt 55
remove column L completely and give a new description to this area

---

## Prompt 56
Make this executive brief into a very detailed Management presentation in PDF. Use Procucev Logo on the first slide and talk about confidentiality in the second slide and give a brief intro about Procucev as per the attached slide

---

## Prompt 57
Let us add a section above this wherever there are more than 5 vendors in a category with high values and that category or items are procured every month recurringly, let us display here and ask for vendor consolidation and leveraging the volume benefit through e-auctions.

---

## Prompt 58
Add a section here and display wherever multiple POs are being released every month to consolidate and get the economies of scale benefit. Also highligh to release single PO for monthly or quarterly or half yearly or annual POs

---

## Prompt 59
name it as AI Categorization and Strategic Sourcing

---

## Prompt 60
run local chrome

---

## Prompt 61
change the description to data ingestion and deep dive analysis

---

## Prompt 62
Replace this with the new aiCEV. reduce ai size compared to CEV

---

## Prompt 63
check again

---

## Prompt 64
I want this change on the UI screen as per the attached picture. This picture needs to be replaced with the new aiCEV logo

---

## Prompt 65
run locally in chrome

---

## Prompt 66
replace the existing logo here with the aiCEV logo attached

---

## Prompt 67
Let us create a login page for user and admin page for this software. New user creates their account with the name, mobile number, organization email id and company name and address. Admin can see all the users list in his login with complete details

---

## Prompt 68
Use this logo on the login page for everyone. Talk about the technology benefits in terms of cost savings, strategic sourcing and road map for your procurement to increase your savings etc. Talk mainly about benefits on the login page and talk about every penny saved in procurement is a direct increase in profit. Ensure aiCEV logo is looking at the maximum optimum size

---

## Prompt 69
Correct this

---

## Prompt 70
Make logo in bigger size, remove engine 2.0. Write "Tech Enabled Strategic Sourcing Suite"

---

## Prompt 71
Let us create 3 types of subscription for the customer.i.e braonze, silver and gold. Any customer as soon as he registers, he will become bronze customer. He can upload the data and can see only the summary that whether savings available for them or not. He can't see any other information. It should show the first page of data upload and analysis and then details on all other pages to be masked. The second one is Silver customer. Here, he can see the complete first page, summary levels on the second page and trend analysis only at the summary level and final savings engine as well summary level. He can see what is total value of savings but can't see where he can generate savings. third one is Gold customer. He will be able to access everything in this software

---

## Prompt 72
complete the task in progress and run locally

---

## Prompt 73
In the Bronze package, let us show the complete Data ingestion and deep dive analysis along with savings available page. But from AI categorization, you can mask and proceed as per the current plan

---

## Prompt 74
Make this area decongested. Move the low priority things to the right corner login page area. Show the aiCEV logo properly. make it look professionally. Remove authoru and document name.

---

## Prompt 75
Shift this entire area into the right side top corner. Create a login user details at this right corner and add all these details there. Show them only when we click on the name along with support button in the down

---

## Prompt 76
run locally on chrome

---

## Prompt 77
In this page, show the summary of savings from various initiatives discussed in AI Categorization & Strategic Sourcing as well along with a complete summary. Take the user to the respective area when he clicks on the respective summary number to review the detail

---

## Prompt 78
run locally on chrome

---

## Prompt 79
I want you to make the `consulting_nextjs` project fully functional and production-ready.

Main project to implement: `C:\Users\navin\OneDrive\Desktop\procucev\consulting_nextjs`
Reference project: `C:\Users\navin\OneDrive\Desktop\procucev\Enterprise_qua_nextjs`

Requirements:
1. First analyze both projects completely
2. Remove all dummy data (remove hardcoded/mock/demo data wherever it is being used, all displayed data should come from actual database/API/backend)
3. Implement real Google Gemini AI (reuse patterns, prompts, structure, error handling, config from Enterprise_qua_nextjs)
4. Connect everything to real data (frontend -> API -> service -> database)
5. Keep existing UI
6. Use Enterprise_qua_nextjs as reference
7. End-to-end testing
8. Fix all issues found, connect disconnected components, adjust database schema carefully.

---

## Prompt 80
please checkout the origin main branch

---

## Prompt 81
create a new branch from latest origin main branch and ccheckout

---

## Prompt 82
create a new branch consulting from latest origin main branch and checkout

---

## Prompt 83
what is the git current remote origin

---

## Prompt 84
please update the git remote origin

---

## Prompt 85
add this prompt here
abc

---

## Prompt 86
why the changes are pushed in main branch i am trying to push in consulting branch

---

## Prompt 87
Please checkout the origin/main branch and pull the latest updates.
Create a new branch named consulting from the updated origin/main branch and checkout. If the branch already exists, delete it prior to creation.

---

## Prompt 88
run both frontend and backend and also setup frontend gateway

---

## Prompt 89
fix this

---

## Prompt 90
Please checkout the origin/main branch and pull the latest updates.
Create a new branch named consulting from the updated origin/main branch and checkout. If the branch already exists, delete it prior to creation.

---

## Prompt 91
PROJECT: PROCUCEV CONSULTING INTELLIGENCE PLATFORM
TASK:
Build and integrate MODULE 3 — PCBI (Procucev Commodity Benchmark Intelligence) Benchmark Intelligence into the existing Procucev Consulting Software.

IMPORTANT:
Modules 1, 2 and 4 are already developed.

DO NOT rebuild, replace, redesign or duplicate Modules 1, 2 or 4.

Module 3 must consume the outputs of Module 1 and Module 2, perform benchmark intelligence and PCBI opportunity calculations, and send the resulting opportunities into the EXISTING Module 4 Savings Engine.

The final architecture must be:

MODULE 1
Procurement Spend Analyzer
        ↓
MODULE 2
UNSPSC + Procurement Categorization +
Strategic Sourcing Intelligence
        ↓
MODULE 3
PCBI Benchmark Intelligence
        ↓
MODULE 4
Existing Savings Engine
        ↓
Existing Report Generator


========================================================
1. FIRST ACTION — INSPECT THE EXISTING APPLICATION
========================================================

Before writing or modifying code, inspect the existing codebase.

Identify:

1. Module 1 frontend
2. Module 1 backend
3. Module 1 database tables
4. Module 1 APIs
5. Module 2 frontend
6. Module 2 backend
7. Module 2 database tables
8. Module 2 APIs
9. Module 4 frontend
10. Module 4 backend
11. Module 4 database tables
12. Module 4 APIs
13. Existing report generator
14. Existing authentication/authorization
15. Existing client/project structure
16. Existing purchase transaction structure
17. Existing vendor master
18. Existing item/material master
19. Existing UNSPSC classification
20. Existing opportunity/savings data model

DO NOT modify anything initially.

First produce an architecture map showing:

EXISTING TABLE
EXISTING API
EXISTING COMPONENT
PURPOSE
HOW MODULE 3 WILL CONNECT

Reuse existing structures wherever possible.

========================================================
2. CORE PRINCIPLE
========================================================

Module 3 must NOT create a second independent purchase database.

Module 1 is the source of truth for client purchase transactions.

Module 2 is the source of truth for:

- UNSPSC classification
- Commodity
- Class
- Category
- Sub-category
- Strategic sourcing classification

Module 3 is the source of truth for:

- PCBI benchmark mappings
- Benchmark methodology
- Benchmark quality
- Weekly benchmark indices
- Benchmarkability
- PCBI price calculations
- PCBI opportunity calculation

Module 4 remains the source of truth for:

- Overall savings opportunity
- Savings aggregation
- Savings overlap
- Final savings reporting

========================================================
3. MODULE 1 INPUTS TO MODULE 3
========================================================

Module 3 must consume the normalized transaction data already generated by Module 1.

Expected fields include, wherever available:

Client ID
Project ID
Transaction ID
PO Number
Invoice Number
Purchase Date
Material Code
Material Description
Short Text
Vendor ID
Vendor Name
Plant ID
Plant Name
Material Group
Quantity
UOM
Unit Price
Currency
Original Amount
INR Amount
USD Amount
EUR Amount
Other normalized currency fields

Do not duplicate these fields unnecessarily.

Use foreign keys/references to existing Module 1 data.

========================================================
4. MODULE 2 INPUTS TO MODULE 3
========================================================

Module 3 must consume the categorization already generated by Module 2.

Expected fields:

Material Code
Material Description
UNSPSC Segment
UNSPSC Family
UNSPSC Class
UNSPSC Commodity
Client Material Group
PCBI/Procurement Category
PCBI/Procurement Sub-category
Vendor
Plant
Spend
Quantity
UOM

The hierarchy should be:

UNSPSC Segment
       ↓
UNSPSC Family
       ↓
UNSPSC Class
       ↓
UNSPSC Commodity
       ↓
PCBI Category

Do not recategorize an item if Module 2 already has a validated UNSPSC classification.

========================================================
5. PCBI MAPPING PRIORITY
========================================================

For determining the benchmark:

Priority 1:
UNSPSC Commodity

If benchmark is not available:

Priority 2:
UNSPSC Class

If benchmark is not available:

Priority 3:
PCBI Category / Procurement Category

If benchmark is still unavailable:

Priority 4:
PCBI Sub-category / approved fallback mapping

If no benchmark exists:

Status = MAPPING_REQUIRED

Do NOT silently assign an unrelated benchmark.

Every mapping must be auditable.

========================================================
6. PCBI BENCHMARK MASTER
========================================================

Create/import a PCBI Benchmark Master.

The master must contain:

PCBI_ID
Sector
PCBI_Category
PCBI_Subcategory
UNSPSC_Segment
UNSPSC_Family
UNSPSC_Class
UNSPSC_Commodity

Benchmark_Name
Benchmark_Source
Source_Series
Benchmark_Type
Benchmark_Unit
Benchmark_Currency
Benchmark_Geography

Benchmarkability_Percent
Residual_Percent

Quality_Rating

Calculation_Method

Effective_From
Effective_To

Active
Notes

The uploaded PCBI master Excel will be used as the initial benchmark seed.

The structure must support adding future sectors:

Cement
Steel
Sugar
Textile
Pharma
Chemicals
etc.

Do NOT hard-code Cement into the calculation engine.

========================================================
7. PCBI WEEKLY INDEX DATABASE
========================================================

Create/import weekly PCBI benchmark index records.

Fields:

PCBI_ID
Component_ID
Week_Start
Week_End
Index_Value
Source
Source_Series
Quality_Rating
Currency
Unit
Base_Period

Initial historical period:

01-Apr-2020
to
31-Jul-2026

Frequency:

Weekly

The system must support future weekly benchmark uploads.

Do not hard-code the dates into the calculation logic.

========================================================
8. BENCHMARK QUALITY
========================================================

Every benchmark must have a quality rating:

A
B
C

The rating is metadata indicating benchmark reliability.

Do not change the benchmark calculation simply because the rating is A/B/C.

Quality must be displayed to the consultant.

Example:

A = strong/direct market benchmark
B = reasonable proxy/derived benchmark
C = weaker proxy

The exact rating stored in the uploaded master must be respected.

========================================================
9. BENCHMARKABILITY
========================================================

Benchmarkability is critical.

Example:

A lubricant purchase may have:

Benchmarkable component = 70%

Residual component = 30%

If the market benchmark index moves by 10%, only the benchmarkable 70% of the base price should move with the index.

Formula:

Expected Price =
Base Price × Residual %
+
Base Price × Benchmarkability %
× Current Index / Base Index

Example:

Base Price = ₹100
Benchmarkability = 70%
Residual = 30%
Base Index = 100
Current Index = 110

Expected Price:

₹100 × 30%
+
₹100 × 70% × 110/100

= ₹30 + ₹77
= ₹107

========================================================
10. COMPOSITE BENCHMARKS
========================================================

Support multiple benchmark components.

Example:

Steel = 60%
Rubber = 20%
Energy = 10%
Other = 10%

The total benchmark components must not exceed 100%.

For each component:

Component Expected Price =
Base Component Price
× Current Index / Base Index

Then:

Expected Price =
SUM(Component Expected Prices)
+
Residual Component

The system must validate:

SUM(component weights) <= 100%

If the total is greater than 100%, reject the benchmark configuration.

========================================================
11. BASE PURCHASE LOGIC — CRITICAL
========================================================

The FIRST VALID PURCHASE must become the BASE PURCHASE for a comparable item.

All subsequent purchases must be compared against the original base.

Do NOT reset the base for every new purchase.

Example:

July 2023 Week 2:

Actual Price = ₹150
PCBI Index = 105

This becomes:

Base Price = ₹150
Base Index = 105

September 2023 Week 4:

Actual Price = ₹180
PCBI Index = 110

Expected Price:

₹150 × 110/105

= ₹157.14

Opportunity:

₹180 - ₹157.14
= ₹22.86 per unit

This purchase is compared with the original July base, NOT the previous purchase.

========================================================
12. COMPARABLE ITEM IDENTIFICATION
========================================================

Create a configurable Comparable Item Key.

Preferred hierarchy:

1. Material Code
2. UNSPSC Commodity
3. Specification
4. Grade
5. UOM

Where a unique material code exists, use it as the primary identifier.

Do not combine technically different items merely because their descriptions are similar.

The consultant must be able to review/override the comparable-item mapping.

========================================================
13. PURCHASE DATE → WEEKLY INDEX
========================================================

For every transaction:

Purchase Date
       ↓
Find corresponding PCBI week
       ↓
Retrieve PCBI Index

Example:

Purchase Date:
12-Jul-2023

Find weekly benchmark covering that date.

If purchase date falls outside available index:

Status =
INDEX_NOT_AVAILABLE

Do not silently use another date.

If approved fallback logic is implemented, clearly flag:

INDEX_FALLBACK_USED

========================================================
14. PCBI CALCULATION ENGINE
========================================================

For each valid benchmarkable purchase:

Base Price
Base Index
Current Index
Benchmarkability %
Residual %

Calculate:

Expected Price =
Base Price × Residual %
+
Base Price × Benchmarkability %
× Current Index / Base Index

Then:

Price Gap =
Actual Price - Expected Price

Opportunity Per Unit =
MAX(0, Price Gap)

Opportunity Value =
Opportunity Per Unit × Quantity

Do not create negative savings.

If Actual Price < Expected Price:

Favourable Variance =
(Expected Price - Actual Price) × Quantity

But this must NOT be counted as savings opportunity.

========================================================
15. CURRENCY HANDLING
========================================================

Use the normalized currency values already calculated by Module 1.

PCBI calculations should preferably occur in the transaction's normalized analytical currency.

Default reporting currency:

INR

But support:

INR
USD
EUR

Do not convert the original transaction value.

Store:

Original Currency
Original Amount
FX Rate
Normalized Amount

Use the existing Module 1 FX logic wherever available.

========================================================
16. PRICE NORMALIZATION
========================================================

Before comparing prices, ensure:

Same UOM
Same currency basis
Same quantity basis
Same specification
Same comparable item

Example:

₹/KG cannot be compared directly with ₹/TON.

Normalize UOM before calculation.

========================================================
17. BASE PURCHASE SELECTION
========================================================

The system must identify the first VALID purchase.

A purchase is valid only if:

Material identity is valid
Quantity > 0
Price > 0
Currency is valid
UOM is valid
PCBI mapping exists
PCBI index exists
Comparable item is valid

If the first transaction is invalid, move to the next valid transaction.

Store:

Base_Transaction_ID
Base_Purchase_Date
Base_Price
Base_Index
Base_Quantity

The base must be immutable unless a consultant explicitly resets it.

========================================================
18. PCBI OPPORTUNITY RECORD
========================================================

Create a PCBI opportunity record for every transaction where:

Actual Price > Expected Price

Fields:

Opportunity_ID
Client_ID
Project_ID
Transaction_ID

Material_ID
Material_Code
Material_Description

Vendor_ID
Vendor_Name

Plant_ID
Plant_Name

UNSPSC_Commodity
UNSPSC_Class
PCBI_ID
PCBI_Category

Base_Transaction_ID
Base_Date
Base_Price
Base_Index

Current_Date
Current_Price
Current_Index

Benchmarkability
Benchmark_Quality
Benchmark_Source

Expected_Price
Price_Gap
Quantity
Opportunity_Value

Calculation_Method

Opportunity_Type = PCBI_PRICE_OPPORTUNITY

Status

Created_Date

================================================
19. MODULE 3 → MODULE 4
================================================

Do NOT build a separate savings aggregation engine.

Send PCBI opportunities into the EXISTING Module 4 Savings Engine.

Opportunity type:

PCBI_PRICE_OPPORTUNITY

Source:

MODULE_3_PCIB

Module 4 should then combine:

PCBI opportunities
Vendor consolidation
Volume consolidation
Negotiation
Process savings
Manpower savings
Other existing opportunity types

================================================
20. DOUBLE-COUNTING CONTROL
================================================

This is critical.

The same spend cannot be counted multiple times.

Create:

Affected_Spend
Opportunity_Group_ID
Overlap_Status

Possible statuses:

NO_OVERLAP
POTENTIAL_OVERLAP
PARTIAL_OVERLAP
MUTUALLY_EXCLUSIVE

Example:

PCBI opportunity = ₹20 L

Vendor consolidation opportunity = ₹15 L

If both affect the same ₹1 Cr spend:

Do not simply report:

₹35 L

Flag overlap for Module 4.

Module 4 remains the final aggregation layer.

================================================
21. MODULE 3 DASHBOARD
================================================

Create a PCBI dashboard inside the existing application.

Show:

Total Client Spend
PCBI Mapped Spend
PCBI Benchmarkable Spend
PCBI Unmapped Spend
PCBI Opportunity
PCBI Opportunity %
Benchmark Coverage %
Number of Benchmarked Items
Number of Benchmarkable Transactions

Benchmark Quality:

A
B
C

Show distribution.

================================================
22. PCBI CATEGORY ANALYSIS
================================================

Show:

Category
Spend
Benchmarkable Spend
Opportunity
Opportunity %
No. of Items
No. of Vendors
Benchmark Quality

Allow drill-down:

Category
→ Subcategory
→ UNSPSC Class
→ UNSPSC Commodity
→ Material
→ Transaction

================================================
23. MATERIAL-LEVEL PCBI ANALYSIS
================================================

When a consultant opens a material:

Show:

Material
Vendor
Category
UNSPSC
PCBI Benchmark
Benchmark Source
Benchmark Quality
Benchmarkability %

Base Purchase

Base Date
Base Price
Base Index

Current Purchase

Current Date
Actual Price
Current Index

Expected Price
Price Gap
Opportunity

Then display a chart:

Actual Price
vs
PCBI Expected Price

over time.

Also display:

PCBI Index Trend.

================================================
24. VENDOR ANALYSIS
================================================

Allow PCBI opportunity to be analyzed by:

Vendor
Category
Material
Plant

Example:

Vendor A:

Total Spend = ₹10 Cr
PCBI Benchmarkable Spend = ₹8 Cr
PCBI Opportunity = ₹75 L

This should be drillable to transactions.

================================================
25. PLANT ANALYSIS
================================================

Show:

Plant
Spend
Benchmarkable Spend
PCBI Opportunity
Opportunity %

This should integrate with Module 1 plant analysis.

================================================
26. MODULE 2 INTEGRATION
================================================

Within the existing Module 2 category/material screens, add:

PCBI Benchmark

and:

PCBI Opportunity

Do not force the consultant to leave Module 2.

Example navigation:

Material
→ Procurement Intelligence
→ Strategic Sourcing
→ PCBI Benchmark
→ Savings Opportunity

================================================
27. MODULE 1 INTEGRATION
================================================

From the Module 1 transaction/spend detail screen, the consultant should be able to see:

PCBI Status

Possible values:

BENCHMARKED
NOT_BENCHMARKABLE
MAPPING_REQUIRED
INDEX_NOT_AVAILABLE
INVALID_TRANSACTION
PENDING_REVIEW

================================================
28. DATA QUALITY FLAGS
================================================

Do not hide data problems.

Create explicit flags:

MISSING_UNSPSC
MISSING_PCIB_MAPPING
MISSING_INDEX
INVALID_UOM
INVALID_PRICE
INVALID_QUANTITY
CURRENCY_MISMATCH
SPECIFICATION_MISMATCH
BENCHMARK_EXPIRED
INDEX_FALLBACK_USED

Provide a PCBI data-quality dashboard.

================================================
29. BENCHMARK COVERAGE
================================================

Show:

Total Spend

Mapped Spend

Benchmarkable Spend

Unmapped Spend

Coverage %

Formula:

Benchmark Coverage =
Benchmarkable Spend / Total Spend × 100

This is different from Benchmarkability %.

Do not confuse the two.

================================================
30. BENCHMARKABILITY VS COVERAGE
================================================

Example:

Client spend:

₹100 Cr

Benchmark mapped:

₹80 Cr

Benchmarkability:

70%

Then:

Benchmark Coverage =
80 / 100
= 80%

Benchmarkable Spend =
80 × 70%
= ₹56 Cr

Display these separately.

================================================
31. PCBI INDEX NORMALIZATION
================================================

Each benchmark series should maintain its own base index.

Example:

Lubricant:

Base Index = 100

Another benchmark:

Steel = 100

Another:

Copper = 100

Do not compare absolute index values across unrelated benchmarks.

Only compare:

Current Index / Base Index

within the same benchmark series.

================================================
32. HISTORICAL DATA
================================================

Initial PCBI historical index database:

01-Apr-2020
to
31-Jul-2026

Weekly frequency.

Future data should be appendable.

The database must support:

Historical version
Current version
Future weekly uploads

Do not overwrite historical records without audit logging.

================================================
33. BENCHMARK SOURCE MANAGEMENT
================================================

Every benchmark must retain:

Source
Source Series
Source Date
Quality
Unit
Currency
Geography

The source must be visible to the consultant.

Do not present a benchmark as an authoritative market price if it is only a proxy/index.

================================================
34. CONSULTANT OVERRIDE
================================================

Allow authorized consultants to override:

PCBI mapping
Benchmark
Benchmarkability %
Comparable item
Base transaction

But:

Original automated result must remain stored.

Store:

System Value
Consultant Override
Override User
Override Date
Override Reason

================================================
35. VERSION CONTROL
================================================

Benchmark master and weekly index must be versioned.

If benchmarkability changes from:

70%

to:

65%

do not rewrite historical calculations without traceability.

Maintain:

Benchmark Version
Effective From
Effective To

================================================
36. PCBI CALCULATION REPRODUCIBILITY
================================================

Every opportunity must be reproducible.

If the consultant opens an opportunity, the system must show exactly:

Base Price
Base Index
Current Index
Benchmarkability
Expected Price formula
Actual Price
Quantity
Opportunity formula
Final opportunity value

No black-box calculations.

================================================
37. REPORTING
================================================

Use the EXISTING report generator.

Add a PCBI section containing:

PCBI methodology
Benchmark coverage
Benchmarkable spend
Benchmark quality
Top PCBI opportunities
Category-level opportunity
Material-level opportunity
Vendor-level opportunity
Plant-level opportunity
Actual vs Expected price analysis
PCBI index trend

Do not create a separate report engine.

================================================
38. API REQUIREMENTS
================================================

Create APIs consistent with the existing backend architecture.

Required capabilities:

GET PCBI benchmark master
UPLOAD PCBI benchmark master
GET weekly index
UPLOAD weekly index
GET PCBI mapping
UPDATE PCBI mapping
CALCULATE PCBI
GET PCBI dashboard
GET PCBI category analysis
GET PCBI material analysis
GET PCBI vendor analysis
GET PCBI plant analysis
GET PCBI opportunity
SEND PCBI opportunity TO MODULE 4

Use existing authentication and authorization.

================================================
39. IMPORT VALIDATION
================================================

When uploading the PCBI Excel:

Validate:

Required columns
PCBI ID
Category
Benchmark
Benchmark Source
Benchmarkability
Quality
Effective dates

Weekly index:

PCBI ID
Week Start
Week End
Index Value

Reject:

Duplicate PCBI IDs
Invalid percentages
Benchmarkability > 100%
Negative index values
Invalid dates
Overlapping effective periods
Unknown PCBI IDs in weekly data

Provide an error report.

================================================
40. FINAL PCBI MASTER FILE
================================================

Use the supplied:

PCBI_Master_Upload_File_Cement_2020_2026.xlsx

as the initial Cement benchmark seed.

The system must support future files for:

Steel
Cement
Sugar
Textile
Pharma
Chemicals
etc.

Do not hard-code individual sectors.

================================================
41. SECURITY
================================================

Only authorized users should be able to:

Upload benchmark data
Change benchmark mapping
Change benchmarkability
Override comparable items
Override base purchase
Modify benchmark versions

Normal users should have read-only access.

All overrides must be logged.

================================================
42. PERFORMANCE
================================================

The system must be designed to handle:

Millions of purchase transactions
Thousands of materials
Thousands of vendors
Multiple clients
Multiple sectors
Multiple benchmark series
Several years of weekly indices

Do not calculate all historical PCBI results every time the dashboard opens.

Use:

Pre-calculated results
Indexed database queries
Caching where appropriate
Background jobs for large calculations

================================================
43. CALCULATION EXECUTION
================================================

When a client uploads purchase data:

Module 1 processes the data.

Module 2 categorizes the data.

Only after Module 2 is complete:

Module 3 becomes available.

User clicks:

RUN PCBI ANALYSIS

System:

1. Retrieves Module 1 transactions.
2. Retrieves Module 2 categorization.
3. Maps PCBI benchmark.
4. Retrieves applicable weekly index.
5. Identifies first valid purchase.
6. Establishes base price/index.
7. Calculates expected price for subsequent purchases.
8. Calculates price gap.
9. Calculates opportunity.
10. Aggregates results.
11. Sends opportunities to Module 4.
12. Updates report data.

================================================
44. PCBI STATUS
================================================

Each transaction should receive a PCBI status.

Possible values:

NOT_PROCESSED
MAPPING_REQUIRED
BENCHMARKED
NOT_BENCHMARKABLE
INDEX_NOT_AVAILABLE
INVALID_DATA
PENDING_REVIEW
CALCULATED

================================================
45. IMPORTANT — DO NOT MAKE ASSUMPTIONS
================================================

If any required data is missing:

Do not invent a benchmark.

Do not invent an index.

Do not invent a price.

Do not invent benchmarkability.

Flag the record for review.

================================================
46. FINAL USER FLOW
================================================

The consultant should experience:

STEP 1

Client uploads purchase/invoice data.

↓

MODULE 1

Spend analysis completed.

↓

STEP 2

Module 2 categorizes purchases using UNSPSC and generates strategic sourcing insights.

↓

STEP 3

Consultant opens:

PCBI BENCHMARK INTELLIGENCE

↓

System automatically reads Module 1 + Module 2 data.

↓

System maps:

UNSPSC
→ PCBI

↓

System applies:

Benchmark
+
Benchmarkability
+
Weekly Index

↓

System calculates:

Expected Price
+
Price Gap
+
PCBI Opportunity

↓

STEP 4

PCBI opportunities are sent to existing Module 4.

↓

STEP 5

Module 4 combines all savings opportunities.

↓

STEP 6

Existing report generator produces the final consulting report.

================================================
47. ACCEPTANCE TEST
================================================

Use the following test case.

Base purchase:

Date:
July 2023 Week 2

Actual Price:
₹150

PCBI:
105

Benchmarkability:
70%

Base Index:
105

Second purchase:

Date:
September 2023 Week 4

Actual Price:
₹180

PCBI:
110

Calculation:

Expected Price =
150 × 30%
+
150 × 70% × (110/105)

Expected Price =
₹30
+
₹110.00

Wait — calculate carefully.

150 × 70% = ₹105

₹105 × 110/105 = ₹110

Therefore:

Expected Price =
₹30 + ₹110
= ₹140

Price Gap =
₹180 - ₹140
= ₹40

Opportunity per unit =
₹40

The system must reproduce this result.

Important:
Do NOT incorrectly calculate the expected price as ₹157.14 because the benchmarkability adjustment must be applied.

================================================
48. SECOND TEST CASE — 100% BENCHMARKABLE
================================================

Base:

Price = ₹100
Index = 100

Current:

Index = 120

Benchmarkability = 100%

Expected:

₹100 × 120/100
= ₹120

If actual price = ₹135:

Opportunity =
₹15 per unit.

================================================
49. THIRD TEST CASE — 0% BENCHMARKABLE
================================================

Base:

Price = ₹100
Index = 100

Current Index = 120

Benchmarkability = 0%

Expected Price =
₹100

The benchmark should have no effect.

================================================
50. FINAL DEVELOPMENT RULE
================================================

Do not start by coding.

First inspect the existing application.

Then provide:

1. Existing architecture map
2. Database integration plan
3. Module 3 data model
4. API integration plan
5. Frontend integration plan
6. Module 1 → Module 3 data flow
7. Module 2 → Module 3 data flow
8. Module 3 → Module 4 data flow
9. Calculation engine design
10. Benchmark import design
11. Weekly index import design
12. Opportunity overlap design
13. Testing plan

Only after this plan is reviewed should implementation begin.

MOST IMPORTANT:

Module 3 must feel like a native part of the existing Procucev Consulting Software.

Do not build a separate PCBI application.

Do not duplicate Modules 1, 2 or 4.

Do not duplicate purchase data.

Do not overwrite existing categorization.

Do not automatically invent benchmarks.

Every PCBI calculation must be traceable back to the original purchase transaction.

Every PCBI opportunity must ultimately flow into the existing Module 4 Savings Engine.

---

## Prompt 92
Proceed

---

## Prompt 93
Proceed

---

## Prompt 94
Proceed

---

## Prompt 95
ok

---

## Prompt 96
run locally on chrome

---

## Prompt 97
Keep it unloacked till the time we complete the development

---

## Prompt 98
Please checkout the origin/main branch and pull the latest updates.
Create a new branch named consulting from the updated origin/main branch and checkout. If the branch already exists, delete it prior to creation.

---

## Prompt 99
remove the locks right now. we will implement once the design is complete

---

## Prompt 100
PROCUCEV — END-TO-END PROCUREMENT INTELLIGENCE, PCBI BENCHMARKING & SAVINGS PLATFORM

BUILD INSTRUCTION — MASTER PRODUCT SPECIFICATION

Build a production-grade B2B SaaS application for Procucev Enterprise Solutions Pvt Ltd.

The product is an end-to-end Procurement Intelligence and Savings platform.

DO NOT build this as a generic spend-analysis dashboard.

The core business flow is:

MODULE 1 → Understand Customer Spend
MODULE 2 → Categorize Spend + Identify Strategic Sourcing Opportunities
MODULE 3 → PCBI Benchmark & Trend Analysis
MODULE 4 → Consolidated Savings Engine + Action Plan

The existing UI already has the four-module concept:

1. Data Upload
2. AI Categorization and Strategic Sourcing
3. Trend Analysis
4. Savings Engine

Retain the existing clean professional B2B SaaS design language and improve it without unnecessarily redesigning the entire interface.

The final product must be auditable, explainable and suitable for consulting use with CEOs, CFOs, Promoters, Procurement Heads and Supply Chain Heads.


============================================================
PRODUCT OBJECTIVE
============================================================

The platform must answer four questions:

MODULE 1:
"Where did the customer spend the money?"

MODULE 2:
"How can the customer improve the way they source and buy?"

MODULE 3:
"Did the customer's purchase price move appropriately against the underlying market benchmark?"

MODULE 4:
"What should the customer do, what is the potential savings, who should act, and what savings have actually been realized?"

The PCBI (Procucev Benchmark Index) is the evidence layer supporting the savings engine.

The end-to-end processing chain must be:

Purchase History
    ↓
Data Validation
    ↓
Spend Normalization
    ↓
UNSPSC Classification
    ↓
Spend Category Classification
    ↓
Strategic Sourcing Analysis
    ↓
PCBI Category Mapping
    ↓
Benchmark Selection
    ↓
Benchmark Quality
    ↓
Benchmarkability %
    ↓
Constituent / Raw Material Decomposition
    ↓
Weekly PCBI Index
    ↓
Expected Benchmark Price
    ↓
Actual Purchase Price Comparison
    ↓
Potential Opportunity
    ↓
Savings Consolidation
    ↓
Action Plan
    ↓
Savings Realization


============================================================
MODULE 1 — DATA UPLOAD & SPEND INTELLIGENCE
============================================================

Purpose:
Understand and normalize the customer's current purchase history before any sourcing or benchmarking analysis.

INPUT FORMATS:
- Excel
- CSV

The system must support different customer file structures.

Typical fields may include:

PO Number
PO Date
Invoice Number
Invoice Date
Vendor Code
Vendor Name
Material Code
Material Description / Short Text
Quantity
UOM
Unit Price
Currency
Total Value
Plant
Business Unit
Department
Material Group
GL
Cost Center
Buyer
Payment Terms
Delivery Location

Do NOT assume every file contains every field.

Create an intelligent column-mapping interface during upload.

Allow the user to map uploaded columns to the Procucev standard schema.

Preserve the original uploaded data.


DATA VALIDATION

Identify:

- Missing material description
- Missing quantity
- Missing unit price
- Missing UOM
- Missing vendor
- Duplicate transactions
- Negative values
- Zero values
- Invalid dates
- Invalid currencies
- Abnormal quantities
- Abnormal prices
- Missing PO number
- Missing material code

Do NOT silently delete records.

Classify records as:

VALID
WARNING
EXCEPTION

Provide an exception report.


CURRENCY NORMALIZATION

Convert all currencies to INR for reporting.

Preserve:

Original Currency
Original Value
FX Rate
INR Value

Never overwrite the original transaction value.


SPEND DASHBOARD

Display:

Total Purchase Spend
Material Spend
Service Spend
Number of Transactions
Number of Vendors
Number of Unique Materials
Number of Plants
Number of Categories
Average Transaction Value

Top 10 Vendors
Top 10 Materials
Top 10 Categories


SPEND ANALYSIS

Provide:

Vendor-wise Spend
Material-wise Spend
Plant-wise Spend
Monthly Spend
Quarterly Spend
Yearly Spend
Category Spend
Vendor Concentration
Material Concentration
Pareto Analysis

Show:

Top 20%
Top 50%
Top 80%
Remaining 20%

The objective is to identify the 80% of spend requiring detailed procurement analysis.


============================================================
MODULE 2 — AI CATEGORIZATION & STRATEGIC SOURCING
============================================================

Module 2 has TWO separate engines:

A. AI Categorization Engine
B. Strategic Sourcing Opportunity Engine


------------------------------------------------------------
MODULE 2A — AI CATEGORIZATION ENGINE
------------------------------------------------------------

UNSPSC is the primary taxonomy.

Use the Procucev UNSPSC master database uploaded/configured by the administrator.

Map every material wherever possible to:

UNSPSC Segment
UNSPSC Family
UNSPSC Class
UNSPSC Commodity

Priority:

1. Commodity-level mapping
2. Class-level mapping where commodity mapping is not reliable or appropriate
3. Exception/manual review if no defensible mapping exists

Do not leave a material unmapped merely because the description is short.

Use available contextual information:

Material Description
Material Code
Vendor
UOM
Historical category
Related descriptions
Customer material group
Plant
Other available attributes

The system should use AI/LLM/RAG-assisted classification where appropriate, but the final mapping must be deterministic and stored in the database.

Every mapped material must store:

UNSPSC Segment
UNSPSC Family
UNSPSC Class
UNSPSC Commodity
UNSPSC Code
UNSPSC Level
Mapping Confidence
Mapping Method
Manual Override
Reviewer
Mapping Version


SERVICE CLASSIFICATION

If a transaction is clearly a service:

Classification = SERVICE
Benchmarking = EXCLUDED FROM MATERIAL PCBI
Strategic sourcing = INCLUDED

Do not force services into material benchmarking.

If the system cannot confidently classify a material:

Classification = UNMAPPED

Create a review queue.

Do not silently discard unmapped records.


------------------------------------------------------------
SPEND CATEGORY CLASSIFICATION
------------------------------------------------------------

Every transaction/material must additionally be assigned to exactly one of:

DIRECT MATERIALS
MRO
PACKING MATERIALS
INDIRECT MATERIALS
SERVICES
UNMAPPED

This classification is independent of UNSPSC.

Show spend and transaction count by these categories.


------------------------------------------------------------
MODULE 2B — STRATEGIC SOURCING ENGINE
------------------------------------------------------------

Identify sourcing opportunities independently of PCBI.

The following opportunity engines are required:


1. VENDOR CONSOLIDATION

Identify:

- Multiple vendors supplying same/similar materials
- Vendor fragmentation
- Low-volume vendors
- Duplicate vendors
- Similar vendor names
- Excessive vendor count

Show:

Current Vendor Count
Potential Vendor Consolidation
Affected Spend
Potential Opportunity


2. PO CONSOLIDATION

Identify:

- Multiple POs for same material
- Repeated small orders
- Same vendor + same material
- Fragmented purchasing
- High PO frequency

Show:

PO Count
Average PO Value
Potential Consolidation Opportunity


3. E-AUCTION / COMPETITIVE SOURCING

Identify categories suitable for:

- E-auction
- RFQ
- e-RFQ
- Competitive bidding

Consider:

Spend
Number of Vendors
Standardization
Market Availability
Price Transparency
Purchase Frequency


4. RATE CONTRACT

Identify:

- Recurring materials
- Predictable demand
- Repeated purchases
- Stable specifications

Recommend:

Annual Rate Contract
Framework Agreement
Blanket PO


5. SPECIFICATION RATIONALIZATION

Identify:

- Duplicate material descriptions
- Similar specifications
- Duplicate material codes
- Excessive variants
- Standardization opportunities


6. DEMAND CONSOLIDATION

Identify opportunities to consolidate purchases across:

- Plants
- Business Units
- Departments
- Time periods


7. NEW VENDOR DEVELOPMENT

Identify:

- Single-source dependency
- High vendor concentration
- High spend with one vendor
- Limited competition


8. ALTERNATE MATERIAL / MAKE-BUY

Identify potential opportunities where data supports it.

Do not automatically claim savings.

Mark as:

OPPORTUNITY REQUIRING VALIDATION


============================================================
MODULE 3 — PCBI BENCHMARK & TREND ANALYSIS
============================================================

This is the core Procucev Benchmark Intelligence module.

The UI may retain the existing name:

TREND ANALYSIS

but the module should display:

PCBI BENCHMARK & TREND ANALYSIS

Subtitle:

Market Index, Price Movement & Benchmark Opportunity


PCBI means:

PROCUCEV BENCHMARK INDEX


The PCBI engine must use the Procucev PCBI Master Database.


------------------------------------------------------------
PCBI MASTER DATA MODEL
------------------------------------------------------------

Each benchmark must contain:

PCBI ID
PCBI Category
PCBI Subcategory
UNSPSC Commodity
UNSPSC Class
Benchmark Name
Benchmark Type
Benchmark Source
Source URL
Geography
Currency
Unit
Frequency
Historical Start Date
Historical End Date
Quality Rating
Benchmarkability %
Constituent
Constituent Weight %
Methodology
PCBI Version
Status


------------------------------------------------------------
PCBI BENCHMARK QUALITY
------------------------------------------------------------

Use the following client-facing quality classification:

A = DIRECT BENCHMARK

Direct market benchmark or reliable published market index.

B = CONSTITUENT BENCHMARK

Benchmark derived from major raw-material constituents or a strong defensible market relationship.

C = PROXY BENCHMARK

Best available market proxy where a direct or constituent benchmark is not available.

NOT CURRENTLY BENCHMARKABLE

Use only where there is no defensible benchmark.

Do NOT use "NR" as the primary client-facing terminology.


------------------------------------------------------------
BENCHMARKABILITY %
------------------------------------------------------------

Benchmark quality and benchmarkability are different concepts.

The system must calculate benchmarkable spend independently.

Example:

Bearing Spend = ₹10 Cr

Constituents:

Steel = 60%
Rubber = 10%
Conversion = 30%

If steel + rubber can be benchmarked:

Benchmarkability = 70%

Benchmarkable Spend = ₹7 Cr

Do NOT claim that the full ₹10 Cr is benchmarked.

The software must calculate:

Benchmarkable Spend =
Spend × Benchmarkability %

This is a critical PCBI calculation.


------------------------------------------------------------
CONSTITUENT / RAW MATERIAL ENGINE
------------------------------------------------------------

The system must support decomposition of purchased items into major economic constituents.

Examples:

BEARING:

Steel = 60%
Rubber = 10%
Conversion = 30%

LUBRICANT:

Base Oil = 70%
Additives = 15%
Packaging = 5%
Conversion = 10%

PLASTIC BAG:

PE Resin = 75%
Additives = 5%
Conversion = 20%

The system must allow administrators/consultants to create and modify constituent structures.

Each constituent must have:

Constituent Name
Weight %
Benchmark Index
Quality
Source
Benchmarkability %
Methodology


------------------------------------------------------------
COMPOSITE PCBI CALCULATION
------------------------------------------------------------

For a multi-constituent item:

Composite PCBI movement must be calculated using the constituent weights.

Example:

Steel movement = 10%
Weight = 60%

Rubber movement = 5%
Weight = 10%

Conversion movement = 3%
Weight = 30%

Composite PCBI movement:

(60% × 10%)
+
(10% × 5%)
+
(30% × 3%)

The system must calculate this automatically.

Store the calculation details so the consultant can explain the benchmark to the client.


------------------------------------------------------------
PCBI INDEX
------------------------------------------------------------

The standard PCBI base index is:

BASE INDEX = 100

The system must support historical weekly benchmark data.

Default historical period:

1 April 2020 to 31 July 2026

But the system must NOT hard-code these dates.

The administrator must be able to upload additional historical periods and future benchmark data.


INDEX FORMULA

PCBI Index =
Current Benchmark Cost
/
Base Benchmark Cost
× 100


Primary frequency:

WEEKLY

Also support:

Monthly
Quarterly
Yearly

Monthly/quarterly/yearly values should be derived from the weekly dataset according to the defined aggregation methodology.


------------------------------------------------------------
PURCHASE PRICE BASELINE
------------------------------------------------------------

For each material/item:

Default baseline = first valid purchase transaction in the selected analysis period.

Store:

Baseline Date
Baseline Quantity
Baseline UOM
Baseline Unit Price
Baseline Currency
Baseline INR Price
Baseline PCBI Index


------------------------------------------------------------
EXPECTED BENCHMARK PRICE
------------------------------------------------------------

For every subsequent purchase:

Expected Benchmark Price =
Baseline Purchase Price
×
(Current PCBI Index / Baseline PCBI Index)


PRICE GAP

Price Gap =
Actual Purchase Price
-
Expected Benchmark Price


PRICE GAP %

Price Gap % =
(Actual Purchase Price - Expected Benchmark Price)
/
Expected Benchmark Price
× 100


------------------------------------------------------------
PCBI OPPORTUNITY
------------------------------------------------------------

Only positive price gaps should initially be considered potential price opportunity.

Gross Opportunity =
MAX(Actual Price - Expected Benchmark Price, 0)
× Quantity


Benchmark-adjusted opportunity:

PCBI Potential Opportunity =
Gross Opportunity
× Benchmarkability %


IMPORTANT:

Do NOT call this "Actual Savings".

Use:

POTENTIAL OPPORTUNITY

until validated by the client/procurement team.


------------------------------------------------------------
MODULE 3 — TREND ANALYSIS SCREEN
------------------------------------------------------------

Allow selection by:

Client
Project
Sector
Plant
Business Unit
Spend Category
UNSPSC Segment
UNSPSC Family
UNSPSC Class
UNSPSC Commodity
PCBI Category
PCBI Subcategory
Material
Vendor
Date Range


Display a trend chart containing:

Actual Purchase Price
Expected PCBI Benchmark Price
PCBI Index

Use:

Weekly
Monthly
Quarterly
Yearly


The user must be able to zoom and drill down.


------------------------------------------------------------
MODULE 3 — EXECUTIVE BENCHMARK SUMMARY
------------------------------------------------------------

At the top of the dashboard show:

TOTAL PURCHASE SPEND

MATERIAL SPEND

SERVICE SPEND

UNSPSC MAPPED SPEND

UNSPSC MAPPING %

PCBI MAPPED SPEND

PCBI COVERAGE %

BENCHMARKABLE SPEND

BENCHMARKABILITY %

A QUALITY SPEND

B QUALITY SPEND

C QUALITY SPEND

NOT CURRENTLY BENCHMARKABLE SPEND

POTENTIAL PCBI OPPORTUNITY


Each KPI must show:

Value
% of total
Trend where applicable


------------------------------------------------------------
BENCHMARK QUALITY DASHBOARD
------------------------------------------------------------

Show:

A — Direct Benchmark
B — Constituent Benchmark
C — Proxy Benchmark
Not Currently Benchmarkable

For each:

Spend
% Spend
Transaction Count
Material Count
Potential Opportunity


------------------------------------------------------------
BENCHMARK COVERAGE WATERFALL
------------------------------------------------------------

Create a visual waterfall:

TOTAL PURCHASE SPEND
        ↓
MATERIAL SPEND
        ↓
UNSPSC MAPPED SPEND
        ↓
PCBI MAPPED SPEND
        ↓
BENCHMARKABLE SPEND
        ↓
SPEND WITH POSITIVE PRICE GAP
        ↓
POTENTIAL PCBI OPPORTUNITY


------------------------------------------------------------
MODULE 3 — SPEND CATEGORY VIEW
------------------------------------------------------------

Always show:

DIRECT MATERIALS
MRO
PACKING MATERIALS
INDIRECT MATERIALS
SERVICES
UNMAPPED


For each show:

Spend
% Spend
UNSPSC Coverage
PCBI Coverage
Benchmarkable Spend
Benchmarkability %
Potential Opportunity


------------------------------------------------------------
MODULE 3 — UNSPSC ANALYSIS
------------------------------------------------------------

Provide drill-down:

Segment
→ Family
→ Class
→ Commodity
→ Material
→ Vendor
→ Transaction


For every level show:

Spend
% Spend
Material Count
Vendor Count
UNSPSC Mapping
PCBI Mapping
Benchmarkable Spend
Potential Opportunity


------------------------------------------------------------
MODULE 3 — VENDOR ANALYSIS
------------------------------------------------------------

For each category/material:

Vendor
Spend
Quantity
Average Purchase Price
PCBI Benchmark Price
Price Gap
Price Gap %
Benchmarkability %
Potential Opportunity


Show vendor price dispersion.

Example:

Vendor A = ₹150
Vendor B = ₹162
Vendor C = ₹175
PCBI Benchmark = ₹153

This should clearly identify the procurement price gap.


------------------------------------------------------------
MODULE 3 — PLANT ANALYSIS
------------------------------------------------------------

For multi-plant clients show:

Plant Spend
Benchmark Coverage
Benchmarkable Spend
Average Price
PCBI Benchmark
Price Gap
Potential Opportunity

Allow comparison across plants.


------------------------------------------------------------
MODULE 3 — "WHY THIS BENCHMARK?" FEATURE
------------------------------------------------------------

Every benchmark must have an explainability panel.

When the consultant clicks:

WHY THIS BENCHMARK?

Show:

Benchmark Name
UNSPSC
PCBI Category
Benchmark Quality
Benchmarkability %
Source
Source URL
Geography
Currency
Unit
Frequency
Constituents
Constituent Weights
Calculation Methodology
PCBI Version
Last Validation Date


Example:

Item:
Bearing 6205

Benchmark:
Steel + Rubber + Conversion

Steel:
60%

Rubber:
10%

Conversion:
30%

Benchmark Quality:
B

Benchmarkability:
70%

The consultant must be able to explain exactly why this benchmark was selected.


------------------------------------------------------------
MODULE 3 — CALCULATION TRANSPARENCY
------------------------------------------------------------

For every opportunity provide a calculation view.

Example:

Item:
Lubricant

Vendor:
ABC

Baseline Date:
July 2023 Week 2

Baseline Purchase Price:
₹150

Baseline PCBI Index:
105

Current Date:
September 2023 Week 4

Current PCBI Index:
110

Expected Benchmark Price:

₹150 × (110 / 105)

= ₹157.14

Actual Purchase Price:
₹180

Price Gap:
₹22.86

Quantity:
10,000

Gross Opportunity:
₹2,28,600

Benchmarkability:
70%

PCBI Potential Opportunity:
₹1,60,020


The calculation must be generated dynamically, not hard-coded.


============================================================
MODULE 4 — SAVINGS ENGINE
============================================================

Module 4 consolidates opportunities from BOTH:

MODULE 2
Strategic Sourcing Opportunities

AND

MODULE 3
PCBI Potential Opportunities


------------------------------------------------------------
SAVINGS CATEGORIES
------------------------------------------------------------

1. PCBI PRICE OPPORTUNITY

2. VENDOR CONSOLIDATION

3. PO CONSOLIDATION

4. E-AUCTION

5. RATE CONTRACT

6. SPECIFICATION RATIONALIZATION

7. DEMAND CONSOLIDATION

8. NEW VENDOR DEVELOPMENT

9. ALTERNATE MATERIAL / MAKE-BUY

10. OTHER STRATEGIC SOURCING OPPORTUNITIES


------------------------------------------------------------
SAVINGS WATERFALL
------------------------------------------------------------

Create:

TOTAL SPEND
      ↓
ADDRESSABLE SPEND
      ↓
IDENTIFIED OPPORTUNITIES
      ↓
POTENTIAL SAVINGS
      ↓
VALIDATED SAVINGS
      ↓
APPROVED SAVINGS
      ↓
REALIZED SAVINGS


Do not automatically treat potential savings as realized savings.


------------------------------------------------------------
SAVINGS DE-DUPLICATION
------------------------------------------------------------

The same spend may appear in multiple opportunity engines.

Example:

A material may have:

PCBI Opportunity = ₹10L
E-Auction Opportunity = ₹7L
Vendor Consolidation = ₹5L

Do NOT add all three automatically.

The system must detect overlap.

Each opportunity must have:

Opportunity ID
Source Module
Source Engine
Category
Item
Vendor
Plant
Spend
Potential Savings
Overlap ID
Status
Owner
Timeline


Opportunity Status:

IDENTIFIED
UNDER VALIDATION
VALIDATED
APPROVED
IMPLEMENTING
REALIZED
REJECTED
DEFERRED


The final savings dashboard must only count non-overlapping opportunities according to the configured savings methodology.


------------------------------------------------------------
ACTION PLAN
------------------------------------------------------------

Every significant opportunity should be convertible into an action.

Action fields:

Opportunity ID
Action
Owner
Department
Target Date
Priority
Expected Value
Status
Comments

Example:

Opportunity:
Lubricant PCBI Price Gap

Value:
₹25L

Action:
Renegotiate rate

Owner:
Procurement

Timeline:
30 Days

Status:
Open


Allow owners:

Procurement
SCM
Plant
Finance
Technical
Management
Other


============================================================
EXECUTIVE MANAGEMENT DASHBOARD
============================================================

Create one consolidated executive dashboard.

TOP KPIs:

Total Spend
Material Spend
Service Spend
UNSPSC Mapping %
PCBI Coverage %
Benchmarkable Spend
Potential PCBI Opportunity
Strategic Sourcing Opportunity
Total Potential Opportunity
Validated Savings
Realized Savings


Create four visual sections:

1. SPEND

Where is the money going?

2. SOURCING

Where can procurement improve?

3. BENCHMARK

Where are we paying above the benchmark?

4. SAVINGS

What action should management take?


------------------------------------------------------------
TOP OPPORTUNITY ANALYSIS
------------------------------------------------------------

Show:

Top 10 Categories
Top 10 Materials
Top 10 Vendors
Top 10 Plants
Top 10 PCBI Opportunities
Top 10 Strategic Sourcing Opportunities


------------------------------------------------------------
CLIENT SUMMARY
------------------------------------------------------------

The executive dashboard must be understandable within 30 seconds.

Example layout:

TOTAL SPEND
₹100 Cr

MATERIAL SPEND
₹92 Cr

UNSPSC MAPPED
₹88 Cr
95.7%

BENCHMARKABLE
₹70 Cr
76.1%

PCBI POTENTIAL OPPORTUNITY
₹8.2 Cr

STRATEGIC SOURCING OPPORTUNITY
₹5.4 Cr

TOTAL ADDRESSABLE OPPORTUNITY
₹12.6 Cr

VALIDATED SAVINGS
₹X Cr

REALIZED SAVINGS
₹X Cr


============================================================
REPORTING
============================================================

Allow generation of:

PDF
Excel

Reports must include:

1. Executive Summary
2. Spend Analysis
3. UNSPSC Coverage
4. Spend Category Analysis
5. Strategic Sourcing Opportunities
6. PCBI Benchmark Coverage
7. Benchmark Quality
8. Benchmarkability
9. Constituent Analysis
10. Price Trend Analysis
11. Actual vs Benchmark
12. Top Price Gaps
13. PCBI Opportunity
14. Savings Waterfall
15. Action Plan
16. Methodology
17. Detailed Appendix


============================================================
DRILL-DOWN REQUIREMENT
============================================================

Every major number shown on the dashboard must be clickable.

Example:

Potential Opportunity
₹4.60 Cr

Click

→ Category

Click

→ UNSPSC

Click

→ PCBI Category

Click

→ Material

Click

→ Vendor

Click

→ Transaction

Click

→ Calculation


The consultant must be able to trace every rupee back to the original purchase transaction.


============================================================
DATABASE DESIGN
============================================================

Create normalized database entities:

Users
Clients
Projects
Uploads
Upload_Columns
Transactions
Vendors
Materials
UNSPSC_Master
Spend_Categories
PCBI_Master
PCBI_Weekly_Index
PCBI_Constituents
Benchmark_Sources
Benchmark_Quality
Material_PCBI_Mapping
Strategic_Opportunities
Savings_Opportunities
Opportunity_Overlap
Action_Plans
Reports
Audit_Log


Important:

Do not store calculated values unnecessarily where they can be derived reliably.

Use proper relational keys.

Create indexes for:

Client
Project
Material
Vendor
UNSPSC
PCBI
Date
Plant
Category


============================================================
PCBI MASTER VERSION CONTROL
============================================================

PCBI must be version controlled.

Example:

PCBI Master V1.0
PCBI Master V1.1
PCBI Master V2.0

Every client analysis must store:

PCBI Version Used
UNSPSC Version Used
Analysis Date
Methodology Version


IMPORTANT:

Historical reports must NOT change automatically when the PCBI master is updated.

A report generated using PCBI V1.0 must continue to reproduce the same result even after PCBI V2.0 is uploaded.


============================================================
AUDIT TRAIL
============================================================

Maintain an audit trail from:

Original Purchase Data
↓
Data Validation
↓
Currency Normalization
↓
UNSPSC Mapping
↓
Spend Category
↓
PCBI Mapping
↓
Benchmark Quality
↓
Benchmarkability
↓
Constituent Calculation
↓
PCBI Index
↓
Expected Benchmark Price
↓
Price Gap
↓
Potential Opportunity
↓
Savings
↓
Action


Every transformation must be traceable.


============================================================
DATA QUALITY & AI RULES
============================================================

Never fabricate:

UNSPSC codes
Benchmark prices
Benchmark sources
Index values
Constituent weights
Savings values

If information is unavailable:

mark it clearly as:

UNMAPPED
NOT CURRENTLY BENCHMARKABLE
REQUIRES REVIEW

Do not silently make assumptions.

AI-generated classifications must be stored with confidence and methodology.

Allow consultant override.

Consultant overrides must be logged.


============================================================
SECURITY & MULTI-TENANCY
============================================================

Design the architecture as multi-client SaaS.

Client A must never see Client B's data.

Every major database table must have:

client_id
project_id

where applicable.

Implement role-based access.

Roles:

ADMIN
CONSULTANT
CLIENT
MANAGEMENT


============================================================
UI/UX REQUIREMENTS
============================================================

Retain the existing Procucev visual style.

Use a clean professional B2B procurement/enterprise interface.

The primary navigation must show:

1. DATA UPLOAD
2. AI CATEGORIZATION & STRATEGIC SOURCING
3. PCBI BENCHMARK & TREND ANALYSIS
4. SAVINGS ENGINE


MODULE 1 subtitle:

Data Ingestion & Spend Intelligence

MODULE 2 subtitle:

AI Taxonomy, Categorization & Strategic Sourcing

MODULE 3 subtitle:

Market Index, Price Movement & Benchmark Opportunity

MODULE 4 subtitle:

Consolidated Savings, Actions & Realization


The current UI card design can be retained, but Module 3 must clearly communicate that it is not merely a generic trend chart.

Use:

PCBI BENCHMARK & TREND ANALYSIS


============================================================
TECHNICAL ARCHITECTURE
============================================================

Build using a scalable production architecture.

Separate:

Frontend
Backend API
Database
AI/ML services
PCBI Calculation Engine
Background Processing
File Processing
Reporting Engine
Authentication
Audit Service


Large Excel uploads must be processed asynchronously.

Do not block the browser during large data processing.

Use job status:

UPLOADED
VALIDATING
PROCESSING
CATEGORIZING
BENCHMARKING
CALCULATING
COMPLETED
FAILED


Provide progress indicators.


============================================================
EXCEL IMPORT / EXPORT
============================================================

Provide downloadable templates.

MODULE 1 PURCHASE HISTORY TEMPLATE

MODULE 2 UNSPSC MASTER TEMPLATE

MODULE 3 PCBI MASTER TEMPLATE

MODULE 3 PCBI WEEKLY INDEX TEMPLATE

MODULE 3 PCBI CONSTITUENT TEMPLATE

MODULE 4 SAVINGS ACTION TEMPLATE


Allow export of:

Raw Data
Mapped Data
PCBI Analysis
Opportunity Analysis
Savings Register
Action Plan


============================================================
PCBI MASTER UPLOAD FORMAT
============================================================

Create an administrator upload format containing at minimum:

PCBI_ID
PCBI_CATEGORY
PCBI_SUBCATEGORY
UNSPSC_COMMODITY
UNSPSC_CLASS
BENCHMARK_NAME
BENCHMARK_TYPE
SOURCE
SOURCE_URL
GEOGRAPHY
CURRENCY
UNIT
FREQUENCY
QUALITY_RATING
BENCHMARKABILITY_PERCENT
CONSTITUENT
CONSTITUENT_WEIGHT_PERCENT
METHODOLOGY
PCBI_VERSION
EFFECTIVE_FROM
EFFECTIVE_TO


============================================================
PCBI WEEKLY INDEX UPLOAD FORMAT
============================================================

PCBI_ID
INDEX_DATE
WEEK
INDEX_VALUE
SOURCE_VALUE
SOURCE_CURRENCY
SOURCE_UNIT
SOURCE
QUALITY_RATING
PCBI_VERSION


============================================================
CONSTITUENT UPLOAD FORMAT
============================================================

PCBI_ID
ITEM_CATEGORY
CONSTITUENT_NAME
CONSTITUENT_WEIGHT_PERCENT
BENCHMARK_PCBI_ID
BENCHMARKABILITY_PERCENT
QUALITY_RATING
METHODOLOGY
EFFECTIVE_FROM
EFFECTIVE_TO


============================================================
PERFORMANCE
============================================================

The platform may eventually process millions of transactions.

Design the processing architecture accordingly.

Use:

- Batch processing
- Background jobs
- Pagination
- Indexed database queries
- Cached dashboard summaries
- Precomputed analytical aggregates where useful
- Lazy loading for detailed tables


============================================================
ERROR HANDLING
============================================================

Every failed processing step must show:

What failed
Why it failed
Affected records
Suggested corrective action

Do not fail the entire project because of a small number of bad rows.

Allow reprocessing of failed rows.


============================================================
MVP PRIORITY
============================================================

Build in this order.

PHASE 1

Database schema
Authentication
Client/project structure
File upload
Column mapping
Data validation
Transaction storage


PHASE 2

Spend analysis
Vendor analysis
Material analysis
Plant analysis
Pareto
Spend categories


PHASE 3

UNSPSC mapping
AI categorization
Manual review
Mapping confidence
Spend category classification


PHASE 4

Strategic sourcing engines:

Vendor Consolidation
PO Consolidation
E-Auction
Rate Contract
Specification Rationalization
Demand Consolidation
New Vendor Development


PHASE 5

PCBI:

PCBI Master
PCBI Weekly Index
PCBI Constituents
Benchmark Quality
Benchmarkability
UNSPSC → PCBI mapping
Composite index
Actual vs Benchmark
Opportunity calculation


PHASE 6

Savings Engine:

Opportunity consolidation
Overlap detection
Savings waterfall
Validation
Approval
Action plan
Realization tracking


PHASE 7

Reporting:

PDF
Excel
Executive dashboard
Detailed appendix


============================================================
CRITICAL BUSINESS RULES
============================================================

RULE 1:

Do not treat PCBI as a simple price-index chart.

PCBI is the benchmark intelligence layer supporting the savings engine.


RULE 2:

Do not claim that all spend is benchmarkable.

Always show:

Total Spend
Benchmarkable Spend
Benchmarkability %


RULE 3:

Benchmark Quality and Benchmarkability are different.

Example:

Quality B
Benchmarkability 70%


RULE 4:

Potential Opportunity is not Savings.

Use:

Potential Opportunity
Validated Savings
Approved Savings
Realized Savings


RULE 5:

Never double-count opportunities.

Use an overlap/de-duplication engine.


RULE 6:

Services are excluded from material PCBI benchmarking but remain available for strategic sourcing analysis.


RULE 7:

Every benchmark must have a source and methodology.


RULE 8:

Every benchmark calculation must be explainable.


RULE 9:

Every dashboard number must be drillable to transaction level.


RULE 10:

PCBI versions must be immutable once used in a client report.


RULE 11:

Original customer data must never be overwritten.


RULE 12:

AI must assist classification but must not silently fabricate missing information.


============================================================
FINAL PRODUCT EXPERIENCE
============================================================

The final customer journey should be:

LOGIN
↓
CREATE CLIENT
↓
CREATE PROJECT
↓
UPLOAD PURCHASE HISTORY
↓
MODULE 1 — SPEND INTELLIGENCE
↓
MODULE 2 — AI CATEGORIZATION & STRATEGIC SOURCING
↓
REVIEW UNSPSC
↓
REVIEW STRATEGIC SOURCING OPPORTUNITIES
↓
MODULE 3 — PCBI BENCHMARK & TREND ANALYSIS
↓
REVIEW BENCHMARK COVERAGE
↓
REVIEW A/B/C QUALITY
↓
REVIEW BENCHMARKABILITY
↓
REVIEW ACTUAL VS PCBI
↓
REVIEW POTENTIAL OPPORTUNITY
↓
MODULE 4 — SAVINGS ENGINE
↓
CONSOLIDATE ALL OPPORTUNITIES
↓
REMOVE OVERLAPS
↓
VALIDATE
↓
ASSIGN ACTIONS
↓
TRACK SAVINGS
↓
GENERATE MANAGEMENT REPORT


============================================================
FINAL MANAGEMENT OUTPUT
============================================================

The final dashboard must answer:

1. How much did we spend?

2. Where did we spend it?

3. How much is mapped to UNSPSC?

4. How much is Direct Material / MRO / Packing / Indirect / Service?

5. How much spend is benchmarkable?

6. What percentage is A / B / C quality?

7. Which categories have the largest price gaps?

8. Which vendors have the largest price gaps?

9. Which plants have the largest gaps?

10. How much PCBI potential opportunity exists?

11. How much strategic sourcing opportunity exists?

12. What opportunities overlap?

13. What is the consolidated potential savings?

14. What has been realized?

15. What actions should the customer take next?

The application should ultimately convert:

RAW PURCHASE DATA

into:

SPEND INTELLIGENCE

into:

PROCUREMENT OPPORTUNITIES

into:

MARKET BENCHMARK INTELLIGENCE

into:

POTENTIAL SAVINGS

into:

ACTIONABLE PROCUREMENT TRANSFORMATION.


============================================================
IMPORTANT DEVELOPMENT INSTRUCTION
============================================================

Do NOT start by creating only the visual dashboard.

FIRST build and validate:

1. Database schema
2. Data ingestion
3. UNSPSC mapping
4. PCBI master structure
5. PCBI weekly index structure
6. Constituent engine
7. Benchmarkability calculation
8. Expected price calculation
9. Opportunity calculation
10. Savings de-duplication

THEN build the dashboards and visualizations on top of the validated calculation engine.

The calculation engine is the core intellectual property of this product.

All calculations must be deterministic, testable and auditable.

Create automated unit tests for the major formulas before connecting the final dashboard.

Use the following test case:

Baseline purchase:
₹150

Baseline PCBI Index:
105

Current PCBI Index:
110

Current actual purchase:
₹180

Quantity:
10,000

Benchmarkability:
70%

Expected benchmark:

₹150 × (110 / 105) = ₹157.14

Price gap:

₹180 - ₹157.14 = ₹22.86

Gross opportunity:

₹22.86 × 10,000 = ₹228,600

PCBI potential opportunity:

₹228,600 × 70% = ₹160,020

The software must reproduce this calculation correctly.

Finally, create the application so that the PCBI master, UNSPSC master, weekly benchmark data and constituent database can be updated without changing application code.

The result must be a scalable Procucev Procurement Intelligence SaaS platform, not a static consulting spreadsheet application.

---

## Prompt 101
run locally on chrome

---

## Prompt 102
Create a temporary login here and also show the admin page while we develop the application

---

## Prompt 103
BUILD THE PCBI MASTER UPLOAD INTERFACE BEFORE IMPORTING ANY PCBI FILE.

Create an ADMIN section:

ADMIN
  └── PCBI MASTER
       ├── PCBI Dashboard
       ├── Upload PCBI Master
       ├── Validate
       ├── Preview
       ├── Import
       ├── Version History
       └── Published Versions

Create a clearly visible button:

"+ Upload PCBI Master"

The upload should accept:

.xlsx
.csv

When the user selects a file, DO NOT immediately insert it into the production database.

Create this workflow:

UPLOAD
↓
FILE VALIDATION
↓
WORKSHEET DETECTION
↓
COLUMN MAPPING
↓
DATA QUALITY CHECK
↓
PREVIEW
↓
IMPORT
↓
VERSION CREATION
↓
PUBLISH

==================================================
UPLOAD SCREEN
==================================================

Display:

PCBI Master Upload

Upload your Procucev Benchmark Index master file.

Supported formats:
Excel (.xlsx)
CSV (.csv)

Button:

+ Upload PCBI Master

After upload show:

File Name
File Size
Upload Date
Uploaded By
Number of Worksheets
Number of Records

==================================================
WORKSHEET DETECTION
==================================================

For Excel files automatically identify worksheets.

Expected logical datasets may include:

PCBI Master
PCBI Weekly Index
PCBI Constituents
PCBI Sources
PCBI UNSPSC Mapping

Do not assume exact worksheet names.

Identify worksheets based on headers and content.

Show each detected worksheet and its detected purpose.

Example:

Worksheet              Detected As
PCBI_Master             Benchmark Master
Weekly_Index            Weekly Index
Constituents            Constituent Database
Sources                 Benchmark Sources

Allow administrator to override the detected worksheet type.

==================================================
COLUMN MAPPING
==================================================

Automatically map columns.

Show:

Excel Column
Mapped Database Field
Confidence
Status

Allow manual correction.

Do not import until required fields are mapped.

==================================================
VALIDATION
==================================================

Validate:

PCBI ID
Benchmark Category
Benchmark Name
UNSPSC
Quality
Benchmarkability %
Date
Index Value
Constituent Weight %
Currency
Unit
Source

Check:

Missing values
Duplicate PCBI IDs
Duplicate weekly index records
Invalid dates
Invalid index values
Invalid percentages
Constituent weights
Missing sources
Missing UNSPSC
Duplicate mappings

Do not silently correct data.

==================================================
PREVIEW
==================================================

Before import show:

Total PCBI Records
Total Weekly Index Records
Total Constituent Records
Total UNSPSC Mapping Records

A Quality
B Quality
C Quality

Total Benchmarkable %

Date Range

Warnings
Errors

Show the first 50 records from each dataset.

==================================================
IMPORT
==================================================

Only enable:

IMPORT

when there are no blocking errors.

Warnings may be imported but must be clearly recorded.

Import the data into:

PCBI_Master
PCBI_Weekly_Index
PCBI_Constituents
Benchmark_Sources
PCBI_UNSPSC_Mapping

==================================================
VERSION CONTROL
==================================================

When importing a new master create a new version.

Example:

PCBI V1.0
PCBI V1.1
PCBI V2.0

Never overwrite a previously published PCBI version.

Store:

Version
Upload ID
File Name
Upload Date
Uploaded By
Effective Date
Status

Statuses:

DRAFT
VALIDATED
PUBLISHED
ARCHIVED

Only one version should be the active PUBLISHED version unless the architecture explicitly supports effective-date versioning.

==================================================
PUBLISH
==================================================

After successful import show:

"PUBLISH PCBI VERSION"

Before publishing display a summary:

PCBI Version
Number of Benchmarks
Weekly Records
Constituent Records
UNSPSC Mappings
Benchmark Coverage
Quality Distribution
Date Range

Require administrator confirmation.

After publishing, make the PCBI version available to:

MODULE 3 — PCBI BENCHMARK & TREND ANALYSIS

==================================================
IMPORTANT
==================================================

PCBI Master data is system-level reference data.

Customer purchase-history data must NOT be uploaded here.

Customer purchase history must continue to use:

MODULE 1 — DATA UPLOAD

==================================================
TEST REQUIREMENT
==================================================

For the first test, use:

PCBI_GLOBAL_MASTER_V1_2020_2026.xlsx

Upload it through the new:

ADMIN → PCBI MASTER → UPLOAD PCBI MASTER

interface.

Do not hard-code this file into the application.

The objective is to test the complete real-world upload workflow.

After the import, show an Import Summary page with:

SUCCESSFUL RECORDS
WARNING RECORDS
ERROR RECORDS
PCBI RECORDS
WEEKLY INDEX RECORDS
CONSTITUENT RECORDS
UNSPSC MAPPING RECORDS

Also provide:

Download Validation Report
Download Error Records
View Imported PCBI Master

Do not proceed to customer purchase-history testing until this PCBI Master upload workflow is working.

## Prompt 104

IMPORTANT: STOP THE CURRENT PCBI IMPORT.

The validation screen shows:

Total Evaluated Records: 96,063
Valid Records: 95,939
Warnings: 95,773
Blocking Errors: 124

Do NOT import or publish the PCBI master yet.

The current validation logic needs to be corrected before we proceed.

==================================================
1. DO NOT DEFAULT MISSING DATA
==================================================

The current validator is showing:

"Quality rating is not A, B, or C. Defaulting to B."

THIS IS INCORRECT.

Never automatically default:

Quality Rating
Benchmarkability %
PCBI ID
Benchmark Source
UNSPSC
Index Value
Constituent Weight

If a value is missing, retain the original blank value and classify it as:

MISSING_DATA

Do not invent or default a value.

Remove all automatic "defaulting to B" behavior.

==================================================
2. VALIDATE EACH WORKSHEET ACCORDING TO ITS PURPOSE
==================================================

Do NOT apply PCBI_MASTER validation rules to every worksheet.

First identify the dataset type.

Possible dataset types:

PCBI_MASTER
PCBI_WEEKLY_INDEX
PCBI_CONSTITUENTS
BENCHMARK_SOURCES
PCBI_UNSPSC_MAPPING

Each dataset has different mandatory fields.

--------------------------------------------------
PCBI_MASTER
--------------------------------------------------

Mandatory:

PCBI_ID
Benchmark Name
Benchmark Type

Recommended:

PCBI Category
PCBI Subcategory
Quality Rating
Benchmarkability %
Source
Currency
Unit
Geography
Methodology

Quality and Benchmarkability may legitimately be blank if the benchmark requires consultant review.

--------------------------------------------------
PCBI_WEEKLY_INDEX
--------------------------------------------------

Mandatory:

PCBI_ID
Index Date
Index Value

Do NOT require:

Quality Rating
Benchmarkability %
Constituent Weight

because these are not necessarily attributes of every weekly index row.

--------------------------------------------------
PCBI_CONSTITUENTS
--------------------------------------------------

Mandatory:

PCBI_ID
Constituent Name
Constituent Weight %

Do NOT require:

Weekly Index Value

--------------------------------------------------
BENCHMARK_SOURCES
--------------------------------------------------

Mandatory:

PCBI_ID
Source

Optional:

Source URL
Geography
Currency
Unit

--------------------------------------------------
PCBI_UNSPSC_MAPPING
--------------------------------------------------

Mandatory:

PCBI_ID
UNSPSC Code OR UNSPSC Commodity/Class

Do not require weekly index values here.

==================================================
3. FIX PCBI ID DUPLICATE VALIDATION
==================================================

The current system is showing:

DUPLICATE_PCBI_ID
"ALUMINIUM"

Do not assume that every repeated benchmark name means the record is invalid.

First determine whether the PCBI_ID is being used as:

A. Benchmark category/name
OR
B. Unique benchmark definition identifier

For the database, PCBI_ID must be a unique technical identifier.

If the source file contains repeated names such as:

ALUMINIUM

but they represent different benchmark definitions, create a stable unique technical ID.

For example:

ALUMINIUM
ALUMINIUM_01
ALUMINIUM_02

OR preferably:

PCBI-ALU-001
PCBI-ALU-002

However:

DO NOT invent IDs blindly.

First inspect the differentiating fields:

Benchmark Name
Benchmark Type
Grade
Specification
Source
Geography
Unit
Currency
UNSPSC
Effective Date

If two rows are genuinely identical benchmark definitions, classify as:

DUPLICATE_RECORD

If they are different benchmark definitions, allow them as separate PCBI records with unique technical IDs.

Preserve the original benchmark name.

==================================================
4. SEPARATE DISPLAY NAME FROM TECHNICAL PCBI ID
==================================================

Create two fields:

PCBI_ID
PCBI_NAME

Example:

PCBI_ID:
PCBI-ALU-001

PCBI_NAME:
Aluminium

This is important.

"Aluminium" should not necessarily be the unique database key.

==================================================
5. DO NOT TREAT WARNINGS AS DATA ERRORS
==================================================

The current screen shows 95,773 warnings.

This is too broad.

Separate validation results into:

BLOCKING ERRORS
WARNINGS
INFORMATION

Examples:

BLOCKING ERROR:
Missing PCBI_ID in PCBI_MASTER.

WARNING:
Quality rating missing.

WARNING:
Benchmarkability missing.

INFORMATION:
Optional source URL unavailable.

Do not classify optional fields as blocking errors.

==================================================
6. BENCHMARK QUALITY
==================================================

Allowed values:

A
B
C

But missing quality must remain:

NULL / MISSING

Do not convert missing quality to:

A
B
C

The consultant/admin can later assign the quality.

==================================================
7. BENCHMARKABILITY %
==================================================

If populated:

must be numeric
must be between 0 and 100

If blank:

status = MISSING_DATA

Do not automatically set it to:

0
100
70
or any other value.

==================================================
8. CONSTITUENT WEIGHTS
==================================================

For each PCBI_ID, calculate:

SUM(constituent_weight)

If the total equals 100%:

PASS

If not:

WARNING — CONSTITUENT_TOTAL_NOT_100

Do NOT automatically normalize the weights.

Show:

PCBI ID
Constituent Total
Difference from 100%
Status

Example:

ALUMINIUM
Total = 100%
PASS

BEARING
Total = 70%
WARNING
Requires Review

==================================================
9. WEEKLY INDEX VALIDATION
==================================================

For PCBI_WEEKLY_INDEX:

Required:

PCBI_ID
Index Date
Index Value

Index Value must be numeric.

Do not require Quality Rating or Benchmarkability on every weekly row.

Check for:

Duplicate PCBI_ID + Index Date + PCBI Version

If duplicate:

BLOCKING ERROR only if the records are genuinely identical/conflicting.

If the same benchmark has multiple sources, allow them only if the data model explicitly distinguishes the source.

==================================================
10. DATE VALIDATION
==================================================

The initial PCBI historical period is:

01-Apr-2020
through
31-Jul-2026

Do not reject records merely because they fall outside this range.

Instead:

Before 01-Apr-2020:
WARNING — OUTSIDE_INITIAL_PERIOD

After 31-Jul-2026:
WARNING — FUTURE_OR_EXTENDED_PERIOD

The system must support future uploads.

==================================================
11. IMPORTANT — DO NOT MODIFY THE SOURCE FILE
==================================================

Do not silently modify the uploaded Excel.

Do not:

delete rows
change values
change index values
change quality
change benchmarkability
change constituent weights

Only create a normalized internal representation after validation.

Keep the original uploaded file available for audit.

==================================================
12. CREATE A BETTER VALIDATION SUMMARY
==================================================

Replace the current summary with:

TOTAL RECORDS
VALID RECORDS
BLOCKING ERRORS
WARNINGS
INFORMATION

Then separately show:

PCBI MASTER RECORDS
WEEKLY INDEX RECORDS
CONSTITUENT RECORDS
SOURCE RECORDS
UNSPSC MAPPING RECORDS

Also show:

Unique PCBI IDs
Duplicate Technical IDs
Missing Quality
Missing Benchmarkability
Missing Source
Missing UNSPSC
Invalid Index Values
Duplicate Weekly Records
Constituent Weight Issues

==================================================
13. MOST IMPORTANT
==================================================

Do not import the file until:

BLOCKING ERRORS = 0

Warnings can remain.

Warnings must not prevent import.

However, any record containing a blocking error must remain excluded from the published PCBI version until corrected.

==================================================
14. PREVIEW
==================================================

After correcting the validation logic, regenerate the validation screen.

The administrator must be able to click:

ALL
ERRORS
WARNINGS
INFORMATION

For every issue show:

Dataset
Row
Column
Original Value
Validation Rule
Severity
Recommended Action

==================================================
15. FINAL IMPORT RULE
==================================================

Only after:

Blocking Errors = 0

enable:

IMPORT

After import:

create PCBI Version
retain original upload
create audit record
allow Preview
allow Publish

Do NOT publish automatically.

==================================================
16. DO NOT HARD-CODE THE CURRENT FILE
==================================================

The objective is to create a reusable PCBI upload engine.

Future files may contain:

different sectors
different benchmark categories
new PCBI IDs
new weekly dates
new sources
new constituents
new UNSPSC mappings

The upload engine must accommodate them without code changes.

FIRST fix the validation engine.

THEN re-run validation on the currently uploaded PCBI_GLOBAL_MASTER_V1_2020_2026.xlsx.

DO NOT import or publish until the corrected validation results are displayed.

---

## Prompt 146

PROCEED WITH THE IMPORT.

Before committing, perform one final pre-import confirmation:

1. Blocking Errors = 0
2. Valid Records = 96,357
3. Warnings = 290
4. Do not modify any source values.
5. Do not auto-default any missing Quality Rating or Benchmarkability.
6. Preserve all warnings in the audit trail.
7. Preserve the original uploaded Excel file.
8. Import the validated data into the appropriate PCBI datasets:
   - PCBI_Master
   - PCBI_Weekly_Index
   - PCBI_Constituents
   - Benchmark_Sources
   - PCBI_UNSPSC_Mapping
9. Create PCBI Version = V1.0.
10. Do NOT automatically publish it.
11. After import, show the complete Import Summary.

The Import Summary must show:

- PCBI Master Records Imported
- Weekly Index Records Imported
- Constituent Records Imported
- Source Records Imported
- UNSPSC Mapping Records Imported
- Warnings Retained
- Records Excluded, if any
- PCBI Version
- Upload ID
- Import Date
- Import Status

Then show two buttons:

[View Imported PCBI Master]

[Publish PCBI V1.0]

DO NOT PUBLISH AUTOMATICALLY.

Stop after successful import and show me the Import Summary so I can review it before publishing.

---

## Prompt 147

continue

---

## Prompt 148

DO NOT PUBLISH PCBI V1.0 YET.

The PCBI master has been imported and validated with:

PCBI Master Records: 290
Weekly Index Records: 95,700
Constituent Records: 290
Source Records: 4
UNSPSC Mapping Records: 73
Total Records: 96,357
Warnings: 290
Excluded: 0
Version: V1.0
Status: VALIDATED

The record counts reconcile correctly.

Before publishing, perform one final PCBI MASTER QUALITY REVIEW.

==================================================
1. SHOW ALL 290 WARNINGS
==================================================

Create a warning summary grouped by:

Warning Type
Dataset
Field
Count

For example:

Missing Quality Rating
Missing Benchmarkability
Missing Source
Missing UNSPSC
Missing Methodology
Other

Do NOT modify any of these values.

For each warning show:

PCBI ID
PCBI Name
Dataset
Field
Original Value
Warning Reason

==================================================
2. REVIEW PCBI MASTER
==================================================

Show:

Total PCBI IDs = 290

For each PCBI ID display:

PCBI ID
PCBI Name
Category
Subcategory
UNSPSC
Benchmark Type
Quality
Benchmarkability %
Source
Unit
Currency
Methodology
Constituent Count
Weekly Index Count

Allow sorting and filtering.

==================================================
3. REVIEW WEEKLY INDEX
==================================================

Confirm:

Weekly Index Records = 95,700

Show:

Minimum Index Date
Maximum Index Date
Unique PCBI IDs
Average Weekly Records per PCBI
Missing Weeks
Duplicate PCBI ID + Date combinations
Invalid Index Values

For each PCBI ID calculate:

First Index
Last Index
Minimum Index
Maximum Index

Do not change any index values.

==================================================
4. VERIFY THE HISTORICAL DATE RANGE
==================================================

The intended historical period is:

01-Apr-2020 to 31-Jul-2026

Show the actual minimum and maximum dates found.

Also identify any gaps in weekly data.

Do not automatically fill missing weeks.

==================================================
5. REVIEW CONSTITUENTS
==================================================

Confirm:

Constituent Records = 290

For each PCBI ID show:

PCBI ID
Number of Constituents
Total Constituent Weight %
Benchmarkable Constituent %
Quality

Flag any PCBI where constituent weights do not total 100%.

Do not normalize weights automatically.

==================================================
6. REVIEW UNSPSC MAPPINGS
==================================================

Confirm:

UNSPSC Mapping Records = 73

Explain exactly what these 73 records represent.

Show:

PCBI ID
UNSPSC Code
UNSPSC Class
UNSPSC Commodity
Mapping Level

Also show:

Number of PCBI IDs with UNSPSC mapping
Number without UNSPSC mapping

IMPORTANT:

Do not assume that 73 mapping records means only 73 benchmark categories exist.

Explain the relationship between the 290 PCBI Master records and the 73 UNSPSC mappings.

==================================================
7. REVIEW SOURCES
==================================================

Confirm:

Source Records = 4

Show:

Source Name
Source URL
Number of PCBI IDs using Source
Number of Weekly Index Records using Source
Geography
Currency
Frequency

==================================================
8. CREATE PCBI COVERAGE SUMMARY
==================================================

Display:

Total PCBI Categories
Total PCBI IDs
PCBI IDs with Weekly Data
PCBI IDs with Constituent Data
PCBI IDs with UNSPSC Mapping
PCBI IDs without UNSPSC Mapping
A Quality
B Quality
C Quality
Missing Quality
Average Benchmarkability %
Minimum Benchmarkability %
Maximum Benchmarkability %

==================================================
9. IMPORTANT — DO NOT CREATE ANY NEW DATA
==================================================

Do not:

invent values
default values
change index values
change constituent weights
create missing weekly values
invent UNSPSC mappings
invent sources
change benchmarkability
change quality ratings

This is a validation/reconciliation exercise only.

==================================================
10. FINAL PUBLISH DECISION
==================================================

After displaying the above review, show:

PCBI V1.0 — READY FOR PUBLISH

or

PCBI V1.0 — REQUIRES REVIEW

Do NOT publish automatically.

I want to review the warning summary and PCBI coverage summary first.

---

## Prompt 149

PUBLISH PCBI V1.0.

The PCBI V1.0 quality review is complete and shows:

290 technical PCBI IDs
186 PCBI categories
290/290 PCBI IDs with weekly data
290/290 PCBI IDs with constituent cost-driver data
95,700 weekly index records
330 weeks
0 blocking errors
0 missing quality ratings
0 missing benchmarkability values
0 fabricated values
0 fabricated mappings
0 fabricated sources
0 missing weeks created

Publish the validated PCBI V1.0 as the active PCBI benchmark master.

IMPORTANT:

1. Preserve the original uploaded source file.
2. Preserve Upload ID and audit trail.
3. Lock PCBI V1.0 after publishing.
4. Do not modify historical index values.
5. Do not modify constituent weights.
6. Do not modify benchmarkability percentages.
7. Do not modify quality ratings.
8. Do not modify UNSPSC mappings.
9. Do not overwrite V1.0 when future PCBI versions are uploaded.
10. Future versions must be created as separate versions.

Set:

Version = PCBI V1.0
Status = PUBLISHED
Active = YES

Then make PCBI V1.0 available to:

MODULE 3 — PCBI BENCHMARK & TREND ANALYSIS

Do NOT yet run customer purchase analysis.

After publishing, display:

PCBI Version
Publication Date
Total PCBI IDs
Total Categories
Weekly Index Records
Constituent Records
UNSPSC Mapping Records
Quality Distribution
Benchmarkability Distribution
Active Status

Then stop.

---

## Prompt 150

RUN A FULL MODULE 1 AND MODULE 2 CERTIFICATION TEST.

DO NOT CONNECT MODULE 3 OR PCBI YET.

The objective is to certify that Module 1 and Module 2 are production-ready before any customer purchase history is passed into PCBI Benchmark Analysis.

==================================================
ARCHITECTURE
==================================================

MODULE 1
DATA INGESTION + SPEND INTELLIGENCE

MODULE 2
AI CATEGORIZATION + UNSPSC + STRATEGIC SOURCING

MODULE 3
PCBI BENCHMARKING

MODULE 4
SAVINGS ENGINE

For this test, Modules 1 and 2 must be validated independently.

==================================================
MODULE 1 — DATA INGESTION
==================================================

Test:

Excel
Multiple worksheets
CSV
Different column names
Blank rows
Blank columns
Duplicate headers
Different date formats
INR
USD
EUR
Missing quantity
Missing price
Missing vendor
Missing description
Zero values
Negative values
Duplicate transactions

Do not silently delete or modify input rows.

Every source transaction must retain:

Source File
Worksheet
Original Row Number
Transaction ID

==================================================
SPEND CALCULATION
==================================================

Validate:

Quantity
Unit Price
Total Value
Currency
Unit of Measure

Where applicable:

Spend = Quantity × Unit Price

If Total Value is supplied, preserve the original value.

Show:

Original Value
Currency
FX Rate
Normalized INR Value

Do not silently overwrite the original value.

==================================================
CURRENCY
==================================================

Show:

Original Currency
Original Spend
FX Rate
INR Spend

Make FX source and date auditable.

==================================================
DUPLICATES
==================================================

Detect:

Exact duplicates
Potential duplicates
Same PO + Vendor + Item
Same invoice
Same transaction ID

Do not automatically delete potential duplicates.

==================================================
VENDOR NORMALIZATION
==================================================

Create:

Original Vendor
Normalized Vendor
Vendor Master ID

Do not overwrite original vendor names.

Flag possible duplicate vendors.

==================================================
MATERIAL NORMALIZATION
==================================================

Create:

Original Short Text
Normalized Material Description
Material Master ID

Preserve the original description.

==================================================
MODULE 1 CLASSIFICATION
==================================================

Every addressable transaction must be classified into:

Direct Materials
MRO
Packing Materials
Indirect Materials
Service
Other / Unmapped

Show both:

Transaction Count
Spend

All spend must reconcile.

==================================================
MODULE 1 DASHBOARD
==================================================

Show:

Total Transactions
Total Spend
Unique Vendors
Unique Items
Plants
Material Groups

Spend by:

Year
Month
Vendor
Item
Plant
Material Group
Direct/MRO/Packing/Indirect/Service

Pareto:

Top Vendors
Top Items
Top Categories

Use cumulative SPEND for Pareto.

==================================================
MODULE 1 RECONCILIATION
==================================================

Create a reconciliation:

Raw Input Spend
Processed Spend
Categorized Spend
Service Spend
Unmapped Spend
Excluded Spend

The system must explain every difference.

No unexplained spend leakage is acceptable.

==================================================
MODULE 2 — UNSPSC
==================================================

For every material transaction:

Short Text
→ Normalized Description
→ UNSPSC Segment
→ UNSPSC Family
→ UNSPSC Class
→ UNSPSC Commodity

Use Commodity where sufficiently reliable.

Use Class where Commodity is not sufficiently reliable.

Store:

Mapping Level
Mapping Confidence
Mapping Method
UNSPSC Code

==================================================
100% MATERIAL DISPOSITION
==================================================

Every material must end as:

MAPPED

SERVICE

UNMAPPED — REVIEW REQUIRED

No silent "uncategorized" records.

Services must not enter PCBI benchmarking.

Unmapped materials must remain visible for review.

==================================================
AI + HUMAN OVERRIDE
==================================================

Store:

AI Classification
AI UNSPSC
AI Confidence

and separately:

Final Classification
Final UNSPSC
Override Flag
Override Reason
Reviewed By
Review Date

Never overwrite AI results when a human changes them.

==================================================
PCBI CATEGORY
==================================================

Map UNSPSC to:

PCBI Category
PCBI Subcategory

Do NOT perform PCBI price/index calculations yet.

This is only a mapping validation.

==================================================
SECOND LEVEL ITEM DECOMPOSITION
==================================================

Where applicable identify:

Item
Constituent
Constituent Weight %
Benchmarkable Constituent

Do not invent constituent weights.

If unavailable:

mark:

DECOMPOSITION NOT AVAILABLE

==================================================
STRATEGIC SOURCING
==================================================

Identify potential opportunities for:

Vendor Consolidation
PO Consolidation
Competitive Bidding
E-Auction Candidate
Specification Rationalization
Strategic Sourcing

Do not automatically claim savings.

Show:

Opportunity Type
Category
Spend
Supporting Evidence
Number of Vendors
Transaction Frequency
Potential Reason

==================================================
MODULE 2 RECONCILIATION
==================================================

Create:

Total Material Spend

=

Mapped Spend
+
Service Spend
+
Unmapped / Review Spend

Also show:

UNSPSC Coverage %
PCBI Category Mapping %
Mapped Spend %
Unmapped Spend %

All percentages must be SPEND-WEIGHTED.

==================================================
GOLDEN TEST
==================================================

Create an internal controlled test set covering:

1. INR purchase
2. USD purchase
3. EUR purchase
4. Duplicate
5. Missing vendor
6. Missing quantity
7. Missing price
8. Service
9. Bearing
10. Lubricant
11. Steel
12. Chemical
13. Packaging
14. Electrical
15. PU material
16. Vendor name variation
17. Material description variation
18. Commodity mapping
19. Class mapping
20. Unmapped item
21. Multi-constituent item
22. Zero quantity
23. Negative transaction
24. Credit note
25. Very small transaction
26. High-value transaction

For each test case define:

INPUT
EXPECTED RESULT
ACTUAL RESULT
PASS/FAIL

==================================================
DATA INTEGRITY
==================================================

Confirm:

No source row silently deleted
No source value silently modified
No duplicate silently deleted
No currency silently converted without audit trail
No UNSPSC invented
No constituent percentage invented
No service benchmarked
No unmapped item hidden

==================================================
FINAL CERTIFICATION DASHBOARD
==================================================

Create:

MODULE 1 CERTIFICATION

Data ingestion                 PASS/FAIL
Spend calculation              PASS/FAIL
Currency handling              PASS/FAIL
Duplicate handling             PASS/FAIL
Vendor normalization           PASS/FAIL
Material normalization         PASS/FAIL
Spend classification           PASS/FAIL
Pareto analysis                PASS/FAIL
Spend reconciliation            PASS/FAIL

MODULE 2 CERTIFICATION

UNSPSC mapping                 PASS/FAIL
Commodity mapping              PASS/FAIL
Class fallback                 PASS/FAIL
Service exclusion              PASS/FAIL
Unmapped handling              PASS/FAIL
AI confidence                  PASS/FAIL
Human override                 PASS/FAIL
PCBI category mapping          PASS/FAIL
Item decomposition             PASS/FAIL
Vendor consolidation           PASS/FAIL
PO consolidation               PASS/FAIL
E-auction identification       PASS/FAIL
Strategic sourcing             PASS/FAIL
Spend reconciliation            PASS/FAIL

==================================================
GO / NO-GO
==================================================

Set:

MODULE 1 = CERTIFIED / NOT CERTIFIED
MODULE 2 = CERTIFIED / NOT CERTIFIED

Do not allow Module 3 PCBI processing unless:

Module 1 = CERTIFIED
AND
Module 2 = CERTIFIED

If any critical test fails, show:

FAIL
Root Cause
Affected Records
Recommended Fix
Retest Required

Do not proceed to Module 3 until all critical tests pass.

---

## Prompt 151

Run Modules 1 and 2 only. PCBI Module 3 must remain disconnected. Generate the complete real-data validation report and stop before PCBI benchmarking.

---

## Prompt 152

STOP THE REAL-DATA PIPELINE BEFORE MODULE 2.

DO NOT CONNECT MODULE 3.
DO NOT RUN ANY PCBI BENCHMARK CALCULATION.
DO NOT MODIFY THE SOURCE FILE.
DO NOT MODIFY PCBI V1.0.

We have detected a potential source-to-Module-1 spend reconciliation issue.

Perform a FULL READ-ONLY DATA RECONCILIATION of the currently uploaded customer purchase-history file.

==================================================
SOURCE FILE RECONCILIATION
==================================================

Read the uploaded workbook completely.

Report:

1. Source filename
2. Number of worksheets
3. Number of data rows per worksheet
4. Total data rows across all worksheets
5. Minimum Document Date
6. Maximum Document Date
7. Currency distribution
8. Sum of "Total INR"
9. Sum of "Total in Crs"
10. Count of rows with blank Total INR
11. Count of rows with zero Total INR
12. Count of rows with negative Total INR
13. Count of rows with Deletion Indicator = blank
14. Count/value of Deletion Indicator = S
15. Count/value of Deletion Indicator = L
16. Count/value of all other deletion indicators

==================================================
CRITICAL SPEND TEST
==================================================

Calculate independently from the source:

SOURCE_TOTAL_INR =
SUM(all valid numeric values in "Total INR")

SOURCE_TOTAL_CRORE =
SOURCE_TOTAL_INR / 10,000,000

Do NOT apply any business filters for this calculation.

Then compare:

SOURCE_TOTAL_INR
vs
MODULE_1_TOTAL_CUSTOMER_SPEND

Show:

Absolute Difference
Percentage Difference

==================================================
ROW RECONCILIATION
==================================================

Compare:

Source Row Count
vs
Module 1 Imported Row Count
vs
Module 1 Evaluated Row Count

Show any rows excluded.

For every excluded row, show:

Original Sheet
Original Row Number
Reason for Exclusion
Original Total INR

There must be no silent exclusion.

==================================================
FILTER AUDIT
==================================================

Identify every filter currently applied by Module 1.

Specifically check whether Module 1 is filtering by:

Date
Purchasing Document Type
Purchasing Document Category
Item Category
Account Assignment
Deletion Indicator
Material
Material Group
Plant
Supplier
Currency
Spend threshold
Transaction status
Any hidden UI filter
Any default date range
Any default supplier/category filter

Report each filter as:

FILTER NAME
VALUE
ACTIVE / INACTIVE
REASON

Do NOT change any filter automatically.

==================================================
SPEND CALCULATION AUDIT
==================================================

Check whether Module 1 is calculating customer spend from:

Total INR

or

Order Quantity × Net Price / Price Unit

or

another field.

Report the exact formula being used.

Because the source file already contains "Total INR", determine whether Module 1 is unintentionally recalculating spend from another field.

==================================================
DUPLICATE HANDLING AUDIT
==================================================

Determine whether duplicate transactions are being removed before calculating total spend.

DO NOT delete anything.

Report:

Raw rows
Potential duplicate rows
Exact duplicate rows
Spend associated with duplicates

Duplicates must remain auditable unless the user explicitly approves exclusion.

==================================================
DELETION HANDLING
==================================================

Calculate separately:

Total spend including all rows

Total spend excluding Deletion Indicator = S

Total spend excluding Deletion Indicator = L

Total spend excluding both S and L

Do not assume any of these should be the official customer spend.

Show all four figures.

==================================================
MODULE 1 CURRENT RESULT
==================================================

Show exactly how the current:

₹8,63,17,055

was calculated.

Provide a mathematical reconciliation such as:

Source Total
- Filter A
- Filter B
- Filter C
- Exclusions
+/- Adjustments
= Module 1 Total

If the system cannot explain the difference exactly, mark:

MODULE 1 REAL-DATA RECONCILIATION = FAILED

==================================================
IMPORTANT
==================================================

Do NOT declare Module 1 production-certified for this real dataset until:

SOURCE_TOTAL
=
PROCESSED_TOTAL
+
EXPLICITLY DOCUMENTED EXCLUSIONS

There must be zero unexplained spend variance.

Do NOT proceed to Module 2.

Do NOT connect Module 3.

Do NOT modify PCBI.

Return only the diagnostic reconciliation report and stop.

---

## Prompt 153

CRITICAL DATASET RESET AND REAL-DATA RECONCILIATION.

DO NOT RUN MODULE 2.
DO NOT CONNECT MODULE 3.
DO NOT RUN PCBI.
DO NOT MODIFY PCBI V1.0.

The previous reconciliation identified a dataset misalignment and the audit report also referenced an unrelated historical sample file. We must correct this before any Module 1 ingestion.

==================================================
AUTHORITATIVE DATASET RULE
==================================================

The customer purchase-history file uploaded through the CURRENT MODULE 1 UI SESSION is the ONLY authoritative input.

Do NOT use:

C:\Users\srini\Desktop\Consulting Testing Datas\3 years analysis data.xlsx

Do NOT use:

Purchase_History_Multi_Currency_Sample.xlsx

Do NOT use any previous test dataset, cached dataset, sample dataset, fixture, mock data, or previous upload.

Do NOT combine files.

Do NOT reuse the previous ₹8,63,17,055 result.

The current UI-uploaded customer file must be identified by:

Filename
Upload ID
Worksheet
Row count
File hash/checksum if available

Display these before ingestion.

==================================================
SOURCE FILE CONFIRMATION
==================================================

Before processing, show:

CURRENT UI UPLOAD:
Filename:
Upload ID:
Worksheet(s):
Total source rows:
Date range:
Primary spend column:
Currency:

Require the ingestion target to exactly match the current UI upload.

If the current UI upload cannot be identified unambiguously:

STOP.

Do not process any file.

==================================================
FULL SOURCE RECONCILIATION
==================================================

Read the CURRENT UI-UPLOADED WORKBOOK completely.

Calculate independently from the source:

SOURCE_TOTAL_INR =
SUM of all valid numeric values in Total INR

Also calculate:

SOURCE_ROW_COUNT

SOURCE_TOTAL_INR
SOURCE_TOTAL_CRORE

MIN_DATE
MAX_DATE

Currency distribution

Deletion Indicator distribution

==================================================
DELETION POLICY
==================================================

For this validation run:

DELETION POLICY = INCLUDE ALL

Do NOT exclude S.

Do NOT exclude L.

Do NOT exclude S and L.

Preserve every source record.

However, calculate separate reporting totals for:

1. INCLUDE ALL
2. EXCLUDE S ONLY
3. EXCLUDE L ONLY
4. EXCLUDE BOTH S AND L

Do not select one of these as the official business policy yet.

The purpose is to establish the complete source baseline first.

==================================================
NO SILENT FILTERING
==================================================

Before ingestion, identify every active Module 1 filter.

There must be NO hidden filters.

Check:

Date
Vendor
Plant
Material
Material Group
Deletion Indicator
Document Type
Item Category
Currency
Spend threshold
Transaction status
Any UI filter
Any default filter

Set:

CUSTOMER DATA FILTER = NONE

unless explicitly instructed otherwise.

==================================================
NO DUPLICATE REMOVAL
==================================================

For the baseline reconciliation:

Do NOT remove duplicates.

Do NOT deduplicate automatically.

Report potential/exact duplicates separately.

All source rows remain in the reconciliation baseline.

==================================================
PRIMARY SPEND FIELD
==================================================

Use the customer's existing:

Total INR

as the primary transaction spend field where populated and valid.

Do NOT replace it with:

Quantity × Net Price / Price Unit

unless Total INR is unavailable.

The reconstructed spend calculation should be used as a validation check only.

Report:

Total INR source value
Reconstructed value
Difference

==================================================
REAL-DATA RECONCILIATION
==================================================

Create this exact reconciliation:

SOURCE ROW COUNT
=
MODULE 1 INPUT ROW COUNT

SOURCE TOTAL INR
=
MODULE 1 RAW SPEND

There must be ZERO unexplained difference.

For every excluded row, provide:

Source Row Number
Original Value
Reason
Filter/Rule

If any row or spend is excluded, it must be explicitly listed.

==================================================
CONTAMINATION CHECK
==================================================

Verify that none of the following are used in this run:

Purchase_History_Multi_Currency_Sample.xlsx
TXN-0001
TXN-0002
TXN-0003
Any sample/test transaction
Any previous Module 1 result
₹8,63,17,055
Any cached previous dataset

If any such data is detected:

STOP AND REPORT DATASET CONTAMINATION.

==================================================
MODULE 1 EXECUTION
==================================================

ONLY AFTER THE ABOVE SOURCE RECONCILIATION PASSES:

Run Module 1 against the current UI-uploaded file.

Use:

Deletion Policy = INCLUDE ALL

No other filters.

Then produce:

Total Transactions
Total Spend
Unique Vendors
Unique Materials
Plants
Material Groups
Date Range
Currency Distribution

Spend by:

Direct Materials
MRO
Packing Materials
Indirect Materials
Services
Other / Unmapped

==================================================
FINAL MODULE 1 REAL-DATA AUDIT
==================================================

Show:

Source Rows
Module 1 Rows
Source Spend
Module 1 Spend
Spend Variance
Variance %

Deleted S Rows
Deleted S Spend

Deleted L Rows
Deleted L Spend

Potential Duplicate Rows
Potential Duplicate Spend

Excluded Rows
Excluded Spend

Unmapped Rows
Unmapped Spend

Service Rows
Service Spend

==================================================
CERTIFICATION RULE
==================================================

Do NOT mark Module 1 as CERTIFIED unless:

Source Rows = Module 1 Rows

AND

Source Spend = Module 1 Spend

AND

Spend Variance = 0

OR every variance is explicitly documented and approved.

The previous Module 1 certification was based on a misaligned dataset and must NOT be reused for this customer file.

Set:

REAL-DATA MODULE 1 STATUS =
CERTIFIED

only if the current dataset passes.

Otherwise:

REAL-DATA MODULE 1 STATUS =
FAILED

==================================================
STOP CONDITION
==================================================

After Module 1 reconciliation:

STOP.

Do NOT run Module 2.

Do NOT connect Module 3.

Do NOT modify PCBI V1.0.

Return the complete reconciliation report only.

---

## Prompt 154
AUTHORITATIVE CUSTOMER WORKBOOK CONFIRMATION

The authoritative customer purchase-history workbook for this Module 1 real-data test is:

FILENAME:
2 years data(1).xlsx

This is the workbook uploaded through the CURRENT Module 1 browser UI session.

Use ONLY this current UI upload.

DO NOT use:
- 3 years analysis data.xlsx
- Purchase_History_Multi_Currency_Sample.xlsx
- Any previous upload
- Any cached dataset
- Any sample/test dataset
- Any fixture/mock data

==================================================
BIND CURRENT UPLOAD
==================================================

Bind the Module 1 ingestion worker directly to:

2 years data(1).xlsx

First display:

Filename
Upload ID
SHA-256 checksum
Worksheet names
Rows per worksheet
Total source rows

Do NOT run Module 1 yet.

==================================================
SOURCE BASELINE
==================================================

Before ingestion calculate directly from this workbook:

Total source rows
Minimum date
Maximum date
Currency distribution
Deletion Indicator distribution

Primary spend field:

Total INR

Calculate:

SOURCE_TOTAL_INR
SOURCE_TOTAL_CRORE

Do not filter, deduplicate, exclude, or transform any records for this baseline.

==================================================
REQUIRED RECONCILIATION
==================================================

Show:

SOURCE ROW COUNT
SOURCE TOTAL INR

These become the immutable baseline for Module 1.

Then confirm:

SOURCE ROW COUNT = MODULE 1 INPUT ROW COUNT

and later:

SOURCE TOTAL INR = MODULE 1 RAW SPEND

No unexplained difference is permitted.

==================================================
DELETION POLICY
==================================================

For the first baseline run:

DELETION POLICY = INCLUDE ALL

Do not exclude S.
Do not exclude L.

However, separately calculate the spend and row count for:

Include All
Exclude S
Exclude L
Exclude S + L

Do not make a business decision about deletion records yet.

==================================================
FILTER POLICY
==================================================

Module 1 must initially run with:

NO DATE FILTER
NO VENDOR FILTER
NO MATERIAL FILTER
NO PLANT FILTER
NO SPEND THRESHOLD
NO CURRENCY FILTER
NO DOCUMENT TYPE FILTER
NO ITEM CATEGORY FILTER
NO HIDDEN FILTER

The complete current UI-uploaded workbook is the baseline.

==================================================
IMPORTANT
==================================================

Do NOT run Module 2.

Do NOT connect Module 3.

Do NOT run PCBI.

Do NOT modify PCBI V1.0.

Do NOT modify the source workbook.

If the file cannot be found by the exact filename above, STOP and report:

FILE NOT FOUND / FILE BINDING FAILED

Do not substitute another file.

==================================================
OUTPUT
==================================================

Return only:

1. Authoritative filename
2. Upload ID
3. SHA-256
4. Worksheet names
5. Source row count
6. Source Total INR
7. Date range
8. Deletion Indicator summary
9. Confirmation that no filters are active
10. Confirmation that no previous/sample dataset is being used

Then STOP and wait for authorization to run Module 1.

---

## Prompt 155
CONFIRMED.

C:\Users\srini\Desktop\Consulting Testing Datas\2 years data.xlsx

is the exact authoritative workbook uploaded as:

2 years data(1).xlsx

Confirm the following:

1. Bind this exact file as the authoritative Module 1 source.
2. Use the displayed SHA-256 checksum as the file identity.
3. Run Module 1 Data Ingestion.
4. DELETION POLICY = INCLUDE ALL.
5. Do not apply any other filters.
6. Do not deduplicate or silently exclude any rows.
7. Use Total INR as the primary spend field.
8. Preserve complete source-to-Module-1 lineage.

After Module 1 ingestion, perform the full real-data reconciliation:

SOURCE ROW COUNT
vs
MODULE 1 INPUT ROW COUNT

SOURCE TOTAL INR
vs
MODULE 1 RAW SPEND

The expected source baseline is:

31,671 rows
₹59,20,34,77,681.71 INR

Any variance must be explicitly explained.

Do NOT run Module 2.
Do NOT connect Module 3.
Do NOT run PCBI benchmarking.
Do NOT modify PCBI V1.0.

Stop after the complete Module 1 reconciliation report and wait for my authorization before Module 2.

---

## Prompt 156
MODULE 1 FINAL FUNCTIONAL AUDIT — DO NOT RUN MODULE 2

Module 1 real-data source reconciliation has passed:

Source Rows = 31,671
Module 1 Input Rows = 31,671

Source Spend = ₹59,20,34,77,681.71
Module 1 Raw Spend = ₹59,20,34,77,681.71

Spend Variance = ₹0.00

Now perform a COMPLETE READ-ONLY FUNCTIONAL AUDIT OF MODULE 1.

Do NOT run Module 2.
Do NOT connect Module 3.
Do NOT run PCBI.
Do NOT modify PCBI V1.0.
Do NOT modify the source workbook.

==================================================
1. SPEND CLASSIFICATION RECONCILIATION
==================================================

Classify and report:

Direct Materials
MRO
Packing Materials
Indirect Materials
Services
Other / Unmapped

For each:

Row Count
Spend
% of Total Spend

The sum of all classifications must equal:

₹59,20,34,77,681.71

If not, report the variance.

==================================================
2. DATE RECONCILIATION
==================================================

Report:

Minimum Date
Maximum Date
Year-wise Spend
Month-wise Spend

The complete date aggregation must reconcile to the certified source spend.

Identify:

Blank dates
Invalid dates
Future dates
Duplicate dates where applicable

Do not silently correct anything.

==================================================
3. CURRENCY RECONCILIATION
==================================================

Report every source currency:

Currency
Transaction Count
Original Currency Spend
INR Converted Spend
Conversion Rate Logic

Reconcile converted INR spend to:

₹59,20,34,77,681.71

Identify missing or invalid currency conversions.

==================================================
4. VENDOR RECONCILIATION
==================================================

Report:

Unique Vendor Count
Vendor-wise transaction count
Vendor-wise spend

Top 20 vendors by spend.

The complete vendor aggregation must reconcile to the certified total.

Do not merge vendors automatically.

Flag possible duplicate/variant vendor names separately.

==================================================
5. MATERIAL RECONCILIATION
==================================================

Report:

Unique Material Count
Material-wise transaction count
Material-wise spend

Top 50 materials by spend.

Do not alter material descriptions.

Flag blank material numbers/descriptions.

==================================================
6. PLANT RECONCILIATION
==================================================

Report:

Unique Plants
Plant-wise transaction count
Plant-wise spend

The plant aggregation must reconcile to the certified total.

Flag blank/invalid plants.

==================================================
7. MATERIAL GROUP RECONCILIATION
==================================================

Report:

Unique Material Groups
Material Group-wise transaction count
Material Group-wise spend

Reconcile to total source spend.

Flag blank/invalid material groups.

==================================================
8. DUPLICATE AUDIT
==================================================

Identify:

Exact duplicate rows
Potential transaction duplicates
Duplicate document/item combinations

Do NOT remove them.

Show:

Row Count
Spend
Duplicate Type

Original source records remain untouched.

==================================================
9. SERVICE AUDIT
==================================================

Identify service transactions.

Report:

Service Row Count
Service Spend
% of Total Spend

Services must remain separately identifiable.

They must NOT be benchmarked by PCBI unless explicitly authorized later.

==================================================
10. DATA QUALITY AUDIT
==================================================

For important fields report:

Blank Count
Invalid Count
Zero Count where relevant

Fields:

Document Date
Material
Material Description
Vendor
Plant
Material Group
Quantity
UOM
Currency
Net Price
Price Unit
Total INR
Deletion Indicator

No silent corrections.

==================================================
11. PARETO / 80% SPEND ANALYSIS
==================================================

Calculate cumulative spend Pareto for:

Materials
Vendors
Material Groups
Plants
Spend Categories

Report the point at which cumulative spend reaches:

50%
70%
80%
90%

For the 80% threshold show:

Number of items
Spend
% of total
Relevant vendors
Relevant categories

==================================================
12. DASHBOARD RECONCILIATION
==================================================

Every Module 1 dashboard KPI must reconcile to the certified baseline.

For every displayed spend KPI provide:

Metric
Displayed Value
Independent Calculation
Variance

There must be ZERO unexplained spend variance.

==================================================
13. MODULE 1 CERTIFICATION
==================================================

Do NOT change the existing source-to-ingestion certification.

Create a separate:

MODULE 1 FUNCTIONAL AUDIT STATUS

PASS only if all material/spend aggregations reconcile.

If any issue exists:

FAIL — [specific issue]

Do not fix automatically.

==================================================
FINAL STOP
==================================================

After producing the audit report:

STOP.

Do NOT run Module 2.

Do NOT connect Module 3.

Do NOT modify PCBI.

Return the complete Module 1 Functional Audit Report.

---

## Prompt 157
AUTHORIZE MODULE 2 — CONTROLLED REAL-DATA VALIDATION

Module 1 has now passed:

SOURCE-TO-MODULE 1 RECONCILIATION = PASS
MODULE 1 FUNCTIONAL AUDIT = PASS

Certified baseline:

Rows = 31,671
Spend = ₹59,20,34,77,681.71
Spend Variance = ₹0

Now authorize MODULE 2 ONLY.

DO NOT CONNECT MODULE 3.
DO NOT RUN PCBI.
DO NOT MODIFY PCBI MASTER V1.0.
DO NOT MODIFY SOURCE DATA.

==================================================
MODULE 2 OBJECTIVE
==================================================

Run AI Categorization + UNSPSC + Strategic Sourcing analysis against the complete certified Module 1 dataset.

Every source transaction must remain traceable.

Required lineage:

SOURCE TRANSACTION
→ MATERIAL / DESCRIPTION
→ UNSPSC
→ UNSPSC SEGMENT
→ UNSPSC FAMILY
→ UNSPSC CLASS
→ UNSPSC COMMODITY
→ SPEND CATEGORY
→ ITEM DECOMPOSITION
→ STRATEGIC SOURCING OPPORTUNITY

==================================================
1. SOURCE RECONCILIATION
==================================================

Before classification confirm:

Module 1 certified rows = 31,671
Module 2 input rows = 31,671

Module 1 certified spend =
₹59,20,34,77,681.71

Module 2 input spend must equal the same amount.

No rows may disappear.

==================================================
2. UNSPSC CLASSIFICATION
==================================================

Use the authoritative UNSPSC master already configured in the application.

For each material transaction attempt:

1. UNSPSC Segment
2. UNSPSC Family
3. UNSPSC Class
4. UNSPSC Commodity

Commodity-level mapping is preferred where sufficient evidence exists.

Where commodity-level mapping is not reliable, use Class-level mapping.

Do NOT invent an UNSPSC code.

Do NOT use a generic code merely to increase coverage.

Every mapping must retain:

Source Material
Material Description
UNSPSC Code
UNSPSC Level
Mapping Confidence
Mapping Method

==================================================
3. ZERO-SILENT-MAPPING RULE
==================================================

Every transaction must receive exactly one status:

MAPPED_COMMODITY
MAPPED_CLASS
MAPPED_SEGMENT_ONLY
UNMAPPED
SERVICE

No transaction may disappear.

If insufficient evidence exists:

UNMAPPED

Do not fabricate a mapping.

==================================================
4. SERVICE IDENTIFICATION
==================================================

Identify service transactions separately.

Classification:

SERVICE

Services must be:

- included in Module 2 reporting
- included in spend reconciliation
- excluded from PCBI benchmarking
- excluded from material benchmark opportunity calculations

Report:

Service Rows
Service Spend
% of Total Spend

==================================================
5. SPEND CATEGORY
==================================================

Classify material spend into:

DIRECT MATERIALS
MRO
PACKING MATERIALS
INDIRECT MATERIALS
SERVICES
OTHER / UNMAPPED

For every category report:

Rows
Unique Items
Spend
% Total Spend

All categories together must reconcile to:

₹59,20,34,77,681.71

==================================================
6. ITEM DECOMPOSITION
==================================================

For high-value/high-impact items perform second-level decomposition.

Examples:

Bearings
Lubricants
Electrical items
Mechanical items
Steel products
Chemicals
Packaging
Polymers
Fasteners
Valves
Pumps
Motors
Cables
Refractories
etc.

Where an item contains multiple major cost drivers, identify:

Component / Cost Driver
Estimated Constituent %
Basis
Source / Evidence
Benchmarkability

DO NOT invent constituent percentages.

If no reliable decomposition exists:

MARK AS SOURCE_PENDING

==================================================
7. STRATEGIC SOURCING OPPORTUNITIES
==================================================

Identify opportunities independently from PCBI.

Potential opportunity types:

Vendor Consolidation
PO Consolidation
Category Consolidation
Volume Aggregation
E-Auction Candidate
Competitive RFQ
Alternate Vendor
Specification Rationalization
Payment Term Opportunity
Contract Consolidation
Price Variance
Duplicate Vendor
Tail Spend
Long Tail Supplier
Single Source
Multi Source
Buy-from-Stock opportunity

Do NOT calculate savings unless supported by an explicit benchmark or documented calculation.

Opportunity identification and savings quantification must remain separate.

==================================================
8. VENDOR ANALYSIS
==================================================

For each major category report:

Vendor Count
Spend
Vendor Concentration
Top Vendors
Long-tail Vendors

Identify categories with:

High supplier count
Low supplier count
High spend concentration
Fragmented spend

Do not automatically recommend consolidation.

Present as:

OPPORTUNITY FOR REVIEW

==================================================
9. 80% SPEND PRIORITIZATION
==================================================

Identify the transactions/categories/items contributing to approximately:

50%
70%
80%
90%

of total spend.

Create a priority list for the 80% spend population.

Report:

Category
UNSPSC
Item
Spend
% Spend
Cumulative %
Vendor Count
Benchmarkability status

==================================================
10. MODULE 2 RECONCILIATION
==================================================

At the end calculate:

Module 1 Rows
Module 2 Rows
Row Variance

Module 1 Spend
Module 2 Spend
Spend Variance

Classification Spend
vs
Module 1 Spend

UNSPSC mapped spend
+
Unmapped spend
+
Service spend

must reconcile to total Module 1 spend.

There must be ZERO unexplained spend variance.

==================================================
11. QUALITY METRICS
==================================================

Report:

Commodity Mapped %
Class Mapped %
Segment Mapped %
Unmapped %
Service %

Also report spend-weighted coverage:

Commodity Spend Coverage %
Class Spend Coverage %
Segment Spend Coverage %
Unmapped Spend %
Service Spend %

This is critical.

Do NOT evaluate Module 2 only on row coverage.

==================================================
12. AUDIT TRAIL
==================================================

For every transformation retain:

Source Row ID
Material
Description
Vendor
Spend
UNSPSC
Mapping Level
Mapping Confidence
Spend Category
Service Flag
Item Decomposition
Strategic Sourcing Opportunity

No silent changes.

==================================================
13. MODULE 2 CERTIFICATION
==================================================

Do NOT certify Module 2 merely because mappings exist.

MODULE 2 PASS requires:

1. 31,671 input rows accounted for
2. Zero unexplained spend variance
3. Every row has a final status
4. Services separately identified
5. No fabricated UNSPSC mappings
6. Unmapped items explicitly reported
7. Commodity/Class hierarchy preserved
8. Spend categories reconcile
9. Strategic sourcing opportunities traceable to source data
10. No savings claims without an explicit supporting basis

==================================================
FINAL STOP
==================================================

After completing Module 2:

STOP.

Do NOT connect Module 3.

Do NOT run PCBI.

Do NOT calculate benchmark opportunity loss.

Do NOT modify PCBI V1.0.

Generate a complete:

MODULE 2 REAL-DATA VALIDATION & AUDIT REPORT

including:

- Coverage
- UNSPSC mapping
- Spend category
- Service exclusion
- Item decomposition
- Vendor analysis
- Strategic sourcing opportunities
- 80% spend analysis
- Data quality
- Reconciliation
- Exceptions
- Certification status

Wait for explicit authorization before connecting Module 3.

---

## Prompt 158
MODULE 2 DEEP-DIVE QUALITY AUDIT

Module 2 has passed its structural certification:

Rows processed = 31,671
Spend = ₹59,20,34,77,681.71
Spend variance = ₹0
No dropped rows
No fabricated UNSPSC codes
Service spend isolated
Commodity/Class spend coverage = 96.66%
Unmapped spend = 1.42%

Before connecting Module 3, perform a SECOND-LEVEL QUALITY AUDIT of the existing Module 2 output.

THIS IS AN AUDIT ONLY.

DO NOT:
- Modify Module 2 results
- Reclassify automatically
- Create new UNSPSC codes
- Connect Module 3
- Run PCBI
- Modify PCBI Master V1.0
- Calculate benchmark savings

==================================================
1. UNSPSC COVERAGE BREAKDOWN
==================================================

Provide exact:

Transaction Count
Spend
% of Total Spend

for:

UNSPSC Commodity
UNSPSC Class
UNSPSC Segment
Unmapped
Service

Also provide spend-weighted coverage.

Verify that:

Commodity Spend
+
Class Spend
+
Segment Spend
+
Unmapped Spend
+
Service Spend

= ₹59,20,34,77,681.71

with ZERO variance.

==================================================
2. COMMODITY VS CLASS QUALITY
==================================================

For every Commodity/Class mapping level report:

UNSPSC Level
Number of Items
Transaction Count
Spend
% Spend

Then identify the TOP 100 highest-spend mapped items.

For each provide:

Material
Material Description
Vendor
Spend
UNSPSC Code
UNSPSC Level
UNSPSC Description
Mapping Confidence
Mapping Method

Do NOT change the mappings.

==================================================
3. HIGH-SPEND MAPPING QUALITY REVIEW
==================================================

Create a review population containing:

TOP 100 materials by spend

and

TOP 100 UNSPSC categories by spend.

For each identify:

Mapping appears semantically strong
Mapping requires review
Mapping appears too broad
Mapping appears potentially incorrect

Do not automatically correct anything.

Show the reason for each REVIEW flag.

==================================================
4. GENERIC / BROAD UNSPSC AUDIT
==================================================

Identify mappings where:

The UNSPSC level is excessively broad
Class was used where Commodity appears potentially identifiable
A generic category may have been used
Material description contains enough information for a more precise mapping

Report:

Material
Spend
Current UNSPSC
Current Level
Reason for Flag

Do NOT change the mapping.

==================================================
5. UNMAPPED SPEND DEEP DIVE
==================================================

Analyze ALL unmapped spend.

Report:

Unmapped Spend
Unmapped Transactions
Unmapped Unique Materials

Then TOP 100 unmapped materials by spend:

Material
Description
Vendor
Spend
Material Group
Reason unmapped
Potential Commodity
Potential Class
Mapping Feasibility

Categorize each:

A = Commodity mapping likely possible
B = Class mapping likely possible
C = Insufficient information
D = Service / non-material
E = Other

Do NOT create or apply mappings.

==================================================
6. SERVICE AUDIT
==================================================

Analyze the ₹113.39 Cr service population.

Report:

Service Category
Transaction Count
Spend
% Total Spend

Identify any records that appear to be:

Material
Service
Mixed / Review Required

Do NOT move them automatically.

==================================================
7. SPEND CATEGORY AUDIT
==================================================

Validate:

Direct Materials
MRO
Packing Materials
Indirect Materials
Services
Other / Unmapped

For each:

Rows
Unique Materials
Spend
% Spend

Confirm total = ₹5,920.35 Cr.

==================================================
8. 80% PARETO DEEP DIVE
==================================================

Identify the exact population contributing to:

50%
70%
80%
90%

of total spend.

For the 80% population provide:

Material
Description
UNSPSC
UNSPSC Level
Spend
% Spend
Cumulative %
Vendor Count
Spend Category
Benchmarkability Status

Calculate:

80% Spend Value
Number of Materials
Number of Categories
Number of Vendors

==================================================
9. STRATEGIC SOURCING OPPORTUNITY QUALITY
==================================================

Audit all identified opportunities.

Classify each opportunity as:

Vendor Consolidation
PO Consolidation
Volume Aggregation
Competitive RFQ
E-Auction Candidate
Alternate Supplier
Specification Rationalization
Payment Terms
Contract Consolidation
Tail Spend
Single Source
Multi Source
Buy-from-Stock
Other

For each show:

Spend
Number of Vendors
Number of Items
Evidence
Opportunity Status

Use:

IDENTIFIED OPPORTUNITY

Do NOT assign savings % unless an explicit benchmark or documented calculation exists.

==================================================
10. ITEM DECOMPOSITION AUDIT
==================================================

For high-spend items where decomposition exists, report:

Material
Spend
Constituent
Constituent %
Basis
Source
Confidence
Benchmarkability

Flag:

SOURCE_PENDING

where no reliable constituent basis exists.

Do NOT invent constituent percentages.

==================================================
11. COMMERCIAL COVERAGE
==================================================

Calculate:

Total Customer Spend
Less Services
Less Unmapped
= Material Spend potentially addressable by PCBI

Then calculate:

Commodity-level benchmarkable spend
Class-level benchmarkable spend
Other benchmarkable spend
Non-benchmarkable spend

Report both:

VALUE
and
% OF TOTAL CUSTOMER SPEND

==================================================
12. PCBI READINESS SCORECARD
==================================================

Do NOT provide a subjective score.

Instead provide factual readiness metrics:

Total Spend
Material Spend
Service Spend
Unmapped Spend
Commodity Coverage
Class Coverage
80% Spend Covered
High-Spend Items Mapped
High-Spend Items Requiring Review
Items With Constituent Decomposition
Items Without Benchmark Basis

==================================================
13. FINAL QUALITY VERDICT
==================================================

Classify each area only as:

PASS
REVIEW REQUIRED
DATA INSUFFICIENT

Areas:

UNSPSC Coverage
UNSPSC Accuracy Review
Unmapped Spend
Service Separation
Spend Category
80% Pareto
Strategic Sourcing
Item Decomposition
PCBI Readiness

Do NOT connect Module 3.

Do NOT modify PCBI.

Do NOT alter Module 2.

STOP after generating the complete Module 2 Deep-Dive Quality Audit.

---

## Prompt 159
FINAL MODULE 2 PRE-PCBI GATE AUDIT

Module 2 has completed the second-level quality audit.

Current certified figures:

TOTAL CUSTOMER SPEND:
₹59,20,34,77,681.71

TOTAL MATERIAL SPEND:
₹57,22,68,44,673.34

SERVICE SPEND:
₹1,13,38,62,599.86

UNMAPPED SPEND:
₹84,27,70,408.51

COMMODITY COVERAGE:
85.7446%

CLASS COVERAGE:
10.92%

TOTAL ADDRESSABLE MATERIAL SPEND:
96.6613%

80% PARETO:
₹4,744.64 Cr / 24 items / 80.14%

TOP 100 HIGH-SPEND MATERIALS MAPPED:
100%

HIGH-SPEND ITEMS FLAGGED FOR REVIEW:
18 items / 3.29% spend

DOCUMENTED CONSTITUENT DECOMPOSITIONS:
496 unique items

SOURCE_PENDING:
3,076 items / 1.42% spend

DO NOT CONNECT MODULE 3.

DO NOT RUN PCBI.

DO NOT MODIFY PCBI MASTER V1.0.

Perform the following final gate audit only.

==================================================
1. RECONCILE ALL COVERAGE NUMBERS
==================================================

Verify mathematically that:

Commodity Spend
+
Class Spend
+
Other Benchmarkable Spend
+
Non-Benchmarkable Spend
+
Unmapped Spend
+
Service Spend

= Total Customer Spend

with ZERO variance.

Report both INR and percentage.

==================================================
2. INVESTIGATE THE CLASS-LEVEL DIFFERENCE
==================================================

Current Class-Level Spend:

₹646.31 Cr / 10.92%

Break this into:

A. Class-Level Benchmarkable
B. Non-Benchmarkable Engineered / Custom
C. Review Required
D. Other

Current reported values:

Class-Level Benchmarkable:
₹549.36 Cr

Non-Benchmarkable Engineered Spares:
₹96.95 Cr

Validate the classification of the ₹96.95 Cr.

Do not accept "custom engineered" as sufficient justification by itself.

For the top 50 items within this ₹96.95 Cr population, provide:

Material
Description
Spend
UNSPSC
UNSPSC Level
Reason classified as non-benchmarkable
Potential constituent(s)
Potential raw-material basis
Potential PCBI benchmark route
Status:

DIRECT_INDEX
CONSTITUENT_INDEX
PROXY_INDEX
SOURCE_PENDING
GENUINELY_NON_BENCHMARKABLE

Do not create benchmark values.

==================================================
3. REVIEW THE 18 HIGH-SPEND FLAGGED ITEMS
==================================================

Provide all 18 records.

For each:

Material
Description
Spend
UNSPSC
UNSPSC Level
Vendor
Current Classification
Reason for Review
Potential PCBI Route
Status

Do not modify classification.

==================================================
4. REVIEW THE 496 CONSTITUENT-DECOMPOSED ITEMS
==================================================

Provide a summary:

Number of items
Total spend
% of total customer spend

Break constituents into:

Metal
Polymer
Chemical
Mineral
Energy
Other

For the TOP 100 constituent-decomposed items show:

Material
Spend
Constituent
Constituent %
Basis
Source
Quality
Potential PCBI Index

Do not create an index.

==================================================
5. SOURCE_PENDING AUDIT
==================================================

Analyze the 3,076 SOURCE_PENDING items.

Report:

Total spend
% spend
Unique materials
Top 100 by spend

Classify each top item:

DIRECT INDEX POTENTIAL
CONSTITUENT INDEX POTENTIAL
PROXY INDEX POTENTIAL
INSUFFICIENT DATA
GENUINELY NON-BENCHMARKABLE

Do not invent sources or values.

==================================================
6. 80% PARETO VALIDATION
==================================================

Validate the statement:

24 items = 80.14% of total spend.

For all 24 items show:

Material
Description
Spend
% Spend
Cumulative %
UNSPSC
UNSPSC Level
Vendor Count
Constituent Decomposition Available?
Potential PCBI Route

Confirm whether these 24 items are genuinely ready for PCBI.

==================================================
7. TOP 100 SPEND VALIDATION

For the top 100 materials by spend:

Show:

Mapped
Commodity
Class
Unmapped
Service
Review Required

Provide:

Count
Spend
% Spend

The objective is to ensure that high-value customer spend is not hidden inside low-quality mappings.

==================================================
8. PCBI READINESS MATRIX

Create a factual readiness matrix:

CATEGORY
TOTAL SPEND
% TOTAL
UNSPSC MAPPED
COMMODITY
CLASS
CONSTITUENT DATA
DIRECT INDEX POTENTIAL
CONSTITUENT INDEX POTENTIAL
PROXY INDEX POTENTIAL
SOURCE PENDING
NON-BENCHMARKABLE

Do not provide subjective scores.

==================================================
9. FINAL GATE DECISION

Return exactly one of:

READY FOR MODULE 3

or

REVIEW REQUIRED BEFORE MODULE 3

Use REVIEW REQUIRED if any of the following exist:

- unexplained spend variance
- unresolved high-spend mapping issues
- material misclassification
- questionable non-benchmarkable classification
- significant unmapped high-value spend
- unresolved constituent-weight problems
- incorrect service isolation

Otherwise return:

READY FOR MODULE 3

==================================================
10. STRICT STOP

After producing this report:

DO NOT connect Module 3.

DO NOT calculate benchmark prices.

DO NOT calculate opportunity loss.

DO NOT modify PCBI Master.

DO NOT publish any PCBI version.

STOP and wait for explicit authorization.

---

## Prompt 160
MODULE 3 PCBI CONTROLLED TEST — AUTHORIZE CONNECTION

MODULES 1 AND 2 HAVE NOW CLEARED THE FINAL PRE-PCBI STAGE GATE.

AUTHORIZE MODULE 3 TO CONNECT TO THE CERTIFIED OUTPUTS OF MODULES 1 AND 2.

PCBI MASTER V1.0 MUST REMAIN READ-ONLY.

DO NOT MODIFY THE PCBI MASTER.

DO NOT PUBLISH A NEW PCBI VERSION.

THIS IS A CONTROLLED TEST ONLY.

==================================================
1. CONNECTION
==================================================

Connect:

MODULE 1 CUSTOMER PURCHASE HISTORY
+
MODULE 2 VERIFIED UNSPSC / CATEGORY / ITEM DECOMPOSITION
+
PCBI MASTER V1.0

The customer purchase-history data must remain immutable.

PCBI Master must remain immutable.

Maintain complete source-to-result lineage.

==================================================
2. TEST POPULATION
==================================================

DO NOT PROCESS THE ENTIRE CUSTOMER DATASET YET.

First process only:

A. TOP 24 SPEND ITEMS identified by Module 2 Pareto analysis.

B. At least 10 items with documented constituent decomposition.

C. At least 10 items with direct benchmark/index potential.

D. At least 10 items requiring constituent-weighted benchmarking.

If an item belongs to more than one group, do not duplicate it in the calculation.

Create a unique test population.

==================================================
3. PCBI MATCHING LOGIC
==================================================

For every test item determine:

Customer Material
Material Description
Vendor
Purchase Date
Quantity
Purchase Unit
Purchase Price
Total Spend
UNSPSC
UNSPSC Level
PCBI ID
PCBI Category
Benchmark Route
Quality Rating
Benchmarkability %

Benchmark Route must be one of:

DIRECT_INDEX
CONSTITUENT_INDEX
PROXY_INDEX
SOURCE_PENDING
NON_BENCHMARKABLE

Do not fabricate a benchmark.

==================================================
4. DIRECT INDEX LOGIC
==================================================

Where a valid PCBI direct benchmark exists:

Retrieve the corresponding weekly PCBI index for the purchase date.

Report:

Purchase Date
Purchase Price
PCBI Index at Purchase Date
Quality Rating
Benchmarkability %
PCBI ID

Do not interpolate unless the PCBI Master explicitly defines an interpolation methodology.

If the date does not have a valid index:

SOURCE_PENDING

Do not create a value.

==================================================
5. CONSTITUENT-WEIGHTED LOGIC
==================================================

For items with documented decomposition:

For every constituent show:

Constituent
Weight %
Benchmark Source
PCBI ID
Weekly Index
Quality Rating
Benchmarkability %

Calculate the weighted benchmark using the documented constituent weights.

DO NOT normalize constituent weights automatically.

If weights do not total 100%, preserve the residual exactly as documented and show it separately.

Do not invent the residual.

==================================================
6. BENCHMARK QUALITY
==================================================

For every item calculate and display:

Direct benchmark %
Constituent benchmark %
Proxy benchmark %
Unbenchmarkable %
Total benchmarkable %

These percentages must never exceed the valid addressable basis.

Do not treat Quality Rating A/B/C as a savings percentage.

Quality rating represents benchmark evidence quality only.

==================================================
7. CLIENT PURCHASE VS PCBI
==================================================

For each test transaction calculate:

Actual Purchase Price
PCBI Benchmark Price
Purchase Quantity
Benchmarkable Quantity / Spend Basis
Benchmark Difference

Do NOT calculate opportunity loss yet unless the index methodology is fully validated.

For now label the output:

PRELIMINARY BENCHMARK DIFFERENCE

==================================================
8. DATE / INDEX VALIDATION
==================================================

For every tested transaction verify:

Purchase Date
Corresponding PCBI Week
PCBI Index Availability
PCBI Version
PCBI ID

Flag:

VALID
SOURCE_PENDING
OUT_OF_RANGE
MISSING_INDEX

Do not substitute another week's index silently.

==================================================
9. TRACEABILITY
==================================================

Every calculated benchmark must be traceable:

Customer Transaction
→ Module 1 Record
→ Module 2 Classification
→ UNSPSC
→ PCBI ID
→ PCBI Weekly Index
→ Constituent(s), if applicable
→ Benchmark Calculation

No orphan calculations.

==================================================
10. TEST OUTPUT
==================================================

Produce a detailed table with:

Transaction ID
Material
Description
Date
Quantity
Purchase Price
Spend
UNSPSC
UNSPSC Level
PCBI ID
Benchmark Route
Quality Rating
Benchmarkability %
PCBI Index
Benchmark Price
Benchmark Difference
Status

==================================================
11. RECONCILIATION
==================================================

Reconcile:

Test Population Spend
=
Sum of all selected customer transactions

with ZERO variance.

Also report:

Direct Benchmark Spend
Constituent Benchmark Spend
Proxy Benchmark Spend
Source Pending Spend
Non-Benchmarkable Spend

and their percentages.

==================================================
12. CRITICAL VALIDATION

Before proceeding further, test the following:

A. Same material purchased at different dates
→ verify that different weekly indexes are correctly applied.

B. Same material purchased from different vendors
→ verify that the benchmark is not incorrectly vendor-dependent unless explicitly defined.

C. Same UNSPSC with multiple descriptions
→ verify PCBI matching logic.

D. Commodity-level vs Class-level fallback
→ verify that the correct PCBI hierarchy is selected.

E. Constituent-based item
→ verify weighted benchmark calculation.

F. Missing benchmark
→ verify SOURCE_PENDING rather than fabricated value.

G. Service item
→ verify it never enters PCBI.

==================================================
13. STOP CONDITION

DO NOT:

- calculate final opportunity loss
- calculate savings %
- modify Module 1
- modify Module 2
- modify PCBI Master
- publish PCBI
- process the full customer dataset

until the controlled test calculations have been displayed and reconciled.

Return:

MODULE 3 CONTROLLED TEST STATUS

with one of:

PASS — READY FOR FULL PCBI RUN

or

REVIEW REQUIRED

Then STOP.

---

## Prompt 161
MODULE 3 — FULL PCBI RUN + OPPORTUNITY GAP ENGINE

The Module 3 controlled test has PASSED.

Controlled test:
30 materials
2,328 transactions
₹4,847.15 Cr spend
₹0 reconciliation variance
Direct benchmark logic PASSED
Constituent-weighted logic PASSED
Proxy logic PASSED
All 7 edge-case tests PASSED
No synthetic values
No premature savings claims

AUTHORIZE THE FULL MODULE 3 PCBI RUN.

IMPORTANT:

MODULE 4 MUST REMAIN DISCONNECTED.

DO NOT generate consolidated savings recommendations yet.

PCBI MASTER V1.0 must remain READ-ONLY.

MODULE 1 and MODULE 2 customer data must remain immutable.

==================================================
1. FULL DATA POPULATION
==================================================

Process the complete eligible customer material population from Modules 1 and 2.

Exclude:

SERVICE
UNMAPPED
SOURCE_PENDING
GENUINELY_NON_BENCHMARKABLE

from actual benchmark calculations unless a valid PCBI route subsequently exists.

Do not force a benchmark.

==================================================
2. PCBI MATCHING
==================================================

For every eligible material determine:

Customer Transaction ID
Material
Description
Vendor
Purchase Date
Quantity
Purchase Unit
Purchase Price
Total Spend
UNSPSC
UNSPSC Level
PCBI ID
PCBI Category
Benchmark Route
Quality Rating
Benchmarkability %

Benchmark Route:

DIRECT_INDEX
CONSTITUENT_INDEX
PROXY_INDEX
SOURCE_PENDING
NON_BENCHMARKABLE

No fabricated benchmark values.

==================================================
3. WEEKLY INDEX SELECTION
==================================================

For every eligible transaction:

Purchase Date
→ corresponding PCBI week
→ PCBI ID
→ weekly index

Show:

PCBI Week
PCBI Index
PCBI Version
Quality Rating
Source Status

Do not silently substitute a different index.

If a valid index is unavailable:

SOURCE_PENDING

==================================================
4. DIRECT BENCHMARK
==================================================

Where a direct PCBI index exists:

Use the applicable weekly PCBI index.

Report:

Purchase Date
Purchase Price
PCBI Index
Quality Rating
Benchmarkability %

==================================================
5. CONSTITUENT-WEIGHTED BENCHMARK
==================================================

For items with documented decomposition:

For each constituent:

Constituent
Weight %
PCBI ID
Weekly Index
Quality Rating
Benchmarkability %
Source

Calculate the weighted benchmark strictly using the documented constituent weights.

DO NOT normalize weights automatically.

DO NOT invent residual weights.

If the decomposition does not support a reliable benchmark:

SOURCE_PENDING

==================================================
6. OPPORTUNITY GAP METHODOLOGY — CRITICAL
==================================================

For every material/category with multiple valid purchases:

IDENTIFY THE FIRST VALID PURCHASE CHRONOLOGICALLY.

This becomes the BASE PURCHASE.

For the base purchase:

Base Purchase Price = actual purchase price
Base PCBI Index = PCBI index applicable to that purchase date

Opportunity Gap for the base purchase = ₹0

For every subsequent purchase of the same benchmarkable material/category:

Indexed Expected Price
=
Base Purchase Price
×
(Current Purchase Date PCBI Index / Base Purchase Date PCBI Index)

Then:

Gross Opportunity Difference Per Unit
=
Actual Purchase Price
-
Indexed Expected Price

Gross Opportunity Amount
=
Gross Opportunity Difference Per Unit
×
Current Purchase Quantity

IMPORTANT:

If Actual Purchase Price <= Indexed Expected Price:

Opportunity Loss = ₹0

Do NOT create negative savings/opportunity values.

==================================================
7. BENCHMARKABILITY ADJUSTMENT
==================================================

Where Benchmarkability % is less than 100%:

Benchmarkable Opportunity
=
Gross Opportunity Amount
×
Benchmarkability %

Example:

Gross opportunity = ₹10,00,000
Benchmarkability = 70%

Benchmarkable opportunity =
₹10,00,000 × 70%
=
₹7,00,000

Do NOT treat Quality Rating A/B/C as a savings percentage.

Quality Rating indicates evidence quality.

Benchmarkability % determines the addressable portion.

==================================================
8. FIRST PURCHASE BASE RULE
==================================================

The first valid purchase must ALWAYS be used as the base for that material/category.

Do not:

- use average purchase price as base
- use latest price as base
- use lowest price as base
- use highest price as base
- use a manually selected price
- reset the base because the vendor changes
- reset the base because the quantity changes

The base can only change if the system identifies a new independent benchmark series/category according to the approved PCBI mapping.

Every base selection must be auditable.

==================================================
9. VENDOR CHANGES
==================================================

If the same benchmarkable material is purchased from different vendors:

Continue the same PCBI/index series unless the PCBI methodology explicitly defines separate benchmark series.

Do not reset the base merely because the vendor changed.

Report vendor separately so the client can see vendor-level opportunity.

==================================================
10. PURCHASE DATE CHANGES
==================================================

The index used for each purchase must correspond to the purchase date.

Example:

Base:
July 2023 Week 2
Price = ₹150
Index = 105

Future:
September 2023 Week 4
Price = ₹180
Index = 110

Expected indexed price:

₹150 × (110 / 105)
= ₹157.142857

Difference:

₹180 − ₹157.142857
= ₹22.857143/unit

If quantity = 1,000:

Gross opportunity =
₹22.857143 × 1,000
= ₹22,857.14

If benchmarkability = 70%:

Benchmarkable opportunity =
₹22,857.14 × 70%
= ₹16,000.00

Use full precision internally.
Round only for display.

==================================================
11. QUALITY LEVEL REPORTING
==================================================

Produce opportunity separately for:

Quality A
Quality B
Quality C

Report:

Spend
Benchmarkable Spend
Number of Transactions
Number of Materials
Gross Opportunity
Benchmarkable Opportunity

Do NOT combine A/B/C into a single quality-adjusted percentage.

==================================================
12. PCBI COVERAGE SUMMARY
==================================================

Produce:

Total Customer Spend
Service Spend
Unmapped Spend
Non-Benchmarkable Spend
SOURCE_PENDING Spend

Direct Benchmarkable Spend
Constituent Benchmarkable Spend
Proxy Benchmarkable Spend

Total PCBI Benchmarkable Spend

Report both INR and % of total customer spend.

==================================================
13. OPPORTUNITY SUMMARY
==================================================

Calculate:

Total Benchmarkable Spend
Total Gross Opportunity
Total Benchmarkable Opportunity

Break down by:

UNSPSC Commodity
UNSPSC Class
PCBI Category
Material
Vendor
Plant
Material Group
Spend Category
Quality Rating
Benchmark Route

==================================================
14. MATERIAL-LEVEL OUTPUT
==================================================

Create an auditable transaction-level table:

Transaction ID
Material
Description
Vendor
Purchase Date
Quantity
Purchase Price
Spend
UNSPSC
UNSPSC Level
PCBI ID
PCBI Category
Benchmark Route
Quality Rating
Benchmarkability %
Base Purchase Date
Base Purchase Price
Base PCBI Index
Current PCBI Index
Indexed Expected Price
Actual Purchase Price
Gross Difference / Unit
Gross Opportunity
Benchmarkable Opportunity
Status

==================================================
15. MATERIAL SUMMARY
==================================================

Create a material-level summary:

Material
Description
UNSPSC
PCBI ID
First Purchase Date
Base Purchase Price
Base PCBI Index
Latest Purchase Date
Latest Purchase Price
Latest PCBI Index
Total Spend
Benchmarkable Spend
Gross Opportunity
Benchmarkable Opportunity
Vendor Count
Purchase Count
Quality Rating
Benchmark Route

==================================================
16. TOP OPPORTUNITY ITEMS
==================================================

Produce:

TOP 25 opportunity materials
TOP 25 opportunity categories
TOP 25 opportunity vendors

For each show:

Spend
Benchmarkable Spend
Opportunity
Opportunity %
Quality
PCBI Route

Do not rank materials by "quality".

Ranking is permitted only for factual opportunity magnitude.

==================================================
17. ZERO / NEGATIVE CHECK

Verify:

No negative opportunity values
No negative benchmark prices
No fabricated PCBI indexes
No fabricated constituent weights
No benchmark for services
No benchmark for unresolved SOURCE_PENDING records
No benchmark for unmapped records

==================================================
18. RECONCILIATION

Verify:

Sum transaction spend
=
Module 1 certified material spend

and:

Direct opportunity
+
Constituent opportunity
+
Proxy opportunity
+
Non-benchmarkable
+
SOURCE_PENDING

reconciles to the appropriate eligible population.

All variances must equal ₹0.

==================================================
19. CLIENT-FACING SUMMARY

Generate a concise client summary containing:

Total Spend
Material Spend
PCBI Addressable Spend
PCBI Coverage %
Quality A/B/C coverage
Direct Benchmark Coverage
Constituent Benchmark Coverage
Proxy Coverage
SOURCE_PENDING
Non-Benchmarkable Spend
Gross Opportunity
Benchmarkable Opportunity
Top Opportunity Categories
Top Opportunity Materials
Top Opportunity Vendors

Clearly distinguish:

OBSERVED FACT
BENCHMARK RESULT
OPPORTUNITY GAP
ACTIONABLE OPPORTUNITY

Do not call opportunity "realized savings".

It is an estimated / identified opportunity until the client implements the sourcing action.

==================================================
20. MODULE 4 REMAINS LOCKED

DO NOT connect Module 4.

DO NOT generate final consolidated savings.

DO NOT generate action-plan recommendations from Module 4.

DO NOT modify PCBI Master V1.0.

DO NOT publish a new PCBI version.

==================================================
21. FINAL AUDIT

Return:

MODULE 3 FULL PCBI RUN STATUS

with:

Total Transactions Processed
Total Materials Processed
Total Eligible Spend
PCBI Benchmarkable Spend
PCBI Coverage %
Direct Benchmark Spend
Constituent Benchmark Spend
Proxy Benchmark Spend
SOURCE_PENDING Spend
Non-Benchmarkable Spend
Gross Opportunity
Benchmarkable Opportunity
Quality A Opportunity
Quality B Opportunity
Quality C Opportunity
Reconciliation Variance

Then return:

PASS — READY FOR MODULE 4

only if all reconciliation and integrity tests pass.

Otherwise:

REVIEW REQUIRED

STOP after completing the Module 3 full run and audit.

---

## Prompt 162
MODULE 3 – FULL PCBI CALCULATION AUDIT BEFORE MODULE 4
========================================================

DO NOT RUN MODULE 4.
DO NOT GENERATE CONSOLIDATED SAVINGS OR ACTION PLANS.
DO NOT MODIFY PCBI MASTER V1.0.
DO NOT FABRICATE, DEFAULT, ESTIMATE OR SYNTHESIZE ANY PRICE, INDEX,
QUALITY, WEIGHT OR SAVINGS VALUE.

We have completed Modules 1 and 2 and completed the controlled/full
Module 3 PCBI run.

Before allowing Module 4, perform a COMPLETE CALCULATION AUDIT of
Module 3 using the actual customer purchase history and PCBI Master V1.0.

PRIMARY OBJECTIVE
-----------------
Validate that every benchmarkable transaction is mathematically capable
of producing an auditable Opportunity Loss calculation using the
historical first-purchase-base methodology.

The methodology MUST be:

1. For each material/item, identify the customer's FIRST VALID PURCHASE
   chronologically.

2. The first purchase becomes the BASE PURCHASE:
      Base Purchase Date
      Base Purchase Week
      Base Actual Purchase Price
      Base PCBI Index
      Base Quality Rating
      Base Currency / INR Converted Price
      Base Vendor
      Base Quantity

3. For every subsequent purchase of the SAME material/item:

      Expected Benchmark Price at Purchase Date
      =
      Base Actual Purchase Price
      ×
      (Current PCBI Index / Base PCBI Index)

   Do NOT use the customer's previous purchase price as the base.

4. Calculate transaction-level Opportunity Loss:

      Opportunity Loss
      =
      Actual Purchase Price
      -
      Expected Benchmark Price

5. For savings/opportunity reporting:

      Positive Opportunity =
      MAX(Actual Purchase Price - Expected Benchmark Price, 0)

   Negative values must NOT be presented as savings.
   They should be separately identified as PURCHASE BELOW BENCHMARK /
   NEGATIVE VARIANCE.

6. Preserve all original transaction quantities.

7. Calculate spend/opportunity using:

      Quantity × Price Difference

   wherever the source data supports quantity-based calculation.

8. Where the customer's transaction price is already normalized to INR,
   use INR directly.

9. Where the transaction is in USD/EUR/GBP/AED or another currency,
   verify that Module 1's approved FX conversion is used consistently.
   Do NOT introduce a second FX methodology.

10. Weekly PCBI mapping must use the exact transaction date/week and
    the corresponding PCBI index available in the master.

QUALITY LOGIC
-------------
For every benchmarked transaction, explicitly identify:

Quality A = Direct physical commodity benchmark
Quality B = Direct producer-price proxy
Quality C = Secondary cost-driver proxy

Do NOT treat A/B/C as arbitrary savings percentages.

Quality rating describes benchmark strength, NOT an automatic savings
percentage.

Therefore:

Quality A Opportunity
Quality B Opportunity
Quality C Opportunity

must be calculated from the actual benchmark-price methodology above,
not by applying an assumed percentage reduction.

CONSTITUENT / COMPOSITE MATERIAL LOGIC
--------------------------------------
For constituent-based PCBI records:

1. Show the constituent materials/components.
2. Show each constituent weight.
3. Show the constituent PCBI index.
4. Calculate the composite benchmark index transparently.
5. Show the formula used.

Where:

Composite Index =
SUM(Constituent Weight × Constituent Index)

preserve the authored constituent weights exactly.

Do NOT silently normalize weights to 100%.

If weights do not total 100%, report the residual explicitly.

For every composite benchmark, provide:

Material
PCBI ID
Constituent
Weight %
Constituent Index
Weighted Index Contribution
Composite Index

INDEX AUDIT
-----------
For every benchmarkable item verify:

- First purchase date
- First purchase week
- First purchase actual price
- Base PCBI index
- Current transaction date
- Current transaction week
- Current PCBI index
- Index movement %
- Expected benchmark price
- Actual purchase price
- Price variance
- Quantity
- Opportunity amount
- Quality rating
- Benchmark type
- PCBI ID

The index movement must be calculated as:

(Current Index / Base Index) - 1

and NOT simply:

Current Index - Base Index

unless both are separately displayed.

IMPORTANT:
The base purchase must remain fixed for that material throughout the
analysis.

Do NOT reset the base after each purchase.

Do NOT use the previous transaction as the new base.

TRANSACTION-LEVEL TEST
----------------------
Select at least 20 real materials across:

- Direct Quality A
- Quality B
- Quality C
- Constituent benchmark
- Proxy benchmark
- Different currencies
- Different years
- Materials with increasing prices
- Materials with decreasing prices
- Materials with multiple purchases
- Materials with only one purchase

For each selected material show the COMPLETE calculation.

Example:

Material: Lubricant
First Purchase: July 2023 Week 2
Base Actual Price: ₹150
Base PCBI Index: 105

Later Purchase:
September 2023 Week 4
Actual Price: ₹180
PCBI Index: 110

Expected Benchmark Price:

₹150 × (110 / 105)
= ₹157.142857

Price Variance:

₹180 - ₹157.142857
= ₹22.857143

Opportunity Loss per unit:

₹22.857143

Then multiply by the actual transaction quantity to arrive at
transaction opportunity.

This exact methodology must be reproducible by the software.

FULL POPULATION AUDIT
---------------------
Calculate:

1. Total transactions
2. Total customer spend
3. Benchmarkable transactions
4. Benchmarkable spend
5. Transactions with valid first purchase
6. Transactions with valid base index
7. Transactions with valid current index
8. Transactions with valid benchmark price
9. Transactions with calculable opportunity
10. Transactions with SOURCE_PENDING
11. Transactions with no historical base
12. Single-purchase materials
13. Multi-purchase materials
14. Positive price variance
15. Negative price variance
16. Zero price variance
17. Quality A spend
18. Quality B spend
19. Quality C spend
20. Direct benchmark spend
21. Constituent benchmark spend
22. Proxy benchmark spend
23. Non-benchmarkable spend
24. Service spend
25. Unmapped spend

OPPORTUNITY RECONCILIATION
--------------------------
Produce the following bridge:

TOTAL CUSTOMER SPEND
        ↓
LESS SERVICES
        ↓
LESS UNMAPPED / SOURCE_PENDING
        ↓
LESS NON-BENCHMARKABLE
        ↓
BENCHMARKABLE SPEND
        ↓
TRANSACTIONS WITH CALCULABLE BENCHMARK
        ↓
POSITIVE OPPORTUNITY
        ↓
NEGATIVE PRICE VARIANCE
        ↓
NET PRICE VARIANCE

The following must reconcile exactly:

Transaction-level opportunity
=
Material-level opportunity
=
Quality-level opportunity
=
Benchmark-type opportunity
=
Total Module 3 opportunity

Any variance must be explicitly identified.

DO NOT force reconciliation by rounding.

ROUNDING
--------
Maintain full precision internally.

Display INR values to 2 decimals.

Do not round intermediate index or benchmark-price calculations.

TOP OPPORTUNITY ANALYSIS
------------------------
Generate:

Top 25 materials by Opportunity Loss
Top 25 materials by Opportunity % of spend
Top 25 vendors by Opportunity
Top 25 commodities by Opportunity
Top 25 UNSPSC classes by Opportunity
Top 25 Quality A opportunities
Top 25 Quality B opportunities
Top 25 Quality C opportunities

For each show:

Material
Description
Vendor
UNSPSC
Commodity
Class
PCBI ID
Quality
Spend
Base Date
Base Price
Base Index
Current Index
Expected Benchmark Price
Actual Price
Opportunity %
Opportunity Amount

IMPORTANT:
Do not call an item an "opportunity" merely because it has high spend.

It must have an auditable positive benchmark variance.

SOURCE_PENDING
--------------
SOURCE_PENDING transactions must never generate synthetic opportunity.

Report them separately as:

SOURCE_PENDING SPEND
SOURCE_PENDING TRANSACTIONS
SOURCE_PENDING MATERIALS

and clearly state:

"No opportunity calculated because a validated benchmark index was
not available."

SINGLE-PURCHASE MATERIALS
-------------------------
For materials having only one purchase:

Do not fabricate opportunity.

Report them separately as:

"Benchmarkable but insufficient purchase history for historical
opportunity calculation."

They may still be benchmarked against the current index, but must not
be included in historical opportunity unless the methodology supports it.

QUALITY DISTRIBUTION
--------------------
Show:

Quality A:
Spend
Transactions
Materials
Calculable opportunity
Opportunity %

Quality B:
Spend
Transactions
Materials
Calculable opportunity
Opportunity %

Quality C:
Spend
Transactions
Materials
Calculable opportunity
Opportunity %

Do NOT imply that Quality C is equivalent in reliability to Quality A.

CONFIDENCE / COVERAGE
---------------------
Create a clear hierarchy:

1. Direct benchmark – highest benchmark confidence
2. Constituent benchmark – constituent-weighted
3. Producer proxy
4. Secondary cost-driver proxy
5. SOURCE_PENDING
6. Non-benchmarkable

Show spend and opportunity separately for each.

CRITICAL VALIDATION
-------------------
Specifically investigate why the current Module 3 output reports:

Gross Opportunity = ₹0
Benchmarkable Opportunity = ₹0
Quality A Opportunity = ₹0
Quality B Opportunity = ₹0
Quality C Opportunity = ₹0

Determine whether:

A. The opportunity calculation has genuinely produced zero;
B. The PCBI index exists but the historical calculation engine has not
   been activated;
C. Base purchase mapping is incomplete;
D. Current index mapping is incomplete;
E. Quantity mapping is incomplete;
F. Constituent benchmark calculation is incomplete;
G. A software logic issue is preventing opportunity calculation.

Do NOT change the calculation simply to produce a non-zero opportunity.

If the correct result is genuinely zero, prove it using transaction-level
calculations.

If the calculation engine is incomplete, identify the exact missing
logic and DO NOT certify Module 3 as fully complete.

FINAL OUTPUT
------------
Produce a "MODULE 3 PCBI CALCULATION AUDIT REPORT" containing:

1. Data population reconciliation
2. PCBI coverage reconciliation
3. First-purchase-base validation
4. Weekly index mapping validation
5. Direct benchmark validation
6. Constituent benchmark validation
7. Proxy benchmark validation
8. Quality A/B/C validation
9. Transaction-level sample calculations
10. Full-population opportunity reconciliation
11. SOURCE_PENDING reconciliation
12. Single-purchase analysis
13. Top 25 opportunity items
14. Top vendors
15. Top commodities
16. Top UNSPSC classes
17. Positive vs negative price variance
18. Opportunity by quality
19. Opportunity by benchmark type
20. Data-quality exceptions
21. Software calculation exceptions
22. Final Module 3 readiness decision

FINAL GATE
----------
Do NOT connect Module 4.

Do NOT generate consolidated savings.

Do NOT generate action plans.

Do NOT declare Module 3 fully certified unless:

- Base purchase methodology is verified
- Weekly index mapping is verified
- Direct benchmark calculations are verified
- Constituent calculations are verified
- Proxy calculations are verified
- Opportunity calculations are verified
- Full population reconciliation is zero variance
- At least 20 real transaction-level examples independently reconcile
- No synthetic values are present

If any condition fails, report:

MODULE 3 = CALCULATION AUDIT FAILED / REMEDIATION REQUIRED

If all conditions pass, report:

MODULE 3 = CALCULATION AUDITED / READY FOR MODULE 4

BUT KEEP MODULE 4 DISCONNECTED UNTIL EXPLICIT AUTHORIZATION.

---

## Prompt 163
FORENSIC QA GATE — DO NOT RUN FULL PCBI
Do NOT execute the full Module 3 / PCBI production run.
Do NOT modify PCBI Master V1.0, its 95,700 weekly records, constituent weights, source files, mappings, or historical values.
We have completed the first-level Module 1 and Module 2 audit. Now perform a SECOND-LEVEL FORENSIC QA of Modules 1 and 2 using the authoritative customer purchase-history workbook already bound to this session.
Validate the following independently:
MODULE 1
1. 100% source-row-to-Module-1-row reconciliation.
2. Every source field transformation and preservation.
3. Currency conversion for every non-INR transaction.
4. FX rate and INR calculation reconciliation.
5. Purchase-date validation.
6. Duplicate detection without unauthorized row deletion.
7. Deletion-indicator treatment.
8. Material/service/other spend classification.
9. Vendor, plant and material-group reconciliation.
10. Total spend reconciliation.
11. Identify every dropped, transformed, duplicated, or altered record.
MODULE 2
12. Produce a complete material-level UNSPSC mapping audit.
13. Validate every UNSPSC code against the declared official UNSPSC master/version.
14. Identify unmapped, ambiguous and questionable mappings.
15. Produce the complete Top 100 materials audit table.
16. Independently recalculate the 80% Pareto.
17. Validate service isolation across 100% of service spend.
18. Validate engineered/non-benchmarkable spare classification.
19. Validate Direct / Constituent / Proxy / Non-Benchmark classifications.
20. Validate all 496 documented constituent decompositions.
21. Confirm constituent weights are preserved exactly and never normalized.
22. Reconcile every spend bucket back to total customer spend.
23. Independently recalculate benchmark-addressable spend.
24. Independently recalculate commodity-level and class-level coverage.
25. Validate vendor concentration calculations.
26. Validate strategic sourcing opportunity identification WITHOUT calculating speculative savings.
27. Validate that no savings/opportunity value has been fabricated.
PCBI INTERFACE VALIDATION — NO FULL RUN
28. Validate only the interface between Module 2 outputs and PCBI eligibility.
29. Confirm every material sent to PCBI has a traceable Module 2 classification.
30. Confirm services, unmapped tail spend and non-benchmarkable engineered spares cannot enter PCBI.
31. Confirm SOURCE_PENDING PCBI records cannot generate opportunity values.
32. Confirm no historical PCBI value has been altered.
NEGATIVE TESTS
Perform controlled validation tests for:
- altered FX rate
- deleted transaction
- duplicated transaction
- invalid UNSPSC
- changed constituent weight
- missing date
- missing vendor
- missing material
- fabricated PCBI index value
The system must demonstrate that these conditions are detected and/or rejected.
OUTPUT REQUIRED
Produce a complete MODULE 1 & MODULE 2 FORENSIC QA REPORT containing:
- test ID
- test description
- expected result
- actual result
- records tested
- exceptions
- variance
- evidence
- PASS/FAIL
- severity
- recommended correction
Do not use aggregate PASS statements without providing the underlying reconciliation evidence.
At the end produce:
MODULE 1 FORENSIC STATUS
MODULE 2 FORENSIC STATUS
OPEN EXCEPTIONS
PCBI GATE STATUS
Do not authorize or execute the full Module 3 run unless all critical and high-severity issues are resolved.
---

## Prompt 164
STOP. DO NOT RUN ANY FURTHER PCBI BENCHMARKING OR GENERATE ANY SAVINGS/OPPORTUNITY CLAIMS.

We have completed Module 1 and Module 2 validation and the controlled Module 3 test.

Before any production PCBI benchmarking is permitted, perform a FINAL FORENSIC PRE-PRODUCTION AUDIT.

STRICT RULES:

1. Module 1 and Module 2 are FROZEN.
2. PCBI Master V1.0 is FROZEN and READ-ONLY.
3. Do not modify, normalize, default, interpolate, estimate, synthesize or fabricate any PCBI index values.
4. Do not generate savings or opportunity values.
5. Do not alter the 95,700 weekly PCBI records.
6. Do not alter the 290 PCBI series.
7. Do not alter constituent weights.
8. Do not alter UNSPSC mappings.
9. Module 4 must remain disconnected.

AUDIT THE FOLLOWING:

A. MODULE 1 → MODULE 2 HANDOFF
- Verify every 31,671 source transaction has exactly one downstream status.
- Verify zero dropped transactions.
- Verify zero duplicate transactions introduced.
- Verify total spend remains exactly ₹59,20,34,77,681.71.
- Verify transaction-level lineage from source → Module 1 → Module 2.

B. MODULE 2 → PCBI ELIGIBILITY
Reconcile exactly:
- Total customer spend
- Services excluded
- Unmapped tail excluded
- Engineered/non-benchmarkable spares excluded
- PCBI-eligible transaction count
- PCBI-eligible spend

Produce a transaction-count reconciliation AND INR reconciliation.

C. PCBI MASTER INTEGRITY
Verify:
- 290 PCBI Technical IDs
- 95,700 weekly records
- 330 weeks per series
- all source files unchanged
- all hashes/metadata unchanged
- no index values have been inserted
- no SOURCE_PENDING values have been converted
- no constituent weights have been modified

D. PCBI CALCULATION LOGIC
Audit the calculation engine WITHOUT executing production calculations.

For each route:
1. DIRECT
2. CONSTITUENT
3. PROXY

verify:
- base price selection
- base-date selection
- latest-price selection
- index-date selection
- index availability check
- SOURCE_PENDING handling
- quality A/B/C handling
- single-purchase handling
- negative variance handling
- price-increase handling
- price-decrease handling
- zero/negative/fallback protection

E. EDGE CASES
Create and test cases for:
- no index available
- base index SOURCE_PENDING
- current index SOURCE_PENDING
- one purchase only
- multiple purchases
- price increase
- price decrease
- zero price
- missing price
- missing date
- duplicate transaction
- unmapped material
- service material
- engineered spare
- invalid PCBI ID
- invalid UNSPSC
- missing constituent weight
- constituent weights not summing to 100%
- proxy material
- quality C material

The expected result for every case must be explicitly documented.

F. OPPORTUNITY GOVERNANCE
Confirm that:
- SOURCE_PENDING = ₹0 opportunity
- absence of an index never becomes a default index
- no synthetic market price is created
- no negative savings is presented as savings
- insufficient purchase history = ₹0 opportunity
- benchmarkable does not automatically mean savings exists

G. FINAL GATE
Produce a final report with ONLY these statuses:

MODULE 1 → PASS / FAIL
MODULE 2 → PASS / FAIL
MODULE 3 ENGINE LOGIC → PASS / FAIL
PCBI MASTER INTEGRITY → PASS / FAIL
MODULE 1→2→3 LINEAGE → PASS / FAIL
DATA INTEGRITY → PASS / FAIL
NEGATIVE/EDGE CASES → PASS / FAIL
OPPORTUNITY GOVERNANCE → PASS / FAIL

Then provide:

1. OPEN DEFECTS
2. OPEN WARNINGS
3. UNTESTED ITEMS
4. DATA REQUIRED BEFORE PRODUCTION PCBI
5. FINAL GO / NO-GO DECISION

IMPORTANT:
A PASS must mean that the specific control was actually tested and evidenced.
Do not convert an absence of errors into a PASS.
Do not declare PCBI production-ready merely because the controlled test passed.

STOP after producing this forensic audit.
DO NOT execute a full production PCBI benchmark run.

---

## Prompt 165
PCBI MASTER DATA READINESS AUDIT — DO NOT RUN PRODUCTION BENCHMARKING

Modules 1 and 2 are frozen and certified.
Module 3 calculation engine and governance have passed forensic validation.

DO NOT execute the full PCBI benchmark run.
DO NOT generate savings.
DO NOT generate opportunity values.
DO NOT modify PCBI Master V1.0.

Perform ONLY a PCBI MASTER DATA READINESS AUDIT.

OBJECTIVE:

Determine whether PCBI Master V1.0 contains sufficient source-backed, technically valid and auditable index data to support a production Module 3 benchmark calculation.

AUDIT ALL 290 PCBI TECHNICAL IDs AND ALL 95,700 WEEKLY RECORDS.

SECTION A — SERIES COVERAGE

For every PCBI ID report:

- PCBI Technical ID
- Category
- Benchmark description
- Index type
- Quality rating
- Source
- Source reference
- Frequency
- Currency
- Unit
- Start date
- End date
- Observation count
- Missing observation count
- Duplicate observation count
- Current Data Status

Produce totals for:

- Total PCBI IDs
- IDs with valid source
- IDs without source
- IDs with populated values
- IDs SOURCE_PENDING
- IDs with complete weekly history
- IDs with missing weeks

SECTION B — DATE INTEGRITY

For every series verify:

- expected weekly dates
- missing weeks
- duplicate weeks
- overlapping dates
- future dates
- stale observations
- invalid dates

DO NOT CREATE OR INTERPOLATE MISSING WEEKS.

SECTION C — VALUE INTEGRITY

Check for:

- blank values
- zero values
- negative values
- impossible values
- duplicate values where suspicious
- unexplained extreme jumps
- unexplained collapses
- currency changes
- unit changes

Do not modify any values.

SECTION D — SOURCE TRACEABILITY

For every populated index value determine whether it has:

PCBI ID
→ Date
→ Index Value
→ Source
→ Source Reference
→ Unit
→ Currency

Flag anything where the chain is incomplete.

SECTION E — UNIT AND CURRENCY CONTROL

Verify that every populated series has explicit:

- Currency
- Unit
- Measurement basis
- Geography where relevant
- Product/specification basis where relevant

Identify any series where customer purchase prices cannot safely be compared to the index without an explicit conversion.

SECTION F — BENCHMARK APPLICABILITY

For every PCBI ID verify whether the benchmark definition is sufficiently specific to support:

Customer Material
→ PCBI ID
→ Benchmark Type
→ Quality
→ Index
→ Unit/Currency
→ Date

Flag ambiguous mappings.

SECTION G — CONSTITUENT DATA

For every constituent-based PCBI series verify:

- constituent list
- constituent weight
- weight source
- weight date/version
- residual component
- whether weights sum correctly
- whether the system has incorrectly normalized authored weights

Do not alter weights.

SECTION H — PROXY DATA

For every proxy series verify:

- proxy definition
- reason for proxy use
- source
- applicability
- quality classification
- whether proxy is clearly distinguished from direct physical commodity data

SECTION I — GOVERNANCE

Confirm:

- SOURCE_PENDING remains SOURCE_PENDING
- missing index never becomes a default index
- no synthetic value exists
- no interpolation occurred
- no fabricated historical value exists
- no fabricated source exists
- no fabricated weight exists
- no opportunity is calculated where a required index is unavailable

SECTION J — FINAL READINESS GATE

Return exactly:

1. ENGINE LOGIC STATUS
2. PCBI DATA STATUS
3. SOURCE TRACEABILITY STATUS
4. DATE INTEGRITY STATUS
5. VALUE INTEGRITY STATUS
6. UNIT/CURRENCY STATUS
7. CONSTITUENT DATA STATUS
8. PROXY DATA STATUS
9. CUSTOMER→PCBI MAPPING STATUS
10. GOVERNANCE STATUS

For each status use only:

PASS
FAIL
PASS WITH WARNINGS
NOT TESTABLE

Then provide:

- Critical defects
- Major warnings
- Minor warnings
- Missing data
- Missing sources
- Missing weeks
- Ambiguous mappings
- Series requiring remediation

FINAL RULE:

Do NOT say "PCBI Production Ready" merely because the calculation engine passed.

PCBI may be declared PRODUCTION READY only if both:

A. ENGINE LOGIC = PASS
AND
B. PCBI MASTER DATA = PASS

Otherwise return:

PCBI PRODUCTION GATE = NOT READY

STOP after the audit.

---

## Prompt 166
FINAL PRE-PCBI CROSS-MODULE RECONCILIATION AUDIT

Do NOT run production PCBI benchmarking.
Do NOT populate, modify, normalize, estimate, interpolate, or fabricate any PCBI index values.
Do NOT modify PCBI_GLOBAL_MASTER_V1_2020_2026.xlsx.
Do NOT connect Module 4.

Before any PCBI production run, perform a read-only forensic reconciliation of Module 1, Module 2, Module 3 controlled-test outputs, and PCBI Master V1.0.

OBJECTIVE:
Establish that every number flowing from Module 1 → Module 2 → Module 3 is mathematically and transactionally reconciled.

REQUIRED CHECKS:

1. SOURCE RECONCILIATION
- Source transaction count = 31,671.
- Source raw spend = ₹59,20,34,77,681.71.
- Module 1 input count must equal source count.
- Module 1 raw spend must equal source spend.
- Variance must be exactly ₹0.00.

2. MODULE 2 RECONCILIATION
Reconcile:
- Total customer spend
- Service spend
- Unmapped spend
- Addressable material spend
- Commodity-level spend
- Class-level spend
- Engineered/non-benchmarkable spare spend
- Any other excluded category

Every amount must have a mathematical bridge back to total customer spend.

3. MODULE 2 → MODULE 3 ELIGIBILITY BRIDGE
Starting from 31,671 transactions, produce a transaction-level waterfall:

31,671 total transactions
↓
Services excluded
↓
Unmapped/source-pending excluded
↓
Engineered/custom-spec/non-benchmarkable excluded
↓
Other exclusion rules, if any
↓
PCBI eligible transactions

The final eligible transaction count must reconcile exactly to the reported 13,837.

Provide:
- row count at every stage
- spend at every stage
- percentage at every stage
- transaction IDs/records contributing to every exclusion category
- zero unexplained residual.

4. SPEND WATERFALL
Starting with ₹5,920.35 Cr, mathematically reconcile to:
- Services
- Unmapped tail
- Non-benchmarkable engineered spares
- PCBI benchmarkable spend

No category may overlap another category.
No transaction may appear in two exclusion buckets.
No transaction may disappear.

5. PCBI BENCHMARKABLE SPEND
Independently recalculate the reported:
₹5,317.86 Cr

Do NOT accept the previously calculated value as authoritative.
Recalculate it from transaction-level data.

Show:
- formula
- source rows
- included transaction count
- excluded transaction count
- resulting INR amount
- reconciliation variance.

6. MATERIAL-LEVEL RECONCILIATION
Reconcile:
- 6,485 materials
- 31,671 transactions
- 290 PCBI technical IDs
- 13,837 PCBI-eligible transactions

Identify:
- materials mapped to multiple PCBI IDs
- PCBI IDs mapped to multiple materials
- materials with no PCBI mapping
- duplicate mappings
- ambiguous mappings
- one-to-many and many-to-one relationships.

Do not correct anything automatically. Report exceptions only.

7. PCBI MASTER INTEGRITY
Read PCBI_GLOBAL_MASTER_V1_2020_2026.xlsx in READ-ONLY mode.

Verify:
- 290 technical IDs
- 95,700 weekly records
- constituent weights
- quality ratings
- source descriptions
- cross-sector mappings
- date/calendar structure
- duplicate records
- missing records
- blank index values
- SOURCE_PENDING status

Calculate SHA-256/hash and confirm the master has not changed.

8. WEEKLY RECORD MATHEMATICS
Verify that the 95,700 records mathematically correspond to:
290 series × expected weekly periods.

Do not assume 330 weeks.
Derive the exact expected week count from the master calendar/date structure and explain any difference.

Separately identify:
- historical weeks
- current week
- future weeks

Do not populate future weeks.

9. SOURCE_PENDING AUDIT
Confirm whether all 95,700 records are SOURCE_PENDING.

Break down SOURCE_PENDING by:
- PCBI technical ID
- sector
- quality rating
- date range

Do not replace SOURCE_PENDING with estimates.

10. CONTROLLED TEST VS PRODUCTION DATA
Clearly separate:
A. Module 3 calculation-engine validation
B. Controlled 30-material test
C. Actual customer-data production eligibility
D. PCBI Master data readiness

Do not allow a PASS in A/B/C to automatically imply that D has passed.

11. NUMERICAL CONSISTENCY AUDIT
Search all generated reports for inconsistent values for:
- ₹5,920.35 Cr
- ₹5,722.68 Cr
- ₹5,317.86 Cr
- ₹113.39 Cr
- ₹84.28 Cr
- 31,671
- 13,837
- 6,485
- 290
- 95,700

If the same metric has different values anywhere, flag it and explain the reason.

12. FINAL GATE
Return exactly one of:

PASS – CROSS-MODULE RECONCILIATION COMPLETE

or

FAIL – RECONCILIATION EXCEPTION(S) FOUND

If FAIL:
- list every exception
- severity
- affected transaction/material/PCBI ID
- financial impact
- recommended remediation

IMPORTANT:
This is a READ-ONLY AUDIT.
Do not modify customer data.
Do not modify Module 1.
Do not modify Module 2.
Do not modify PCBI Master V1.0.
Do not execute production benchmarking.
Do not generate savings.
Do not connect Module 4.

STOP after producing the complete reconciliation report.

---

## Prompt 167
============================================================
PCBI MASTER DATA — SOURCE MAPPING & READINESS AUDIT
PHASE 1 — NO INDEX POPULATION
============================================================

OBJECTIVE

The validation of Module 1, Module 2, and the Module 1→2→3
cross-module reconciliation has been completed and CERTIFIED.

Now begin ONLY the PCBI Master Data Source-Mapping and
Readiness phase.

DO NOT execute a production PCBI benchmark run.

DO NOT populate any index values.

DO NOT modify any existing PCBI index values.

DO NOT fabricate, estimate, interpolate, extrapolate,
backfill, normalize, smooth, or synthesize any market prices.

DO NOT modify PCBI_GLOBAL_MASTER_V1_2020_2026.xlsx.

DO NOT connect Module 4.

PCBI Master V1.0 must remain READ-ONLY.

------------------------------------------------------------
1. AUTHORITATIVE PCBI MASTER
------------------------------------------------------------

Use:

PCBI_GLOBAL_MASTER_V1_2020_2026.xlsx

as the authoritative PCBI master.

Verify before starting:

- 290 PCBI Technical IDs
- 186 PCBI Categories
- 95,700 weekly records
- 330 weekly periods per Technical ID
- Existing Quality Rating
- Existing Benchmarkability %
- Existing Constituent/Cost Driver information
- Existing UNSPSC/category mappings
- Existing source-description fields
- Existing Data Status fields

Generate and record SHA-256 before any processing.

The file must remain byte-for-byte unchanged.

------------------------------------------------------------
2. BUILD THE 290-SERIES SOURCE REGISTER
------------------------------------------------------------

Create a READ-ONLY source-mapping audit table containing
EXACTLY 290 rows — one row per PCBI Technical ID.

Required fields:

PCBI Technical ID
PCBI Category
Sector
Description
Benchmark Type
Quality Rating
Benchmarkability %
Constituent / Cost Driver
Unit
Expected Market Variable
Current Source Description
Proposed Authoritative Source
Source Publisher / PRA
Source Type
Historical Availability
Frequency
Currency
Geography
Specification / Grade
Source URL or Source Reference
Source Status
Historical Coverage Status
Data Access Status
Confidence
Mapping Notes
Remediation Required

IMPORTANT:

Do NOT invent a source merely because a commodity name looks
similar.

If a suitable authoritative source cannot be established,
mark:

SOURCE_NOT_IDENTIFIED

Do not substitute an unrelated index.

------------------------------------------------------------
3. SOURCE QUALITY HIERARCHY
------------------------------------------------------------

Classify every proposed source according to:

A = Direct physical commodity / direct market price

B = Direct producer-price or recognized producer-price proxy

C = Secondary cost-driver proxy

UNRESOLVED = No sufficiently defensible source identified

Do NOT upgrade a B or C source to A.

Do NOT upgrade a C source to B.

Preserve the existing Quality Rating unless an explicit
audit finding identifies a mismatch.

Any proposed rating change must be separately reported and
must NOT modify the master.

------------------------------------------------------------
4. SOURCE VALIDATION
------------------------------------------------------------

For every one of the 290 PCBI Technical IDs determine:

1. Does the source actually represent the intended commodity?
2. Does the specification/grade match?
3. Does the geography match the intended benchmark?
4. Does the unit match?
5. Does the currency match?
6. Is the historical data actually available?
7. Is weekly data available directly?
8. If only another frequency exists, FLAG IT.
9. Is the historical period April 2020–September 2026
   actually available?
10. Is the source public, licensed, subscription-based,
    exchange-based, government-based, or otherwise restricted?
11. Can the data legally/technically be obtained for production?
12. Is the source sufficiently authoritative for customer-facing
    procurement benchmarking?

Do NOT create data to fill gaps.

------------------------------------------------------------
5. HISTORICAL COVERAGE TEST
------------------------------------------------------------

For each of the 290 series calculate:

Required historical weeks:
330

Available historical weeks:
[actual verified number]

Missing historical weeks:
[actual verified number]

Future weeks:
[actual verified number]

Coverage %:
[calculated]

Do NOT treat future weeks as missing historical data.

Do NOT populate future weeks.

------------------------------------------------------------
6. SOURCE-PENDING BREAKDOWN
------------------------------------------------------------

Reconcile the existing:

95,700 weekly records
290 Technical IDs

Break down SOURCE_PENDING by:

- Technical ID
- Category
- Sector
- Quality Rating
- Year
- Historical vs future period

Confirm whether the current SOURCE_PENDING status is
consistent with the actual availability of source data.

Do NOT change any SOURCE_PENDING status.

------------------------------------------------------------
7. SOURCE GAP CLASSIFICATION
------------------------------------------------------------

Classify every PCBI Technical ID into exactly one:

A. VERIFIED SOURCE AVAILABLE
B. SOURCE IDENTIFIED — ACCESS REQUIRED
C. SOURCE IDENTIFIED — HISTORICAL DATA INCOMPLETE
D. SOURCE IDENTIFIED — FREQUENCY MISMATCH
E. SOURCE IDENTIFIED — SPECIFICATION MISMATCH
F. SOURCE NOT IDENTIFIED
G. REQUIRES LICENSED / PAID DATA
H. REQUIRES MANUAL AUTHENTICATED DATA IMPORT

No Technical ID may remain unclassified.

------------------------------------------------------------
8. PAID DATA REQUIREMENT
------------------------------------------------------------

Identify which PCBI series require:

- Paid subscription
- Licensed market data
- Exchange data
- Proprietary price-reporting agency data
- Manual authenticated source files

For each such series report:

PCBI ID
Required provider/source
Data type required
Historical period required
Frequency required
Indicative access method
Reason free/public data is insufficient

Do NOT purchase anything.
Do NOT subscribe to anything.
Do NOT fabricate pricing.

------------------------------------------------------------
9. PCBI MASTER COVERAGE SUMMARY
------------------------------------------------------------

Produce a final summary:

Total PCBI Technical IDs = 290

A — Verified Source Available = X
B — Access Required = X
C — Historical Data Incomplete = X
D — Frequency Mismatch = X
E — Specification Mismatch = X
F — Source Not Identified = X
G — Paid/Licensed Data Required = X
H — Manual Authenticated Import Required = X

The sum MUST equal exactly 290.

------------------------------------------------------------
10. PRODUCTION READINESS GATE
------------------------------------------------------------

Calculate:

Source Mapping Coverage %
Historical Data Readiness %
Production Data Readiness %

BUT:

Do NOT declare PCBI production-ready merely because a source
has been identified.

Production readiness requires verified historical data,
appropriate specification matching, authenticated source
provenance, and successful validation.

------------------------------------------------------------
11. REQUIRED OUTPUTS
------------------------------------------------------------

Generate:

A. PCBI 290-Series Source Register
B. PCBI Source Gap Analysis
C. PCBI Historical Coverage Audit
D. Paid/Licensed Source Requirement List
E. PCBI Master Data Readiness Report
F. PCBI Production Gate Decision

------------------------------------------------------------
12. FINAL GATE

Return exactly one:

PCBI MASTER DATA — READY FOR POPULATION

OR

PCBI MASTER DATA — NOT READY FOR POPULATION

If NOT READY:

List all blockers with:

PCBI ID
Problem
Required source
Required action
Severity
Historical impact
Commercial/data-access implication

------------------------------------------------------------
STRICT GOVERNANCE
------------------------------------------------------------

MODULE 1 = FROZEN
MODULE 2 = FROZEN
MODULE 3 PRODUCTION = LOCKED
MODULE 4 = DISCONNECTED
PCBI MASTER V1.0 = READ-ONLY

NO INDEX VALUES MAY BE CREATED OR MODIFIED.

NO SAVINGS VALUES MAY BE GENERATED.

NO BENCHMARK CALCULATIONS MAY BE EXECUTED.

STOP after producing the complete PCBI Source-Mapping &
Readiness Audit.

============================================================
END COMMAND
============================================================

---

## Prompt 168
FINALIZE MODULE 1 & MODULE 2 AND PREPARE PCBI MASTER FOR DATA POPULATION — DO NOT RUN PCBI BENCHMARKING

Objective:
Modules 1 and 2 have completed real-data validation, forensic QA, and cross-module reconciliation.

Treat the current certified state as FROZEN.

1. MODULE 1
- Status: CERTIFIED / PASS.
- 31,671 source rows reconciled.
- Total customer spend: ₹59,20,34,77,681.71.
- Variance: ₹0.00.
- Do not re-ingest, modify, transform, or overwrite Module 1 data.

2. MODULE 2
- Status: CERTIFIED / PASS.
- Preserve all existing classifications, UNSPSC mappings, spend categories, service isolation, unmapped-tail treatment and sourcing classifications.
- Do not rerun Module 2 unless specifically required for validation.
- Do not alter any certified Module 2 outputs.

3. CROSS-MODULE RECONCILIATION
- Treat the completed cross-module reconciliation as the authoritative baseline.
- Preserve the existing lineage:
  SOURCE → MODULE 1 → MODULE 2 → PCBI ELIGIBILITY.
- Do not change the reconciliation numbers.

4. PCBI MODULE 3
STRICTLY DO NOT RUN THE PRODUCTION PCBI BENCHMARK ENGINE.

Do NOT:
- calculate benchmark prices;
- calculate savings;
- calculate opportunity values;
- populate synthetic/default/index-estimated prices;
- modify PCBI Master V1.0;
- connect Module 4;
- generate savings/action-plan recommendations.

5. PCBI MASTER V1.0
Keep PCBI Master V1.0 READ-ONLY and UNMODIFIED.

The current condition is:
- 290 benchmark series.
- 95,700 weekly records.
- Index values currently SOURCE_PENDING / blank.
- No benchmark calculation is permitted until verified market data is available.

6. NEXT TASK — PCBI DATA READINESS AUDIT ONLY

Perform a detailed readiness audit of all 290 PCBI benchmark series.

For each series identify:

A. Series name / benchmark name
B. Commodity / material mapping
C. Existing PCBI classification
D. Required unit of measure
E. Required geography / market
F. Required quality/specification basis
G. Required historical period
H. Required weekly frequency
I. Potential authoritative source / Price Reporting Agency / exchange / government source
J. Whether the source is FREE or requires PAID subscription
K. Exact data coverage available from the source
L. Whether the source can provide historical data from April 2020 onward
M. Whether weekly data can be obtained
N. Currency
O. Unit conversion requirement
P. Data licensing/access requirement
Q. Source reliability rating
R. Data availability status:
   - AVAILABLE
   - PARTIALLY AVAILABLE
   - SUBSCRIPTION REQUIRED
   - SOURCE NOT IDENTIFIED
   - SOURCE PENDING

7. CRITICAL GOVERNANCE RULE

Do NOT invent, estimate, interpolate, synthesize, backfill or assume any market index value.

If a verified source is unavailable:
- leave the PCBI value blank;
- retain SOURCE_PENDING;
- report the missing source;
- do not create a substitute index.

8. OUTPUT

Create a complete PCBI DATA SOURCE READINESS REPORT covering all 290 series.

Also create:

1. 290-series master source-mapping table.
2. List of FREE data sources.
3. List of PAID/subscription sources.
4. List of series requiring licensed data.
5. List of series with no identified reliable source.
6. Historical coverage assessment for April 2020–September 2026.
7. Recommended data-acquisition sequence based on data availability and business relevance.
8. Exact fields required to populate PCBI_MASTER.
9. Data-validation rules that must pass before any value is written into PCBI_MASTER.
10. A final readiness percentage based ONLY on verified source availability.

IMPORTANT:
This is a DATA READINESS / SOURCE MAPPING exercise only.

DO NOT populate PCBI Master.
DO NOT execute Module 3 production benchmarking.
DO NOT calculate savings.
DO NOT connect Module 4.

At the end, stop and provide:

PCBI PRODUCTION GATE STATUS:
BLOCKED — AWAITING VERIFIED MARKET DATA

MODULE 1: FROZEN / CERTIFIED
MODULE 2: FROZEN / CERTIFIED
MODULE 3: NOT RUN
PCBI MASTER V1.0: READ-ONLY / UNMODIFIED
MODULE 4: DISCONNECTED

---

## Prompt 169
FINAL GOVERNANCE LOCK — STOP BEFORE PCBI PRODUCTION BENCHMARKING

We have completed and certified the real-data validation of Module 1 and Module 2.

AUTHORITATIVE RESULTS:

Module 1:
- Source rows: 31,671
- Module 1 input rows: 31,671
- Total customer spend: ₹59,20,34,77,681.71
- Reconciliation variance: ₹0.00
- Module 1 status: CERTIFIED / PASS

Module 2:
- All 31,671 Module 1 rows accounted for
- Spend reconciliation variance: ₹0.00
- UNSPSC mapping and taxonomy audit completed
- Services isolated from material benchmarking
- Unmapped tail isolated and flagged
- Module 2 status: CERTIFIED / PASS

GOVERNANCE REQUIREMENTS:

1. DO NOT run Module 3 production benchmarking.
2. DO NOT calculate any production benchmark price.
3. DO NOT calculate or claim savings/opportunity values.
4. DO NOT modify PCBI Master V1.0.
5. DO NOT populate, overwrite, estimate, interpolate, synthesize or default any PCBI index values.
6. PCBI Master V1.0 must remain READ-ONLY and IMMUTABLE.
7. Module 4 must remain STRICTLY DISCONNECTED.
8. Do not modify the source purchase-history workbook.
9. Do not duplicate or transform the source dataset.
10. Do not rerun Module 1 or Module 2 unless specifically instructed.

IMPORTANT DISTINCTION:

Any Module 3 controlled-test / engine-validation results already generated must be classified strictly as:
"NON-PRODUCTION LOGIC VALIDATION ONLY"

They must NOT be represented as:
- production benchmarking,
- market-index benchmarking,
- realized savings,
- benchmark savings,
- procurement opportunity,
- customer savings.

The ₹0.00 opportunity currently reported by the system must remain ₹0.00 because the PCBI index source is SOURCE_PENDING.

FINAL STATE REQUIRED:

MODULE 1 = CERTIFIED
MODULE 2 = CERTIFIED
MODULE 3 PRODUCTION = DISCONNECTED / BLOCKED
PCBI MASTER V1.0 = UNMODIFIED / READ-ONLY
MODULE 4 = DISCONNECTED

Now generate ONE final consolidated PRE-PCBI VALIDATION REPORT containing:

A. Module 1 source-to-ingestion reconciliation
B. Module 1 data-quality audit
C. Module 2 taxonomy / UNSPSC audit
D. Module 2 spend-category reconciliation
E. Service isolation
F. Unmapped-spend analysis
G. 80% Pareto analysis
H. Strategic sourcing opportunity identification WITHOUT savings claims
I. Module 1 → Module 2 lineage
J. Module 2 → PCBI eligibility bridge
K. PCBI Master integrity check
L. PCBI readiness / missing-data assessment
M. Explicit production gate decision

The final conclusion must be:

"MODULES 1 AND 2 VALIDATED. PCBI PRODUCTION BENCHMARKING BLOCKED PENDING VERIFIED MARKET-INDEX DATA."

STOP AFTER GENERATING THIS REPORT.
DO NOT EXECUTE MODULE 3 PRODUCTION BENCHMARKING.
DO NOT EXECUTE MODULE 4.

---

## Prompt 170
START PCBI MASTER DATA SOURCE-MAPPING PHASE

Modules 1 and 2 are FROZEN and CERTIFIED.

DO NOT modify Modules 1 or 2.

DO NOT run Module 3 production benchmarking.

DO NOT calculate savings or opportunity.

DO NOT populate PCBI index values yet.

DO NOT modify PCBI_MASTER_V1.0.

OBJECTIVE:

Create the authoritative PCBI 290-Series Source Register.

For every one of the 290 PCBI Technical IDs, create exactly one source-mapping record containing:

1. PCBI Technical ID
2. Sector
3. Category
4. Benchmark Description
5. Benchmark Type:
   DIRECT / CONSTITUENT / PROXY / NON_BENCH
6. Quality:
   A / B / C
7. Unit
8. Currency
9. Geography
10. Specification / Grade
11. Required Market Variable
12. Recommended Benchmark Source
13. Source Publisher
14. Source Type
15. FREE / PAID / LICENSED / MANUAL
16. Historical Data Availability
17. Required Period:
    April 2020 to September 2026
18. Frequency:
    Weekly / Monthly / Daily / Other
19. Weekly Data Availability
20. Source URL / Reference
21. Source Confidence
22. Source Status
23. Data Gap
24. Recommended Action

SOURCE STATUS must be exactly one of:

VERIFIED_FREE
VERIFIED_PAID
LICENSED
MANUAL_AUTHENTICATED
PARTIAL_HISTORY
FREQUENCY_MISMATCH
SPECIFICATION_MISMATCH
SOURCE_NOT_IDENTIFIED
NOT_BENCHMARKABLE

IMPORTANT:

Do not invent sources.

Do not assume that a similarly named commodity is equivalent.

Do not use an unrelated index simply to increase coverage.

Do not populate any benchmark values.

Do not modify PCBI Master.

After completing the 290-series register, produce:

A. Total series by source status
B. FREE source coverage
C. PAID source coverage
D. LICENSED source coverage
E. MANUAL data coverage
F. SOURCE_NOT_IDENTIFIED
G. NOT_BENCHMARKABLE
H. Estimated spend coverage represented by each group using the current Module 2 customer dataset
I. Top 50 PCBI series by customer spend
J. Top 50 PCBI series where additional paid data could potentially increase benchmark coverage

MOST IMPORTANT:

Calculate the potential customer-spend coverage associated with each source category.

Do NOT calculate savings.

Do NOT run Module 3.

Do NOT modify any benchmark values.

STOP after producing the Source Register and Coverage Analysis.

---

## Prompt 171
PCBI SOURCE REGISTER — SECOND-LEVEL METHODOLOGY AUDIT

DO NOT populate any PCBI index values.

DO NOT run Module 3 production benchmarking.

DO NOT modify PCBI Master V1.0.

DO NOT calculate savings or opportunity.

Module 1 and Module 2 remain FROZEN / CERTIFIED.

Audit the newly created 290-series PCBI Source Register before any commercial data is purchased.

OBJECTIVE:

Validate the LOGIC of the source mapping, not the market prices.

1. RECONCILE SOURCE STATUS COUNTS

The current report states:

VERIFIED_FREE = 3
VERIFIED_PAID = 25
LICENSED = 3
MANUAL_AUTHENTICATED = 7
PARTIAL_HISTORY = 0
FREQUENCY_MISMATCH = 201
SPECIFICATION_MISMATCH = 0
SOURCE_NOT_IDENTIFIED = 23
NOT_BENCHMARKABLE = 28

Confirm that these equal exactly 290.

Then explain exactly how the report derived:

FREE / PUBLIC = 255 SERIES.

If 255 cannot be mathematically derived from the permitted source-status categories, mark this as a DATA-QUALITY DEFECT and correct the reporting logic.

Do not silently change the underlying classifications.

2. AUDIT THE TOP 15 SERIES

For each of the top 15 PCBI series, verify:

PCBI ID
Benchmark description
Customer spend
Benchmark type
Quality
Source status
Recommended source
Unit
Currency
Geography
Specification / grade
Direct / Constituent / Proxy methodology
Reason the source is considered equivalent

3. CRITICAL REVIEW OF PCBI-0288

PCBI-0288 currently represents approximately ₹2,708.47 Cr / 45.75% of customer spend.

Do NOT accept "LME / BigMint" as sufficient source validation.

Determine whether Stainless Steel should be classified as:

DIRECT
CONSTITUENT
PROXY
NON_BENCH

Explicitly document:

A. What exact stainless-steel market series will be used?
B. What exact grade/specification does it represent?
C. What geography does it represent?
D. What currency/unit does it use?
E. What historical period is available?
F. If constituent-based, identify every constituent and weighting methodology.
G. If proxy-based, provide the documented rationale and correlation requirement.
H. Identify whether BigMint actually provides the required historical series.
I. Identify whether LME is being used for a constituent rather than as a direct Stainless Steel benchmark.

Do not approve PCBI-0288 merely because LME Nickel is related to stainless steel.

4. AUDIT PCBI-0289

Perform the same technical validation for:

PCBI-0289
Steel / Bulk Ferroalloys
₹2,502.65 Cr
42.27% of customer spend

Identify exactly which market series will benchmark this spend.

Do not treat "Steel" as a single homogeneous benchmark if the underlying customer transactions contain materially different grades/products.

5. AUDIT ALL 201 FREQUENCY_MISMATCH SERIES

For each series define:

SOURCE FREQUENCY
TARGET PCBI FREQUENCY
EFFECTIVE DATE RULE
WEEK ASSIGNMENT RULE
HOLIDAY RULE
PUBLICATION-LAG RULE
MISSING-DATE RULE

Confirm that the methodology is STEP-FUNCTION ONLY where appropriate.

NO interpolation.
NO synthetic weekly market prices.
NO averaging unless the source itself publishes an average.

6. CREATE A SOURCE HIERARCHY

For each series assign:

PRIMARY SOURCE
SECONDARY SOURCE
FALLBACK SOURCE

with the following hierarchy:

1. Official exchange / government / statutory source
2. Authorized Price Reporting Agency
3. Recognized commercial market-data provider
4. Authenticated corporate circular
5. Proxy / constituent methodology
6. No benchmark

7. COMMERCIAL DATA ACQUISITION PLAN

After completing the audit, calculate:

A. Customer spend benchmarkable using verified FREE data
B. Customer spend requiring PAID PRA data
C. Customer spend requiring LICENSED exchange data
D. Customer spend requiring authenticated corporate data
E. Customer spend requiring constituent methodology
F. Customer spend with no defensible benchmark

Do not call a series "commercially unlocked" unless its actual source and methodology have been technically validated.

8. FINAL GATE

Produce one of:

PASS — SOURCE METHODOLOGY READY FOR DATA ACQUISITION

or

HOLD — SOURCE METHODOLOGY REQUIRES CORRECTION

The gate must remain HOLD if:

- the 255 FREE-series figure cannot be reconciled;
- PCBI-0288 methodology is unresolved;
- PCBI-0289 methodology is unresolved;
- frequency conversion methodology is undefined;
- a benchmark source is not specification-equivalent;
- any source is being treated as verified without evidence.

STOP AFTER THIS AUDIT.

DO NOT POPULATE PCBI MASTER.
DO NOT RUN MODULE 3.
DO NOT RUN MODULE 4.

















---

## Prompt 172
PCBI SOURCE REGISTER V1.1 � METHODOLOGY REMEDIATION COMMAND
[Full prompt text as submitted � remediate access-tier logic, grade-stratify PCBI-0288, commodity-stratify PCBI-0289, document 201 FM methodology, reconcile all 290 series to customer spend, produce commercial acquisition matrix, run second-level QA, output 8 artifacts, final gate: READY_FOR_DATA_ACQUISITION or HOLD.]

---

## Prompt 173
PCBI V1.1 � PHASE 2 BOUNDARY RECONCILIATION. Module 2 read-only. Re-derive PCBI-0288 and PCBI-0289 spend using material code + UNSPSC. Resolve ?968.89 Cr gap (0288), ?486.98 Cr gap (0289), ?7.06 Cr discrepancy. Produce 7 output artifacts. Final gate: READY_FOR_SOURCE_VALIDATION or HOLD. No keyword-only classification. No PCBI Master modification. No index values. No savings.
 
---

## Prompt 174
continue

---

## Prompt 175
PCBI V1.1.2 — MICRO-RECONCILIATION BEFORE SOURCE VALIDATION

MODE:
READ-ONLY / FORENSIC AUDIT
NO PRODUCTION BENCHMARKING
NO PCBI MASTER MODIFICATION
NO SAVINGS CALCULATION
NO COMMERCIAL DATA PURCHASE
MODULE 1 AND MODULE 2 REMAIN FROZEN

OBJECTIVE:
Perform a transaction-level reconciliation of PCBI-0288 and PCBI-0289 after
the V1.1.1 Module-2 UNSPSC re-attribution.

MANDATORY CHECK 1 — PCBI-0288
Reconcile:

V1.0 baseline
=
0288 direct certified
+ 0288 constituent pool
+ 0288 reclassified non-core

Show:
- exact transaction count
- exact INR amount
- exact variance in INR
- exact variance in Cr
- transaction IDs contributing to any variance

MANDATORY CHECK 2 — PCBI-0289
Reconcile:

V1.0 baseline ₹2,502.6453 Cr

against:

Direct certified ₹2,007.9481 Cr
+ Constituent ₹306.0620 Cr
+ Reclassified non-core ₹188.6340 Cr

DO NOT ASSUME ROUNDING.

The displayed figures currently imply:
₹2,502.6441 Cr versus ₹2,502.6453 Cr
= ₹0.0012 Cr = ₹1,20,000 variance.

Trace this difference to the underlying Module-2 transactions.

MANDATORY CHECK 3 — PREVIOUS ₹7.06 Cr STATEMENT

Trace the historical ₹7.06 Cr discrepancy statement.

Identify:
1. What exact transactions created the original ₹7.06 Cr discrepancy?
2. Where those transactions are now classified?
3. Whether ₹7.06 Cr was a genuine discrepancy, a display/aggregation issue,
   or a calculation-definition issue.
4. Provide before/after transaction-level evidence.

MANDATORY CHECK 4 — ROUNDING

Perform all reconciliation calculations using raw INR transaction values.

Do NOT reconcile using rounded ₹ Cr values.

Only after exact INR reconciliation may the result be converted to ₹ Cr
for reporting.

MANDATORY CHECK 5 — DOUBLE COUNTING / OMISSION

Verify that every transaction belonging to the original PCBI-0288 and
PCBI-0289 pools appears exactly once in:

A. Direct certified
B. Constituent
C. Reclassified non-core
D. Explicitly excluded category, if applicable

No transaction may appear twice.
No transaction may disappear.

OUTPUT:

1. PCBI_0288_0289_MICRO_RECONCILIATION_V1_1_2.json
2. PCBI_0288_0289_TRANSACTION_EXCEPTION_LOG.json
3. PCBI_V1_1_2_MICRO_RECONCILIATION_REPORT.md

FINAL GATE:

If exact variance = ₹0.00:
    STATUS = RECONCILIATION_CERTIFIED

If any variance > ₹0.00:
    STATUS = RECONCILIATION_HOLD

Do NOT proceed to source validation until the exact INR reconciliation
is certified.

Do NOT modify PCBI Master V1.0.
Do NOT populate any PCBI index values.
Do NOT calculate savings.
Do NOT connect Module 4.

---

## Prompt 176
===============================================================
PCBI V1.2 — PHASE 3 SOURCE VALIDATION & HISTORICAL DATA FEASIBILITY
===============================================================

MODE:
READ-ONLY / FORENSIC SOURCE VALIDATION

CURRENT GATE:
RECONCILIATION_CERTIFIED

NEXT GATE:
READY_FOR_SOURCE_ACQUISITION

STRICTLY PROHIBITED:
- No PCBI Master V1.0 modification
- No benchmark index population
- No synthetic prices
- No estimated prices
- No default/substitute prices
- No savings calculation
- No opportunity calculation
- No Module 4 connection
- No commercial subscription purchase
- No production Module 3 execution

MODULE 1:
FROZEN / CERTIFIED

MODULE 2:
FROZEN / CERTIFIED / CLASSIFICATION AUTHORITY

PCBI MASTER V1.0:
READ-ONLY / IMMUTABLE


===============================================================
OBJECTIVE
===============================================================

Validate the source methodology for ALL 290 PCBI technical IDs.

The objective is NOT to populate benchmark values.

The objective is to determine, for every PCBI series:

1. Whether a legitimate benchmark source exists.
2. Whether the source is specification-equivalent.
3. Whether the source covers the required geography.
4. Whether the source has sufficient historical depth.
5. Whether the source has the required frequency.
6. Whether the source has a documented publication methodology.
7. Whether historical data from April 2020 through September 2026
   can actually be obtained.
8. Whether the data can legally and technically be acquired.
9. Whether the proposed source is DIRECT, CONSTITUENT or PROXY.
10. Whether the source is acceptable for production PCBI calculation.


===============================================================
AUTHORITATIVE INPUTS
===============================================================

Use only:

A. PCBI_SOURCE_REGISTER_V1_1_1
B. PCBI_0288_MODULE2_REATTRIBUTION
C. PCBI_0289_MODULE2_REATTRIBUTION
D. PCBI_0288_0289_RECONCILIATION
E. PCBI_METHODOLOGY_QA_V1_1_1
F. MODULE 2 CERTIFIED UNSPSC / MATERIAL-CODE REGISTRY
G. Existing PCBI methodology rules

Do NOT use keyword matching to redefine commodities.

Do NOT change Module 2 classifications.


===============================================================
SOURCE STATUS TAXONOMY
===============================================================

Every PCBI series must end in exactly ONE of these statuses:

1. VERIFIED_FREE
2. VERIFIED_PAID
3. LICENSED
4. MANUAL_AUTHENTICATED
5. PENDING_METHODOLOGY
6. SOURCE_UNRESOLVED
7. NO_BENCHMARK

Do NOT use:
FREE
PUBLIC
AVAILABLE
LIKELY_AVAILABLE
ASSUMED_AVAILABLE

unless accompanied by an explicit approved source-status enum.


===============================================================
MANDATORY SOURCE VALIDATION FIELDS
===============================================================

For every PCBI ID PCBI-0001 through PCBI-0290 create:

PCBI_ID
Benchmark_Name
Commodity
Grade / Specification
Module_2_UNSPSC
Material_Groups
Customer_Spend_INR
Customer_Spend_Cr
Transaction_Count

Benchmark_Route:
DIRECT / CONSTITUENT / PROXY / NO_BENCHMARK

Proposed_Source
Source_Organization
Source_Product_or_Series
Source_Status
Access_Tier

Geography
Currency
Unit
Frequency
Publication_Methodology
Publication_Lag_Days

Historical_Start_Date
Historical_End_Date
Historical_Depth_Status

Specification_Equivalence:
EXACT / ACCEPTABLE / PARTIAL / NOT_EQUIVALENT / UNKNOWN

Historical_Availability:
VERIFIED / PARTIAL / UNVERIFIED / NOT_AVAILABLE

Data_Acquisition_Method:
API / DOWNLOAD / FILE / MANUAL / LICENSED_FEED / CORPORATE_CIRCULAR

API_Availability:
YES / NO / UNKNOWN

Commercial_Requirement:
NONE / SUBSCRIPTION / LICENSE / MANUAL_PERMISSION / UNKNOWN

License_Restriction

Source_URL
Source_Document
Source_Evidence

Validation_Quality:
A / B / C / UNVERIFIED

Final_Source_Validation:
PASS / HOLD / REJECT


===============================================================
CRITICAL RULE — SOURCE ≠ SOURCE NAME
===============================================================

Do NOT mark a series as validated merely because a reputable
organization exists.

The actual benchmark series must be identified.

Example:

"LME" alone is NOT sufficient.

The record must identify:
- exact commodity
- exact LME series
- unit
- currency
- frequency
- historical availability
- specification relationship
- source evidence

Likewise:

"BigMint" alone is NOT sufficient.

Identify the exact BigMint benchmark/product/series and establish
whether historical data from April 2020 onward actually exists.


===============================================================
CRITICAL RULE — SPECIFICATION EQUIVALENCE
===============================================================

A source cannot be classified as DIRECT merely because it represents
the same broad commodity family.

Examples requiring explicit validation:

Stainless Steel 201
Stainless Steel 304 / 304L
Stainless Steel 316 / 316L / 317
Stainless Steel 410
Mixed Stainless Scrap
Billets

These must NOT automatically share one benchmark.

Similarly PCBI-0289 must remain stratified:

0289A Ferro Molybdenum
0289B HC Ferro Chrome
0289C Ferro Silicon
0289D Silico Manganese
0289E Ferro Manganese
0289F HMS
0289G Pig Iron
0289H MoO3

Each requires its own source validation.

No broad "Steel Index" may be used as a substitute.


===============================================================
CONSTITUENT BENCHMARK RULE
===============================================================

For constituent routes, explicitly document:

Finished material
↓
Constituent
↓
Constituent percentage / physical relationship
↓
Source benchmark
↓
Transformation methodology

Do NOT calculate the transformed price.

Only validate whether the source and methodology are sufficient.


===============================================================
FREQUENCY-MISMATCH RULE
===============================================================

For all 201 FREQUENCY_MISMATCH series:

NO interpolation.

NO synthetic weekly prices.

NO averaging.

NO linear estimation.

The methodology must document:

Published Frequency
Publication Date
Effective Date
Lag
Step-Function Rule
Carry-Forward Rule
DATA_GAP Flag
Holiday Treatment

For monthly source data:

First Monday of applicable month =
effective benchmark week,

subject to the approved publication-lag methodology.

If publication is unavailable:

carry forward previous validated publication and flag DATA_GAP.

Do not fabricate a value.


===============================================================
HISTORICAL DEPTH TEST
===============================================================

For every source determine whether actual historical observations exist
for the required period:

01-Apr-2020 through 30-Sep-2026.

Classify:

FULL:
Complete verified historical coverage.

PARTIAL:
Some historical periods available but gaps exist.

UNVERIFIED:
Source appears plausible but historical depth has not been proven.

NOT_AVAILABLE:
Required historical series does not exist.

A source with current prices but no verified historical depth
MUST NOT be marked SOURCE_VALIDATED.


===============================================================
SPECIAL VALIDATION — HIGH-VALUE SERIES
===============================================================

Perform enhanced validation for all series with customer spend
greater than ₹25 Cr.

At minimum inspect:

PCBI-0288A
PCBI-0288B
PCBI-0288C
PCBI-0288D
PCBI-0288E
PCBI-0288F

PCBI-0289A
PCBI-0289B
PCBI-0289C
PCBI-0289D
PCBI-0289E
PCBI-0289F
PCBI-0289G
PCBI-0289H

and all other series exceeding ₹25 Cr.

No high-value series may pass merely on source-name plausibility.


===============================================================
COMMERCIAL SOURCE VALIDATION
===============================================================

For each PAID or LICENSED source determine:

1. Exact subscription/product required
2. Historical data availability
3. Historical start date
4. Historical frequency
5. API availability
6. Bulk-download availability
7. Licensing restrictions
8. Redistribution restrictions
9. Indicative commercial requirement
10. Whether data can legally be stored inside PCBI
11. Whether data can be used for derived benchmark calculations
12. Whether customer-facing derived values can be displayed

DO NOT PURCHASE ANY DATA.

This phase only determines acquisition feasibility.


===============================================================
MANDATORY SOURCE EVIDENCE
===============================================================

Every PASS must contain evidence.

Acceptable evidence:

- Official source documentation
- Official methodology document
- Official historical dataset
- Official API documentation
- Official price bulletin
- Official corporate circular
- Licensed-data documentation
- Clearly identified authoritative publication

A generic Google/search result is NOT evidence.

A third-party statement claiming that a dataset exists is NOT sufficient.


===============================================================
SOURCE QUALITY RATING
===============================================================

A:
Exact benchmark / specification equivalence
+ authoritative source
+ verified historical coverage
+ documented methodology

B:
Strong authoritative source
+ acceptable benchmark relationship
+ minor limitations documented

C:
Proxy / incomplete / partially equivalent
or insufficient historical evidence.

UNVERIFIED:
Evidence insufficient to establish benchmark suitability.


===============================================================
MANDATORY OUTPUTS
===============================================================

Create:

1. PCBI_SOURCE_VALIDATION_MATRIX_V1_2.xlsx
2. PCBI_SOURCE_VALIDATION_MATRIX_V1_2.json
3. PCBI_SOURCE_EVIDENCE_REGISTER_V1_2.json
4. PCBI_HISTORICAL_DEPTH_AUDIT_V1_2.json
5. PCBI_COMMERCIAL_ACQUISITION_FEASIBILITY_V1_2.json
6. PCBI_HIGH_VALUE_SOURCE_AUDIT_V1_2.json
7. PCBI_SOURCE_VALIDATION_REPORT_V1_2.md


===============================================================
FINAL DASHBOARD
===============================================================

Report:

Total Series:
290

VERIFIED_FREE:
___ series
₹___ Cr

VERIFIED_PAID:
___ series
₹___ Cr

LICENSED:
___ series
₹___ Cr

MANUAL_AUTHENTICATED:
___ series
₹___ Cr

PENDING_METHODOLOGY:
___ series
₹___ Cr

SOURCE_UNRESOLVED:
___ series
₹___ Cr

NO_BENCHMARK:
___ series
₹___ Cr

---------------------------------------------------------------

Historical Coverage:

FULL:
___ series

PARTIAL:
___ series

UNVERIFIED:
___ series

NOT_AVAILABLE:
___ series


Specification Validation:

EXACT:
___

ACCEPTABLE:
___

PARTIAL:
___

NOT_EQUIVALENT:
___

UNKNOWN:
___


Commercial Acquisition:

FREE:
___ series

PAID:
___ series

LICENSED:
___ series

MANUAL:
___ series


===============================================================
FINAL GATE
===============================================================

The final result must be one of:

SOURCE_VALIDATION_READY

or

SOURCE_VALIDATION_HOLD

Use SOURCE_VALIDATION_READY only if:

1. Every benchmarkable series has a named source.
2. High-value series have specification validation.
3. Historical availability has been established.
4. No unsupported source assumptions remain.
5. No broad commodity index has been substituted for a
   specification-specific benchmark without documented methodology.
6. Frequency mismatch methodology is documented.
7. Commercial requirements are known.
8. Source evidence is attached/recorded.
9. No benchmark values have been populated.
10. No savings have been calculated.

If ANY of these conditions fail:

FINAL GATE = SOURCE_VALIDATION_HOLD

Provide an exception list with:
PCBI ID
Spend
Issue
Required Evidence
Recommended Action
Priority


===============================================================
ABSOLUTE GOVERNANCE RULE
===============================================================

THIS IS STILL A PRE-PRODUCTION VALIDATION STAGE.

DO NOT:

- Populate PCBI Master V1.0
- Generate historical index values
- Generate weekly benchmark values
- Calculate opportunity
- Calculate savings
- Connect Module 4
- Claim addressable savings
- Substitute missing market data
- Invent source values

The only permitted output is a defensible SOURCE VALIDATION MATRIX
and acquisition-readiness assessment.

===============================================================
END COMMAND
===============================================================

---

## Prompt 177
===============================================================
PCBI V1.2 — PHASE 3
SOURCE VALIDATION & HISTORICAL DATA FEASIBILITY AUDIT
===============================================================

MODE:
READ-ONLY / FORENSIC AUDIT / PRE-PRODUCTION

CURRENT STATUS:
RECONCILIATION_CERTIFIED

MODULE 1:
FROZEN / CERTIFIED

MODULE 2:
FROZEN / CERTIFIED
MODULE 2 MATERIAL-CODE + UNSPSC MAPPING IS THE CLASSIFICATION AUTHORITY

PCBI MASTER V1.0:
READ-ONLY / IMMUTABLE

MODULE 3:
BLOCKED

MODULE 4:
DISCONNECTED

===============================================================
OBJECTIVE
===============================================================

Do NOT populate benchmark values.

Do NOT calculate savings.

Do NOT calculate opportunity.

Do NOT modify PCBI Master V1.0.

The sole objective of this phase is to validate whether each
PCBI technical series has a defensible benchmark SOURCE and whether
that source can provide the required historical data.

Audit ALL 290 PCBI technical IDs.

Required historical period:

01-Apr-2020 through 30-Sep-2026

The final output must tell us:

1. What is the exact benchmark source?
2. Is the source authoritative?
3. Is the benchmark specification-equivalent?
4. Is historical data actually available?
5. What frequency does the source publish?
6. What is the publication lag?
7. Can weekly PCBI values be derived using the approved
   step-function methodology?
8. Is the source FREE, PAID, LICENSED or MANUAL?
9. Is API/download/manual access available?
10. Are there licensing or redistribution restrictions?
11. Is the source sufficiently proven to allow Phase 4 acquisition?

===============================================================
AUTHORITATIVE INPUTS
===============================================================

Use the following existing artifacts:

- PCBI_SOURCE_REGISTER_V1_1_1
- PCBI_0288_MODULE2_REATTRIBUTION
- PCBI_0289_MODULE2_REATTRIBUTION
- PCBI_0288_0289_RECONCILIATION
- PCBI_0288_0289_MICRO_RECONCILIATION_V1_1_2
- PCBI_METHODOLOGY_QA_V1_1_1
- PCBI_V1_1_2_MICRO_RECONCILIATION_REPORT
- Module 2 certified UNSPSC/material-code registry
- Existing PCBI methodology rules

DO NOT change any of these files.

===============================================================
IMPORTANT — DO NOT ASSUME PROPOSED SOURCES ARE VALIDATED
===============================================================

The sources mentioned in previous reports are PROPOSED SOURCES only.

Do not mark them validated merely because they appear in an earlier
PCBI report.

For example:

BigMint
LME
Platts
Fastmarkets
ICDA
SteelMint
WPI
IBM
IOCL
PPAC
IEX
etc.

must individually pass source validation.

===============================================================
SOURCE STATUS ENUMS
===============================================================

Every PCBI series must have exactly ONE:

VERIFIED_FREE
VERIFIED_PAID
LICENSED
MANUAL_AUTHENTICATED
PENDING_METHODOLOGY
SOURCE_UNRESOLVED
NO_BENCHMARK

Never use:

FREE
PUBLIC
AVAILABLE
LIKELY_AVAILABLE
ASSUMED_AVAILABLE

as final statuses.

===============================================================
MANDATORY RECORD FOR EVERY PCBI SERIES
===============================================================

Create a validation record containing:

PCBI_ID
Benchmark_Name
Commodity
Grade
Specification
Module_2_UNSPSC
Material_Group
Customer_Spend_INR
Customer_Spend_Cr
Transaction_Count

Benchmark_Route:
DIRECT / CONSTITUENT / PROXY / NO_BENCHMARK

Source_Organization
Source_Product
Source_Series
Source_Status
Access_Tier

Geography
Currency
Unit
Frequency
Publication_Methodology
Publication_Lag_Days

Historical_Start_Date
Historical_End_Date
Historical_Depth_Status

Specification_Equivalence:
EXACT
ACCEPTABLE
PARTIAL
NOT_EQUIVALENT
UNKNOWN

Historical_Availability:
VERIFIED
PARTIAL
UNVERIFIED
NOT_AVAILABLE

Acquisition_Method:
API
DOWNLOAD
FILE
MANUAL
LICENSED_FEED
CORPORATE_CIRCULAR

API_Availability:
YES / NO / UNKNOWN

Commercial_Requirement:
NONE
SUBSCRIPTION
LICENSE
MANUAL_PERMISSION
UNKNOWN

License_Restriction
Redistribution_Restriction

Source_URL
Source_Document
Source_Evidence

Validation_Quality:
A / B / C / UNVERIFIED

Final_Source_Validation:
PASS / HOLD / REJECT

Validation_Comment
Required_Next_Action

===============================================================
SOURCE EVIDENCE RULE
===============================================================

A source is NOT validated merely because an organization publishes
commodity information.

Evidence must establish the actual benchmark series.

For example:

"LME" is NOT sufficient.

Identify the exact LME commodity/contract/series, unit, currency,
frequency and historical availability.

"BigMint" is NOT sufficient.

Identify the exact BigMint benchmark/product/series and establish
whether historical data from 01-Apr-2020 exists.

"Steel index" is NOT sufficient for stainless steel grades.

===============================================================
SPECIFICATION-EQUIVALENCE RULE
===============================================================

Do not use broad commodity indexes as direct benchmarks when the
customer material specification is materially different.

In particular validate PCBI-0288 independently:

0288A — SS 201
0288B — SS 304 / 304L
0288C — SS 316 / 316L / 317
0288D — SS 410
0288E — Mixed Turning Scrap
0288F — Billets / Prime

Do not combine these into one generic Stainless Steel benchmark.

Also keep constituent Ferro Nickel separate.

===============================================================
PCBI-0289 VALIDATION
===============================================================

Validate independently:

0289A — Ferro Molybdenum
0289B — HC Ferro Chrome
0289C — Ferro Silicon 75%
0289D — Silico Manganese
0289E — HC Ferro Manganese
0289F — HMS India
0289G — Pig Iron
0289H — MoO3 Briquettes

Do not use one generic Steel index for these commodities.

Each must have its own source assessment.

===============================================================
CONSTITUENT ROUTE
===============================================================

Where Benchmark_Route = CONSTITUENT:

Document:

Customer Material
→ Constituent
→ Constituent relationship
→ Proposed market benchmark
→ Transformation methodology

Do not calculate the transformed benchmark price.

Only validate whether the source and methodology are defensible.

===============================================================
201 FREQUENCY-MISMATCH SERIES
===============================================================

For every FREQUENCY_MISMATCH series verify:

Source frequency
Publication date
Effective date
Publication lag
Step-function methodology
Carry-forward rule
DATA_GAP flag
Holiday treatment

ABSOLUTE RULES:

NO interpolation
NO averaging
NO synthetic prices
NO estimated weekly prices

If source is monthly:

Use the approved step-function methodology.

If a new publication is unavailable:

Carry forward the previous validated publication and mark:

DATA_GAP = CARRY_FORWARD

Do not invent a value.

===============================================================
HISTORICAL DEPTH
===============================================================

Required period:

01-Apr-2020 → 30-Sep-2026

Classify every source:

FULL
PARTIAL
UNVERIFIED
NOT_AVAILABLE

FULL means the required historical series has actually been verified.

A current source with no evidence of 2020 historical data is NOT FULL.

===============================================================
HIGH-VALUE SERIES
===============================================================

Perform enhanced forensic validation for every PCBI series with
customer spend > ₹25 Cr.

At minimum:

PCBI-0288A
PCBI-0288B
PCBI-0288C
PCBI-0288D
PCBI-0288E
PCBI-0288F

PCBI-0289A
PCBI-0289B
PCBI-0289C
PCBI-0289D
PCBI-0289E
PCBI-0289F
PCBI-0289G
PCBI-0289H

and every other PCBI series exceeding ₹25 Cr.

===============================================================
COMMERCIAL DATA VALIDATION
===============================================================

For PAID / LICENSED sources determine:

- Exact commercial product required
- Historical data availability
- Historical start date
- Frequency
- API availability
- Bulk download availability
- Approximate acquisition mechanism
- Licensing restrictions
- Redistribution restrictions
- Whether derived benchmark values can be stored
- Whether derived benchmark values can be displayed to customers
- Whether a one-time historical purchase is possible
- Whether an ongoing subscription is required

DO NOT purchase anything.

This is only a feasibility assessment.

===============================================================
SOURCE QUALITY
===============================================================

A = authoritative + specification-equivalent + historical evidence

B = authoritative + acceptable benchmark relationship but with
minor documented limitations

C = proxy / partial equivalence / incomplete evidence

UNVERIFIED = insufficient evidence

===============================================================
MANDATORY OUTPUTS
===============================================================

Generate:

1. PCBI_SOURCE_VALIDATION_MATRIX_V1_2.xlsx

2. PCBI_SOURCE_VALIDATION_MATRIX_V1_2.json

3. PCBI_SOURCE_EVIDENCE_REGISTER_V1_2.json

4. PCBI_HISTORICAL_DEPTH_AUDIT_V1_2.json

5. PCBI_COMMERCIAL_ACQUISITION_FEASIBILITY_V1_2.json

6. PCBI_HIGH_VALUE_SOURCE_AUDIT_V1_2.json

7. PCBI_SOURCE_VALIDATION_REPORT_V1_2.md

===============================================================
MANDATORY EXECUTIVE SUMMARY
===============================================================

Report exactly:

TOTAL PCBI SERIES = 290

VERIFIED_FREE:
Count
Spend

VERIFIED_PAID:
Count
Spend

LICENSED:
Count
Spend

MANUAL_AUTHENTICATED:
Count
Spend

PENDING_METHODOLOGY:
Count
Spend

SOURCE_UNRESOLVED:
Count
Spend

NO_BENCHMARK:
Count
Spend

Then:

HISTORICAL COVERAGE

FULL:
Count

PARTIAL:
Count

UNVERIFIED:
Count

NOT_AVAILABLE:
Count

Then:

SPECIFICATION VALIDATION

EXACT:
Count

ACCEPTABLE:
Count

PARTIAL:
Count

NOT_EQUIVALENT:
Count

UNKNOWN:
Count

Then:

COMMERCIAL REQUIREMENT

FREE:
Count

PAID:
Count

LICENSED:
Count

MANUAL:
Count

===============================================================
CRITICAL HIGH-VALUE TABLE
===============================================================

Create a separate table:

PCBI ID
Benchmark
Spend ₹Cr
Transactions
Source
Specification Match
Historical 2020-2026
Frequency
Access Type
Source Evidence
Validation Status
Priority
Next Action

Sort this table by CUSTOMER SPEND DESCENDING.

===============================================================
EXCEPTION REGISTER
===============================================================

For every HOLD or REJECT create:

PCBI ID
Spend
Problem
Why Current Source Is Insufficient
Evidence Required
Potential Source
Commercial Requirement
Priority
Recommended Next Action

===============================================================
FINAL GATE
===============================================================

Set:

SOURCE_VALIDATION_READY

ONLY IF:

1. All benchmarkable series have an identified source.
2. High-value series have specification validation.
3. Historical depth has been verified.
4. No source is accepted merely because it was proposed previously.
5. No generic commodity benchmark is incorrectly used as a
   specification-specific benchmark.
6. Frequency mismatch methodology is documented.
7. Commercial requirements are known.
8. Source evidence exists.
9. No benchmark values have been populated.
10. No savings or opportunity values have been calculated.

Otherwise:

FINAL GATE = SOURCE_VALIDATION_HOLD

===============================================================
ABSOLUTE PRODUCTION LOCK
===============================================================

DO NOT:

- Populate PCBI Master V1.0
- Create weekly benchmark values
- Create historical index values
- Calculate savings
- Calculate opportunity
- Connect Module 4
- Modify Module 1
- Modify Module 2
- Purchase commercial data
- Invent missing market prices
- Estimate unavailable historical prices
- Treat assumptions as verified sources

ONLY produce the SOURCE VALIDATION and DATA ACQUISITION
FEASIBILITY outputs.

===============================================================
END — PCBI V1.2 PHASE 3
===============================================================

## Prompt 178

===============================================================
PCBI V1.2.1 — SOURCE VALIDATION CLOSURE & PRODUCTION READINESS AUDIT
===============================================================

MODE:
READ-ONLY / FORENSIC QA / PRE-PRODUCTION

DO NOT:
- Populate benchmark values
- Modify PCBI Master V1.0
- Modify Module 1
- Modify Module 2
- Calculate savings
- Calculate opportunity
- Purchase any commercial data
- Connect Module 4

MODULE 3 REMAINS BLOCKED.

===============================================================
OBJECTIVE
===============================================================

Perform a final closure audit of the PCBI V1.2 Phase 3 Source
Validation results.

The purpose is to determine exactly:

A. Which PCBI series are genuinely source-ready.
B. Which series require methodology closure.
C. Which series require publisher confirmation.
D. Which series require commercial access.
E. Which series are permanently NO_BENCHMARK.
F. Whether the PCBI source register is internally consistent.
G. Whether any terminology or classification ambiguity remains.

Do NOT perform benchmark population.

===============================================================
AUTHORITATIVE FILES
===============================================================

Use:

PCBI_SOURCE_VALIDATION_MATRIX_V1_2
PCBI_SOURCE_EVIDENCE_REGISTER_V1_2
PCBI_HISTORICAL_DEPTH_AUDIT_V1_2
PCBI_COMMERCIAL_ACQUISITION_FEASIBILITY_V1_2
PCBI_HIGH_VALUE_SOURCE_AUDIT_V1_2
PCBI_SOURCE_VALIDATION_REPORT_V1_2

Also use:

PCBI_SOURCE_REGISTER_V1_1_1
PCBI_0288_MODULE2_REATTRIBUTION
PCBI_0289_MODULE2_REATTRIBUTION
PCBI_0288_0289_RECONCILIATION
PCBI_0288_0289_MICRO_RECONCILIATION_V1_1_2

Module 2 remains the classification authority.

===============================================================
TEST 1 — 290 SERIES COMPLETENESS
===============================================================

Verify:

PCBI-0001 through PCBI-0290

Exactly 290 unique technical IDs.

Check:

Missing IDs
Duplicate IDs
Unexpected IDs
Orphan source records
Orphan spend records

Output:

TOTAL_IDS
UNIQUE_IDS
MISSING_IDS
DUPLICATE_IDS
ORPHAN_IDS

Expected:

290
290
0
0
0

===============================================================
TEST 2 — SOURCE STATUS VS COMMERCIAL ACCESS
===============================================================

CRITICAL GOVERNANCE REQUIREMENT:

Do NOT mix these concepts.

Maintain two completely independent fields:

SOURCE_STATUS

and

COMMERCIAL_ACCESS_REQUIREMENT

SOURCE_STATUS permitted values:

VERIFIED_FREE
VERIFIED_PAID
LICENSED
MANUAL_AUTHENTICATED
PENDING_METHODOLOGY
SOURCE_UNRESOLVED
NO_BENCHMARK

COMMERCIAL_ACCESS_REQUIREMENT permitted values:

NONE
PAID_SUBSCRIPTION
LICENSE
MANUAL_ACCESS
UNKNOWN

Do NOT use "FREE" as a Source Status.

Do NOT infer:

PENDING_METHODOLOGY = FREE

Do NOT infer:

SOURCE_UNRESOLVED = FREE

Do NOT infer:

NO_BENCHMARK = FREE

Create a cross-tab:

SOURCE_STATUS
vs
COMMERCIAL_ACCESS_REQUIREMENT

Report count and spend for every combination.

===============================================================
TEST 3 — HIGH-VALUE SOURCE READINESS
===============================================================

For every series with spend > ₹25 Cr, determine:

PCBI_ID
Spend
Source
Specification Match
Historical Depth
Commercial Access
Source Evidence
Final Readiness

Allowed Final Readiness:

READY_FOR_ACQUISITION
READY_AFTER_METHODOLOGY_SIGNOFF
PUBLISHER_CONFIRMATION_REQUIRED
COMMERCIAL_ACCESS_REQUIRED
SOURCE_UNRESOLVED
NO_BENCHMARK

Do not mark a series READY merely because a source organization
has been identified.

===============================================================
TEST 4 — PCBI-0288
===============================================================

Independently verify:

0288A SS 201
0288B SS 304/304L
0288C SS 316/316L/317
0288D SS 410
0288E Mixed Turning Scrap
0288F Billets/Prime
0288_FeNi Constituent

Verify:

Spend reconciliation
Transaction reconciliation
Source
Specification equivalence
Historical depth
Commercial requirement

SPECIAL RULE:

BigMint 2020 historical depth must remain:

UNVERIFIED

unless explicit publisher evidence exists.

Do not upgrade it based on assumption.

===============================================================
TEST 5 — PCBI-0289
===============================================================

Independently verify:

0289A FeMo
0289B HC FeCr
0289C FeSi
0289D SiMn
0289E HC FeMn
0289F HMS
0289G Pig Iron
0289H MoO3

No generic "Steel" benchmark may be used.

Verify each source independently.

===============================================================
TEST 6 — 201 FREQUENCY-MISMATCH SERIES
===============================================================

Verify every frequency-mismatch series has:

Named source
Frequency
Publication lag
Effective-date rule
Step-function rule
Carry-forward rule
DATA_GAP flag

Absolute prohibition:

NO interpolation
NO averaging
NO synthetic weekly prices

If methodology is incomplete:

READY_AFTER_METHODOLOGY_SIGNOFF

not READY_FOR_ACQUISITION.

===============================================================
TEST 7 — HISTORICAL DEPTH
===============================================================

Required period:

01-Apr-2020 through 30-Sep-2026

Classify each:

FULL
PARTIAL
UNVERIFIED
NOT_AVAILABLE

Do not convert UNVERIFIED into FULL without documentary evidence.

===============================================================
TEST 8 — COMMERCIAL ACQUISITION
===============================================================

Create a precise acquisition list containing only sources that
actually require commercial access.

For each:

Publisher
Series
Historical period
Frequency
Product/feed
Access type
Estimated cost
Cost confidence:

CONFIRMED
INDICATIVE
UNKNOWN

IMPORTANT:

Existing cost figures such as ₹29–49 lakh/year must NOT be presented
as confirmed prices unless supported by an actual quotation or
contract.

Label them:

INDICATIVE — NOT QUOTED

===============================================================
TEST 9 — CLIENT-READINESS CLASSIFICATION
===============================================================

For each series assign exactly one:

1. SOURCE_READY
2. METHODOLOGY_SIGNOFF_REQUIRED
3. PUBLISHER_CONFIRMATION_REQUIRED
4. COMMERCIAL_ACCESS_REQUIRED
5. SOURCE_UNRESOLVED
6. NO_BENCHMARK

Create spend totals for each category.

===============================================================
TEST 10 — FINAL PCBI READINESS
===============================================================

Determine:

TOTAL PCBI SPEND
SOURCE_READY SPEND
METHODOLOGY_PENDING SPEND
PUBLISHER_CONFIRMATION SPEND
COMMERCIAL_ACCESS SPEND
SOURCE_UNRESOLVED SPEND
NO_BENCHMARK SPEND

Also calculate:

% CUSTOMER SPEND READY
% CUSTOMER SPEND BLOCKED

Do not calculate savings.

===============================================================
MANDATORY OUTPUTS
===============================================================

Create:

PCBI_V1_2_1_SOURCE_CLOSURE_AUDIT.xlsx

PCBI_V1_2_1_SOURCE_CLOSURE_AUDIT.json

PCBI_V1_2_1_SOURCE_CLOSURE_REPORT.md

PCBI_V1_2_1_HIGH_VALUE_READINESS_MATRIX.xlsx

PCBI_V1_2_1_COMMERCIAL_ACQUISITION_LIST.xlsx

===============================================================
FINAL GATE
===============================================================

If any of the following remain:

- unresolved source
- unverified historical depth
- specification mismatch
- missing methodology
- missing publisher evidence
- commercial access requirement

then:

FINAL GATE = SOURCE_VALIDATION_HOLD

Otherwise:

FINAL GATE = READY_FOR_PHASE_4_ACQUISITION

IMPORTANT:

READY_FOR_PHASE_4_ACQUISITION does NOT mean benchmark population
is authorized.

It only means source validation is complete and we can decide
whether/when to acquire data.

===============================================================
ABSOLUTE PRODUCTION LOCK
===============================================================

At the end of this command:

Benchmark values = 0
Savings = 0
Opportunity = 0
Module 3 = BLOCKED
Module 4 = DISCONNECTED
Module 1 = FROZEN
Module 2 = FROZEN
PCBI Master V1.0 = IMMUTABLE

STOP AFTER GENERATING THE AUDIT.

===============================================================
END V1.2.1
===============================================================

## Prompt 179

===============================================================
PCBI V1.2.2 — COMMERCIAL DATA ACQUISITION DECISION PACK
===============================================================

MODE:
READ-ONLY / COMMERCIAL PLANNING / PRE-PRODUCTION

IMPORTANT:
DO NOT populate PCBI benchmark values.
DO NOT modify Module 1.
DO NOT modify Module 2.
DO NOT modify PCBI Master V1.0.
DO NOT calculate savings.
DO NOT calculate opportunity.
DO NOT connect Module 4.
MODULE 3 MUST REMAIN BLOCKED.

This command is ONLY to determine the minimum commercial data
that should be acquired, based on customer spend coverage and
source readiness.

===============================================================
AUTHORITATIVE INPUTS
===============================================================

Use:

PCBI_V1_2_1_SOURCE_CLOSURE_AUDIT
PCBI_V1_2_1_HIGH_VALUE_READINESS_MATRIX
PCBI_V1_2_1_COMMERCIAL_ACQUISITION_LIST
PCBI_V1_2_1_SOURCE_CLOSURE_REPORT

Also use:

PCBI_SOURCE_REGISTER_V1_1_1
PCBI_0288_MODULE2_REATTRIBUTION
PCBI_0289_MODULE2_REATTRIBUTION
PCBI_0288_0289_MICRO_RECONCILIATION_V1_1_2

Module 2 remains the classification authority.

===============================================================
OBJECTIVE
===============================================================

Determine the MINIMUM practical commercial data acquisition
strategy for PCBI.

The objective is NOT maximum data purchase.

The objective is:

MINIMUM COST
+
MAXIMUM VALIDATED SPEND COVERAGE
+
MAXIMUM HISTORICAL COVERAGE
+
MINIMUM NUMBER OF VENDORS
+
NO SPECIFICATION MISMATCH

===============================================================
RULE 1 — DO NOT ASSUME SOURCE VALIDITY
===============================================================

For every proposed commercial source classify:

SOURCE_CONFIDENCE:

CONFIRMED
PUBLISHER_CONFIRMATION_REQUIRED
PROPOSED_ONLY

Do NOT treat a proposed source as validated.

BigMint historical depth from 01-Apr-2020 remains:

UNVERIFIED

unless documentary evidence exists.

===============================================================
RULE 2 — SEPARATE THREE DIFFERENT THINGS
===============================================================

For every PCBI series maintain:

A. SOURCE VALIDITY
B. HISTORICAL DEPTH
C. COMMERCIAL ACCESS

Never combine these into a single assumption.

Example:

BigMint SS 304:

Source = Proposed / acceptable
Historical depth = UNVERIFIED
Commercial access = PAID

Therefore:

STATUS = PUBLISHER_CONFIRMATION_REQUIRED

NOT READY FOR BENCHMARKING.

===============================================================
RULE 3 — CREATE SOURCE-TO-SPEND MAP
===============================================================

Create a table:

Publisher
PCBI IDs
Commodity
Spend
% Customer Spend
Historical Period
Frequency
Specification Match
Source Status
Commercial Requirement
Historical Depth
Current Readiness
Evidence Required

===============================================================
RULE 4 — VENDOR CONSOLIDATION ANALYSIS
===============================================================

Determine how many vendors are actually required.

Evaluate whether one subscription can cover multiple PCBI series.

At minimum evaluate:

1. BigMint
2. LME
3. S&P Global Platts
4. ICDA
5. MMTA
6. Free Government Sources

Do NOT assume that purchasing one vendor's data eliminates
the need for another vendor where specification coverage differs.

===============================================================
RULE 5 — MINIMUM ACQUISITION SCENARIOS
===============================================================

Create FOUR scenarios.

SCENARIO A:
ZERO COMMERCIAL PURCHASE

Show:

Spend benchmarkable using already available validated/free
sources.

Spend blocked.

Coverage %.

Do NOT create benchmark values.

---------------------------------------------------------------

SCENARIO B:
MINIMUM COST

Identify the smallest commercial acquisition package that gives
the highest practical customer spend coverage.

Show:

Vendor
Estimated Annual Cost
Cost Confidence
PCBI Series Covered
Spend Covered
Incremental Spend Coverage
Cumulative Spend Coverage

Use:

INDICATIVE — NOT QUOTED

for every unconfirmed price.

---------------------------------------------------------------

SCENARIO C:
HIGH COVERAGE

Identify the commercial acquisition package required to cover
the maximum practical benchmarkable customer spend while
maintaining specification integrity.

Show:

Total estimated annual cost
Number of vendors
Spend covered
% coverage

---------------------------------------------------------------

SCENARIO D:
FULL PRACTICAL COVERAGE

Include:

Commercial sources
Free government sources
Manual corporate sources
Methodology sign-off sources

Exclude:

NO_BENCHMARK
SOURCE_UNRESOLVED

Show:

Total practical addressable spend
Remaining unresolved spend
Remaining non-benchmarkable spend

===============================================================
RULE 6 — PCBI-0288 SPECIAL ANALYSIS
===============================================================

Break down:

0288A SS 201
0288B SS 304/304L
0288C SS 316/316L/317
0288D SS 410
0288E Mixed Turning Scrap
0288F Billets / Prime
0288_FeNi

For each show:

Spend
Source
Historical depth
Commercial requirement
Publisher confirmation requirement

Calculate:

TOTAL PCBI-0288 SPEND
SPEND REQUIRING BIGMINT
SPEND REQUIRING LME
SPEND CURRENTLY UNVERIFIED

DO NOT combine LME Nickel constituent pricing with direct
stainless steel pricing.

===============================================================
RULE 7 — PCBI-0289 SPECIAL ANALYSIS
===============================================================

Break down:

0289A FeMo
0289B HC FeCr
0289C FeSi
0289D SiMn
0289E HC FeMn
0289F HMS
0289G Pig Iron
0289H MoO3
0289_FeNi

For each show:

Spend
Source
Historical depth
Commercial requirement
Publisher confirmation requirement

Calculate vendor-level coverage.

===============================================================
RULE 8 — FREE DATA
===============================================================

Identify all series that can be covered by genuinely free,
validated public sources.

Do NOT call a methodology-pending source "FREE".

Use:

VERIFIED_FREE

only where source availability is actually validated.

For WPI and similar monthly sources:

Commercial Access = NONE

but:

Readiness = METHODOLOGY_SIGNOFF_REQUIRED

until methodology approval.

===============================================================
RULE 9 — COST PER SPEND COVERED
===============================================================

For each commercial vendor calculate:

Estimated Annual Cost
/
Customer Spend Covered

Also calculate:

Cost per ₹100 Cr of customer spend covered.

Clearly label these as planning metrics, NOT ROI or savings.

DO NOT calculate procurement savings.

===============================================================
RULE 10 — HISTORICAL DEPTH
===============================================================

Required period:

01-Apr-2020 to 30-Sep-2026

For every commercial source classify:

FULL
PARTIAL
UNVERIFIED
NOT_AVAILABLE

Do not upgrade UNVERIFIED to FULL.

===============================================================
RULE 11 — DATA PURCHASE DECISION TABLE
===============================================================

Create a final table:

Vendor
Estimated Cost
Cost Confidence
Spend Covered
Coverage %
Historical Depth
Critical Dependency
Decision Status

Decision Status:

REQUIRED NOW
REQUIRED AFTER PUBLISHER CONFIRMATION
OPTIONAL
DEFER
NOT REQUIRED

Do NOT make assumptions about actual vendor pricing.

===============================================================
RULE 12 — CLIENT EXPANSION MODEL
===============================================================

Also determine:

Which data subscriptions are justified only if additional
customers require those commodities.

Separate:

CURRENT CUSTOMER REQUIREMENT

from:

FUTURE PRODUCT COVERAGE

This is important.

Do not recommend purchasing a broad data library merely to
populate the PCBI catalog.

===============================================================
FINAL MANAGEMENT SUMMARY
===============================================================

Generate a one-page management summary containing:

1. Current PCBI addressable spend
2. Currently source-ready spend
3. Spend requiring publisher confirmation
4. Spend requiring commercial access
5. Spend requiring methodology sign-off
6. Minimum commercial package
7. High-coverage commercial package
8. Number of vendors required
9. Estimated annual cost range
10. Historical-depth risks
11. Data acquisition dependencies

Do NOT state that any subscription should actually be purchased.

This is an acquisition planning exercise only.

===============================================================
MANDATORY OUTPUT FILES
===============================================================

Create:

PCBI_V1_2_2_DATA_ACQUISITION_DECISION_PACK.xlsx

PCBI_V1_2_2_DATA_ACQUISITION_DECISION_PACK.json

PCBI_V1_2_2_DATA_ACQUISITION_MANAGEMENT_SUMMARY.md

PCBI_V1_2_2_VENDOR_COVERAGE_MATRIX.xlsx

PCBI_V1_2_2_COST_COVERAGE_ANALYSIS.xlsx

===============================================================
FINAL SAFETY LOCK
===============================================================

Benchmark values = 0
Savings = 0
Opportunity = 0

Module 1 = FROZEN
Module 2 = FROZEN
PCBI Master V1.0 = IMMUTABLE
Module 3 = BLOCKED
Module 4 = DISCONNECTED

STOP AFTER GENERATING THE DATA ACQUISITION DECISION PACK.

===============================================================
END PCBI V1.2.2
===============================================================

## Prompt 180

PCBI V1.2.3 — FREE DATA MAXIMIZATION AUDIT

MODE:
READ-ONLY / PRE-PRODUCTION / NO COMMERCIAL PURCHASE

OBJECTIVE:

Before any commercial data acquisition decision is made,
determine the maximum possible customer spend that can be
credibly benchmarked using FREE / PUBLIC / GOVERNMENT /
STATUTORY / PSU / EXCHANGE-PUBLISHED / CORPORATE-PUBLISHED
data sources.

This is NOT a commercial acquisition exercise.

Do NOT recommend purchasing any subscription.
Do NOT populate Module 3.
Do NOT generate benchmark values.
Do NOT calculate savings.
Do NOT modify Module 1.
Do NOT modify Module 2.
Do NOT modify PCBI Master V1.0.

========================================================
AUTHORITATIVE INPUTS
========================================================

Use:

PCBI_V1_2_2_DATA_ACQUISITION_DECISION_PACK
PCBI_V1_2_2_VENDOR_COVERAGE_MATRIX
PCBI_V1_2_2_COST_COVERAGE_ANALYSIS
PCBI_V1_2_2_DATA_ACQUISITION_MANAGEMENT_SUMMARY

Also use:

PCBI_SOURCE_REGISTER_V1_1_1
PCBI_0288_MODULE2_REATTRIBUTION
PCBI_0289_MODULE2_REATTRIBUTION
PCBI_0288_0289_MICRO_RECONCILIATION_V1_1_2

Module 2 UNSPSC classification remains the sole
material-classification authority.

========================================================
CORE QUESTION
========================================================

For the complete ₹5,524.9154 Cr PCBI addressable spend:

HOW MUCH CAN BE BENCHMARKED USING FREE/PUBLIC DATA
WITHOUT BUYING ANY COMMERCIAL DATA?

Do NOT confuse:

SOURCE IDENTIFIED

with:

SOURCE READY

and do NOT confuse:

FREE SOURCE

with:

FREE BENCHMARK READY.

========================================================
CREATE FIVE INDEPENDENT ATTRIBUTES
========================================================

For every PCBI technical series create:

1. BENCHMARKABILITY

YES
NO
CONDITIONAL

2. DATA ACCESS

FREE_PUBLIC
PAID
LICENSED
MANUAL_CORPORATE
UNRESOLVED

3. SOURCE VALIDATION

VERIFIED
PROPOSED
UNVERIFIED
UNRESOLVED

4. HISTORICAL DEPTH

FULL_2020_2026
PARTIAL
UNVERIFIED
NOT_AVAILABLE

5. METHODOLOGY READINESS

READY
METHODOLOGY_PENDING
HISTORY_PENDING
SPECIFICATION_PENDING
SOURCE_PENDING
NOT_BENCHMARKABLE

These five attributes MUST remain independent.

========================================================
FREE SOURCE AUDIT
========================================================

Audit every PCBI series for potential FREE sources.

At minimum evaluate:

PPAC
IOCL
OEA / DPIIT WPI
CIL
IBM
IEX
IGX
Government ministry publications
PSU price circulars
Government tender price publications
Statutory commodity publications
Published manufacturer circulars
Public exchange-published data
Publicly available commodity indices
Publicly available industry association publications

Do NOT assume a source is free merely because a website
exists.

Record:

Source Name
Publisher
URL / Reference
Commodity
PCBI ID
Specification
Frequency
Historical Coverage
Access Type
Source Verification Status
Methodology Status

========================================================
CRITICAL: 201 FREQUENCY-MISMATCH SERIES
========================================================

Audit ALL 201 frequency-mismatch series individually.

For every series determine:

PCBI ID
Commodity
Customer Spend
Source
Source Frequency
Customer Purchase Frequency
Historical Depth
Lag
Proposed Step Function
Methodology Status

Determine whether the series can be converted into a
benchmark using the documented step-function methodology.

RULE:

NO INTERPOLATION.

NO SYNTHETIC PRICES.

NO AVERAGING TO CREATE MISSING VALUES.

ONLY documented step-function / carry-forward methodology.

Classify each:

FREE_READY

FREE_METHODOLOGY_PENDING

FREE_HISTORY_PENDING

NOT_FREE_BENCHMARKABLE

========================================================
CALCULATE FREE COVERAGE
========================================================

Produce:

A. FREE SOURCE IDENTIFIED SPEND

B. FREE SOURCE-READY SPEND

C. FREE METHODOLOGY-PENDING SPEND

D. FREE HISTORY-PENDING SPEND

E. FREE SOURCE UNRESOLVED SPEND

F. PAID / LICENSED REQUIRED SPEND

G. NOT BENCHMARKABLE SPEND

IMPORTANT:

Do NOT merge A/B/C/D.

========================================================
TOP FREE OPPORTUNITY
========================================================

Rank FREE/PUBLIC series by:

Customer Spend descending.

Show top 50.

Columns:

Rank
PCBI ID
Commodity
Customer Spend
% Total Spend
Free Source
Historical Depth
Frequency
Methodology Status
Potential Free Coverage
Action Required

========================================================
FREE DATA COVERAGE DASHBOARD
========================================================

Create:

TOTAL PCBI ADDRESSABLE SPEND

FREE READY
FREE METHODOLOGY PENDING
FREE HISTORY PENDING
FREE SOURCE UNRESOLVED
PAID REQUIRED
LICENSED REQUIRED
MANUAL CORPORATE
NOT BENCHMARKABLE

Show:

₹ Cr
% of PCBI Addressable Spend

========================================================
COMMERCIAL DATA SHOULD BE THE RESIDUAL
========================================================

After completing the free-data audit calculate:

TOTAL ADDRESSABLE SPEND
-
VALIDATED FREE / PUBLIC COVERAGE
=
RESIDUAL COMMERCIAL REQUIREMENT

This residual is the ONLY spend that should be considered
for future commercial acquisition.

Do not classify a commodity as paid merely because a paid
source also exists.

If a credible free source exists and meets specification,
use FREE as the primary access classification.

========================================================
NO COMMERCIAL PURCHASE
========================================================

Do NOT recommend:

LME
BigMint
Platts
ICDA
MMTA
or any other paid subscription

until the free-data audit is completed.

Commercial sources may be listed as FALLBACK / ALTERNATIVE
ONLY.

========================================================
FINAL MANAGEMENT OUTPUT
========================================================

Produce a one-page summary:

1. Total PCBI addressable spend
2. Free benchmark-ready spend
3. Free methodology-pending spend
4. Free history-pending spend
5. Paid/licensed residual spend
6. Not benchmarkable spend
7. Percentage potentially covered by free data
8. Percentage currently ready using free data
9. Top 20 free-data opportunities
10. Main methodology gaps
11. Main historical-depth gaps

========================================================
MANDATORY FILES
========================================================

Generate:

PCBI_V1_2_3_FREE_DATA_MAXIMIZATION_AUDIT.xlsx

PCBI_V1_2_3_FREE_DATA_SERIES_REGISTER.xlsx

PCBI_V1_2_3_FREE_DATA_COVERAGE.json

PCBI_V1_2_3_FREE_DATA_MANAGEMENT_SUMMARY.md

========================================================
FINAL SAFETY LOCK
========================================================

Module 1 = FROZEN
Module 2 = FROZEN
PCBI Master V1.0 = IMMUTABLE

Module 3 = BLOCKED

Benchmark values = 0
Savings = 0
Opportunity = 0

Commercial subscriptions purchased = 0

STOP AFTER FREE DATA MAXIMIZATION AUDIT.

DO NOT PROCEED TO COMMERCIAL PURCHASE DECISION.

========================================================
END COMMAND
========================================================

## Prompt 181

PCBI V1.2.4 — IBEF PUBLIC DATA SOURCE AUDIT

MODE:
READ-ONLY / PRE-PRODUCTION / NO COMMERCIAL PURCHASE

OBJECTIVE:

Add the India Brand Equity Foundation (IBEF)
https://www.ibef.org/
as an additional FREE / PUBLIC DATA DISCOVERY SOURCE
within the PCBI Free Data Maximization Audit.

IMPORTANT:

IBEF must NOT automatically be treated as a commodity
benchmark authority.

First determine what data IBEF actually publishes,
what data IBEF reproduces from other authorities,
and whether any of that data can support PCBI benchmarking.

DO NOT populate Module 3.
DO NOT generate benchmark values.
DO NOT calculate savings.
DO NOT purchase commercial data.
DO NOT modify Module 1.
DO NOT modify Module 2.
DO NOT modify PCBI Master V1.0.

========================================================
IBEF COVERAGE AUDIT
========================================================

Audit IBEF across all relevant sector pages and reports.

At minimum investigate:

Cement
Chemicals
Metals & Mining
Steel
Manufacturing
Oil & Gas
Power
Paper & Packaging
Pharmaceuticals
Agriculture
Infrastructure
Automobiles
Auto Components
Electronics
Renewable Energy
Glass / relevant adjacent sectors
and any other sector relevant to PCBI.

========================================================
FOR EACH PCBI SERIES
========================================================

Check whether IBEF contains:

1. Direct commodity price data
2. Commodity price indices
3. Sector price indices
4. Government price indices
5. Industry association price data
6. Production-linked price information
7. Historical price series
8. Monthly / weekly / quarterly data
9. Published price circulars
10. Commodity-specific market data
11. Source references to original government/industry publishers

========================================================
SOURCE PROVENANCE
========================================================

For every potentially useful IBEF dataset record:

PCBI ID
Commodity
Customer Material
UNSPSC
Customer Spend
IBEF Page
IBEF Report
Data Type
Data Frequency
Historical Coverage
Start Date
End Date
Original Data Publisher
Original Source URL
IBEF URL
Specification
Geography
Unit
Currency
Methodology
Free/Public Status
Benchmark Suitability
Confidence

========================================================
CRITICAL PROVENANCE RULE
========================================================

If IBEF republishes data originating from:

OEA / DPIIT
PPAC
IOCL
CIL
IBM
IEX
IGX
Ministry publications
Government departments
PSUs
Industry associations
other authoritative sources

record the ORIGINAL SOURCE separately.

Do NOT classify the data as an IBEF benchmark merely because
IBEF displays it.

Preferred hierarchy:

ORIGINAL AUTHORITATIVE SOURCE
        ↓
IBEF AS SECONDARY PUBLIC SOURCE
        ↓
PCBI SOURCE REGISTER

========================================================
BENCHMARK CLASSIFICATION
========================================================

For every IBEF candidate classify:

IBEF_DIRECT_PRICE
IBEF_REPUBLISHED_AUTHORITATIVE_PRICE
IBEF_INDEX
IBEF_SECTOR_INDICATOR
IBEF_MARKET_INTELLIGENCE_ONLY
NOT_RELEVANT

Only the first three may potentially qualify for PCBI
benchmarking.

IBEF_SECTOR_INDICATOR and IBEF_MARKET_INTELLIGENCE_ONLY
must NOT be used as price benchmarks.

========================================================
SPECIFICATION TEST
========================================================

For every potential IBEF benchmark test:

Commodity equivalence
Grade equivalence
Specification equivalence
Geographic equivalence
Unit equivalence
Frequency equivalence
Historical coverage
Publication methodology

Reject any source that cannot reasonably represent the
customer material.

========================================================
HISTORICAL TEST
========================================================

For every potential source determine whether historical data
exists for:

01-Apr-2020 through 31-Mar-2026

Classify:

FULL_HISTORY
PARTIAL_HISTORY
CURRENT_ONLY
HISTORY_UNVERIFIED

Do not assume historical coverage merely because a current
IBEF page exists.

========================================================
FREE DATA COVERAGE IMPACT
========================================================

Calculate:

Existing FREE coverage

+

Additional IBEF-eligible coverage

=

TOTAL POTENTIAL FREE COVERAGE

But DO NOT double-count any PCBI series already covered by
another free source.

Create:

1. Additional Spend Unlocked by IBEF
2. Existing Free Spend Duplicated by IBEF
3. IBEF-only Potential Spend
4. IBEF Methodology Pending Spend
5. IBEF History Pending Spend
6. IBEF Rejected Spend

========================================================
TOP OPPORTUNITIES
========================================================

Produce Top 50 PCBI series where IBEF potentially provides
additional free/public benchmark intelligence.

Columns:

Rank
PCBI ID
Commodity
Customer Spend
UNSPSC
IBEF Page
Original Publisher
Data Type
Historical Coverage
Specification Match
Frequency
Benchmark Status
Required Validation
Potential Free Spend

========================================================
CLIENT-FACING VALUE
========================================================

Separate:

A. PRICE BENCHMARK DATA

B. PRICE INDEX / ESCALATION DATA

C. MARKET TREND DATA

D. INDUSTRY CONTEXT

E. SUPPLY / DEMAND DATA

F. PRODUCTION / CAPACITY DATA

IBEF information that cannot be used for direct price
benchmarking may still be retained for Module 3 Trend
Analysis as contextual intelligence.

========================================================
FINAL OUTPUT
========================================================

Generate:

PCBI_V1_2_4_IBEF_SOURCE_AUDIT.xlsx

PCBI_V1_2_4_IBEF_SERIES_REGISTER.xlsx

PCBI_V1_2_4_IBEF_COVERAGE.json

PCBI_V1_2_4_IBEF_MANAGEMENT_SUMMARY.md

========================================================
FINAL REPORT
========================================================

Clearly answer:

1. How much PCBI spend can IBEF potentially support?
2. How much is direct price data?
3. How much is index data?
4. How much is only market intelligence?
5. How much is backed by original government sources?
6. How much has full 2020–2026 history?
7. How much requires methodology validation?
8. How much additional FREE coverage does IBEF provide?
9. Which PCBI commodities benefit most?
10. Which IBEF data should NOT be used for benchmarking?

========================================================
SAFETY LOCK
========================================================

Module 3 = BLOCKED
Benchmark values = 0
Savings = 0
Commercial purchase = 0

PCBI Master = IMMUTABLE

STOP AFTER IBEF AUDIT.

## Prompt 182

PCBI MODULE 3 — PRE-PRODUCTION ARCHITECTURE FREEZE

MODE:
READ-ONLY / PRE-PRODUCTION / NO BENCHMARK POPULATION

DO NOT:
- populate any PCBI benchmark values
- calculate savings
- calculate opportunity
- modify Module 1
- modify Module 2
- modify PCBI Master V1.0
- purchase or call commercial data sources
- activate Module 4

SOURCE GOVERNANCE:

1. PRIMARY BENCHMARK SOURCES
Only authoritative primary/statutory sources may populate benchmark/index values.

2. SECONDARY PUBLIC SOURCES
IBEF must be classified strictly as:
IBEF_CONTEXT_ONLY

IBEF must NEVER be used as a direct commodity price benchmark.

3. FREE DATA
Retain the current audited figures:
- VERIFIED_FREE = ₹41.94 Cr
- METHODOLOGY_PENDING_FREE = ₹222.74 Cr
- TOTAL POTENTIAL FREE/PUBLIC = ₹264.6858 Cr
- COMMERCIAL RESIDUAL = ₹5,260.2296 Cr

Do not increase free coverage based on IBEF.

4. COMMERCIAL DATA
Do not purchase or ingest any commercial data.
Keep commercial sources as SOURCE_PENDING / COMMERCIAL_REQUIRED until separately authorized.

MODULE 3 DATA MODEL:

Create three distinct benchmark evidence classes:

A. DIRECT_PRICE_BENCHMARK
Specification-equivalent market price/index with valid source, unit, geography,
quality/grade, frequency and historical coverage.

B. OFFICIAL_INDEX_BENCHMARK
Government/statutory index such as WPI or other formally approved index.
Must preserve:
- source
- series ID
- frequency
- publication date
- effective date
- lag
- step-function rule
- carry-forward rule
- data-gap flag

C. MARKET_INTELLIGENCE_CONTEXT
IBEF and similar secondary sources.
May contain:
- demand/supply
- production
- capacity
- imports/exports
- industry trends
- policy developments
- market drivers
- sector commentary

This class MUST NOT produce a numeric purchase-price benchmark.

FOR EACH PCBI SERIES CREATE/VALIDATE THESE FIELDS:

PCBI_ID
Benchmark_Description
UNSPSC
Customer_Material_Code
Customer_Material_Description
Customer_Spend_INR
Customer_Transaction_Count
Category
Quality
Benchmark_Evidence_Class
Source_Status
Primary_Source
Secondary_Source
Source_URL
Source_Series_ID
Unit
Currency
Geography
Frequency
Historical_Start
Historical_End
Publication_Lag_Days
Effective_Date_Rule
Step_Function_Rule
Specification_Match
Quality_Match
Geography_Match
Frequency_Match
History_Coverage
Data_Gap_Flag
Validation_Status
Commercial_Requirement
Methodology_Status

IMPORTANT:

Do NOT invent any benchmark value.

For every series, produce a READINESS classification:

READY_FOR_FREE_BENCHMARK
READY_FOR_OFFICIAL_INDEX
METHODOLOGY_PENDING
SOURCE_VALIDATION_PENDING
COMMERCIAL_SOURCE_REQUIRED
MARKET_CONTEXT_ONLY
NOT_BENCHMARKABLE

Create an executive coverage matrix showing:

1. Customer spend
2. Spend with verified free direct benchmark
3. Spend with official index benchmark
4. Spend requiring methodology approval
5. Spend requiring commercial data
6. Spend that is market-context-only
7. Spend that is not benchmarkable

Also show:
- series count
- transaction count
- percentage of PCBI spend
- percentage of total customer spend

IBEF GOVERNANCE:

Record IBEF only as a secondary contextual source.

For every IBEF-linked series, retain:
IBEF_URL
IBEF_Report
IBEF_Date
Context_Type
Original_Primary_Source

Never label the benchmark source as IBEF if the underlying source is DPIIT,
PPAC, CIL, IBM, JPC or another statutory authority.

QUALITY GATE:

Before completing:
- reconcile total PCBI spend to ₹5,524.9154 Cr
- variance must be ₹0.00
- no duplicate series
- no duplicate transaction attribution
- no benchmark values populated
- no savings
- no opportunity
- Module 4 disconnected
- Module 1 frozen
- Module 2 frozen
- PCBI Master V1.0 immutable

OUTPUT:

Generate:

1. PCBI_V1_3_MODULE3_PREPRODUCTION_SCHEMA.json
2. PCBI_V1_3_BENCHMARK_READINESS_REGISTER.xlsx
3. PCBI_V1_3_FREE_VS_COMMERCIAL_COVERAGE.xlsx
4. PCBI_V1_3_IBEF_CONTEXT_REGISTER.xlsx
5. PCBI_V1_3_MODULE3_READINESS_REPORT.md

FINAL STATUS MUST BE ONE OF:

READY_FOR_MODULE3_SOURCE_INGESTION
or
HOLD — METHODOLOGY/SOURCE VALIDATION REQUIRED

Do not execute production benchmarking.
Do not calculate savings.
Stop after the readiness audit.


## Prompt 183

PCBI MODULE 3 — FINAL SOURCE VALIDATION & COMMERCIAL DATA DECISION AUDIT

MODE:
READ-ONLY / FORENSIC VALIDATION
NO BENCHMARK POPULATION
NO SAVINGS
NO OPPORTUNITY CALCULATION
NO COMMERCIAL PURCHASE
MODULE 4 DISCONNECTED

OBJECTIVE:

Before authorizing any commercial data purchase or production benchmarking,
perform one final independent validation of the Module 3 architecture created in
PCBI V1.3.

Do NOT modify Module 1, Module 2 or PCBI Master V1.0.

========================================================
PART 1 — RECONCILE EVIDENCE CLASS VS READINESS STATUS
========================================================

For every PCBI series PCBI-0001 through PCBI-0290 independently compare:

A. Evidence Class
B. Source Status
C. Readiness Status
D. Customer Spend
E. Transaction Count
F. Benchmarkability
G. Commercial Requirement

Create a matrix showing:

PCBI_ID
Customer_Spend_INR
Evidence_Class
Source_Status
Readiness_Status
Benchmarkability_Status
Primary_Source
Secondary_Source
Commercial_Required
Methodology_Pending
Historical_Coverage_Status

IMPORTANT:

Evidence Class and Readiness Status are DIFFERENT dimensions.

Do not allow:
DIRECT_PRICE_BENCHMARK
to automatically mean
READY_FOR_BENCHMARK.

A DIRECT_PRICE_BENCHMARK may remain SOURCE_VALIDATION_PENDING or
COMMERCIAL_SOURCE_REQUIRED.

========================================================
PART 2 — INVESTIGATE THE 36 DIRECT-PRICE SERIES
========================================================

The current architecture reports:

36 DIRECT_PRICE_BENCHMARK series
₹5,280.9996 Cr

Independently list all 36 series.

For each series identify:

- PCBI ID
- Commodity
- Customer spend
- Source
- Source type
- Direct vs constituent
- Grade/specification
- Geography
- Unit
- Frequency
- Historical start date
- Historical end date
- 2020-2026 availability
- Source verification status
- Commercial requirement
- Production readiness

Then reconcile:

Sum of 36 DIRECT_PRICE_BENCHMARK series
against
₹5,280.9996 Cr

Variance must be ₹0.00.

If any series is incorrectly classified as DIRECT_PRICE_BENCHMARK,
flag it.

Do not silently correct it.

========================================================
PART 3 — INVESTIGATE THE 58 COMMERCIAL-REQUIRED SERIES
========================================================

Independently list all 58 series currently classified as:

COMMERCIAL_SOURCE_REQUIRED

Reconcile their spend exactly to:

₹5,260.2296 Cr

Break them into:

A. PCBI-0288 Stainless Steel
B. PCBI-0289 Ferroalloys/Bulk Materials
C. Copper
D. Aluminium
E. Any other commercial series

For each series specify:

- Required source
- Source publisher
- Data type
- Grade/specification
- Geography
- Frequency
- Historical depth required
- Current historical availability status
- Whether 2020-04-01 to 2026-08-31 is available
- Whether source certification is required
- Whether commercial subscription is mandatory
- Estimated spend covered

DO NOT recommend purchasing anything yet.

========================================================
PART 4 — BIGMINT VALIDATION
========================================================

For PCBI-0288:

Break the ₹2,708.4674 Cr pool into:

0288A
0288B
0288C
0288D
0288E
0288F
Constituent Pool
Any remaining sub-series

For every sub-series determine:

1. Is BigMint actually specification-equivalent?
2. Is the Indian geography appropriate?
3. Is the required grade available?
4. Is scrap vs prime correctly separated?
5. Is historical data available continuously from 2020-04-01?
6. Is weekly/monthly frequency available?
7. Is the publisher willing/licensed to provide historical data?
8. Is written publisher confirmation required?

Mark each:

PASS
CONDITIONAL
FAIL
UNVERIFIED

Do not assume BigMint coverage merely because BigMint was named earlier.

========================================================
PART 5 — FERROALLOY SOURCE VALIDATION
========================================================

For PCBI-0289:

Validate each:

0289A FeMo
0289B HC FeCr
0289C FeSi
0289D SiMn
0289E HC FeMn
0289F HMS
0289G Pig Iron
0289H MoO3
0289Z / other steel-related residuals

For each determine:

- Proposed source
- Exact product/grade
- Unit
- Geography
- Frequency
- Historical depth
- Specification equivalence
- Source verification status
- Commercial requirement

Do not combine different ferroalloys under a single generic "Steel" benchmark.

========================================================
PART 6 — FREE DATA FINAL VALIDATION
========================================================

Validate the current free/public architecture:

VERIFIED_FREE = ₹41.9430 Cr

METHODOLOGY_PENDING = ₹222.7428 Cr

TOTAL POTENTIAL FREE = ₹264.6858 Cr

Confirm whether these figures reconcile exactly.

For the ₹222.7428 Cr methodology-pending bucket:

List every source family:

- DPIIT WPI
- CIL
- IBM
- PPAC
- JPC
- Other

For each identify:

- series count
- spend
- frequency
- historical coverage
- lag
- proposed effective-date rule
- whether client policy approval is required

Do NOT populate benchmark values.

========================================================
PART 7 — IBEF FINAL GOVERNANCE CHECK
========================================================

Confirm:

IBEF_CONTEXT_ONLY = TRUE

IBEF must never generate:

- benchmark price
- index value
- customer price variance
- savings
- opportunity

IBEF may only provide:

- demand/supply context
- production
- capacity
- imports/exports
- industry trends
- policy context
- market commentary

Confirm that every IBEF reference retains the original primary source.

========================================================
PART 8 — NOT-BENCHMARKABLE VALIDATION
========================================================

The architecture currently reports:

28 NOT_BENCHMARKABLE series
₹0.00 Cr spend

Independently validate this.

For every NOT_BENCHMARKABLE series show:

PCBI_ID
Description
Customer Spend
Reason
Transaction Count
Module 2 Classification

Confirm whether these are genuinely zero-spend PCBI technical series
or whether any customer spend has been incorrectly excluded.

If any non-zero spend is found, STOP and flag it.

========================================================
PART 9 — FINAL COMMERCIAL RESIDUAL
========================================================

After Parts 1–8, calculate independently:

TOTAL PCBI ADDRESSABLE SPEND
LESS:
Verified Free
Methodology-Pending Free
Any newly validated public benchmark

= TRUE COMMERCIAL RESIDUAL

Do not assume ₹5,260.2296 Cr is correct.

Recalculate it independently from the series-level register.

Required tolerance:

RAW INR VARIANCE = ₹0.00

========================================================
PART 10 — COMMERCIAL DATA PURCHASE MATRIX
========================================================

DO NOT PURCHASE ANY DATA.

Instead create a decision matrix:

Priority
Commodity
PCBI Spend
Required Source
Coverage Needed
Historical Period
Frequency
Specification
Current Verification
Commercial Requirement
Why Needed
Potential Alternative Free Source
Purchase Decision

Purchase Decision must only be:

NOT YET
VALIDATE SOURCE FIRST
COMMERCIAL PURCHASE JUSTIFIED
NO PURCHASE REQUIRED

Do NOT use "BUY" automatically.

========================================================
PART 11 — STOP CONDITIONS
========================================================

If ANY of the following occur:

- spend variance
- duplicate PCBI series
- duplicate transaction attribution
- unexplained commercial residual
- unsupported direct benchmark classification
- unsupported BigMint historical claim
- unsupported Platts/Fastmarkets historical claim
- unsupported LME historical claim
- non-zero NOT_BENCHMARKABLE spend
- IBEF used as benchmark
- methodology gap without documented rule

then FINAL STATUS must be:

HOLD — SOURCE VALIDATION DEFECT

Otherwise:

FINAL STATUS:

READY_FOR_CONTROLLED_SOURCE_INGESTION

IMPORTANT:

READY_FOR_CONTROLLED_SOURCE_INGESTION does NOT authorize production
benchmarking or commercial purchase.

It only means the architecture is ready for the next controlled step.

========================================================
OUTPUT FILES
========================================================

Generate:

1. PCBI_V1_4_FINAL_SOURCE_VALIDATION.xlsx
2. PCBI_V1_4_COMMERCIAL_PURCHASE_MATRIX.xlsx
3. PCBI_V1_4_36_DIRECT_SERIES_AUDIT.xlsx
4. PCBI_V1_4_COMMERCIAL_58_SERIES_AUDIT.xlsx
5. PCBI_V1_4_FINAL_RECONCILIATION.json
6. PCBI_V1_4_FINAL_SOURCE_VALIDATION_REPORT.md

FINAL RULE:

STOP AFTER THE AUDIT.

NO BENCHMARK VALUES.
NO SAVINGS.
NO OPPORTUNITY.
NO COMMERCIAL PURCHASE.
NO MODULE 4.

Return the final gate decision and all reconciliation figures.


## Prompt 184

PCBI MODULE 3 — MCX PUBLIC/HISTORICAL DATA SOURCE AUDIT

MODE:
READ-ONLY / FORENSIC SOURCE DISCOVERY / PRE-PRODUCTION

IMPORTANT:
DO NOT populate any PCBI benchmark values.
DO NOT calculate savings.
DO NOT calculate opportunity.
DO NOT modify Module 1.
DO NOT modify Module 2.
DO NOT modify PCBI Master V1.0.
DO NOT purchase or subscribe to any commercial data.
DO NOT unlock Module 4.

OBJECTIVE:

Conduct a complete forensic audit of MCX (Multi Commodity Exchange of India) as a potential FREE/PUBLIC or LOW-COST historical benchmark source for PCBI Module 3.

AUTHORITATIVE SOURCE:
Official MCX website only.

MCX SOURCES TO AUDIT:
1. MCX Historical Data
2. MCX Bhav Copy
3. MCX Spot Market Price
4. MCX Compare Commodities – Historical
5. MCX Reports on Historical Data
6. MCX official Datafeed / Historical Data documentation
7. MCX official commodity contract specifications
8. Any official MCX archive or downloadable historical files
9. Any official MCX documentation concerning historical access, free access, licensing, redistribution, or data-feed charges

DO NOT use third-party websites as evidence of MCX data availability.
Third-party sources may be listed separately only as discovery leads and must never be treated as authoritative.

PRIMARY QUESTION:

Can MCX replace or reduce any of the currently assumed commercial requirements in PCBI Module 3?

CURRENT COMMERCIAL CANDIDATES INCLUDE:

- PCBI-0001 Aluminium
- PCBI-0005 Copper
- Nickel-related PCBI constituent series
- Any other non-ferrous commodity series mapped through Module 2
- Any steel/energy/other commodity where an MCX specification-equivalent series exists

PHASE 1 — BUILD MCX COMMODITY COVERAGE REGISTER

Search the official MCX source architecture and create a register containing:

MCX Commodity
MCX Symbol
Instrument Type
Contract Type
Contract Specification
Unit
Quotation Basis
Trading Currency
Delivery Location
Expiry Structure
Historical Availability Start
Historical Availability End
Daily/Monthly Frequency
Spot/Futures Availability
Bhav Copy Availability
Historical Data Availability
Publicly Downloadable?
Free Access?
Free Historical Depth
Commercial License Required?
Redistribution Restrictions
Official Source URL
Source Evidence
Validation Status

PHASE 2 — TEST HISTORICAL DEPTH

For every potentially relevant MCX commodity, specifically test whether historical data can support:

01-Apr-2020 through 31-Mar-2026

Do NOT assume that because MCX says historical data exists, the complete 2020–2026 series is freely downloadable.

Classify each commodity as:

A = COMPLETE FREE HISTORICAL SERIES
B = PARTIAL FREE HISTORICAL SERIES
C = HISTORICAL SERIES AVAILABLE BUT COMMERCIAL ACCESS REQUIRED
D = CURRENT DATA ONLY / INSUFFICIENT HISTORY
E = NOT AVAILABLE
F = SPECIFICATION MISMATCH

Record exact evidence for the classification.

PHASE 3 — MAP MCX TO PCBI

Use Module 2 as the ONLY classification authority.

For every potentially MCX-benchmarkable PCBI series:

PCBI ID
Material Group
Material Code(s)
Material Description
UNSPSC
Customer Spend
Customer Unit
Customer Purchase Geography
Required Benchmark Commodity
MCX Commodity
MCX Contract
Specification Match %
Specification Match Status
Unit Match
Currency Match
Geography Match
Frequency Match
Historical Depth Match
Benchmark Suitability
MCX Evidence Class
Recommended Source Status

DO NOT use description keyword matching as classification authority.

PHASE 4 — NON-FERROUS METAL DEEP DIVE

Perform a detailed audit for:

ALUMINIUM
COPPER
NICKEL
ZINC
LEAD

For each:

1. Identify the exact MCX contract(s).
2. Identify contract specifications.
3. Identify historical availability.
4. Identify whether daily Bhav Copy exists.
5. Identify whether historical data is publicly downloadable.
6. Identify whether 2020–2026 data is available.
7. Determine whether MCX can serve as the PRIMARY benchmark.
8. Determine whether MCX can serve as a SECONDARY validation benchmark.
9. Compare against the currently proposed LME requirement.
10. Do NOT declare LME necessary unless MCX has been objectively tested and found inadequate.

PHASE 5 — STEEL / FERROALLOY AUDIT

Investigate whether MCX provides specification-equivalent historical data for:

Stainless Steel
SS 201
SS 304
SS 304L
SS 316
SS 316L
SS 410
Stainless Steel Scrap
Ferro Molybdenum
Ferro Chrome
Ferro Silicon
Silico Manganese
Ferro Manganese
Pig Iron
HMS
MoO3

For each commodity, classify:

DIRECT MATCH
PROXY
CONSTITUENT ONLY
INSUFFICIENT
NOT AVAILABLE

Do not use a constituent price as a direct benchmark.

Example:
MCX Nickel must NOT automatically become a Stainless Steel benchmark.
If MCX Nickel is useful only as a constituent driver for stainless steel, explicitly classify it as CONSTITUENT ONLY.

PHASE 6 — FREE DATA MAXIMIZATION

This is critical.

Before recommending ANY paid source, calculate:

MCX FREE COVERAGE
+
OTHER VERIFIED FREE SOURCES
+
OFFICIAL INDEX SOURCES
+
VALIDATED PUBLIC SOURCES

Determine the maximum possible customer spend that can be benchmarked without purchasing commercial data.

Do NOT artificially force the analysis toward commercial sources.

Produce:

Current Free Coverage
MCX Incremental Free Coverage
Combined Free Coverage
Residual Commercial Requirement

All figures must reconcile exactly to the certified customer baseline.

PHASE 7 — COMMERCIAL SOURCE REASSESSMENT

After the MCX audit, reassess:

Current commercial requirement:
₹5,260.2296 Cr

Determine whether MCX reduces this amount.

Create:

BEFORE MCX
Commercial Spend Requirement
Commercial Series Count

AFTER MCX
Commercial Spend Requirement
Commercial Series Count

INCREMENTAL FREE COVERAGE CREATED BY MCX

If there is no reduction, explicitly prove why.

PHASE 8 — HISTORICAL DATA ACCESS COST

Determine whether MCX historical data can be obtained:

1. Completely free
2. Through public website downloads
3. Through Bhav Copy
4. Through limited free historical access
5. Through a formal request
6. Through paid historical data
7. Through a datafeed license

DO NOT assume "website accessible" means "licensed for commercial redistribution."

Separate:

DATA ACCESS
from
DATA LICENSING / REDISTRIBUTION RIGHTS

This distinction is mandatory.

PHASE 9 — PCBI SOURCE REGISTER UPDATE — DRAFT ONLY

Do NOT modify the immutable master register.

Create a proposed overlay:

PCBI_MCX_SOURCE_AUDIT

with fields:

PCBI_ID
MCX_COMMODITY
MCX_SYMBOL
MCX_CONTRACT
SOURCE_STATUS
EVIDENCE_CLASS
FREE_OR_PAID
HISTORICAL_DEPTH
SPECIFICATION_MATCH
UNIT_MATCH
GEOGRAPHY_MATCH
FREQUENCY
2020_COVERAGE
2021_COVERAGE
2022_COVERAGE
2023_COVERAGE
2024_COVERAGE
2025_COVERAGE
2026_COVERAGE
PRIMARY_OR_SECONDARY
LICENSE_REQUIRED
REDISTRIBUTION_ALLOWED
CONFIDENCE
OFFICIAL_SOURCE_URL
AUDIT_NOTES

PHASE 10 — GOVERNANCE RULES

The following rules are mandatory:

1. No benchmark values may be populated.
2. No interpolation.
3. No synthetic prices.
4. No averaging of unmatched specifications.
5. No keyword-only classification.
6. Module 2 remains the classification authority.
7. MCX futures price must not automatically be treated as physical procurement price.
8. Spot and futures must be separately classified.
9. Constituent benchmarks must never be presented as direct finished-product benchmarks.
10. Historical availability must be proven, not assumed.
11. Free access and commercial redistribution rights must be separately assessed.
12. All source URLs must point to official MCX sources.
13. Every conclusion must have source evidence.
14. No savings calculation.
15. No opportunity calculation.
16. Module 4 remains disconnected.

FINAL OUTPUT:

Generate the following artifacts:

1. PCBI_MCX_SOURCE_AUDIT.xlsx
2. PCBI_MCX_COMMODITY_REGISTER.xlsx
3. PCBI_MCX_PCBI_MAPPING.xlsx
4. PCBI_MCX_HISTORICAL_ACCESS_AUDIT.xlsx
5. PCBI_MCX_FREE_COVERAGE_IMPACT.xlsx
6. PCBI_MCX_SOURCE_VALIDATION_REPORT.md
7. PCBI_MCX_EXECUTIVE_SUMMARY.md

FINAL MANAGEMENT SUMMARY MUST ANSWER:

1. What MCX commodities can we use?
2. Which PCBI series can MCX directly benchmark?
3. Which PCBI series can MCX only support as a constituent/proxy?
4. How much customer spend can MCX potentially cover?
5. How much incremental FREE coverage does MCX add?
6. How much commercial spend requirement remains?
7. Can MCX replace LME for any series?
8. Can MCX replace BigMint for stainless steel?
9. Can MCX replace Platts/ICDA/MMTA for ferroalloys?
10. What historical period is freely available?
11. What requires a paid license?
12. What are the redistribution/commercial-use restrictions?
13. What must remain pending source validation?

FINAL STATUS:

Do not proceed to benchmark population.

Return only:

MCX_SOURCE_VALIDATION_HOLD

if any material source, historical-depth, specification, or licensing question remains unresolved.


## Prompt 185

PCBI MODULE 3 — FINAL FREE/PUBLIC DATA EXHAUSTION AUDIT

MODE:
READ-ONLY / FORENSIC / PRE-PRODUCTION

DO NOT:
- Populate any benchmark values
- Calculate savings
- Calculate opportunity
- Activate Module 4
- Modify Module 1
- Modify Module 2
- Modify PCBI Master V1.0
- Purchase or call any commercial data subscription
- Treat any commercial PRA as automatically mandatory without testing public alternatives

OBJECTIVE:

We have completed audits of:
1. Government/statutory public sources
2. IBEF
3. MCX

MCX has identified potential coverage of:
PCBI-0001 Aluminium = ₹7.1037 Cr
PCBI-0005 Copper = ₹42.0132 Cr
Total MCX candidate = ₹49.1169 Cr

However, MCX remains LICENSE/METHODOLOGY_PENDING and must NOT yet be classified as VERIFIED_FREE.

Now conduct the FINAL FREE/PUBLIC DATA EXHAUSTION AUDIT across ALL 290 PCBI SERIES, with particular focus on the remaining commercial requirement of approximately ₹5,211.11 Cr.

SOURCE DISCOVERY MUST INCLUDE, WHERE RELEVANT:

- MCX
- Data.gov.in
- DPIIT / Office of Economic Adviser / WPI
- PPAC
- IOCL
- BPCL
- HPCL
- Coal India
- Ministry of Coal
- Indian Bureau of Mines
- Ministry of Mines
- JPC
- SAIL
- RINL
- NMDC
- NALCO
- Hindalco
- Vedanta
- MMTA
- ICDA
- Other Indian government/statutory/public-sector sources
- Indian commodity/industry associations
- Official producer price circulars
- Official public historical datasets

IMPORTANT GOVERNANCE RULE:

Do NOT classify a source as a valid benchmark merely because the commodity name matches.

A source is benchmark-eligible only if ALL applicable dimensions are satisfied:

1. Commodity identity
2. Grade/specification
3. Quality
4. Physical form
5. Unit
6. Currency
7. Geography
8. Pricing basis
9. Frequency
10. Historical availability
11. 01-Apr-2020 to 31-Mar-2026 coverage
12. Source provenance
13. Publication methodology
14. Data accessibility
15. Commercial-use / redistribution rights

CLASSIFY EACH SERIES INTO EXACTLY ONE:

A = VERIFIED_FREE_DIRECT
B = VERIFIED_FREE_OFFICIAL_INDEX
C = PUBLIC_DATA_LICENSE_PENDING
D = METHODOLOGY_PENDING
E = COMMERCIAL_SOURCE_REQUIRED
F = SOURCE_UNRESOLVED
G = NOT_BENCHMARKABLE

DO NOT USE "FREE" AS A DEFAULT.

For every series classified E = COMMERCIAL_SOURCE_REQUIRED, provide:

- Why every identified free/public source failed
- Exact specification mismatch, if any
- Historical-depth failure, if any
- Frequency failure, if any
- Geography failure, if any
- Unit/pricing-basis failure, if any
- Licensing restriction, if any
- Best commercial source candidate
- Alternative commercial sources
- Customer spend exposed

FOR MCX SPECIFICALLY:

Reassess PCBI-0001 and PCBI-0005.

Do NOT mark them VERIFIED_FREE yet.

Determine separately:

MCX_PUBLIC_DATA_AVAILABLE
MCX_HISTORICAL_DEPTH_AVAILABLE
MCX_SPECIFICATION_MATCH
MCX_CONTINUOUS_ROLL_METHODOLOGY
MCX_COMMERCIAL_REUSE_PERMISSION
MCX_DERIVED_INDEX_PERMISSION
MCX_CLIENT-FACING_USAGE_PERMISSION
MCX_LICENSE_REQUIRED

Only after these are independently established may the system recommend a final status.

FOR THE MAJOR COMMERCIAL POOLS:

Perform a source-exhaustion test for:

PCBI-0288 Stainless Steel:
- SS 201
- SS 304/304L
- SS 316/316L
- SS 410
- Stainless turnings
- Stainless billets
- Ferro Nickel constituent

PCBI-0289:
- Ferro Molybdenum
- HC Ferro Chrome
- Ferro Silicon
- Silico Manganese
- HC Ferro Manganese
- HMS
- Pig Iron
- MoO3

Do not use a single index for multiple specifications unless equivalence is formally demonstrated.

SPECIAL RULE:

For stainless steel and ferroalloys, search Indian public producer circulars, government publications and industry associations BEFORE concluding that BigMint/Platts/ICDA/MMTA is mandatory.

For each possible source, calculate the actual customer spend it can support.

FINAL OUTPUT REQUIRED:

1. 290-series source exhaustion register
2. Free/public coverage by source
3. Potential free coverage by spend
4. MCX candidate coverage separately
5. Methodology-pending coverage
6. Commercial-required coverage
7. Source-unresolved coverage
8. Non-benchmarkable coverage
9. Duplicate-source analysis
10. Historical-depth analysis
11. Licensing/commercial-use analysis
12. Final "FREE DATA MAXIMIZATION" summary
13. Remaining commercial spend after ALL public-source testing

RECONCILIATION REQUIREMENT:

Total of all categories MUST equal exactly:

₹5,524.9154 Cr

Variance must be ₹0.00 at raw INR transaction level.

DO NOT round intermediate calculations.

FINAL GATE:

If additional credible free/public coverage is found, update only the audit/readiness artifacts.

DO NOT populate Module 3 benchmark values.

DO NOT calculate savings.

DO NOT calculate opportunity.

DO NOT connect Module 4.

Set final status to:

FREE_DATA_EXHAUSTION_COMPLETE

only if all 290 series have been individually assessed.

Otherwise:

FREE_DATA_EXHAUSTION_INCOMPLETE

and identify the exact unresolved series.

STOP AFTER THE AUDIT.

## Prompt 186

Stop source-exhaustion analysis. Do not purchase or call any commercial source. Using the frozen Module 1 and Module 2 only, build the PCBI Commodity & Grade Historical Data Master, ranked by spend and benchmark priority, and identify the exact historical commodities/grades we need to collect data for. For each commodity, identify publicly available historical evidence sources, including PDFs, government publications, exchange data, producer circulars, industry reports and archived publications. Do not populate any benchmark values and do not execute Module 3.

## Prompt 187

PCBI MODULE 3 — COMMODITY-WISE HISTORICAL DATA ACQUISITION MATRIX
===============================================================

MODE:
READ-ONLY / PRE-PRODUCTION / NO BENCHMARK CALCULATION

OBJECTIVE:
Do NOT calculate, populate, or publish any PCBI benchmark values.

Do NOT purchase any commercial data.

Do NOT modify Module 1, Module 2, PCBI Master V1.0/V1.1.x, or any frozen
classification.

Do NOT connect Module 4.

The sole objective of this command is to determine, commodity-by-commodity,
WHAT HISTORICAL MARKET DATA IS REQUIRED to construct the Procucev Commodity
Benchmark Index (PCBI).

IMPORTANT CHANGE IN APPROACH:
Do NOT search for one single source capable of benchmarking all materials.

PCBI will be constructed commodity-wise and grade/specification-wise.

A commodity may use:
1. A direct market price;
2. A constituent/raw-material price;
3. Multiple constituent prices;
4. A relevant government index;
5. A scrap/reference price;
6. A market premium/conversion component;
7. Multiple independent public sources for validation.

The final PCBI will be Procucev's own calculated index and must NOT simply
reproduce another publisher's index.

===============================================================
1. SOURCE OF TRUTH
===============================================================

Use ONLY the frozen and certified outputs of:

MODULE 1:
Customer spend / transaction data.

MODULE 2:
Material-code classification, UNSPSC classification, commodity grouping,
strategic sourcing classification and all certified material mappings.

Module 2 remains the CLASSIFICATION AUTHORITY.

Do NOT use keyword matching as classification authority.

Do NOT reclassify customer transactions.

Do NOT alter transaction values.

===============================================================
2. CREATE COMMODITY / GRADE FAMILIES
===============================================================

From Module 2, consolidate the 290 PCBI technical series into the minimum
logical set of commodity and grade families required to construct complete
benchmark coverage.

Do NOT unnecessarily create one index for every material code.

However, DO NOT combine materially different grades/specifications.

Examples:

STAINLESS STEEL:
- SS 201
- SS 304 / 304L
- SS 316 / 316L
- SS 410
- Stainless turning scrap
- Stainless scrap where specification differs
- Stainless billets / prime material

FERROALLOYS:
- Ferro Molybdenum
- Ferro Chrome
- Ferro Silicon
- Silico Manganese
- Ferro Manganese
- MoO3 / Molybdenum input
- HMS scrap
- Pig Iron
- Other certified ferroalloy families

NON-FERROUS:
- Nickel
- Copper
- Aluminium

OTHER MAJOR COMMODITIES:
- Coal
- Limestone
- Diesel
- Industrial gases
- Refractories
- Ramming mass
- Electricity
- Other material families identified from Module 2.

Do NOT assume the above is exhaustive.

Derive the complete list from the actual certified Module 2 data.

===============================================================
3. FOR EACH COMMODITY FAMILY, DETERMINE THE INDEX CONSTRUCTION MODEL
===============================================================

For every commodity/grade family create one of these classifications:

A. DIRECT_MARKET_PRICE
A reasonably specification-equivalent market price is available.

B. CONSTITUENT_BASED
The commodity price can be constructed primarily from constituent/raw
material prices.

C. MULTI_CONSTITUENT
The commodity requires multiple constituent market drivers.

D. OFFICIAL_INDEX
A government/statutory index is appropriate.

E. SCRAP_REFERENCE
A relevant scrap/reference market is required.

F. PROXY_WITH_VALIDATION
No exact direct price exists, but a documented proxy can be constructed.

G. NOT_BENCHMARKABLE
No defensible benchmark methodology should be attempted.

H. METHODOLOGY_PENDING
Insufficient evidence exists and further research is required.

Do NOT force every commodity into a benchmark.

===============================================================
4. IDENTIFY HISTORICAL DATA REQUIREMENT
===============================================================

For each commodity determine:

- Required historical start date: 01-Apr-2020
- Required historical end date: latest available date
- Preferred frequency: Daily / Weekly / Monthly
- Minimum acceptable frequency
- Required unit
- Required geography
- Required grade/specification
- Required currency
- Required Incoterm/location where relevant
- Required market basis
- Required transformation
- Required normalization
- Required FX conversion if applicable
- Required freight adjustment if applicable
- Required quality adjustment if applicable

IMPORTANT:

Do NOT invent missing historical data.

Do NOT interpolate prices.

Do NOT create synthetic historical observations.

Clearly identify missing history.

===============================================================
5. FREE DATA FIRST
===============================================================

Before identifying commercial sources, exhaustively identify publicly available
sources.

Search for:

- Indian Government sources
- Ministry sources
- Government publications
- PPAC
- DPIIT / OEA WPI
- IBM
- Coal India
- JPC
- data.gov.in
- MCX
- official exchange publications
- official company price circulars
- manufacturer circulars
- industry associations
- public PDF price circulars
- public historical reports
- public market reports
- public commodity publications
- IBEF ONLY as contextual/supporting information
- other credible public sources

IBEF MUST NOT be treated as a primary price authority.

For every free source determine:

FREE_CONFIRMED
FREE_PUBLIC_BUT_METHODOLOGY_PENDING
PUBLIC_CONTEXT_ONLY
NOT_USABLE_FOR_PRICE

Do not count contextual information as price coverage.

===============================================================
6. MULTI-SOURCE STRATEGY
===============================================================

For each important commodity attempt to identify:

PRIMARY FREE SOURCE
SECONDARY FREE CROSS-CHECK
TERTIARY FREE CROSS-CHECK

where available.

The purpose is NOT to blindly average sources.

Instead determine:

- whether the sources measure the same commodity;
- whether grades are equivalent;
- whether geography is equivalent;
- whether units are equivalent;
- whether frequency is equivalent;
- whether historical coverage overlaps;
- whether there are systematic premiums/discounts.

Document differences.

===============================================================
7. PUBLIC PDF / DOCUMENT DATA
===============================================================

Do NOT reject a source merely because historical information is published
through PDF, circular, report, bulletin or downloadable document.

Identify:

SOURCE FORMAT:
WEB
PDF
EXCEL
CSV
API
PRICE_CIRCULAR
MONTHLY_REPORT
WEEKLY_REPORT
OTHER

For PDF/circular sources record:

- publisher
- document name
- publication date
- applicable price period
- commodity
- grade
- geography
- unit
- historical availability
- URL/location
- extraction feasibility

Do NOT extract values into the PCBI yet.

This stage is DATA REQUIREMENT MAPPING ONLY.

===============================================================
8. METAL-SPECIFIC DRIVER MATRIX
===============================================================

For every major metal/metal-related commodity identify the underlying
market drivers required for a Procucev index.

Examples:

SS 304:
- Nickel
- Chromium / Ferro Chrome
- Iron / steel base
- Scrap
- Energy
- conversion / processing component
- India market premium where required

SS 316:
- Nickel
- Chromium
- Molybdenum
- Iron / steel base
- Scrap
- Energy
- conversion component

Ferro Molybdenum:
- Molybdenum / MoO3
- conversion premium
- applicable ferroalloy market reference

Ferro Chrome:
- Chrome ore / chromium
- electricity
- reductants
- conversion premium
- applicable market reference

Ferro Silicon:
- Silicon/raw material driver
- electricity
- reductants
- conversion premium
- market reference

Silico Manganese:
- manganese
- silicon
- electricity
- reductants
- conversion premium

DO NOT assume these examples are the final methodology.

Determine the appropriate driver structure based on source evidence.

===============================================================
9. DATA SUFFICIENCY SCORE
===============================================================

Create a data sufficiency score for every commodity:

5 = Strong historical public data + independent cross-check
4 = Good historical data, minor gaps
3 = Usable data with meaningful limitations
2 = Partial data / significant methodology work required
1 = Very weak data / proxy only
0 = No defensible historical data identified

Do NOT convert this into a commercial or investment ranking.

This is purely a technical data-readiness classification.

===============================================================
10. HISTORICAL COVERAGE MATRIX
===============================================================

For every commodity show:

Commodity
PCBI Series
Grade
Customer Spend
Transaction Count
Benchmark Type
Required Historical Period
Free Source
Historical Start
Historical End
Frequency
Unit
Geography
Primary Driver
Secondary Driver
Data Sufficiency
Cross-Check Available
Public PDF Available
Methodology Status
Commercial Source Needed?
Reason Commercial Source Needed
Open Data Gap

===============================================================
11. PRIORITY FOR DATA COLLECTION
===============================================================

Create three technical work queues:

QUEUE A:
High-spend commodities where sufficient FREE historical data appears
available.

QUEUE B:
High-spend commodities where FREE data exists but requires methodology/
document extraction/validation.

QUEUE C:
High-spend commodities where reliable historical data appears unavailable
publicly and commercial data may eventually be required.

Do NOT purchase anything.

Do NOT recommend a subscription merely because a commercial source exists.

First establish whether a defensible free-data construction is possible.

===============================================================
12. MOST IMPORTANT OUTPUT
===============================================================

Produce a table called:

PCBI_COMMODITY_DATA_REQUIREMENT_MASTER

This must answer:

"Exactly what historical datasets do we need to collect to build the complete
PCBI?"

For every commodity, show the minimum datasets required.

Example:

SS 304
→ Nickel historical series
→ Chromium/Ferro Chrome series
→ Steel/scrap reference
→ India market adjustment
→ conversion methodology
→ historical coverage assessment

SS 316
→ Nickel
→ Chromium/Ferro Chrome
→ Molybdenum
→ steel/scrap
→ conversion methodology

etc.

===============================================================
13. DO NOT CREATE BENCHMARK VALUES
===============================================================

ABSOLUTE PROHIBITION:

Do NOT calculate:
- PCBI index
- benchmark price
- savings
- opportunity
- should-cost
- target price
- supplier variance

No benchmark values shall be populated.

===============================================================
14. DO NOT MODIFY EXISTING MODULES
===============================================================

Module 1 = FROZEN
Module 2 = FROZEN
PCBI Master = IMMUTABLE
Module 4 = DISCONNECTED

Only create new research/audit artifacts.

===============================================================
15. REQUIRED OUTPUT ARTIFACTS
===============================================================

Generate:

1. PCBI_COMMODITY_DATA_REQUIREMENT_MASTER.xlsx

2. PCBI_FREE_SOURCE_DISCOVERY_REGISTER.xlsx

3. PCBI_METAL_DRIVER_MATRIX.xlsx

4. PCBI_HISTORICAL_COVERAGE_MATRIX.xlsx

5. PCBI_DATA_GAP_REGISTER.xlsx

6. PCBI_COMMODITY_FAMILY_MAPPING.json

7. PCBI_MODULE3_DATA_ACQUISITION_BLUEPRINT.md

8. PCBI_FREE_DATA_MAXIMIZATION_REPORT.md

===============================================================
16. FINAL MANAGEMENT SUMMARY
===============================================================

At the end provide:

A. Number of commodity/grade families identified

B. Customer spend represented by those families

C. Number potentially benchmarkable using FREE/public data

D. Number requiring methodology validation

E. Number potentially requiring commercial data

F. Number not benchmarkable

G. Total historical datasets required

H. Top data gaps

I. Which commodities should be researched next

J. Which datasets can be collected immediately from FREE sources

K. Which commercial sources should NOT yet be purchased because a free
alternative or constituent-based methodology may still be possible

===============================================================
FINAL GATE
===============================================================

Set final status to:

COMMODITY_DATA_REQUIREMENT_MAPPED

NOT:

BENCHMARK_READY
BENCHMARK_POPULATED
SAVINGS_READY

Stop execution after producing the above artifacts.

DO NOT proceed to PCBI index calculation.
DO NOT populate benchmark values.
DO NOT activate Module 4.
DO NOT purchase commercial data.

## Prompt 188

PCBI MODULE 3 — COMMODITY-WISE HISTORICAL DATA DISCOVERY & FREE-SOURCE MAXIMIZATION

MODE:
READ-ONLY / PRE-PRODUCTION / DATA-DISCOVERY ONLY

CRITICAL:
DO NOT populate PCBI benchmark values.
DO NOT calculate savings.
DO NOT modify Module 1.
DO NOT modify Module 2.
DO NOT modify PCBI Master V1.0.
DO NOT activate Module 4.
DO NOT purchase or call any commercial subscription/API.
DO NOT declare any source as validated merely because it exists.
DO NOT create synthetic prices.
DO NOT interpolate missing historical prices.

OBJECTIVE:

We are no longer trying to find one universal data source for PCBI.

Our objective is to build a COMMODITY-WISE HISTORICAL DATA ACQUISITION MAP.

The final PCBI index will be our own Procucev-developed benchmark/trend index. External sources are ONLY raw/reference market data used to understand historical price movements and construct the methodology.

Therefore, evaluate sources commodity-by-commodity rather than attempting to force all commodities through one publisher.

========================================================
STEP 1 — BUILD THE FINAL COMMODITY UNIVERSE
========================================================

Read the frozen Module 2 material-code / UNSPSC classification registry.

Identify every commodity/material family that contributes meaningful customer spend and requires historical market trend analysis.

Do NOT use PCBI-0288 and PCBI-0289 as single commodities.

Expand them into their underlying commodity families.

At minimum identify:

A. NON-FERROUS METALS
1. Aluminium
2. Copper
3. Nickel
4. Molybdenum
5. Chromium / Ferro Chrome
6. Manganese / Ferro Manganese
7. Zinc if present
8. Lead if present
9. Titanium if present
10. Cobalt if present
11. Niobium if present

B. STAINLESS STEEL / FERROUS MATERIALS
12. Stainless Steel 201
13. Stainless Steel 304 / 304L
14. Stainless Steel 316 / 316L
15. Stainless Steel 410
16. Stainless Steel mixed turnings
17. Stainless Steel scrap
18. Stainless Steel billets / prime
19. Ferro Nickel
20. Ferro Silicon
21. Ferro Molybdenum
22. High Carbon Ferro Chrome
23. Silico Manganese
24. High Carbon Ferro Manganese
25. Pig Iron
26. HMS / ferrous scrap
27. Steel billets
28. HRC / steel flat products if present
29. Mill scale / steel by-products where economically relevant

C. MINERALS / RAW MATERIALS
30. Limestone
31. Coal
32. Non-coking coal
33. Coking coal
34. Dolomite
35. Refractory raw materials
36. Ramming mass
37. Other major minerals identified from Module 2

D. ENERGY / INDUSTRIAL INPUTS
38. Diesel
39. Natural Gas
40. LPG / other petroleum products if present
41. Electricity
42. Industrial gases
43. Argon
44. Oxygen
45. Nitrogen

E. CHEMICALS
46. Caustic Soda
47. Sodium Nitrate
48. Other high-spend chemicals identified from Module 2

F. PACKAGING / OTHER BENCHMARKABLE MATERIALS
49. Corrugated boxes
50. Other significant packaging materials

Do NOT blindly retain this list.
Use Module 2 spend data to determine the actual final commodity universe.

For every commodity, calculate:

- Total customer spend
- Number of transactions
- Number of material codes
- Number of vendors
- Share of total customer spend
- Whether price benchmarking is economically meaningful
- Required historical period
- Required frequency
- Required specification/grade
- Required geography
- Required unit

========================================================
STEP 2 — DEFINE THE BENCHMARK SPECIFICATION
========================================================

For every commodity create a unique BENCHMARK SPECIFICATION.

Each row must contain:

COMMODITY_ID
COMMODITY_NAME
SUB_COMMODITY
GRADE / QUALITY
CUSTOMER_MATERIAL_CODES
UNSPSC
CUSTOMER_SPEND_INR
TRANSACTION_COUNT
VENDOR_COUNT
CUSTOMER_UNIT
TARGET_MARKET
TARGET_GEOGRAPHY
REQUIRED_HISTORY_START
REQUIRED_HISTORY_END
REQUIRED_FREQUENCY
BENCHMARK_UNIT
PRICE_BASIS
SPECIFICATION_REQUIREMENT

The default historical period should be:

01-Apr-2020 to latest available date.

Preferred frequency:

MONTHLY where reliable historical monthly data exists.

WEEKLY only where a reliable weekly source exists.

Do NOT manufacture weekly values from monthly data at this stage.

========================================================
STEP 3 — SEARCH FOR HISTORICAL DATA COMMODITY BY COMMODITY
========================================================

For every commodity, identify ALL plausible historical data sources.

Search in this order:

TIER 1 — FREE PRIMARY / GOVERNMENT
- Government of India
- Ministry portals
- PPAC
- DPIIT / OEA WPI
- IBM
- CIL
- JPC
- data.gov.in
- DGCI&S where applicable
- Ministry of Mines
- Ministry of Steel
- Ministry of Coal
- Ministry of Petroleum
- official exchange/public market data
- official producer circulars

TIER 2 — FREE INDUSTRY / PUBLIC SOURCES
Examples:
- IBEF
- manufacturer price circulars
- producer announcements
- industry associations
- trade associations
- publicly available PDF reports
- archived market reports
- public historical price bulletins
- public tender / auction results
- public import/export data
- public commodity reports

TIER 3 — EXCHANGE / MARKET SOURCES
Evaluate:
- MCX
- LME
- other recognized exchanges

Important:
Do not assume exchange data is automatically suitable.
Check whether the contract/grade/unit/geography actually represents the customer's procurement commodity.

TIER 4 — COMMERCIAL PRA SOURCES
Only identify as potential sources.
DO NOT purchase or call them.

Examples:
- BigMint / SteelMint
- Fastmarkets
- Platts / S&P Global
- Argus
- ICDA
- Chemical Weekly
- MMTA
- other relevant specialist publications

========================================================
STEP 4 — SOURCE DISCOVERY MUST INCLUDE PDF DATA
========================================================

Do NOT reject a source merely because the data is published as:

- PDF
- Excel
- monthly bulletin
- price circular
- archived report
- scanned circular
- HTML table
- downloadable publication

For each source determine:

SOURCE_NAME
SOURCE_TYPE
SOURCE_URL
DOCUMENT_NAME
PUBLICATION_FREQUENCY
HISTORICAL_DEPTH
AVAILABLE_FROM
AVAILABLE_TO
DATA_FORMAT
COMMODITY
GRADE
UNIT
GEOGRAPHY
PRICE_BASIS
PRIMARY_OR_SECONDARY
FREE_OR_PAID
ARCHIVE_ACCESS
AUTOMATION_FEASIBILITY
DATA_EXTRACTION_DIFFICULTY

========================================================
STEP 5 — HISTORICAL COVERAGE MATRIX
========================================================

Create a matrix:

Commodity | Required Period | Source | Free/Paid | Start Date | End Date | Frequency | Grade Match | Unit Match | Geography Match | Historical Completeness | Confidence

Classify historical coverage as:

FULL
>=95%

HIGH
80–94%

PARTIAL
50–79%

LOW
<50%

UNAVAILABLE

Do not treat "source exists" as historical coverage.

========================================================
STEP 6 — FREE-DATA MAXIMIZATION
========================================================

For each commodity calculate:

FREE DIRECT DATA
FREE INDEX DATA
FREE HISTORICAL MARKET DATA
FREE SECONDARY DATA
FREE PDF DATA
PUBLIC AUCTION / CIRCULAR DATA
EXCHANGE PUBLIC DATA

Then determine:

MAXIMUM FREE HISTORICAL COVERAGE

The objective is to maximize the amount of historical trend information obtainable WITHOUT commercial subscriptions.

Do NOT optimize for the number of sources.

Optimize for:

1. Historical completeness
2. Specification equivalence
3. Reliability
4. Consistency
5. Auditability
6. Reproducibility

========================================================
STEP 7 — SOURCE COMBINATION STRATEGY
========================================================

A commodity may use multiple historical sources.

For example:

Aluminium:
LME + NALCO circulars + Indian market references

Stainless Steel:
Grade-specific Indian scrap/steel sources + producer circulars + constituent metals where appropriate

Ferro Chrome:
ICDA + public Indian market reports + producer references

Ferro Silicon:
public Indian market reports + industry publications

Diesel:
PPAC / IOCL

Coal:
CIL + government sources

Limestone:
IBM + government sources

Do NOT automatically combine sources.

For every proposed combination explain:

WHY SOURCES CAN BE COMBINED
WHAT NORMALIZATION IS REQUIRED
WHAT CANNOT BE COMBINED
WHAT SPECIFICATION DIFFERENCES EXIST

========================================================
STEP 8 — CONSTITUENT / COMPOSITE INDEX CANDIDATES
========================================================

Identify commodities where a Procucev composite index may be more appropriate than a single market price.

Examples:

Stainless Steel 304
Stainless Steel 316
Ferro Nickel
Ferro Chrome
Ferro Molybdenum
Other alloy materials

For each candidate identify:

RAW MATERIAL COMPONENTS
COMPONENT WEIGHT / FORMULA POSSIBILITY
AVAILABLE HISTORICAL SOURCE
SOURCE FREQUENCY
CUSTOMER SPECIFICATION
NORMALIZATION REQUIREMENTS
METHODOLOGY RISK

DO NOT calculate the final index.

Only identify the methodology inputs.

========================================================
STEP 9 — DATA GAP REGISTER
========================================================

Create a DATA GAP REGISTER.

For every commodity where historical data is incomplete identify:

Commodity
Missing Period
Missing Grade
Missing Geography
Missing Unit
Missing Frequency
Source Gap
Possible Alternative Source
Free Alternative
Commercial Alternative
Recommended Next Validation Step

========================================================
STEP 10 — PRIORITIZE BY CUSTOMER SPEND
========================================================

Rank the commodities by customer spend ONLY for project execution priority.

This is NOT a quality ranking of commodities or sources.

Create three execution groups:

GROUP A:
Commodities representing approximately the first 80% of customer spend.

GROUP B:
Next approximately 15%.

GROUP C:
Remaining approximately 5%.

The purpose is only to determine development sequence.

========================================================
STEP 11 — FINAL OUTPUT
========================================================

Generate the following artifacts:

1. PCBI_COMMODITY_UNIVERSE_V1.xlsx

2. PCBI_COMMODITY_SOURCE_MATRIX_V1.xlsx

3. PCBI_FREE_HISTORICAL_DATA_REGISTER_V1.xlsx

4. PCBI_HISTORICAL_DATA_GAP_REGISTER_V1.xlsx

5. PCBI_COMPOSITE_INDEX_CANDIDATES_V1.xlsx

6. PCBI_COMMODITY_SOURCE_DISCOVERY_REPORT_V1.md

7. PCBI_FREE_DATA_MAXIMIZATION_REPORT_V1.md

8. PCBI_MODULE3_DATA_ACQUISITION_ROADMAP_V1.md

========================================================
FINAL GOVERNANCE RULE
========================================================

At the end provide:

TOTAL COMMODITY FAMILIES
TOTAL CUSTOMER SPEND
FREE HISTORICAL DATA COVERAGE
FREE + PUBLIC HISTORICAL COVERAGE
COMMERCIAL-ONLY HISTORICAL COVERAGE
UNAVAILABLE HISTORICAL COVERAGE

Also provide:

TOP COMMODITIES WHERE FREE DATA IS SUFFICIENT
TOP COMMODITIES WHERE FREE DATA IS PARTIALLY SUFFICIENT
TOP COMMODITIES WHERE COMMERCIAL DATA MAY BE REQUIRED
TOP COMMODITIES REQUIRING COMPOSITE / PROCUCEV INDEX METHODOLOGY

IMPORTANT:

Do NOT move to benchmark calculation.

Do NOT populate Module 3.

Do NOT calculate savings.

Do NOT connect Module 4.

This exercise is ONLY to answer:

"FOR EACH MATERIAL FAMILY IN OUR CUSTOMER SPEND, WHAT HISTORICAL MARKET DATA CAN WE ACTUALLY OBTAIN, FROM WHERE, FOR WHAT PERIOD, AT WHAT SPECIFICATION, AND HOW MUCH OF IT CAN BE OBTAINED FREE?"

STOP after generating the commodity-wise historical data acquisition map.

## Prompt 189

PCBI SOURCE DATA INGESTION — V2

Operating Mode:
READ-ONLY / PRE-PRODUCTION / SOURCE VALIDATION ONLY

I have uploaded:
PCBI_FREE_METAL_BENCHMARK_V2_ALL_TARGETS.xlsx

IMPORTANT:
This is SOURCE DATA ONLY.
Do NOT populate production PCBI benchmark values.
Do NOT calculate savings.
Do NOT connect Module 4.
Do NOT modify Module 1 or Module 2.
Do NOT modify PCBI Master V1.0.

TASK:

1. Read every sheet in the uploaded workbook.

2. Treat SERIES_MASTER as the authoritative list of target commodity/grade families for this research pass.

3. Treat OBSERVATIONS as verified public-market observations only.

4. Treat SOURCE_MAP as the source/provenance register.

5. Treat METHODOLOGY as governance rules.

6. For every target series, create a SOURCE COVERAGE MATRIX with:

   PCBI Target
   Commodity
   Grade
   Specification
   Geography
   Basis
   Unit
   Frequency
   Source
   Source Type
   Historical Start
   Historical End
   Number of Verified Observations
   Complete 2020-2026 History? YES/NO
   Free/Public? YES/NO
   Direct Price / Constituent / Context
   Data Quality
   Gap Periods
   Required Additional Research
   Production Readiness

7. DO NOT fill missing historical values.

8. DO NOT interpolate missing values.

9. DO NOT carry forward missing values.

10. DO NOT create synthetic benchmark values.

11. Do NOT treat IMF/LME metal prices as India-delivered prices.

12. Do NOT use Nickel alone as a Stainless Steel benchmark.

13. Do NOT use a generic Steel index for Ferro Chrome, Ferro Silicon, Ferro Manganese, Silico Manganese or Ferro Molybdenum.

14. Preserve grade, location and commercial basis for every observation.

15. Identify exactly which historical periods are missing for each target series.

16. Identify which series can be constructed primarily from free/public data.

17. Identify which series require additional public-source research before considering any commercial subscription.

18. Rank the research gaps by CUSTOMER SPEND IMPACT using the existing certified Module 2 mapping.

19. Produce:

   A. PCBI_SOURCE_COVERAGE_MATRIX.xlsx
   B. PCBI_PUBLIC_DATA_GAP_REGISTER.xlsx
   C. PCBI_SOURCE_VALIDATION_REPORT.md
   D. PCBI_PUBLIC_DATA_READINESS.json

20. FINAL RULE:

The output is a SOURCE VALIDATION REPORT only.

NO production benchmark values.
NO savings.
NO opportunity calculations.
NO Module 4.
NO modification of Modules 1 or 2.

STOP after producing the source coverage and gap analysis.

## Prompt 190

INGEST PCBI_METAL_BENCHMARK_SOURCE_PACK_V1.xlsx AS THE AUTHORITATIVE PRE-PRODUCTION METAL SOURCE PACK.

IMPORTANT:
Do NOT modify Module 1.
Do NOT modify Module 2.
Do NOT populate production PCBI benchmark values.
Do NOT calculate savings or opportunities.
Do NOT connect Module 4.

The purpose of this exercise is now ONLY to build the Module 3 METAL DATA LAYER.

Use the uploaded workbook as follows:

1. SERIES_MASTER
Treat the 21 target families as the complete initial metal/grade research universe.

2. VERIFIED_OBSERVATIONS
Treat only these rows as verified numeric observations.
Do not extrapolate, interpolate, average, smooth, or manufacture missing observations.

3. CONSTITUENT_TRENDS
Treat Nickel, Copper and Aluminium as GLOBAL CONSTITUENT TREND SERIES only.
They must NOT automatically become direct Stainless Steel, Copper Cathode or Aluminium Ingot benchmarks.

4. SOURCE_REGISTER
Use the listed public sources as the source hierarchy.
IBEF must remain CONTEXT_ONLY.
MCX, PPAC, IBM, DGCI&S and JPC must be independently validated before their data is promoted into benchmark evidence.

5. GAP_MATRIX
Create a metal-by-metal acquisition/research queue.

For every one of the 21 targets, determine:

A. Exact specification/grade required
B. Required unit
C. Required geography
D. Required frequency
E. Required history: April 2020 through latest available
F. Free/public sources available
G. Whether historical data is actually downloadable
H. Whether the source is direct price, index, constituent or contextual
I. Whether the source is specification-equivalent
J. Data gaps
K. Required conversion/basis adjustment
L. Confidence level
M. Whether the series can contribute to the PCBI composite methodology

CRITICAL DESIGN PRINCIPLE:

WE ARE NOT LOOKING FOR ONE SOURCE THAT BENCHMARKS EVERYTHING.

Build PCBI metal-by-metal.

For Stainless Steel:
separate 201, 304/304L, 316/316L, 410, turnings/borings and billets/semis.
Use Nickel, Chromium, Molybdenum, Iron/steel scrap and other relevant public trends as constituents where appropriate.
Never use Nickel alone as a Stainless Steel benchmark.

For Ferroalloys:
separate FeMo, HC FeCr, FeSi 75%, SiMn, HC FeMn, HMS, Pig Iron and MoO3.
Each commodity must have its own evidence chain.

For Copper:
separate Copper constituent trend from Copper Cathode Grade A.

For Aluminium:
separate Aluminium constituent trend from P1020A primary aluminium.

For HSD:
validate PPAC/IOCL historical domestic data.

For Limestone:
validate IBM Average Sale Price historical data.

For FeMo and MoO3:
investigate DGCI&S customs unit-value history and clearly identify import-basis limitations.

For FeCr, FeSi, SiMn, FeMn, HMS and Pig Iron:
search systematically for FREE historical PDFs, producer circulars, government publications, JPC publications and other publicly accessible evidence.

For every source found, record:
Source Name
URL
Publisher
Commodity
Grade
Geography
Unit
Frequency
Start Date
End Date
Publication Date
Data Type
Direct/Constituent/Context
Specification Match
Historical Continuity
Evidence Quality
Extraction Method
License/Access Concern
PCBI Usage Permission Status

DO NOT claim that a source is verified merely because a webpage exists.
A source is VERIFIED only when actual historical numerical observations have been located and their dimensions have been checked.

FINAL OUTPUT:

Create:

1. METAL_SOURCE_EVIDENCE_REGISTER
2. METAL_HISTORICAL_OBSERVATIONS
3. METAL_GAP_MATRIX
4. METAL_COMPOSITE_BUILD_MAP
5. METAL_SOURCE_URL_REGISTER
6. METAL_DATA_QUALITY_REPORT

The METAL_COMPOSITE_BUILD_MAP must show how each final PCBI metal index could be constructed from one or more independently sourced constituent trends.

Do NOT calculate the final PCBI benchmark index yet.

Do NOT calculate customer savings.

Do NOT release Module 3.

The objective is to finish the DATA FOUNDATION first.

FINAL STATUS MUST BE ONE OF:

DATA_READY
DATA_PARTIALLY_READY
SOURCE_GAP_REMAINS

Do not use a generic HOLD status without specifying exactly which commodity, period and source is missing.

## Prompt 191

PCBI MODULE 3 — DYNAMIC COMMODITY & BENCHMARK DATA ARCHITECTURE
END-TO-END TEST PREPARATION — DO NOT POPULATE BENCHMARK VALUES YET

Operating Mode:
READ-ONLY / PRE-PRODUCTION / ARCHITECTURE & TESTING

IMPORTANT:
Do NOT calculate or populate any benchmark index values.
Do NOT calculate savings.
Do NOT calculate procurement opportunities.
Do NOT modify Module 1.
Do NOT modify Module 2.
Do NOT modify PCBI Master V1.0.
Do NOT purchase or call commercial data sources.
Module 4 must remain disconnected.

OBJECTIVE:

We are going to build our own PCBI benchmark indices using historical commodity/market trends.

We will NOT necessarily depend on one publisher or one source for each commodity.

Historical information may subsequently come from:
- Government sources
- MCX
- LME
- IBEF
- PPAC
- CIL
- IBM
- WPI
- Industry associations
- Commodity publications
- Manufacturer price circulars
- Market reports
- Public PDFs
- Public historical price reports
- Other authenticated market sources

The source data will be used as INPUT EVIDENCE for our own PCBI methodology.

The objective now is to make Module 3 capable of handling commodities independently and dynamically.

========================================================
PHASE 1 — IDENTIFY COMPLETE COMMODITY DATA REQUIREMENTS
========================================================

Using the frozen Module 2 material-code / UNSPSC classification, identify every commodity/material family that Module 3 may need to benchmark.

Do NOT attempt to populate prices.

Create a master DATA_REQUIREMENT_REGISTER containing one record for every required benchmark commodity/sub-series.

For every commodity determine:

1. PCBI_ID
2. Parent_PCIB_ID if applicable
3. Commodity_Name
4. Commodity_Family
5. Material_Code / Material_Group
6. UNSPSC
7. Grade
8. Specification
9. Unit
10. Geography
11. Customer Spend
12. Transaction Count
13. Benchmark Type
14. Required Historical Start Date
15. Required Historical End Date
16. Required Frequency
17. Minimum Historical Coverage
18. Preferred Frequency
19. Alternative Frequency
20. Required Market Driver(s)
21. Required Constituent(s)
22. Required Source Type
23. Possible Public Sources
24. Possible Industry Sources
25. Possible Exchange Sources
26. Possible Manufacturer Sources
27. Source Authentication Requirement
28. Source Reliability Requirement
29. Data Transformation Required
30. Currency Requirement
31. FX Requirement
32. Freight/Location Adjustment Requirement
33. Quality/Grade Adjustment Requirement
34. Formula Readiness
35. Data Availability Status
36. Benchmark Readiness Status
37. Missing Data Requirement
38. Admin Upload Required
39. Evidence File Required
40. Notes

========================================================
PHASE 2 — COMMODITY-LEVEL ARCHITECTURE
========================================================

IMPORTANT:

Do NOT treat the PCBI system as dependent on a single master benchmark file.

Instead implement the architecture:

PCBI MASTER
    |
    +-- Commodity A
    |      +-- Historical Data
    |      +-- Source Evidence
    |      +-- Methodology
    |      +-- PCBI Index
    |
    +-- Commodity B
    |      +-- Historical Data
    |      +-- Source Evidence
    |      +-- Methodology
    |      +-- PCBI Index
    |
    +-- Commodity C
    |      +-- Historical Data
    |      +-- Source Evidence
    |      +-- Methodology
    |      +-- PCBI Index
    |
    +-- NEW COMMODITY
           +-- Historical Data
           +-- Source Evidence
           +-- Methodology
           +-- PCBI Index

A new commodity must be addable without changing the core Module 3 code.

========================================================
PHASE 3 — ADMIN PORTAL REQUIREMENT
========================================================

Design/implement an ADMIN PORTAL section called:

"PCBI Commodity & Benchmark Management"

It must support:

A. ADD NEW COMMODITY

Fields:

- PCBI ID
- Commodity Name
- Parent Commodity
- Category
- Sub-category
- Material Codes
- UNSPSC
- Grade
- Specification
- Unit
- Geography
- Currency
- Benchmark Methodology
- Benchmark Type
- Historical Start Date
- Historical End Date
- Required Frequency
- Source Type
- Source Name
- Source URL
- Source Document
- Source Date
- Source Quality
- Evidence Type
- Transformation Rules
- Constituent Rules
- FX Rules
- Freight Rules
- Quality Adjustment Rules
- Effective Date Rules
- Data Gap Rules
- Approval Status

B. UPLOAD HISTORICAL DATA

Allow administrator to upload:

- Excel
- CSV
- PDF
- JSON

The uploaded data must NOT immediately become a benchmark.

It must first enter:

DATA INGESTION → VALIDATION → SOURCE EVIDENCE → METHODOLOGY → APPROVAL → BENCHMARK ENGINE

C. UPLOAD SOURCE EVIDENCE

Allow administrator to attach:

- PDF
- Excel
- CSV
- URL
- Publisher document
- Government publication
- Market circular

Each source must have:

- Source ID
- Source Name
- Publisher
- Publication Date
- Data Period
- URL
- Document
- Evidence Type
- Reliability Class
- Authentication Status

D. COMMODITY STATUS

Each commodity should show:

NOT_STARTED
DATA_REQUIRED
SOURCE_IDENTIFIED
DATA_UPLOADED
DATA_VALIDATED
METHODOLOGY_PENDING
READY_FOR_INDEX
INDEX_GENERATED
APPROVED
ACTIVE
SUSPENDED

========================================================
PHASE 4 — DATA REQUIREMENT DASHBOARD
========================================================

Create an Admin dashboard:

"PCBI DATA READINESS"

Display:

Total PCBI commodities
Data Ready
Data Partially Available
Data Required
Source Required
Methodology Required
Ready for Index
Approved
Active

Also display:

Commodity
PCBI ID
Customer Spend
Transaction Count
Historical Period Required
Historical Period Available
Frequency Required
Frequency Available
Source
Source Status
Data Status
Methodology Status
Approval Status

The dashboard must immediately tell us:

"WHAT DATA DO WE NEED NEXT?"

========================================================
PHASE 5 — DATA VALIDATION ENGINE
========================================================

Before historical data can be used, validate:

1. Date completeness
2. Duplicate dates
3. Missing dates
4. Frequency consistency
5. Unit consistency
6. Currency consistency
7. Grade consistency
8. Geography consistency
9. Source consistency
10. Outlier detection
11. Sudden unexplained price changes
12. Source publication gaps
13. Historical coverage
14. Data lineage

Do NOT silently fill missing prices.

Every missing observation must be flagged.

Use:

DATA_AVAILABLE
DATA_MISSING
DATA_GAP
CARRY_FORWARD_ALLOWED
CARRY_FORWARD_NOT_ALLOWED
SOURCE_CONFLICT
SPECIFICATION_MISMATCH
UNIT_MISMATCH
CURRENCY_MISMATCH

========================================================
PHASE 6 — PCBI INDEX ARCHITECTURE
========================================================

The PCBI index must be generated independently for each commodity.

Do NOT assume that all commodities use the same formula.

Every commodity must have a:

BENCHMARK_METHODOLOGY_PROFILE

containing:

- PCBI ID
- Base Date
- Base Value
- Base Index
- Price Series
- Frequency
- Source Series
- Constituent Weights
- Quality Adjustments
- Geography Adjustment
- Currency Adjustment
- Freight Adjustment
- Effective Date Rule
- Missing Data Rule
- Rebase Rule
- Validation Rule
- Approval Rule

The engine must support:

A. DIRECT PRICE SERIES

B. OFFICIAL INDEX SERIES

C. CONSTITUENT-BASED INDEX

D. WEIGHTED COMPOSITE INDEX

E. PROXY INDEX

F. MARKET-DERIVED INDEX

G. MULTI-SOURCE COMPOSITE INDEX

No formula should be hard-coded globally.

========================================================
PHASE 7 — SOURCE COMBINATION
========================================================

Allow one PCBI commodity to use multiple sources.

Example:

STAINLESS STEEL 304

Source 1 → Nickel
Source 2 → Chromium
Source 3 → Stainless scrap market
Source 4 → Ferroalloy input
Source 5 → FX
Source 6 → Indian market adjustment

The final PCBI is OUR calculated index.

The source data is evidence/input, not the PCBI itself.

Maintain complete lineage:

PCBI
→ Methodology
→ Input Series
→ Source
→ Source Document
→ Publication Date
→ Transformation
→ Weight
→ Calculation
→ Output Index

========================================================
PHASE 8 — MATERIAL-TO-PCBI MAPPING
========================================================

Module 2 remains the sole authority for material classification.

Module 3 must consume:

Material Code
Material Description
UNSPSC
Commodity
Grade
Specification
PCBI ID

Do NOT use keyword-only classification.

A transaction may map to:

ONE PCBI

or

A constituent PCBI pool

or

NO_BENCHMARK

or

SOURCE_UNRESOLVED

========================================================
PHASE 9 — NEW COMMODITY WORKFLOW
========================================================

Demonstrate that a new commodity can be added without changing the existing application architecture.

Workflow:

ADMIN
↓
ADD COMMODITY
↓
ASSIGN PCBI ID
↓
MAP MATERIAL CODES
↓
DEFINE SPECIFICATION
↓
DEFINE METHODOLOGY
↓
UPLOAD HISTORICAL DATA
↓
UPLOAD SOURCE EVIDENCE
↓
VALIDATE DATA
↓
RUN METHODOLOGY QA
↓
APPROVAL
↓
GENERATE PCBI
↓
ACTIVATE PCBI

Existing commodities must remain unaffected.

========================================================
PHASE 10 — END-TO-END TEST MODE
========================================================

Create a TEST MODE where we can select:

1. Commodity
2. PCBI ID
3. Historical dataset
4. Source evidence
5. Methodology profile

Then run:

DATA VALIDATION
→ METHODOLOGY VALIDATION
→ INDEX PREVIEW
→ QA REPORT

WITHOUT activating the index.

The preview must show:

- Historical input series
- Missing observations
- Source lineage
- Transformation
- Formula
- Calculated test index
- QA exceptions
- Data quality score
- Methodology status

Activation must require explicit Admin approval.

========================================================
PHASE 11 — REQUIRED OUTPUT
========================================================

Do NOT generate benchmark values yet.

Generate the following:

1. PCBI_COMMODITY_DATA_REQUIREMENT_REGISTER
2. PCBI_DATA_READINESS_DASHBOARD
3. PCBI_ADMIN_COMMODITY_SCHEMA
4. PCBI_HISTORICAL_DATA_UPLOAD_SCHEMA
5. PCBI_SOURCE_EVIDENCE_SCHEMA
6. PCBI_METHODOLOGY_PROFILE_SCHEMA
7. PCBI_INDEX_LINEAGE_SCHEMA
8. PCBI_NEW_COMMODITY_WORKFLOW
9. PCBI_MODULE3_TEST_MODE_SPECIFICATION
10. PCBI_MODULE3_ARCHITECTURE_GAP_REPORT

Also produce:

"TOP 20 COMMODITIES TO COLLECT FIRST"

based on:

- Customer Spend
- Transaction Volume
- Strategic Importance
- Availability of historical data
- Potential for free/public data
- Complexity
- Expected PCBI coverage

IMPORTANT:

Do NOT rank them as "best/worst".
Use a transparent priority calculation based only on the above operational criteria.

========================================================
FINAL GOVERNANCE RULE
========================================================

At the end of execution display:

MODULE 1 = FROZEN
MODULE 2 = FROZEN
PCBI MASTER = IMMUTABLE
MODULE 3 = PRE-PRODUCTION
MODULE 4 = DISCONNECTED
BENCHMARK VALUES = NOT ACTIVATED
SAVINGS = ZERO
COMMERCIAL PURCHASES = ZERO

Most importantly:

The system must be designed so that we can continuously add:

NEW COMMODITY
+
NEW HISTORICAL DATA
+
NEW SOURCE EVIDENCE
+
NEW METHODOLOGY

through the Admin Portal without rebuilding Module 3.

STOP after generating the architecture, data requirement register and test framework.

DO NOT RUN PRODUCTION BENCHMARKING.

## Prompt 192

PCBI MODULE 3 — DYNAMIC PCBI INGESTION, GAP DETECTION & ADMIN EXTENSION FRAMEWORK

MODE:
Pre-production engineering.
Do NOT calculate savings.
Do NOT modify Module 1 or Module 2.
Do NOT populate production benchmark values from unapproved sources.
Do NOT alter PCBI Master V1.0 directly.

OBJECTIVE:

Upgrade Module 3 so that PCBI is a continuously extensible benchmark system.

The system must NOT assume that all required commodities already exist in the PCBI master.

When customer purchase data is uploaded and Module 1 + Module 2 are processed, Module 3 must automatically identify:

1. Commodities for which an approved PCBI benchmark already exists.
2. Commodities for which a PCBI benchmark exists but historical coverage is incomplete.
3. Commodities for which PCBI exists but specification/grade/frequency is incompatible.
4. Commodities for which NO PCBI exists.
5. Commodities where customer spend is material enough to require benchmark creation.
6. Commodities where benchmarking is not appropriate / not benchmarkable.

IMPORTANT:
Do not treat missing PCBI as an application failure.
Missing PCBI must become a visible DATA GAP / BENCHMARK GAP requiring user action.

========================================================
1. AUTOMATIC PCBI GAP DETECTION
========================================================

After Module 1 and Module 2 processing, create:

PCBI_GAP_REGISTER

For every material/category requiring benchmarking, calculate:

- Material Code
- Material Description
- Module 2 Category
- UNSPSC
- Commodity
- Sub-Commodity
- Grade / Specification
- Unit
- Currency
- Plant
- Customer Spend
- Transaction Count
- Latest Purchase Date
- Earliest Purchase Date
- Existing PCBI ID, if available
- PCBI Match Status
- Historical Coverage Required
- Historical Coverage Available
- Frequency Required
- Frequency Available
- Specification Match Status
- Source Status
- Gap Severity
- Recommended Action

Allowed PCBI Match Status values:

MATCHED
PARTIAL_HISTORY
FREQUENCY_MISMATCH
SPECIFICATION_MISMATCH
PCBI_MISSING
NOT_BENCHMARKABLE
UNDER_REVIEW

========================================================
2. MATERIALITY-BASED GAP PRIORITIZATION
========================================================

Rank PCBI gaps based on customer spend.

Create configurable thresholds.

Example:

CRITICAL:
> ₹25 Cr

HIGH:
₹5–25 Cr

MEDIUM:
₹1–5 Cr

LOW:
< ₹1 Cr

Do NOT hard-code these thresholds permanently.

Allow Admin to change them.

The UI must clearly show:

"PCBI MISSING — ACTION REQUIRED"

Example:

Material:
FERRO MOLYBDENUM LUMPS

Customer Spend:
₹XXX Cr

Transactions:
XXX

PCBI:
NOT AVAILABLE

Historical Requirement:
April 2020 – Current

Recommended Action:
UPLOAD / CREATE PCBI

========================================================
3. ADMIN — ADD NEW PCBI COMMODITY
========================================================

Create an Admin-only function:

"+ ADD NEW PCBI"

The administrator must be able to create a new PCBI commodity without developer intervention.

Required fields:

PCBI ID
Commodity Name
Commodity Family
Sub-Commodity
Grade / Specification
UNSPSC
Unit
Geography
Currency
Benchmark Type
Source Type
Source Name
Source URL
Source Document
Historical Start Date
Historical End Date
Frequency
Data Quality
Methodology
Transformation Rule
Effective Date Rule
Lag Rule
Missing Data Rule
Version
Status
Notes

PCBI ID must be automatically generated.

Example:

PCBI-0291
PCBI-0292
PCBI-0293

Never overwrite an existing PCBI ID.

========================================================
4. UNIVERSAL PCBI DATA UPLOAD
========================================================

The Admin portal must allow the administrator to upload benchmark source data in ANY reasonable format.

Supported formats:

.xlsx
.xls
.csv
.pdf
.txt
.json
.xml

If technically feasible also support:

.docx
HTML
copied/pasted tabular data

The user should NOT be required to manually convert the source data into PCBI format.

========================================================
5. INTELLIGENT SOURCE DATA PARSER
========================================================

When a file is uploaded:

DO NOT immediately insert it into the PCBI master.

First perform:

UPLOAD
↓
FILE TYPE DETECTION
↓
TABLE / TEXT EXTRACTION
↓
COLUMN IDENTIFICATION
↓
DATE IDENTIFICATION
↓
PRICE IDENTIFICATION
↓
UNIT IDENTIFICATION
↓
CURRENCY IDENTIFICATION
↓
COMMODITY IDENTIFICATION
↓
GRADE / SPECIFICATION IDENTIFICATION
↓
FREQUENCY DETECTION
↓
DATA QUALITY CHECK
↓
PCBI STANDARDIZATION
↓
VALIDATION REPORT
↓
ADMIN REVIEW
↓
APPROVAL
↓
VERSIONED PCBI DATASET
↓
PUBLISH TO PCBI MASTER

========================================================
6. UNIVERSAL DATA NORMALIZATION
========================================================

The system must normalize:

Daily
Weekly
Fortnightly
Monthly
Quarterly

into the standard internal PCBI time-series structure.

IMPORTANT:

NEVER invent a market price.

NEVER interpolate unless the specific PCBI methodology explicitly permits it.

NEVER convert monthly data into weekly values by mathematically interpolating prices.

Instead, apply the approved frequency transformation rule.

For example:

MONTHLY SOURCE
→ MONTHLY PCBI

WEEKLY SOURCE
→ WEEKLY PCBI

FORTNIGHTLY SOURCE
→ FORTNIGHTLY SOURCE
→ standardized effective-date representation

If a weekly PCBI output is required from monthly source data, use the approved step-function / carry-forward methodology.

Every transformed value must retain:

Original Date
Original Value
Original Frequency
Standardized Date
Standardized Frequency
Transformation Rule
Source Reference
Transformation Version

========================================================
7. DATA PROVENANCE
========================================================

Every PCBI observation must maintain provenance.

Required fields:

PCBI_ID
Observation_Date
Effective_Date
Original_Date
Original_Value
Standardized_Value
Original_Unit
Standardized_Unit
Original_Currency
Standardized_Currency
Source_Name
Source_URL
Source_Document
Source_Page
Source_Row
Source_Column
Extraction_Method
Transformation_Method
Frequency
Quality
Approval_Status
Approved_By
Approved_Date
Version

A user must be able to trace:

PCBI value
→ transformed value
→ uploaded document
→ exact source location.

========================================================
8. VALIDATION ENGINE
========================================================

Before approval perform:

DATE VALIDATION
- duplicate dates
- missing dates
- invalid dates
- future dates
- chronological order

PRICE VALIDATION
- blank prices
- zero prices
- negative prices
- abnormal jumps
- duplicate observations

UNIT VALIDATION
- ₹/MT
- ₹/KG
- USD/MT
- USD/LB
- etc.

CURRENCY VALIDATION

SPECIFICATION VALIDATION

FREQUENCY VALIDATION

HISTORICAL COVERAGE VALIDATION

SOURCE VALIDATION

OUTLIER DETECTION

IMPORTANT:

An outlier must NOT automatically be deleted.

Flag it for review.

========================================================
9. PCBI / CUSTOMER SPECIFICATION MATCH ENGINE
========================================================

When a PCBI is uploaded, compare it against Module 2.

Match using:

Material Code
UNSPSC
Commodity
Sub-Commodity
Description
Grade
Specification
Unit
Geography

Do NOT use description keyword matching as the sole authority.

Module 2 remains the classification authority.

Show:

MATCH
PARTIAL MATCH
SPECIFICATION MISMATCH
UNIT MISMATCH
GEOGRAPHY MISMATCH
NO MATCH

========================================================
10. CUSTOMER VS PCBI MISMATCH ALERT
========================================================

After benchmark processing becomes authorized, if customer purchase prices materially deviate from the PCBI trend, show:

"PCBI / CUSTOMER PRICE MISMATCH DETECTED"

Show:

Material
Customer Price
PCBI Reference
Variance %
Transaction Count
Spend
Period
Possible Reason

Possible reasons should be presented as hypotheses only:

Specification difference
Grade difference
Quantity difference
Freight
Location
Supplier premium
Contract condition
Timing difference
Data quality issue

Do NOT automatically call the difference "savings".

========================================================
11. ADMIN APPROVAL WORKFLOW
========================================================

New PCBI data must have these statuses:

DRAFT
VALIDATING
VALIDATION_FAILED
READY_FOR_REVIEW
APPROVED
PUBLISHED
SUPERSEDED
REJECTED

Only:

APPROVED → PUBLISHED

may enter the production PCBI dataset.

No uploaded data should automatically enter the production master.

========================================================
12. VERSION CONTROL
========================================================

Every PCBI must have versions.

Example:

PCBI-0291
Version 1.0

PCBI-0291
Version 1.1

PCBI-0291
Version 2.0

Never overwrite historical PCBI data.

Maintain:

Created By
Created Date
Modified By
Modified Date
Approval History
Change Reason

========================================================
13. PCBI MASTER ARCHITECTURE
========================================================

Separate:

PCBI_MASTER_CATALOG

from

PCBI_OBSERVATIONS

from

PCBI_SOURCE_REGISTER

from

PCBI_TRANSFORMATION_RULES

from

PCBI_APPROVAL_LOG

from

PCBI_GAP_REGISTER

from

PCBI_VERSION_HISTORY

This is mandatory.

Do NOT store everything in one flat PCBI table.

========================================================
14. NEW COMMODITY ONBOARDING WORKFLOW
========================================================

The complete workflow should be:

Customer Excel Upload
↓
Module 1
↓
Module 2
↓
Commodity Identification
↓
PCBI Matching
↓
Existing PCBI → Continue
NO PCBI → GAP ALERT
↓
Admin selects "CREATE PCBI"
↓
Upload any source format
↓
AI/Data Parser extracts information
↓
Standardization
↓
Validation
↓
Preview
↓
Admin Approval
↓
Create PCBI
↓
Version PCBI
↓
Publish
↓
Re-run affected Module 3 series
↓
Update benchmark coverage

========================================================
15. IMPORTANT: NO CYCLICAL DEVELOPMENT LOOP
========================================================

Do NOT ask the administrator/developer to manually create a new software code path for every commodity.

The system architecture must support:

"New commodity = new data + metadata"

NOT:

"New commodity = new software development."

The benchmark engine must be commodity-agnostic.

========================================================
16. ADMIN DASHBOARD
========================================================

Create a PCBI Coverage Dashboard showing:

Total PCBI commodities
Matched commodities
PCBI missing
Partial history
Specification mismatch
Frequency mismatch
Pending approval
Approved
Published
Not benchmarkable

Also show spend:

Matched Spend
Missing PCBI Spend
Partial PCBI Spend
Specification Mismatch Spend
Benchmarkable Spend
Non-Benchmarkable Spend

Add:

"ADD NEW PCBI"

button.

========================================================
17. SAFETY LOCK

For this implementation:

DO NOT populate benchmark values into production.

DO NOT calculate savings.

DO NOT connect Module 4.

DO NOT modify Module 1.

DO NOT modify Module 2.

DO NOT modify PCBI Master V1.0.

Build the architecture and validation workflow only.

========================================================
18. REQUIRED OUTPUT

After implementation, generate:

1. PCBI_DYNAMIC_ARCHITECTURE.md
2. PCBI_GAP_REGISTER_SCHEMA.json
3. PCBI_MASTER_SCHEMA_V2.json
4. PCBI_OBSERVATION_SCHEMA.json
5. PCBI_SOURCE_REGISTER_SCHEMA_V2.json
6. PCBI_TRANSFORMATION_RULE_SCHEMA.json
7. PCBI_APPROVAL_WORKFLOW.json
8. PCBI_VERSION_CONTROL_SCHEMA.json
9. PCBI_ADMIN_UPLOAD_SPECIFICATION.md
10. PCBI_DATA_VALIDATION_RULES.md
11. PCBI_GAP_DETECTION_TEST_REPORT.md
12. PCBI_DYNAMIC_ARCHITECTURE_TEST_REPORT.md

Also provide:

- database/schema changes
- backend API changes
- frontend/admin UI changes
- validation logic
- test cases
- migration considerations

FINAL REQUIREMENT:

Before reporting completion, run automated tests proving:

A. Existing PCBI continues to work.
B. Missing PCBI is detected.
C. Missing PCBI does not break Module 3.
D. A new PCBI can be created without code changes.
E. Excel upload can be parsed.
F. CSV upload can be parsed.
G. Monthly data can be normalized.
H. Weekly data can be normalized.
I. Fortnightly data can be normalized.
J. Invalid data is rejected/flagged.
K. Uploaded data cannot enter production without approval.
L. Version history is preserved.
M. Module 1 remains unchanged.
N. Module 2 remains unchanged.
O. Module 4 remains disconnected.
P. No savings are calculated.

STOP AFTER ARCHITECTURE + TEST VALIDATION.

Do not proceed to production benchmark population.
## Prompt 193

PCBI MODULE 3 — DYNAMIC ARCHITECTURE QA / GAP CLASSIFICATION HARDENING

MODE:
READ-ONLY / PRE-PRODUCTION / NO PRODUCTION BENCHMARKING

Do NOT populate production benchmark values.
Do NOT calculate savings.
Do NOT modify Module 1.
Do NOT modify Module 2.
Do NOT modify PCBI Master V1.0.
Do NOT purchase or call commercial data.
Keep Module 4 disconnected.

We have completed the Dynamic PCBI Ingestion architecture and 16/16 architecture tests passed.

Before any real benchmark testing, perform a SECOND-LEVEL QA of the architecture and correct the following issues.

========================================================
1. SEPARATE PCBI EXISTENCE FROM DATA AVAILABILITY
========================================================

The current report shows:

PCBI_MISSING = 0

while 16 series are PARTIAL_HISTORY.

This is insufficiently granular.

Implement the following independent dimensions:

PCBI_DEFINITION_STATUS:

DEFINED
MISSING
UNDER_REVIEW
NOT_BENCHMARKABLE

PCBI_DATA_STATUS:

COMPLETE
PARTIAL_HISTORY
NO_HISTORY
FREQUENCY_MISMATCH
SPECIFICATION_MISMATCH
SOURCE_UNVERIFIED

A PCBI being DEFINED must NOT imply that historical benchmark data is COMPLETE.

The dashboard must show both dimensions separately.

========================================================
2. MODULE 2 REMAINS THE ONLY CLASSIFICATION AUTHORITY
========================================================

Do not allow Module 3 to independently classify customer materials based on:

keyword searches
description matching
AI inference
commodity assumptions

Module 3 may use Module 2's:

Material Code
UNSPSC
Material Group
Commodity
Sub-Commodity
Grade
Specification

as its classification input.

Create a hard validation:

IF Module 3 classification conflicts with Module 2 classification:
STATUS = CLASSIFICATION_CONFLICT
ACTION = BLOCK

Do not automatically resolve the conflict.

========================================================
3. REMOVE AUTOMATIC METHODOLOGY ASSUMPTIONS
========================================================

Review every automatically generated recommendation such as:

- form-factor discounts
- grade conversion
- specification adjustment
- commodity proxy
- index substitution
- source substitution
- price conversion

No numerical adjustment may be automatically applied unless:

1. A documented methodology exists.
2. The methodology has a unique METHOD_ID.
3. The methodology is approved.
4. The methodology specifies the mathematical rule.
5. The rule has a source/provenance record.

If no approved methodology exists:

STATUS = METHODOLOGY_PENDING

Example:

SS 304 Turnings vs SS 304 Prime

Do NOT automatically apply -18%.

Instead:

SPECIFICATION_MISMATCH
METHODOLOGY_PENDING
ADMIN_ACTION_REQUIRED

========================================================
4. SOURCE CANDIDATE ≠ VALIDATED SOURCE
========================================================

Every recommended source must have:

SOURCE_STATUS:

CANDIDATE
UNDER_VALIDATION
VALIDATED
REJECTED

Never classify a suggested source as validated merely because the commodity name appears similar.

Validate:

Commodity
Grade
Specification
Unit
Geography
Frequency
Historical coverage
Price basis
Market basis

Example:

Ferro Molybdenum 65%

IBM mineral ASP must NOT automatically be treated as a valid ferro-moly benchmark.

It may be:

SOURCE_CANDIDATE

until specification equivalence is demonstrated.

========================================================
5. PROVENANCE TEST
========================================================

For every benchmark observation in the staging environment prove:

Observation
→ Source
→ Source document
→ Page/table/row
→ Original value
→ Original unit
→ Original frequency
→ Transformation rule
→ Standardized value
→ Approval record

If any link is missing:

VALIDATION_STATUS = BLOCKED

========================================================
6. PREVIEW SAFETY TEST
========================================================

The existing preview endpoint may calculate trial values only inside an isolated sandbox.

Rename the status visibly:

SIMULATION_ONLY
NOT_PRODUCTION
NOT_APPROVED

Prove that preview execution cannot write into:

PCBI_OBSERVATIONS production
PCBI_MASTER_CATALOG production
Savings engine
Module 4

Create an automated test for this.

========================================================
7. CREATE A FORMAL PCBI GAP MATRIX
========================================================

For all customer benchmark requirements generate:

Material
Module 2 Commodity
UNSPSC
Spend
Transactions
PCBI ID
Definition Status
Data Status
Source Status
Methodology Status
Historical Start Required
Historical End Required
Historical Start Available
Historical End Available
Frequency Required
Frequency Available
Specification Match
Geography Match
Unit Match
Action Required

Possible final readiness statuses:

READY_FOR_VALIDATION
SOURCE_REQUIRED
HISTORY_REQUIRED
METHODOLOGY_REQUIRED
SPECIFICATION_REVIEW
CLASSIFICATION_CONFLICT
PCBI_MISSING
NOT_BENCHMARKABLE

========================================================
8. CRITICAL MATERIALITY RULE
========================================================

Do not call a material "benchmark ready" merely because a PCBI ID exists.

Benchmark readiness requires ALL:

PCBI DEFINED
+
SOURCE VALIDATED
+
SPECIFICATION MATCH
+
UNIT MATCH
+
GEOGRAPHY MATCH
+
HISTORICAL COVERAGE SUFFICIENT
+
FREQUENCY RULE APPROVED
+
METHODOLOGY APPROVED

Otherwise:

NOT_READY

========================================================
9. TEST THE ARCHITECTURE USING SYNTHETIC TEST CASES
========================================================

Create at least these test cases:

TEST 01:
Existing PCBI + complete history
Expected = READY_FOR_VALIDATION

TEST 02:
Existing PCBI + partial history
Expected = HISTORY_REQUIRED

TEST 03:
No PCBI
Expected = PCBI_MISSING

TEST 04:
PCBI exists but wrong grade
Expected = SPECIFICATION_REVIEW

TEST 05:
PCBI exists but wrong unit
Expected = UNIT_MISMATCH

TEST 06:
Source exists but specification equivalence unproven
Expected = SOURCE_UNDER_VALIDATION

TEST 07:
Monthly source for weekly requirement
Expected = FREQUENCY_MISMATCH / METHODOLOGY_REQUIRED

TEST 08:
Approved transformation rule exists
Expected = eligible for normalization

TEST 09:
Unapproved discount methodology
Expected = BLOCKED

TEST 10:
Preview calculation attempted
Expected = SANDBOX ONLY

TEST 11:
Module 2 classification conflicts with Module 3
Expected = CLASSIFICATION_CONFLICT / BLOCK

TEST 12:
Admin uploads malformed PDF
Expected = VALIDATION_FAILED

========================================================
10. DO NOT RESEARCH OR PURCHASE COMMODITY DATA
========================================================

This command is architecture QA only.

Do not search for:

BigMint
Platts
LME
ICDA
MMTA
IBM
PPAC
WPI
MCX

No external benchmark data is required for this test.

========================================================
11. REQUIRED OUTPUT
========================================================

Generate:

PCBI_V1_3_1_GAP_STATUS_MODEL.json
PCBI_V1_3_1_SOURCE_VALIDATION_MODEL.json
PCBI_V1_3_1_METHODOLOGY_GOVERNANCE.json
PCBI_V1_3_1_PREVIEW_SAFETY_TEST.json
PCBI_V1_3_1_GAP_MATRIX.xlsx
PCBI_V1_3_1_ARCHITECTURE_QA_REPORT.md

Report:

- all tests passed/failed
- all automatic assumptions found
- all fields changed
- all API changes
- all UI changes
- all database/schema changes

FINAL SAFETY LOCK:

Module 1 = FROZEN
Module 2 = FROZEN
PCBI Master V1.0 = IMMUTABLE
Module 3 = PRE-PRODUCTION
Module 4 = DISCONNECTED
Benchmark production values = ZERO
Savings = ZERO

STOP AFTER ARCHITECTURE QA.
## Prompt 194

run locally

## Prompt 195

PCBI MODULE 3 — DYNAMIC ARCHITECTURE QA / GAP CLASSIFICATION HARDENING

MODE:
READ-ONLY / PRE-PRODUCTION / NO PRODUCTION BENCHMARKING

Do NOT populate production benchmark values.
Do NOT calculate savings.
Do NOT modify Module 1.
Do NOT modify Module 2.
Do NOT modify PCBI Master V1.0.
Do NOT purchase or call commercial data.
Keep Module 4 disconnected.

We have completed the Dynamic PCBI Ingestion architecture and 16/16 architecture tests passed.

Before any real benchmark testing, perform a SECOND-LEVEL QA of the architecture and correct the following issues.

========================================================
1. SEPARATE PCBI EXISTENCE FROM DATA AVAILABILITY
========================================================

The current report shows:

PCBI_MISSING = 0

while 16 series are PARTIAL_HISTORY.

This is insufficiently granular.

Implement the following independent dimensions:

PCBI_DEFINITION_STATUS:

DEFINED
MISSING
UNDER_REVIEW
NOT_BENCHMARKABLE

PCBI_DATA_STATUS:

COMPLETE
PARTIAL_HISTORY
NO_HISTORY
FREQUENCY_MISMATCH
SPECIFICATION_MISMATCH
SOURCE_UNVERIFIED

A PCBI being DEFINED must NOT imply that historical benchmark data is COMPLETE.

The dashboard must show both dimensions separately.

========================================================
2. MODULE 2 REMAINS THE ONLY CLASSIFICATION AUTHORITY
========================================================

Do not allow Module 3 to independently classify customer materials based on:

keyword searches
description matching
AI inference
commodity assumptions

Module 3 may use Module 2's:

Material Code
UNSPSC
Material Group
Commodity
Sub-Commodity
Grade
Specification

as its classification input.

Create a hard validation:

IF Module 3 classification conflicts with Module 2 classification:
STATUS = CLASSIFICATION_CONFLICT
ACTION = BLOCK

Do not automatically resolve the conflict.

========================================================
3. REMOVE AUTOMATIC METHODOLOGY ASSUMPTIONS
========================================================

Review every automatically generated recommendation such as:

- form-factor discounts
- grade conversion
- specification adjustment
- commodity proxy
- index substitution
- source substitution
- price conversion

No numerical adjustment may be automatically applied unless:

1. A documented methodology exists.
2. The methodology has a unique METHOD_ID.
3. The methodology is approved.
4. The methodology specifies the mathematical rule.
5. The rule has a source/provenance record.

If no approved methodology exists:

STATUS = METHODOLOGY_PENDING

Example:

SS 304 Turnings vs SS 304 Prime

Do NOT automatically apply -18%.

Instead:

SPECIFICATION_MISMATCH
METHODOLOGY_PENDING
ADMIN_ACTION_REQUIRED

========================================================
4. SOURCE CANDIDATE ≠ VALIDATED SOURCE
========================================================

Every recommended source must have:

SOURCE_STATUS:

CANDIDATE
UNDER_VALIDATION
VALIDATED
REJECTED

Never classify a suggested source as validated merely because the commodity name appears similar.

Validate:

Commodity
Grade
Specification
Unit
Geography
Frequency
Historical coverage
Price basis
Market basis

Example:

Ferro Molybdenum 65%

IBM mineral ASP must NOT automatically be treated as a valid ferro-moly benchmark.

It may be:

SOURCE_CANDIDATE

until specification equivalence is demonstrated.

========================================================
5. PROVENANCE TEST
========================================================

For every benchmark observation in the staging environment prove:

Observation
→ Source
→ Source document
→ Page/table/row
→ Original value
→ Original unit
→ Original frequency
→ Transformation rule
→ Standardized value
→ Approval record

If any link is missing:

VALIDATION_STATUS = BLOCKED

========================================================
6. PREVIEW SAFETY TEST
========================================================

The existing preview endpoint may calculate trial values only inside an isolated sandbox.

Rename the status visibly:

SIMULATION_ONLY
NOT_PRODUCTION
NOT_APPROVED

Prove that preview execution cannot write into:

PCBI_OBSERVATIONS production
PCBI_MASTER_CATALOG production
Savings engine
Module 4

Create an automated test for this.

========================================================
7. CREATE A FORMAL PCBI GAP MATRIX
========================================================

For all customer benchmark requirements generate:

Material
Module 2 Commodity
UNSPSC
Spend
Transactions
PCBI ID
Definition Status
Data Status
Source Status
Methodology Status
Historical Start Required
Historical End Required
Historical Start Available
Historical End Available
Frequency Required
Frequency Available
Specification Match
Geography Match
Unit Match
Action Required

Possible final readiness statuses:

READY_FOR_VALIDATION
SOURCE_REQUIRED
HISTORY_REQUIRED
METHODOLOGY_REQUIRED
SPECIFICATION_REVIEW
CLASSIFICATION_CONFLICT
PCBI_MISSING
NOT_BENCHMARKABLE

========================================================
8. CRITICAL MATERIALITY RULE
========================================================

Do not call a material "benchmark ready" merely because a PCBI ID exists.

Benchmark readiness requires ALL:

PCBI DEFINED
+
SOURCE VALIDATED
+
SPECIFICATION MATCH
+
UNIT MATCH
+
GEOGRAPHY MATCH
+
HISTORICAL COVERAGE SUFFICIENT
+
FREQUENCY RULE APPROVED
+
METHODOLOGY APPROVED

Otherwise:

NOT_READY

========================================================
9. TEST THE ARCHITECTURE USING SYNTHETIC TEST CASES
========================================================

Create at least these test cases:

TEST 01:
Existing PCBI + complete history
Expected = READY_FOR_VALIDATION

TEST 02:
Existing PCBI + partial history
Expected = HISTORY_REQUIRED

TEST 03:
No PCBI
Expected = PCBI_MISSING

TEST 04:
PCBI exists but wrong grade
Expected = SPECIFICATION_REVIEW

TEST 05:
PCBI exists but wrong unit
Expected = UNIT_MISMATCH

TEST 06:
Source exists but specification equivalence unproven
Expected = SOURCE_UNDER_VALIDATION

TEST 07:
Monthly source for weekly requirement
Expected = FREQUENCY_MISMATCH / METHODOLOGY_REQUIRED

TEST 08:
Approved transformation rule exists
Expected = eligible for normalization

TEST 09:
Unapproved discount methodology
Expected = BLOCKED

TEST 10:
Preview calculation attempted
Expected = SANDBOX ONLY

TEST 11:
Module 2 classification conflicts with Module 3
Expected = CLASSIFICATION_CONFLICT / BLOCK

TEST 12:
Admin uploads malformed PDF
Expected = VALIDATION_FAILED

========================================================
10. DO NOT RESEARCH OR PURCHASE COMMODITY DATA
========================================================

This command is architecture QA only.

Do not search for:

BigMint
Platts
LME
ICDA
MMTA
IBM
PPAC
WPI
MCX

No external benchmark data is required for this test.

========================================================
11. REQUIRED OUTPUT
========================================================

Generate:

PCBI_V1_3_1_GAP_STATUS_MODEL.json
PCBI_V1_3_1_SOURCE_VALIDATION_MODEL.json
PCBI_V1_3_1_METHODOLOGY_GOVERNANCE.json
PCBI_V1_3_1_PREVIEW_SAFETY_TEST.json
PCBI_V1_3_1_GAP_MATRIX.xlsx
PCBI_V1_3_1_ARCHITECTURE_QA_REPORT.md

Report:

- all tests passed/failed
- all automatic assumptions found
- all fields changed
- all API changes
- all UI changes
- all database/schema changes

FINAL SAFETY LOCK:

Module 1 = FROZEN
Module 2 = FROZEN
PCBI Master V1.0 = IMMUTABLE
Module 3 = PRE-PRODUCTION
Module 4 = DISCONNECTED
Benchmark production values = ZERO
Savings = ZERO

STOP AFTER ARCHITECTURE QA.
## Prompt 196

check again


## Prompt 197

PCBI MODULE 3 — END-TO-END DYNAMIC PCBI TEST

Operating Mode:
CONTROLLED PRE-PRODUCTION E2E TEST
NO UNAPPROVED PRODUCTION BENCHMARKING
MODULE 1 = FROZEN
MODULE 2 = FROZEN / SOLE CLASSIFICATION AUTHORITY
MODULE 4 = DISCONNECTED

We have completed the Module 3 architecture hardening and all 12 synthetic QA tests have passed.

Now proceed to an END-TO-END TEST of the actual user workflow using the existing certified Module 1 + Module 2 customer data.

OBJECTIVE:
Prove that Module 3 can operate dynamically when PCBI data is incomplete, missing, available in different formats, or available at different frequencies.

DO NOT attempt to research or invent benchmark data.
DO NOT populate fabricated benchmark values.
DO NOT alter Module 1, Module 2, or PCBI Master V1.0.
Do not purchase or call commercial data sources.

PHASE 1 — LOAD CUSTOMER DATA

Run the complete Module 3 pipeline against the certified Module 1 + Module 2 dataset.

For every classified commodity/material family determine:

1. PCBI_DEFINITION_STATUS
2. PCBI_DATA_STATUS
3. Customer spend
4. Transaction count
5. Required historical period
6. Available historical period
7. Required frequency
8. Available frequency
9. Source status
10. Final readiness status
11. Required ADMIN_ACTION

Create a complete gap matrix.

PHASE 2 — IDENTIFY PCBI GAPS

For every commodity where PCBI data is:

- MISSING
- NO_HISTORY
- PARTIAL_HISTORY
- FREQUENCY_MISMATCH
- SPECIFICATION_MISMATCH
- SOURCE_UNVERIFIED
- METHODOLOGY_PENDING

display a clear user-facing alert.

The alert must contain:

COMMODITY
MODULE 2 MATERIAL / UNSPSC MAPPING
CUSTOMER SPEND
TRANSACTION COUNT
PCBI STATUS
DATA GAP
REQUIRED DATA
REQUIRED FREQUENCY
REQUIRED UNIT
REQUIRED CURRENCY
REQUIRED HISTORICAL PERIOD
REQUIRED ACTION

Example:

"PCBI DATA GAP — Ferro Molybdenum
Customer Spend: ₹XXX Cr
Required History: Apr-2020 to latest
Required Frequency: Weekly
Required Unit: INR/MT
Current PCBI History: Missing
Action: Upload PCBI source data"

PHASE 3 — PCBI UPLOAD WORKFLOW

Verify that the administrator can select:

UPLOAD PCBI DATA

The upload interface must accept common source formats:

- XLSX
- XLS
- CSV
- PDF
- JSON
- TXT

Do NOT assume that the uploaded file already follows the PCBI schema.

The system must first perform:

UPLOAD
→ FILE VALIDATION
→ DATA EXTRACTION
→ COLUMN DETECTION
→ DATE DETECTION
→ PRICE/VALUE DETECTION
→ UNIT DETECTION
→ CURRENCY DETECTION
→ FREQUENCY DETECTION
→ SOURCE IDENTIFICATION
→ SERIES IDENTIFICATION
→ DATA QUALITY CHECK
→ PCBI STANDARDIZATION PREVIEW

The system must NEVER directly write uploaded data into production.

PHASE 4 — FREQUENCY NORMALIZATION

Test at least these cases:

1. Weekly source
2. Fortnightly source
3. Monthly source
4. Quarterly source

For each case:

DO NOT interpolate unless an explicitly approved methodology exists.

Instead show:

SOURCE FREQUENCY
TARGET PCBI FREQUENCY
PROPOSED TRANSFORMATION
METHODOLOGY STATUS
ADMIN APPROVAL REQUIRED

If transformation would require interpolation or synthetic values, BLOCK the transformation and explicitly state:

"METHODOLOGY_APPROVAL_REQUIRED"

For monthly/fortnightly/weekly conversion, preserve the original observation and transformation lineage.

PHASE 5 — STANDARD PCBI FORMAT

Create a normalized preview containing at minimum:

PCBI_ID
COMMODITY_ID
SERIES_ID
SOURCE_NAME
SOURCE_URL
SOURCE_DOCUMENT
OBSERVATION_DATE
EFFECTIVE_DATE
RAW_VALUE
RAW_UNIT
RAW_CURRENCY
STANDARD_VALUE
STANDARD_UNIT
STANDARD_CURRENCY
SOURCE_FREQUENCY
STANDARD_FREQUENCY
TRANSFORMATION_METHOD
TRANSFORMATION_VERSION
DATA_GAP_FLAG
SOURCE_STATUS
METHODOLOGY_ID
INGESTION_BATCH_ID
CHECKSUM
VALIDATION_STATUS

Display the complete preview to the administrator.

PHASE 6 — ADMIN CONFIRMATION GATE

The administrator must see:

SOURCE DATA
→ NORMALIZED DATA
→ TRANSFORMATION
→ VALIDATION RESULTS
→ PCBI PREVIEW

with two explicit options:

[REJECT]
[APPROVE & ADD TO PCBI CATALOG]

IMPORTANT:

Before approval:
ZERO writes to production.

After APPROVE:
write only the approved PCBI series into the PCBI catalog.

Record:

ADMIN_USER
APPROVAL_TIMESTAMP
APPROVAL_ID
SOURCE_CHECKSUM
METHODOLOGY_ID
VERSION
CHANGE_REASON

PHASE 7 — MAIN PCBI CATALOG

Verify that an approved new commodity can be added without modifying existing PCBI series.

The catalog must support:

ADD NEW COMMODITY
ADD NEW PCBI SERIES
ADD NEW SOURCE
ADD NEW HISTORY
UPDATE EXISTING SERIES
VERSION HISTORY
DEPRECATE SERIES

Existing approved data must remain immutable.

PHASE 8 — RE-RUN THE SAME CUSTOMER DATA

After an administrator-approved PCBI series is added:

Re-run Module 3 against the same customer dataset.

Verify that:

BEFORE:
PCBI_DATA_STATUS = MISSING / PARTIAL / etc.

AFTER:
PCBI_DATA_STATUS = COMPLETE or appropriate validated status

The previously displayed gap must disappear automatically.

The system must NOT require a code deployment for adding a new commodity or new PCBI history.

PHASE 9 — MISMATCH DETECTION

Create a controlled test where customer data and uploaded PCBI data have a major mismatch in:

- grade
- specification
- unit
- currency
- geography
- date coverage
- frequency

The system must NOT silently accept it.

Expected behaviour:

MISMATCH DETECTED
→ CLASSIFICATION_CONFLICT / SPECIFICATION_MISMATCH / CONVERSION_PENDING / METHODOLOGY_PENDING
→ ADMIN ACTION REQUIRED
→ NO PRODUCTION BENCHMARK

PHASE 10 — FINAL E2E REPORT

Generate:

1. PCBI_V1_4_E2E_TEST_REPORT.md
2. PCBI_V1_4_E2E_GAP_MATRIX.xlsx
3. PCBI_V1_4_UPLOAD_NORMALIZATION_TEST.json
4. PCBI_V1_4_APPROVAL_WORKFLOW_TEST.json
5. PCBI_V1_4_FREQUENCY_NORMALIZATION_TEST.json
6. PCBI_V1_4_PCBI_CATALOG_VERSION_TEST.json

The final report must clearly state:

TOTAL COMMODITIES TESTED
PCBI DEFINED
PCBI MISSING
COMPLETE HISTORY
PARTIAL HISTORY
NO HISTORY
FREQUENCY MISMATCH
SPECIFICATION MISMATCH
SOURCE UNVERIFIED
METHODOLOGY PENDING
NOT BENCHMARKABLE
HIGH-IMPACT GAPS
UPLOAD TESTS PASSED
NORMALIZATION TESTS PASSED
ADMIN APPROVAL TESTS PASSED
CATALOG VERSIONING TESTS PASSED
PRODUCTION WRITES BEFORE APPROVAL
PRODUCTION WRITES AFTER APPROVAL
MODULE 1 MODIFIED = YES/NO
MODULE 2 MODIFIED = YES/NO
MODULE 4 CONNECTED = YES/NO

FINAL GATE MUST BE ONE OF:

E2E_VALIDATED
E2E_VALIDATED_WITH_GAPS
E2E_BLOCKED

Do NOT call the system production-ready merely because the tests pass.

STOP after generating the E2E report.
Do not generate production benchmark values or savings.


## Prompt 198

PCBI MODULE 3 — CONTROLLED BENCHMARK ENGINE VALIDATION

We have completed E2E dynamic PCBI ingestion successfully.

Final E2E status:
E2E_VALIDATED_WITH_GAPS

DO NOT perform another architecture redesign.
DO NOT modify Module 1.
DO NOT modify Module 2.
DO NOT modify PCBI Master V1.0.
DO NOT connect Module 4.
DO NOT calculate savings or procurement opportunities.

The next objective is to validate the ACTUAL PCBI CALCULATION ENGINE using a controlled set of approved/known source structures.

IMPORTANT:
This is a CALCULATION VALIDATION exercise, not full production benchmarking.

PHASE 1 — FULL DATASET PRE-FLIGHT

Load the complete certified Module 1 + Module 2 customer dataset.

Report:

Total customer spend
Total transactions
Total Module 2 commodity families
Total PCBI technical series
PCBI DEFINED
PCBI MISSING
COMPLETE HISTORY
PARTIAL HISTORY
NO HISTORY
FREQUENCY MISMATCH
SPECIFICATION MISMATCH
SOURCE UNVERIFIED
METHODOLOGY PENDING
NOT BENCHMARKABLE

Confirm that the full dataset is being used.

If the dataset is not the certified full dataset, STOP and report the exact dataset being used.

PHASE 2 — CONTROLLED 12-SERIES BENCHMARK TEST

Select exactly one representative series for each of the following categories:

1. VERIFIED_FREE_DIRECT
2. OFFICIAL_INDEX
3. MONTHLY_OFFICIAL_INDEX
4. WEEKLY_SOURCE
5. FORTNIGHTLY_SOURCE
6. METAL_CONSTITUENT
7. STAINLESS_STEEL_GRADE
8. FERROALLOY
9. SCRAP
10. PARTIAL_HISTORY
11. NO_HISTORY
12. SPECIFICATION_MISMATCH

Do not select series arbitrarily.

For every selected series provide:

PCBI_ID
Commodity
Module 2 classification
UNSPSC
Customer spend
Customer transaction count
Source
Source status
Source frequency
Required frequency
Historical period
Available history
Unit
Currency
Geography
Methodology ID
Methodology approval status

PHASE 3 — RAW SOURCE OBSERVATION VALIDATION

Before calculating any PCBI:

Display the source observations used.

For every observation retain:

SOURCE_DATE
EFFECTIVE_DATE
RAW_VALUE
RAW_UNIT
RAW_CURRENCY
SOURCE_FREQUENCY
SOURCE_DOCUMENT
SOURCE_URL
CHECKSUM
INGESTION_BATCH_ID

Do not round values during calculation.

PHASE 4 — STANDARDIZATION

Apply only approved transformations.

Validate:

Currency conversion
Unit conversion
Frequency alignment
Effective-date mapping
Missing-date handling
Rebasing
Series continuity

For every transformation show:

RAW VALUE
TRANSFORMATION
STANDARD VALUE
METHODOLOGY_ID
APPROVAL_STATUS

If any transformation lacks an approved methodology:

BLOCK.

Do not invent a formula.

PHASE 5 — PCBI CALCULATION

For only the eligible series, calculate the PCBI according to the approved methodology.

Show the complete calculation chain:

RAW SOURCE OBSERVATION
→ STANDARDIZED OBSERVATION
→ EFFECTIVE OBSERVATION
→ BASE PERIOD VALUE
→ CURRENT PERIOD VALUE
→ INDEX CALCULATION
→ PCBI OUTPUT

Do not calculate savings.

Do not calculate procurement opportunity.

Do not silently use customer purchase price as a market benchmark.

PHASE 6 — BASE-PERIOD VALIDATION

For every calculated PCBI series explicitly identify:

BASE_DATE
BASE_VALUE
CURRENT_DATE
CURRENT_VALUE
INDEX_BASE = 100
CALCULATION_FORMULA
METHODOLOGY_ID

Verify mathematically that the base period equals 100.

If not, BLOCK.

PHASE 7 — NEGATIVE TESTS

Explicitly test:

A. Missing history
B. Partial history
C. Wrong grade
D. Wrong specification
E. Wrong currency
F. Wrong unit
G. Wrong geography
H. Unapproved frequency conversion
I. Missing source provenance
J. Missing methodology approval

Expected outcome for each:

NO PCBI GENERATED
STATUS = BLOCKED / appropriate governance status
ADMIN ACTION REQUIRED

PHASE 8 — CUSTOMER PRICE COMPARISON

Do NOT calculate savings.

However, create a SAFE analytical preview showing:

CUSTOMER PURCHASE PRICE
PCBI INDEX
PCBI-IMPLIED MOVEMENT

Clearly label this:

"ANALYTICAL PREVIEW — NOT SAVINGS"

Do not produce supplier performance ranking or savings.

PHASE 9 — AUDIT TRAIL

For every generated PCBI observation confirm all 10 provenance links exist:

LINK_01_RAW_DOWNLOAD
LINK_02_ORIGINAL_CHECKSUM
LINK_03_INGESTION_TIMESTAMP
LINK_04_INGESTION_BATCH
LINK_05_EXTRACTION_SCRIPT
LINK_06_REBASE_TRANSFORMATION
LINK_07_CURRENCY_CONVERSION
LINK_08_UNIT_STANDARDIZATION
LINK_09_VALIDATION_EVENT
LINK_10_MODULE3_BENCHMARK_INPUT

Missing link = BLOCK.

PHASE 10 — FINAL REPORT

Generate:

PCBI_V1_5_CONTROLLED_BENCHMARK_VALIDATION.md

PCBI_V1_5_CONTROLLED_BENCHMARK_RESULTS.xlsx

PCBI_V1_5_CALCULATION_AUDIT.json

PCBI_V1_5_NEGATIVE_TEST_RESULTS.json

PCBI_V1_5_PROVENANCE_AUDIT.json

The final report must state:

FULL DATASET CONFIRMED = YES/NO
SERIES TESTED = 12
ELIGIBLE SERIES
BLOCKED SERIES
PCBI CALCULATIONS COMPLETED
PCBI CALCULATIONS BLOCKED
PROVENANCE FAILURES
METHODOLOGY FAILURES
SPECIFICATION FAILURES
FREQUENCY FAILURES
UNIT/CURRENCY FAILURES
MODULE 1 MODIFIED = NO
MODULE 2 MODIFIED = NO
PCBI MASTER MODIFIED = NO
MODULE 4 CONNECTED = NO
SAVINGS CALCULATED = ZERO

FINAL GATE MUST BE ONE OF:

CALCULATION_VALIDATED
CALCULATION_VALIDATED_WITH_GAPS
CALCULATION_BLOCKED

DO NOT declare production readiness.

STOP after generating the report.

## Prompt 199

PCBI MODULE 3 — CONTROLLED PILOT FINALIZATION + DYNAMIC COMMODITY EXPANSION
V1.6 FINAL PRODUCTIZATION COMMAND

OBJECTIVE

The PCBI Module 3 calculation engine has now successfully completed controlled validation.

V1.5 confirms:

- Full certified customer dataset successfully processed
- 12 technical series tested
- 6 eligible series calculated
- 6 series correctly blocked
- Base-period index = 100.00 verified
- 10/10 negative tests passed
- 10-link provenance chain passed
- Module 1 unchanged
- Module 2 unchanged
- PCBI Master V1.0 unchanged
- Module 4 disconnected
- Savings = ZERO
- Commercial purchases = ZERO

Therefore DO NOT restart another broad architecture audit.

MOVE FROM:
ARCHITECTURE VALIDATION

TO:

CONTROLLED PILOT + DYNAMIC PCBI LIBRARY EXPANSION

========================================================
1. FREEZE THE VALIDATED CALCULATION ENGINE
========================================================

Treat the V1.5 calculation engine as the validated baseline.

Do not redesign:

- PCBI calculation chain
- Base-period calculation
- Provenance architecture
- Module 2 authority
- Gap governance
- Admin approval gate
- Version control
- Negative-test controls

Any future change must be treated as a versioned enhancement, not a redesign.

========================================================
2. FINALIZE MODULE 3 AS A DYNAMIC PRODUCT
========================================================

The software must NOT require all commodities to be available before operation.

A commodity can exist in any of these states:

PCBI_MISSING
PCBI_DEFINED_NO_HISTORY
PARTIAL_HISTORY
SOURCE_UNVERIFIED
METHODOLOGY_PENDING
SPECIFICATION_MISMATCH
FREQUENCY_MISMATCH
READY_FOR_CALCULATION
PRODUCTION_READY
NOT_BENCHMARKABLE

The existence of a gap must NOT stop Module 3 from processing other eligible commodities.

========================================================
3. LIVE CUSTOMER GAP MATRIX
========================================================

Whenever customer data is processed:

Module 2 classification
        ↓
PCBI lookup
        ↓
PCBI existence check
        ↓
Historical coverage check
        ↓
Specification check
        ↓
Frequency check
        ↓
Source validation
        ↓
Methodology validation
        ↓
CALCULATE or BLOCK

For blocked commodities create a permanent research queue.

Display:

Commodity
UNSPSC
Material Code
Customer Spend
Transaction Count
PCBI Status
History Available
History Required
Frequency Required
Source
Methodology
Block Reason
Admin Action
Priority

Sort primarily by customer spend.

========================================================
4. DO NOT BLOCK THE WHOLE SYSTEM BECAUSE OF MISSING COMMODITIES
========================================================

This is critical.

If:

Commodity A = PRODUCTION_READY
Commodity B = MISSING
Commodity C = PARTIAL_HISTORY
Commodity D = METHODOLOGY_PENDING

The system must still calculate Commodity A.

Commodity B/C/D must remain blocked individually.

One missing PCBI must never stop other valid PCBI calculations.

========================================================
5. ADMIN PCBI RESEARCH WORKFLOW
========================================================

For every blocked commodity provide:

[RESEARCH PCBI]

Then:

[UPLOAD DATA]

Supported formats:

XLSX
XLS
CSV
PDF
JSON
TXT

The system should automatically detect:

Date
Period
Price
Unit
Currency
Frequency
Commodity
Grade
Specification
Geography
Source

Show all detected information in PREVIEW mode.

Never silently approve.

========================================================
6. PCBI STANDARDIZATION
========================================================

Convert approved source data into the standard PCBI observation structure.

Every observation must retain:

PCBI_ID
COMMODITY_ID
SERIES_ID
SOURCE_NAME
SOURCE_DATE
EFFECTIVE_DATE
RAW_VALUE
RAW_UNIT
RAW_CURRENCY
STANDARD_VALUE
STANDARD_UNIT
STANDARD_CURRENCY
SOURCE_FREQUENCY
STANDARD_FREQUENCY
GEOGRAPHY
GRADE
SPECIFICATION
TRANSFORMATION_METHOD
METHODOLOGY_ID
INGESTION_BATCH_ID
CHECKSUM
VALIDATION_STATUS
VERSION
APPROVED_BY
APPROVED_AT

Do not overwrite previous approved observations.

========================================================
7. COMMODITY-WISE DATA RESEARCH MODEL
========================================================

Do NOT require one universal source.

Each commodity may have a different source.

Examples:

Steel → industry publication / government / market source
Copper → exchange / market source
Aluminium → exchange / market source
Ferro Molybdenum → industry publication / market source
Ferro Chrome → industry source
Ferro Silicon → industry source
Stainless Steel → grade-specific market source
Paper → industry/public source
Chemicals → government/industry source
Polymers → industry/public source
Fuel → government source

Multiple sources can coexist for one commodity.

Each source remains separately traceable.

========================================================
8. CONTINUOUS PCBI LIBRARY EXPANSION
========================================================

The PCBI catalog must support:

ADD COMMODITY
ADD PCBI
ADD GRADE
ADD SERIES
ADD SOURCE
UPLOAD HISTORY
APPEND HISTORY
UPDATE SOURCE
VERSION SERIES
DEPRECATE SERIES

All through ADMIN PORTAL.

No code deployment should be required to add normal new commodity history.

========================================================
9. HISTORICAL DEPTH
========================================================

Target historical period:

2020-04-01 → latest available date

But DO NOT reject a commodity merely because full history is unavailable.

Classify:

75m = COMPLETE
24–74m = PARTIAL_HISTORY
0m = NO_HISTORY

Allow additional history to be uploaded later.

When additional history is approved:

PARTIAL_HISTORY
        ↓
HISTORY UPDATED
        ↓
RECALCULATE READINESS
        ↓
PRODUCTION_READY if all conditions pass

========================================================
10. FREQUENCY GOVERNANCE
========================================================

Keep existing governance.

Weekly → Weekly:
DIRECT

Monthly → Monthly:
DIRECT

Fortnightly → Weekly:
BLOCK until approved methodology

Monthly → Weekly:
BLOCK until approved methodology

Quarterly → Monthly:
BLOCK until approved methodology

NO silent interpolation.

NO synthetic observations.

NO arbitrary averaging.

If a methodology is approved, store the methodology ID with every transformed observation.

========================================================
11. CALCULATION ENGINE
========================================================

For eligible commodities execute:

RAW SOURCE
↓
STANDARDIZATION
↓
EFFECTIVE DATE
↓
BASE PERIOD
↓
CURRENT PERIOD
↓
INDEX
↓
PCBI OUTPUT

Base period:

2020-04

Base index:

100.00

Formula:

PCBI INDEX =
(Current Standardized Value / Base Period Standardized Value) × 100

Where the approved methodology specifies otherwise, use that approved methodology and retain the methodology ID.

========================================================
12. ANALYTICAL PREVIEW
========================================================

Continue to show:

Customer Purchase Value
PCBI Base Value
PCBI Current Value
PCBI Index
Market Movement

BUT FIX AND VALIDATE DISPLAY NORMALIZATION.

The V1.5 preview contained examples such as:

"£66,678.25/roll"
"$72,645.00/pcs"

while the certified customer dataset is reported in INR.

Investigate this.

Ensure:

Customer Value
Customer Currency
Customer Unit
PCBI Value
PCBI Currency
PCBI Unit

are separately displayed and correctly labeled.

Do NOT change underlying certified customer data.

This is a presentation/data-display validation issue.

========================================================
13. DO NOT CALCULATE SAVINGS YET
========================================================

PCBI calculation may run.

But:

SAVINGS = ZERO

OPPORTUNITY = ZERO

SUPPLIER RANKING = ZERO

until the explicit commercial/savings activation gate is approved.

========================================================
14. PILOT DASHBOARD
========================================================

Create the Module 3 management dashboard:

TOTAL CUSTOMER SPEND
TOTAL COMMODITIES
PCBI DEFINED
PCBI MISSING
COMPLETE HISTORY
PARTIAL HISTORY
NO HISTORY
SOURCE VERIFIED
SOURCE PENDING
METHODOLOGY APPROVED
METHODOLOGY PENDING
READY FOR CALCULATION
PRODUCTION READY
HIGH IMPACT GAPS

Also show:

TOP 20 MISSING PCBI BY SPEND

This becomes our permanent research priority list.

========================================================
15. ADMIN ACTIONS
========================================================

For each gap:

[CREATE PCBI]

[UPLOAD HISTORY]

[ADD SOURCE]

[ADD METHODOLOGY]

[VALIDATE]

[APPROVE]

[REJECT]

[VIEW PROVENANCE]

[VIEW VERSION HISTORY]

After approval:

automatically rerun ONLY the affected commodity.

Do not rerun the entire dataset unnecessarily.

========================================================
16. CONTROLLED PILOT MODE
========================================================

Set:

MODULE3_STATUS =
PRODUCTION_READY_FOR_CONTROLLED_PILOT

provided all productization tests pass.

Controlled pilot means:

- PCBI calculations allowed for validated series
- Missing commodities remain individually blocked
- Analytical preview allowed
- No savings
- No commercial opportunity
- Module 4 disconnected
- Module 1 frozen
- Module 2 frozen
- PCBI Master V1.0 immutable

========================================================
17. FINAL ACCEPTANCE TEST
========================================================

Do NOT conduct another broad methodology audit.

Run only these final product tests:

TEST 01:
Existing eligible PCBI calculates successfully.

TEST 02:
Missing PCBI generates actionable gap.

TEST 03:
Admin uploads XLSX.

TEST 04:
Admin uploads PDF.

TEST 05:
Admin uploads CSV.

TEST 06:
System detects columns and frequency.

TEST 07:
System blocks unapproved frequency conversion.

TEST 08:
Admin approves methodology.

TEST 09:
Admin approves PCBI.

TEST 10:
Customer commodity changes:

MISSING
→ DEFINED
→ HISTORY AVAILABLE
→ PRODUCTION_READY

TEST 11:
New historical data can be appended.

TEST 12:
Version history remains immutable.

TEST 13:
Second source can be added.

TEST 14:
Source provenance remains separate.

TEST 15:
One blocked commodity does not prevent another eligible commodity from calculating.

TEST 16:
Module 1 remains unchanged.

TEST 17:
Module 2 remains unchanged.

TEST 18:
Module 4 remains disconnected.

TEST 19:
Savings remains ZERO.

TEST 20:
Commercial purchasing remains ZERO.

========================================================
18. FINAL DELIVERABLES
========================================================

Generate:

PCBI_V1_6_CONTROLLED_PILOT_READINESS.md

PCBI_V1_6_DYNAMIC_CATALOG_SCHEMA.json

PCBI_V1_6_GAP_RESEARCH_QUEUE.xlsx

PCBI_V1_6_ADMIN_PCBl_WORKFLOW.md

PCBI_V1_6_PRODUCT_ACCEPTANCE_TEST.json

PCBI_V1_6_PRODUCTION_READINESS.json

========================================================
19. STOP CONDITION
========================================================

If all 20 product acceptance tests pass:

DO NOT create another architecture redesign.

DO NOT start another recursive audit.

Set:

MODULE3_STATUS =
PRODUCTION_READY_FOR_CONTROLLED_PILOT

and report:

1. IMPLEMENTED
2. PASSING TESTS
3. REMAINING PRODUCT GAPS
4. CURRENT PCBI RESEARCH QUEUE
5. ADMIN ACTION REQUIRED

========================================================
FINAL OPERATING PRINCIPLE
========================================================

We are no longer trying to finish researching every commodity before deploying Module 3.

We are building a continuously expandable PCBI platform.

The software must be useful today with the validated commodities and become stronger every time a new commodity/source/history is uploaded and approved.

NEW COMMODITY
→ NEW PCBI
→ SOURCE
→ HISTORY
→ VALIDATION
→ ADMIN APPROVAL
→ PCBI CATALOG
→ CUSTOMER DATA RERUN
→ GAP CLEARED
→ BETTER COVERAGE

This is the final productization direction.

Do not return to the architecture-design loop unless a concrete acceptance test fails.
## Prompt 200

PCBI MODULE 3 — V1.7 PRODUCTION PILOT ACTIVATION & DYNAMIC PCBI LIBRARY

OBJECTIVE

The V1.6 Controlled Pilot architecture is accepted.

STOP architectural redesign.
STOP repeated reconciliation exercises.
STOP broad source-research exercises.
STOP creating new benchmark methodologies unless explicitly required for a specific commodity.

From this point onward, PCBI Module 3 must operate as a DYNAMIC PCBI LIBRARY + CALCULATION ENGINE.

The objective is to finalize the software workflow so that:
1. Existing validated PCBI series can calculate immediately.
2. Missing/partial PCBI commodities do not block the system.
3. New commodities can continuously be added through the Admin Portal.
4. New historical data can continuously be uploaded and appended.
5. New sources can be added without modifying application code.
6. New PCBI methodologies can be added only through governed Admin approval.
7. Every newly approved PCBI automatically becomes available to Module 3.
8. Customer data should automatically identify missing/partial PCBI coverage and create a prioritized research queue.
9. Once the required PCBI is approved and sufficient history is uploaded, only the affected commodity should recalculate.
10. Module 1 and Module 2 remain completely frozen.
11. Module 4 remains disconnected until explicitly authorized.
12. Savings/opportunity calculations remain OFF unless explicitly authorized.

========================================================
1. FREEZE THE V1.6 CALCULATION ENGINE
========================================================

Treat the V1.5/V1.6 calculation engine as the frozen production-pilot core.

DO NOT redesign:
- indexing mathematics
- Module 2 classification authority
- provenance architecture
- observation schema
- methodology governance
- source validation framework
- gap-state architecture
- preview/approval architecture

The existing calculation formula remains:

PCBI INDEX =
(Current Standardized Value / Base Period Standardized Value) × 100

Base period:
2020-04 = 100.00

========================================================
2. FINALIZE DYNAMIC PCBI CATALOG
========================================================

The PCBI Catalog must support permanent dynamic addition of:

A. New Commodity
B. New PCBI Definition
C. New PCBI Series
D. New Source
E. New Historical Data
F. New Methodology
G. New Geography
H. New Grade/Specification
I. New Frequency
J. Version History
K. Source Replacement
L. Series Deprecation

NO CODE CHANGE should be required for any of the above.

All additions must be data-driven through the Admin Portal.

========================================================
3. ADMIN PORTAL — FINAL PCBI WORKFLOW
========================================================

Create/verify the following workflow:

CUSTOMER DATA
      ↓
MODULE 2 CLASSIFICATION
      ↓
PCBI LOOKUP
      ↓
PCBI EXISTENCE CHECK
      ↓
HISTORY COVERAGE CHECK
      ↓
SPECIFICATION CHECK
      ↓
UNIT CHECK
      ↓
CURRENCY CHECK
      ↓
GEOGRAPHY CHECK
      ↓
FREQUENCY CHECK
      ↓
SOURCE VALIDATION
      ↓
METHODOLOGY VALIDATION
      ↓
CALCULATE OR CREATE GAP

For a gap:

[VIEW GAP]
[RESEARCH PCBI]
[CREATE PCBI]
[UPLOAD DATA]
[VALIDATE PREVIEW]
[APPROVE]
[REJECT]

========================================================
4. UNIVERSAL FILE INGESTION
========================================================

Retain support for:

XLSX
XLS
CSV
PDF
JSON
TXT

The ingestion engine must automatically attempt to detect:

DATE
EFFECTIVE DATE
VALUE / PRICE
UNIT
CURRENCY
FREQUENCY
COMMODITY
GRADE
SPECIFICATION
GEOGRAPHY
SOURCE
SERIES

Never silently guess.

If confidence is insufficient:

STATUS = DATA_MAPPING_REVIEW_REQUIRED

Admin must be able to manually map the fields.

========================================================
5. FREQUENCY NORMALIZATION
========================================================

Do NOT automatically interpolate or synthesize data.

Supported source frequencies may include:

DAILY
WEEKLY
FORTNIGHTLY
MONTHLY
QUARTERLY
ANNUAL

If source frequency differs from required PCBI frequency:

STATUS = FREQUENCY_MISMATCH

ACTION =
METHODOLOGY_APPROVAL_REQUIRED

The Admin must explicitly approve the mathematical transformation methodology before transformed observations can become production observations.

========================================================
6. HISTORY MANAGEMENT
========================================================

Allow incremental history upload.

Example:

Existing:
2020-04 → 2025-12

New upload:
2026-01 → 2026-09

System must APPEND the new observations.

It must NOT overwrite historical observations.

If overlapping observations are uploaded:

detect duplicate DATE + SERIES_ID

and show:

DUPLICATE_OBSERVATION_REVIEW

Admin must decide whether to retain existing, replace through versioning, or reject the new observation.

========================================================
7. MULTIPLE SOURCES
========================================================

A commodity must support multiple source candidates.

Example:

Ferro Molybdenum

Source A — Government/public source
Source B — Industry publication
Source C — Market assessment
Source D — Customer-provided historical source

Each source must retain independent:

SOURCE_ID
SOURCE_NAME
SOURCE_URL
SOURCE_DOCUMENT
CHECKSUM
PUBLICATION_DATE
INGESTION_DATE
SOURCE_FREQUENCY
SOURCE_UNIT
SOURCE_CURRENCY
SOURCE_GEOGRAPHY
SOURCE_SPECIFICATION
VALIDATION_STATUS

Never merge sources invisibly.

========================================================
8. PCBI RESEARCH QUEUE
========================================================

The Research Queue must continuously rank missing/partial PCBI coverage by:

1. Customer Spend
2. Transaction Count
3. Material Criticality
4. Current PCBI Status
5. Historical Coverage Gap

Minimum statuses:

P1_CRITICAL
P2_HIGH
P3_MEDIUM
P4_LOW

The queue must update automatically whenever customer data changes.

========================================================
9. HIGH-IMPACT GAP ALERT
========================================================

If:

Customer Spend > configurable threshold

AND

PCBI history is missing or materially incomplete,

show:

PCBI COVERAGE GAP — HIGH IMPACT

Display:

Commodity
Material Code
UNSPSC
Customer Spend
Transaction Count
Required History
Available History
Required Frequency
Available Frequency
Required Unit
Available Unit
Specification
Current PCBI Status
Recommended Admin Action

Provide:

[CREATE PCBI]
[UPLOAD HISTORY]
[RESEARCH SOURCE]

========================================================
10. TARGETED RECALCULATION
========================================================

When Admin approves:

NEW PCBI
OR
NEW HISTORY
OR
NEW METHODOLOGY

DO NOT rerun the complete customer dataset unnecessarily.

Recalculate only:

Affected PCBI Series
Affected Commodity
Affected Customer Transactions

Then update the affected analytical results.

========================================================
11. PRODUCTION SAFETY
========================================================

Maintain:

Module 1 = FROZEN
Module 2 = FROZEN / SOLE CLASSIFICATION AUTHORITY
PCBI Master V1.0 = IMMUTABLE
Module 4 = DISCONNECTED
Savings = OFF
Opportunity = OFF
Supplier Ranking = OFF

No benchmark observation enters production without:

SOURCE VALIDATION
DATA VALIDATION
METHODOLOGY VALIDATION
ADMIN APPROVAL

========================================================
12. DATA QUALITY DASHBOARD
========================================================

Create a permanent PCBI Coverage Dashboard showing:

TOTAL PCBI COMMODITIES
PCBI DEFINED
PCBI MISSING
COMPLETE HISTORY
PARTIAL HISTORY
NO HISTORY
SOURCE UNVERIFIED
METHODOLOGY PENDING
SPECIFICATION MISMATCH
FREQUENCY MISMATCH
PRODUCTION READY
NOT BENCHMARKABLE

Also show:

CUSTOMER SPEND COVERED
CUSTOMER SPEND WITH PCBI GAP
% SPEND COVERED
% SPEND GAP

========================================================
13. IMPORTANT — DO NOT BLOCK THE ENGINE
========================================================

A missing PCBI must NEVER stop calculation of other valid commodities.

Example:

Ferro Molybdenum = missing

HR Steel = valid
Copper = valid
Kraft Paper = valid
Caustic Soda = valid

The system must calculate:

HR Steel
Copper
Kraft Paper
Caustic Soda

while simultaneously placing Ferro Molybdenum in:

P1_CRITICAL RESEARCH QUEUE

========================================================
14. COMMODITY LIBRARY EXPANSION
========================================================

The system must be capable of adding an unlimited number of future PCBI commodities.

Do NOT hard-code the current 32/290 commodity structure.

PCBI_ID must be dynamically generated according to the existing naming/version convention.

A new commodity must be able to enter the system without software deployment.

========================================================
15. FINAL ACCEPTANCE TEST
========================================================

Run only the following final acceptance tests.

TEST 01:
Existing valid PCBI calculates.

TEST 02:
Missing PCBI creates gap.

TEST 03:
Admin creates new PCBI.

TEST 04:
Admin uploads XLSX.

TEST 05:
Admin uploads PDF.

TEST 06:
Admin uploads CSV.

TEST 07:
Admin manually maps ambiguous columns.

TEST 08:
Admin adds historical observations.

TEST 09:
Duplicate observation detected.

TEST 10:
Partial history remains blocked.

TEST 11:
Frequency mismatch remains blocked.

TEST 12:
Specification mismatch remains blocked.

TEST 13:
Admin approves methodology.

TEST 14:
Admin approves PCBI.

TEST 15:
Affected commodity recalculates only.

TEST 16:
Other commodities remain unaffected.

TEST 17:
New source can be added.

TEST 18:
Existing history remains immutable.

TEST 19:
Module 1 unchanged.

TEST 20:
Module 2 unchanged.

TEST 21:
Module 4 remains disconnected.

TEST 22:
Savings remains ZERO.

TEST 23:
New commodity can be added without code deployment.

TEST 24:
Research queue automatically reprioritizes.

========================================================
16. IMPORTANT COUNT CONSISTENCY CHECK
========================================================

Before final sign-off, perform a DATA CONSISTENCY CHECK across:

Customer commodity count
Material commodity count
Excluded service count
PCBI catalog count
Production-ready count
Research queue count
Partial-history count
No-history count

Do NOT redesign anything because of count discrepancies.

Simply identify and correct the underlying reporting/count aggregation logic if necessary.

========================================================
17. FINAL OUTPUT
========================================================

Generate:

PCBI_V1_7_PRODUCTION_PILOT_RELEASE_REPORT.md
PCBI_V1_7_FINAL_ACCEPTANCE_TEST.json
PCBI_V1_7_DYNAMIC_CATALOG_STATUS.xlsx
PCBI_V1_7_PCBI_COVERAGE_DASHBOARD.xlsx

Final status should be one of:

PRODUCTION_PILOT_READY
or
BLOCKED — with only the specific failed acceptance tests listed.

DO NOT initiate another broad architecture redesign.

DO NOT initiate another global reconciliation exercise.

DO NOT require all commodities to have historical data before the software can operate.

The objective is to finalize the dynamic software and allow the PCBI library to grow continuously commodity-by-commodity.
## Prompt 201

PCBI MODULE 3 — V1.6 PRODUCTIONIZATION & DYNAMIC COMMODITY EXPANSION

Objective:
Move Module 3 from CALCULATION_VALIDATED_WITH_GAPS toward PRODUCTION-READY architecture.

DO NOT restart the architecture.
DO NOT repeat previous reconciliation exercises.
DO NOT modify Module 1, Module 2, PCBI Master V1.0, or Module 4.
Do not purchase commercial data.
Do not generate procurement savings.
Do not create supplier rankings.
Do not make any existing benchmark values production-active unless explicitly approved by Admin.

The objective is to finalize the software so that PCBI can continuously expand commodity coverage through the Admin Portal.

============================================================
1. FREEZE THE CURRENT CORE
============================================================

Treat the following as immutable:

Module 1 = FROZEN
Module 2 = FROZEN / SOLE CLASSIFICATION AUTHORITY
PCBI Master V1.0 = IMMUTABLE
Existing approved PCBI catalog records = VERSIONED / AUDIT CONTROLLED
Module 4 = DISCONNECTED

Do not redesign these modules.

============================================================
2. DYNAMIC PCBI COMMODITY CATALOG
============================================================

Build/finalize a dynamic PCBI Catalog that allows Admin to add:

A. New Commodity
B. New PCBI Definition
C. New PCBI Series
D. New Source
E. New Historical Dataset
F. New Frequency
G. New Geography
H. New Grade / Specification
I. New Unit
J. New Currency
K. New Methodology
L. New Source Document
M. New Historical observations

Each commodity must have independent status:

PCBI_DEFINITION_STATUS:
DEFINED
MISSING
UNDER_REVIEW
NOT_BENCHMARKABLE

PCBI_DATA_STATUS:
COMPLETE
PARTIAL_HISTORY
NO_HISTORY
FREQUENCY_MISMATCH
SPECIFICATION_MISMATCH
SOURCE_UNVERIFIED

Do not combine definition existence and data availability into one status.

============================================================
3. ADMIN PORTAL — “ADD / COMPLETE PCBI”
============================================================

Create a single guided workflow:

CUSTOMER DATA
      ↓
MODULE 2 CLASSIFICATION
      ↓
PCBI EXISTENCE CHECK
      ↓
HISTORICAL DATA CHECK
      ↓
GAP DETECTION
      ↓
ADMIN ALERT
      ↓
UPLOAD PCBI DATA
      ↓
AUTO-EXTRACTION
      ↓
STANDARDIZATION
      ↓
VALIDATION
      ↓
PREVIEW
      ↓
ADMIN APPROVAL
      ↓
VERSIONED PCBI CATALOG UPDATE
      ↓
AUTOMATIC RE-RUN
      ↓
GAP STATUS UPDATED

The system must NOT require a developer/code deployment when a new commodity or historical dataset is added.

============================================================
4. CUSTOMER DATA VS PCBI MISMATCH ENGINE
============================================================

Whenever customer data is uploaded, automatically compare each Module 2 commodity against the PCBI Catalog.

Detect and display:

• PCBI missing
• Definition missing
• Historical data missing
• Historical data incomplete
• Frequency mismatch
• Grade mismatch
• Specification mismatch
• Unit mismatch
• Currency mismatch
• Geography mismatch
• Source unverified
• Methodology pending

For each issue show:

Commodity
PCBI ID
Customer Spend
Transaction Count
Required History
Available History
Required Frequency
Available Frequency
Required Unit
Available Unit
Required Geography
Available Geography
Source Status
Methodology Status
Final Readiness
Admin Action

============================================================
5. HIGH-IMPACT GAP ALERT
============================================================

If:

Customer Spend > configurable materiality threshold
AND
PCBI is missing OR historical data is inadequate

automatically create:

HIGH_IMPACT_PCBI_GAP

Example:

PCBI GAP — HIGH IMPACT

Commodity: Ferro Molybdenum 65%
Customer Spend: ₹1.25 Cr
PCBI Definition: Missing
Historical Data: Missing
Required History: Apr-2020 to latest available
Required Frequency: Weekly
Required Unit: INR/MT

ACTION:
[CREATE PCBI]
[UPLOAD DATA]
[REVIEW EXISTING PCBI]

The threshold must be configurable by Admin.

============================================================
6. UNIVERSAL DATA INGESTION
============================================================

Maintain support for:

XLSX
XLS
CSV
PDF
JSON
TXT

The system must attempt to identify automatically:

Date
Effective Date
Price / Value
Unit
Currency
Frequency
Commodity
Grade
Specification
Geography
Source
Series
Document
Publisher

Never silently assume ambiguous fields.

If confidence is insufficient:

STATUS = ADMIN_REVIEW_REQUIRED

============================================================
7. FREQUENCY NORMALIZATION
============================================================

Support native frequencies:

Daily
Weekly
Fortnightly
Monthly
Quarterly
Annual

Do NOT automatically interpolate, extrapolate, average, or synthesize observations.

If conversion is required:

STATUS = METHODOLOGY_PENDING

Admin must be able to select/approve an existing methodology or create a new methodology.

Every transformation must retain:

SOURCE_FREQUENCY
TARGET_FREQUENCY
TRANSFORMATION_METHOD
METHODOLOGY_ID
APPROVAL_ID

============================================================
8. HISTORICAL DEPTH
============================================================

Do not require every commodity to have the same history merely because another commodity does.

The catalog must store:

REQUIRED_START_DATE
REQUIRED_END_DATE
AVAILABLE_START_DATE
AVAILABLE_END_DATE
HISTORY_MONTHS
HISTORY_COMPLETENESS %

Allow Admin to configure the minimum acceptable historical depth by commodity/series.

Clearly distinguish:

COMPLETE
PARTIAL_HISTORY
NO_HISTORY

============================================================
9. PCBI CALCULATION ENGINE
============================================================

For an APPROVED and VALIDATED series:

RAW OBSERVATION
→ STANDARDIZED OBSERVATION
→ EFFECTIVE OBSERVATION
→ BASE PERIOD
→ CURRENT PERIOD
→ INDEX CALCULATION
→ PCBI OUTPUT

Base period index must equal 100.00.

Use full precision internally.
Round only for presentation.

Formula and methodology must always be stored with the series.

============================================================
10. PROVENANCE
============================================================

Retain the existing 10-link provenance chain:

LINK_01_RAW_DOWNLOAD
LINK_02_ORIGINAL_CHECKSUM
LINK_03_INGESTION_TIMESTAMP
LINK_04_INGESTION_BATCH
LINK_05_EXTRACTION_SCRIPT
LINK_06_REBASE_TRANSFORMATION
LINK_07_CURRENCY_CONVERSION
LINK_08_UNIT_STANDARDIZATION
LINK_09_VALIDATION_EVENT
LINK_10_MODULE3_BENCHMARK_INPUT

Any missing mandatory provenance link must prevent production activation.

============================================================
11. VERSION CONTROL
============================================================

Existing PCBI series must never be overwritten.

Every change creates a new version:

PCBI_VERSION
SOURCE_VERSION
METHODOLOGY_VERSION
DATASET_VERSION

Maintain:

Created By
Created At
Approved By
Approved At
Approval ID
Change Reason
Checksum
Previous Version
Current Version

Allow:

ADD
UPDATE
DEPRECATE
RESTORE
ROLLBACK

Only Admin-approved versions may become active.

============================================================
12. “UPLOAD ANY FORMAT → PCBI STANDARD FORMAT”
============================================================

The most important operational requirement:

Admin should NOT have to manually convert publisher data into the PCBI schema.

Example input:

Excel:
Date | Price

PDF:
Date | Avg Price | USD/MT

CSV:
Week | Value

Website export:
Period | Settlement

System should transform each into the standard internal PCBI observation structure.

Show the normalized result BEFORE approval.

Never silently modify source values.

============================================================
13. DATA QUALITY REPORT
============================================================

After every upload generate:

Records detected
Records accepted
Records rejected
Duplicate records
Missing dates
Missing values
Unit detected
Currency detected
Frequency detected
Start date
End date
Outliers
Gaps
Transformation performed
Methodology required
Provenance completeness
Validation status

Provide downloadable audit output.

============================================================
14. AUTOMATIC RE-RUN
============================================================

After Admin approves a new PCBI dataset:

DO NOT require code changes.

Automatically:

1. Activate new PCBI version
2. Re-run affected customer commodities
3. Recalculate readiness
4. Clear resolved alerts
5. Identify remaining gaps
6. Display updated analytical preview
7. Preserve previous audit state

Example:

Before:
PCBI = MISSING
DATA = NO_HISTORY
READINESS = BLOCKED

After Admin approval:

PCBI = DEFINED
DATA = COMPLETE
READINESS = PRODUCTION_READY

============================================================
15. COMMODITY EXPANSION
============================================================

Design the catalog so that PCBI is NOT limited to the current 32 commodities or the current 290 series.

New commodities must be added dynamically.

Examples:

Copper
Aluminium
Zinc
Lead
Nickel
Tin
Stainless Steel
Ferro Chrome
Ferro Molybdenum
Ferro Silicon
Silico Manganese
Ferro Manganese
Carbon Steel
TMT
HRC
CRC
Billets
Scrap
Graphite Electrodes
Refractories
Industrial Gases
Chemicals
Polymers
Packaging
Lubricants
etc.

These are examples only.

DO NOT create artificial PCBI data for them.

Create catalog definitions only when justified by customer demand and validated source data.

============================================================
16. “LEARN AS WE SCALE” ARCHITECTURE
============================================================

The system must become stronger as Admin adds new commodities and sources.

Maintain a reusable library of:

Commodity Definitions
Series Definitions
Source Definitions
Publisher Definitions
Methodologies
Unit Conversions
Currency Rules
Frequency Rules
Geography Rules
Grade/Specification Rules

A methodology approved for one valid commodity may be reusable only where its applicability conditions explicitly permit it.

Never copy a methodology merely because two commodities appear similar.

============================================================
17. DASHBOARD
============================================================

Create a management dashboard showing:

Total PCBI commodities
Total PCBI series
Production Ready
Partial History
No History
Missing Definition
Methodology Pending
Source Unverified
Specification Mismatch
Frequency Mismatch
High Impact Gaps
Free/Public Sources
Commercial Sources
Pending Admin Actions

Also show:

Customer Spend Covered
Customer Spend Not Covered
Coverage %
High Impact Uncovered Spend

Do not call uncovered spend “savings”.

============================================================
18. FINAL CUSTOMER PROCESS
============================================================

The final operational experience should be:

Customer uploads purchase data
        ↓
Module 1 cleans data
        ↓
Module 2 classifies data
        ↓
Module 3 checks PCBI
        ↓
Existing PCBI → calculate
Missing PCBI → alert
Incomplete PCBI → alert
        ↓
Admin uploads source data
        ↓
System converts source to PCBI
        ↓
Admin validates preview
        ↓
Admin approves
        ↓
PCBI Catalog updated
        ↓
Customer data automatically reprocessed
        ↓
Benchmark becomes available where all governance gates pass

No developer intervention should be required for normal commodity expansion.

============================================================
19. SECURITY / GOVERNANCE
============================================================

Production benchmark activation requires:

Module 2 classification validity
PCBI definition validity
Source validation
Historical sufficiency
Specification match
Unit match
Currency match
Geography match
Frequency methodology
Provenance completeness
Admin approval

If any mandatory condition fails:

DO NOT CALCULATE PRODUCTION PCBI.

============================================================
20. FINAL ACCEPTANCE TEST
============================================================

Do NOT perform another broad architecture audit.

Instead execute one final focused acceptance test:

A. Existing complete commodity
B. Existing partial-history commodity
C. Missing commodity
D. New commodity uploaded through Admin
E. New historical source uploaded
F. PDF source
G. Excel source
H. CSV source
I. Frequency mismatch
J. Specification mismatch
K. Unit mismatch
L. Currency mismatch
M. Geography mismatch
N. Methodology pending
O. Admin approval
P. Automatic catalog versioning
Q. Automatic customer re-run
R. Gap alert clearance
S. Rollback to previous PCBI version
T. Add second new commodity without code change

Required result:

ALL GOVERNANCE CONTROLS PASS.

Most importantly:

NEW COMMODITY + NEW PCBI DATA MUST BE ADDABLE WITHOUT CODE DEPLOYMENT.

============================================================
FINAL OBJECTIVE
============================================================

Move Module 3 to:

FINAL_MODULE_3_STATUS =
PRODUCTION_READY_DYNAMIC_PCBI

provided all acceptance tests pass.

Do not claim production-ready merely because the tests execute.

Show:

1. Tests passed
2. Tests failed
3. Remaining blockers
4. Exact Admin actions required
5. Exact developer actions required, if any
6. Whether a new commodity can genuinely be added without code changes
7. Whether an uploaded arbitrary-format historical dataset can genuinely be converted into the PCBI standard without manual schema preparation
8. Whether an approved PCBI automatically triggers customer-data reprocessing
9. Whether rollback/versioning works
10. Final production-readiness decision

Do not calculate savings.
Do not activate Module 4.
Do not modify Module 1.
Do not modify Module 2.
Do not modify PCBI Master V1.0.
Do not purchase commercial data.

This is the final productionization and dynamic-expansion gate.

## Prompt 202

PCBI MODULE 3 — BUSINESS VALIDATION & COMMODITY POPULATION MODE

Module 3 software architecture is now certified:
FINAL_MODULE_3_STATUS = PRODUCTION_READY_DYNAMIC_PCBI

DO NOT perform another architecture redesign.
DO NOT repeat the 20 acceptance tests unless required for regression.
DO NOT modify Module 1.
DO NOT modify Module 2.
DO NOT modify PCBI Master V1.0.
DO NOT connect Module 4.
DO NOT calculate savings.
DO NOT purchase commercial data.

From this point forward, Module 3 development is considered COMPLETE.

Change the operating objective from SOFTWARE DEVELOPMENT to
PCBI COMMODITY COVERAGE EXPANSION.

==================================================
1. ESTABLISH TWO SEPARATE STATUS LEVELS
==================================================

MODULE 3 SOFTWARE STATUS:
PRODUCTION_READY_DYNAMIC_PCBI

COMMODITY / SERIES STATUS:
PRODUCTION_READY
PARTIAL_HISTORY
NO_HISTORY
MISSING
SOURCE_UNVERIFIED
METHODOLOGY_PENDING
SPECIFICATION_MISMATCH
FREQUENCY_MISMATCH
NOT_BENCHMARKABLE

Never interpret Module 3 software readiness as complete commodity coverage.

==================================================
2. COMMODITY GAP QUEUE
==================================================

Create a permanent PCBI RESEARCH / DATA GAP QUEUE.

Every customer commodity without an adequate PCBI must automatically enter this queue.

Required fields:

COMMODITY_ID
COMMODITY_NAME
MODULE2_CLASSIFICATION
UNSPSC
CUSTOMER_SPEND
TRANSACTION_COUNT
PCBI_ID
PCBI_DEFINITION_STATUS
PCBI_DATA_STATUS
REQUIRED_START_DATE
REQUIRED_END_DATE
REQUIRED_FREQUENCY
REQUIRED_UNIT
REQUIRED_CURRENCY
REQUIRED_GEOGRAPHY
AVAILABLE_HISTORY
SOURCE_STATUS
METHODOLOGY_STATUS
MATERIALITY
PRIORITY
ADMIN_ACTION
RESEARCH_STATUS
DATE_ADDED
LAST_UPDATED

==================================================
3. PRIORITIZATION

Calculate a RESEARCH_PRIORITY based on:

Customer Spend
Transaction Count
Coverage Impact
Historical Data Gap
Availability of public sources
Specification complexity

Do NOT call this a savings ranking.

Display:

P1 — Critical Coverage Gap
P2 — High Coverage Gap
P3 — Medium Coverage Gap
P4 — Low Coverage Gap

Admin must be able to override priority.

==================================================
4. CURRENT DATA-GAP QUEUE

Initialize the queue using the currently identified gaps:

1. Ferro Molybdenum 65%
2. Heavy Duty Slurry Pumps
3. Tungsten Carbide Inserts
4. HDPE Injection Molding Granules
5. Stainless Steel 304 Scrap
6. Industrial Hydraulic Oil ISO 68

Do not manufacture historical data.

These are RESEARCH TARGETS, not benchmark values.

==================================================
5. ADMIN RESEARCH WORKFLOW

For every gap provide:

[SEARCH / ADD SOURCE]
[UPLOAD DATA]
[CREATE PCBI DEFINITION]
[REVIEW EXISTING PCBI]
[MARK NOT BENCHMARKABLE]

Once data is uploaded:

UPLOAD
→ EXTRACT
→ STANDARDIZE
→ VALIDATE
→ PROVENANCE
→ PREVIEW
→ ADMIN APPROVAL
→ VERSION PCBI
→ REPROCESS AFFECTED CUSTOMER DATA

==================================================
6. PUBLIC SOURCE RESEARCH

The system should permit Admin to add multiple sources for the same commodity.

Examples:

Government
Exchange
Industry association
Producer publication
Market report
Historical PDF
Historical Excel
CSV
Public statistical database

Do NOT automatically treat a source as authoritative.

Every source must go through the existing source validation framework.

==================================================
7. MULTI-SOURCE PCBI

A commodity may have multiple sources.

Example:

PCBI:
Ferro Molybdenum 65%

Sources:
SOURCE-A
SOURCE-B
SOURCE-C

Each source must retain independent:

URL
DOCUMENT
PUBLISHER
DATE
CHECKSUM
FREQUENCY
UNIT
CURRENCY
GEOGRAPHY
SOURCE_STATUS

Do not overwrite one source with another.

==================================================
8. SOURCE COMPARISON

Where multiple validated sources exist, provide an ADMIN comparison view:

Period
Source A
Source B
Source C
Difference %
Coverage
Frequency
Unit
Currency
Geography

Do not automatically select a winner.

Admin must approve the methodology/source hierarchy.

==================================================
9. DATA COVERAGE DASHBOARD

Create a dashboard showing:

TOTAL CUSTOMER SPEND
PCBI COVERED SPEND
PCBI UNCOVERED SPEND
COVERAGE %

Number of commodities:

PRODUCTION_READY
PARTIAL_HISTORY
NO_HISTORY
MISSING
SOURCE_UNVERIFIED
METHODOLOGY_PENDING
NOT_BENCHMARKABLE

Also display:

Top uncovered commodities by spend
Top missing PCBI definitions
Top historical-data gaps
Public-source candidates
Commercial-source-required candidates

Never label uncovered spend as savings.

==================================================
10. UNIT / CURRENCY DISPLAY QA

Add a mandatory display-level validation.

For every customer transaction ensure:

CUSTOMER_VALUE
CUSTOMER_UNIT
CUSTOMER_CURRENCY

remain distinguishable from:

PCBI_VALUE
PCBI_UNIT
PCBI_CURRENCY

The analytical preview must NEVER display a converted value with an incorrect currency or unit symbol.

Example:

Do not display an INR transaction as £.
Do not display a per-MT value as per-roll.
Do not display a per-piece value as per-litre.

Create automated tests for this.

==================================================
11. PCBI RESEARCH IS CONTINUOUS

Do not require complete coverage before the product can operate.

New customer commodity:
→ detect gap
→ create research task
→ source data
→ upload
→ approve
→ add PCBI
→ automatically reprocess affected customer data.

The system must continuously expand.

==================================================
12. FINAL SOFTWARE DEVELOPMENT RULE

From this point forward:

NO NEW SOFTWARE FEATURE should be developed unless a real production workflow exposes a genuine defect.

If a problem is caused by missing commodity data:
DO NOT modify the engine.

Instead:
ADD / VALIDATE / VERSION the required PCBI data.

If a problem is caused by methodology:
CREATE / APPROVE methodology.

If a problem is caused by source quality:
ADD / REPLACE / VALIDATE source.

If a problem is caused by classification:
ROUTE TO MODULE 2.

==================================================
13. FINAL DELIVERABLE

Generate:

PCBI_COMMODITY_COVERAGE_MASTER.xlsx

with sheets:

1. Commodity_Master
2. PCBI_Series
3. Source_Register
4. Data_Gaps
5. Research_Queue
6. Methodology_Register
7. Coverage_Dashboard
8. Version_History

This becomes the working control file for continuous PCBI expansion.

FINAL STATUS:

SOFTWARE:
PRODUCTION_READY_DYNAMIC_PCBI

DATA:
CONTINUOUS_COMMODITY_EXPANSION

NEXT DEVELOPMENT:
ONLY DEFECT-DRIVEN

NEXT BUSINESS ACTIVITY:
PCBI DATA RESEARCH + ADMIN POPULATION

Do not perform another architecture redesign.


## Prompt 207

run locally on chrome


## Prompt 208

PCBI PLATFORM — MODULE 4 DEPLOYMENT + END-TO-END MODULE 1→4 CONTINUITY TEST

Operating Mode:
PRODUCTION CANDIDATE / CONTROLLED DEPLOYMENT / FULL SYSTEM INTEGRATION TEST

OBJECTIVE:
Module 3 is now FROZEN and certified as:
FINAL_MODULE_3_STATUS = PRODUCTION_READY_DYNAMIC_PCBI

Do NOT modify Module 3 architecture.
Do NOT reopen Module 1 or Module 2.
Do NOT modify PCBI Master V1.0.
Do NOT manufacture missing PCBI data.
Do NOT block the system merely because some commodities remain in the PCBI research queue.

The objective now is to deploy and validate Module 4 and prove complete continuity:

MODULE 1
Customer Data Ingestion
        ↓
MODULE 2
Classification / UNSPSC / Commodity Authority
        ↓
MODULE 3
PCBI Match → Coverage/Gaps → Benchmark Calculation
        ↓
MODULE 4
Opportunity / Savings / Sourcing Action Engine

========================================================
1. MODULE 4 DEPLOYMENT
========================================================

Deploy Module 4 in CONTROLLED PRE-PRODUCTION mode.

Module 4 must consume ONLY certified outputs from Module 3.

Module 4 must NEVER:
- classify commodities independently
- create PCBI values
- manufacture missing benchmarks
- infer prices where PCBI is unavailable
- treat uncovered spend as savings
- overwrite Module 3 data
- modify Module 1 or Module 2

========================================================
2. DEFINE THE MODULE 3 → MODULE 4 CONTRACT
========================================================

Create and freeze an explicit interface contract.

For every customer commodity, Module 4 must receive:

CUSTOMER_TRANSACTION_ID
COMMODITY_ID
MODULE2_CLASSIFICATION
UNSPSC
CUSTOMER_QUANTITY
CUSTOMER_UNIT
CUSTOMER_CURRENCY
CUSTOMER_VALUE
CUSTOMER_DATE
PCBI_ID
PCBI_VERSION
PCBI_INDEX
PCBI_BASE_PERIOD
PCBI_CURRENT_PERIOD
PCBI_STATUS
PCBI_SOURCE_STATUS
METHODOLOGY_STATUS
COVERAGE_STATUS
DATA_QUALITY_STATUS
GEOGRAPHY
SPECIFICATION
FREQUENCY
PROVENANCE_REFERENCE

Module 4 must distinguish:

1. BENCHMARK_AVAILABLE
2. BENCHMARK_UNAVAILABLE
3. BENCHMARK_BLOCKED
4. PCBI_DATA_GAP
5. SPECIFICATION_MISMATCH
6. FREQUENCY_MISMATCH
7. SOURCE_UNVERIFIED
8. METHODOLOGY_PENDING
9. NOT_BENCHMARKABLE

========================================================
3. MODULE 4 OPPORTUNITY GOVERNANCE
========================================================

Before calculating anything, establish the following states:

BENCHMARKED_SPEND
UNBENCHMARKED_SPEND
BLOCKED_SPEND
NOT_BENCHMARKABLE_SPEND

CRITICAL RULE:

UNBENCHMARKED SPEND ≠ SAVINGS

PCBI DATA GAP ≠ SAVINGS

MARKET MOVEMENT ≠ SAVINGS

INDEX MOVEMENT ≠ SAVINGS

Only an approved Module 4 methodology may produce an opportunity/savings calculation.

========================================================
4. CONTROLLED SAVINGS TEST
========================================================

Create a synthetic controlled dataset containing:

A. Commodity with valid PCBI
B. Commodity with partial PCBI
C. Commodity with no PCBI
D. Specification mismatch
E. Frequency mismatch
F. Currency mismatch
G. Unit mismatch
H. Geography mismatch
I. Not-benchmarkable service

For A, calculate the Module 4 opportunity using the approved methodology.

For B–I:

DO NOT calculate savings.

Instead return the appropriate status and ADMIN_ACTION.

========================================================
5. MODULE 1 → MODULE 4 TRACEABILITY
========================================================

For every calculated result, prove the complete lineage:

CUSTOMER RAW RECORD
→ MODULE 1 CLEANED RECORD
→ MODULE 2 CLASSIFICATION
→ PCBI MATCH
→ PCBI SOURCE OBSERVATION
→ PCBI NORMALIZATION
→ PCBI INDEX
→ MODULE 4 CALCULATION
→ OPPORTUNITY RESULT

Every result must be traceable back to the original customer transaction.

No orphan calculations are permitted.

========================================================
6. PCBI VERSION CHANGE TEST
========================================================

Test:

PCBI Version 1.0
→ Module 4 calculation

Then:

PCBI Version 1.1
→ targeted Module 3 reprocessing
→ Module 4 recalculation

Verify:

- previous calculation remains auditable
- new calculation references new PCBI version
- old PCBI version is immutable
- no unrelated commodities are recalculated
- difference is explicitly recorded

========================================================
7. PCBI GAP → ADMIN UPLOAD → MODULE 4 REPROCESS TEST
========================================================

Take one currently uncovered commodity.

Example:

FERRO MOLYBDENUM 65%

Initial state:

PCBI_DATA_STATUS = NO_HISTORY
MODULE 4 = BENCHMARK_UNAVAILABLE
SAVINGS = ZERO

Then simulate:

ADMIN UPLOAD
→ DATA EXTRACTION
→ STANDARDIZATION
→ VALIDATION
→ ADMIN APPROVAL
→ PCBI CATALOG VERSION
→ TARGETED CUSTOMER REPROCESSING
→ MODULE 4 REPROCESSING

Verify that the commodity automatically moves through:

NO_HISTORY
→ DATA_AVAILABLE
→ VALIDATED
→ PRODUCTION_READY
→ MODULE 4 ELIGIBLE

WITHOUT CODE DEPLOYMENT.

Do not manufacture the Ferro Molybdenum historical data. Use a clearly labelled synthetic test dataset only.

========================================================
8. FULL DATASET CONTINUITY TEST
========================================================

Run the complete certified customer dataset through:

MODULE 1
→ MODULE 2
→ MODULE 3
→ MODULE 4

Produce a reconciliation table:

Total customer spend
Module 1 spend
Module 2 classified spend
Module 3 benchmarked spend
Module 3 unbenchmarked spend
Module 4 eligible spend
Module 4 blocked spend
Module 4 not-benchmarkable spend
Calculated opportunity
Uncalculated opportunity

The following must reconcile exactly:

MODULE 1 TOTAL
=
MODULE 2 TOTAL
=
MODULE 3 CUSTOMER BASELINE
=
MODULE 4 INPUT BASELINE

Any variance must BLOCK final certification.

========================================================
9. ZERO SILENT FAILURES
========================================================

Every transaction must end in exactly one terminal state:

OPPORTUNITY_CALCULATED
BENCHMARK_UNAVAILABLE
PCBI_DATA_GAP
SPECIFICATION_MISMATCH
FREQUENCY_MISMATCH
CURRENCY_MISMATCH
UNIT_MISMATCH
GEOGRAPHY_MISMATCH
METHODOLOGY_PENDING
SOURCE_UNVERIFIED
NOT_BENCHMARKABLE
PROCESSING_ERROR

No transaction may disappear from the pipeline.

========================================================
10. MODULE 4 DASHBOARD
========================================================

Create/validate dashboard metrics:

TOTAL CUSTOMER SPEND
BENCHMARKED SPEND
UNBENCHMARKED SPEND
BLOCKED SPEND
NOT BENCHMARKABLE
PCBI COVERAGE %
MODULE 4 ELIGIBLE SPEND
OPPORTUNITY CALCULATED
OPPORTUNITY BLOCKED
PCBI RESEARCH GAPS
HIGH-IMPACT GAPS

Clearly label all coverage gaps.

NEVER display uncovered spend as savings.

========================================================
11. PARALLEL PCBI RESEARCH MODE
========================================================

Do NOT make PCBI research a software-development blocker.

The existing PCBI Research Queue must remain active in parallel.

Continue researching:

P1 — Ferro Molybdenum 65%
P1 — Heavy Duty Slurry Pumps
P2 — Tungsten Carbide Inserts
P3 — HDPE Injection Molding Granules
P3 — Stainless Steel 304 Scrap
P4 — Industrial Hydraulic Oil ISO 68

Any newly discovered source must enter the existing Admin workflow:

SOURCE DISCOVERY
→ UPLOAD
→ STANDARDIZATION
→ VALIDATION
→ ADMIN APPROVAL
→ PCBI VERSION
→ TARGETED REPROCESSING

No code change should be required.

========================================================
12. PRODUCTION DEPLOYMENT GATE
========================================================

Do NOT declare production-ready merely because tests pass.

Create a final gate report containing:

A. Module 1 status
B. Module 2 status
C. Module 3 status
D. Module 4 status
E. End-to-end reconciliation
F. Opportunity calculation validation
G. PCBI gap handling
H. Versioning validation
I. Audit/provenance validation
J. Security/role validation
K. Error handling
L. Performance results
M. Rollback procedure
N. Known data gaps
O. Known software defects
P. Final deployment recommendation

========================================================
13. IMPORTANT GOVERNANCE RULE
========================================================

There are now TWO independent workstreams:

WORKSTREAM A — SOFTWARE
Module 1 → Module 2 → Module 3 → Module 4
Objective: Production deployment and end-to-end stability.

WORKSTREAM B — DATA
PCBI Commodity Research → Source Validation → Admin Population
Objective: Continuously increase PCBI coverage.

WORKSTREAM B MUST NOT REOPEN OR DELAY THE SOFTWARE ARCHITECTURE UNLESS A REAL SOFTWARE DEFECT IS DISCOVERED.

========================================================
FINAL REQUEST
========================================================

Proceed with Module 4 deployment and complete Module 1 → Module 4 E2E validation.

Freeze all existing certified modules.

Do not ask for another architecture redesign unless a genuine defect is discovered.

At the end, return:

1. MODULE 4 DEPLOYMENT STATUS
2. E2E TEST RESULT
3. MODULE 1→4 RECONCILIATION
4. OPPORTUNITY ENGINE VALIDATION
5. LIST OF ACTUAL SOFTWARE DEFECTS
6. LIST OF DATA/PCBI GAPS — NOT SOFTWARE DEFECTS
7. PRODUCTION BLOCKERS, IF ANY
8. REQUIRED ADMIN ACTIONS
9. REQUIRED DEVELOPER ACTIONS
10. FINAL PRODUCTION DEPLOYMENT GATE

PCBI DATA RESEARCH SHALL CONTINUE IN PARALLEL AND SHALL NOT BECOME A REASON TO RESTART THE SOFTWARE DEVELOPMENT CYCLE.


## Prompt 209

PCBI PLATFORM — FINAL BUSINESS UAT & PRODUCTION SMOKE TEST

Module 1, Module 2, Module 3 and Module 4 architecture are now FROZEN.

DO NOT redesign or modify the architecture.
DO NOT reopen Module 3.
DO NOT modify Module 1 or Module 2.
DO NOT manufacture PCBI data.

The previous E2E report has certified:

M1 → M2 → M3 → M4 continuity
468/468 transactions processed
₹86,317,055 reconciled
0 reconciliation variance
0 silent transaction drops
0 orphan calculations
0 software defects
Module 4 production-ready

The remaining PCBI gaps are BUSINESS/DATA RESEARCH items.

Now perform the FINAL BUSINESS UAT / PRODUCTION SMOKE TEST.

1. Select representative real customer transactions from:
   - Opportunity Eligible
   - PCBI Gap
   - Specification Mismatch
   - Frequency Mismatch
   - Currency Mismatch
   - Unit Mismatch
   - Geography Mismatch
   - Non-Benchmarkable Service

2. For each transaction show:
   Customer purchase
   Customer specification
   Customer quantity
   Customer unit
   Customer currency
   PCBI ID
   PCBI version
   PCBI index
   benchmark status
   Module 4 methodology
   calculated opportunity, if eligible
   reason for blocking, if not eligible
   complete provenance

3. For every opportunity calculation verify:
   - mathematical formula
   - base period
   - current period
   - PCBI index
   - customer value
   - opportunity calculation
   - rounding
   - transaction-level traceability

4. CRITICAL GOVERNANCE CHECK:

   Confirm that the system NEVER represents:

   PCBI COVERAGE GAP
   UNBENCHMARKED SPEND
   BLOCKED SPEND
   MARKET MOVEMENT

   as SAVINGS.

5. Verify that every opportunity number can be independently reproduced from:
   CUSTOMER RECORD + PCBI VERSION + APPROVED METHODOLOGY.

6. Verify that PCBI version changes preserve historical calculations.

7. Verify that adding a new PCBI through Admin:
   SOURCE → UPLOAD → VALIDATE → APPROVE → ACTIVATE → TARGETED REPROCESS

   does not require code deployment.

8. Verify that the six current PCBI research gaps remain isolated from software readiness:

   Ferro Molybdenum 65%
   Heavy Duty Slurry Pumps
   Tungsten Carbide Inserts
   HDPE Injection Molding Granules
   Stainless Steel 304 Scrap
   Industrial Hydraulic Oil ISO 68

9. DO NOT treat these six gaps as software blockers.

10. Produce a final UAT report with only:

    A. Business UAT PASS/FAIL
    B. Mathematical calculation verification
    C. Opportunity calculation verification
    D. Data-gap handling verification
    E. Versioning verification
    F. Admin PCBI population verification
    G. Security/governance verification
    H. Actual defects, if any
    I. Business/data gaps
    J. Final production smoke-test result

If all tests pass:

FINAL_STATUS = PRODUCTION_OPERATIONAL

Then STOP SOFTWARE DEVELOPMENT.

From this point onward:

SOFTWARE = DEFECT_DRIVEN_ONLY

DATA = CONTINUOUS_PCBI_RESEARCH_AND_POPULATION

Do not generate another architecture redesign, enhancement roadmap, or Module 3 redevelopment cycle unless a genuine production defect is demonstrated.


## Prompt 210

PCBI PLATFORM — FINAL PRODUCTION HANDOVER & OPERATING MODE LOCK

The final Business UAT and Production Smoke Test has been completed successfully.

FINAL_STATUS = PRODUCTION_OPERATIONAL

The objective now is NOT further software development.

From this point forward:

SOFTWARE DEVELOPMENT = FROZEN
SOFTWARE CHANGES = DEFECT_DRIVEN_ONLY
PCBI DATA = CONTINUOUS_RESEARCH_AND_POPULATION
MODULE 1 = FROZEN
MODULE 2 = FROZEN / SOLE CLASSIFICATION AUTHORITY
MODULE 3 = FROZEN / PRODUCTION READY DYNAMIC PCBI
MODULE 4 = PRODUCTION OPERATIONAL
PCBI MASTER V1.0 = IMMUTABLE
MODULE 4 OPPORTUNITY ENGINE = ACTIVE ONLY FOR ELIGIBLE / VALIDATED PCBI
UNBENCHMARKED SPEND = NEVER SAVINGS
PCBI DATA GAPS = NEVER SAVINGS
MARKET MOVEMENT = NEVER SAVINGS

DO NOT redesign, refactor or extend the architecture.
DO NOT create another development cycle.
DO NOT modify Modules 1, 2, 3 or the PCBI Master merely to improve coverage.
DO NOT introduce synthetic benchmark data.
DO NOT create benchmark values when source/history/specification/methodology requirements are not satisfied.

============================================================
1. PRODUCTION OPERATING MODEL
============================================================

Lock the platform into the following operating model:

CUSTOMER DATA
↓
MODULE 1
↓
MODULE 2 — SOLE CLASSIFICATION AUTHORITY
↓
PCBI MATCH
↓
PCBI COVERAGE / GAP DETECTION
↓
IF VALID PCBI EXISTS
    ↓
MODULE 3 PCBI CALCULATION
    ↓
MODULE 4 OPPORTUNITY ENGINE
ELSE
    ↓
PCBI RESEARCH QUEUE
    ↓
ADMIN DATA POPULATION
    ↓
VALIDATION
    ↓
ADMIN APPROVAL
    ↓
PCBI CATALOG VERSION
    ↓
TARGETED CUSTOMER REPROCESSING
    ↓
MODULE 4 ELIGIBILITY

============================================================
2. CONTINUOUS PCBI RESEARCH MUST BE PARALLEL
============================================================

The six current research gaps must remain active in the Business Data Research Queue:

P1 — Ferro Molybdenum 65%
P1 — Heavy Duty Slurry Pumps
P2 — Tungsten Carbide Inserts
P3 — HDPE Injection Molding Granules
P3 — Stainless Steel 304 Scrap
P4 — Industrial Hydraulic Oil ISO 68

These research activities must NOT block:

• production deployment
• customer data processing
• Module 4 execution
• valid PCBI calculations
• opportunity generation for already-covered commodities

Research is an independent continuous operational track.

============================================================
3. NEW COMMODITY / PCBI OPERATING RULE
============================================================

Whenever Module 2 identifies a commodity for which a suitable PCBI does not exist:

Automatically create/update the Research Queue entry containing:

COMMODITY_ID
COMMODITY_NAME
MODULE2_CLASSIFICATION
UNSPSC
CUSTOMER_SPEND
TRANSACTION_COUNT
PCBI_ID
PCBI_DEFINITION_STATUS
PCBI_DATA_STATUS
REQUIRED_START_DATE
REQUIRED_END_DATE
REQUIRED_FREQUENCY
REQUIRED_UNIT
REQUIRED_CURRENCY
REQUIRED_GEOGRAPHY
AVAILABLE_HISTORY
SOURCE_STATUS
METHODOLOGY_STATUS
MATERIALITY
PRIORITY
ADMIN_ACTION
RESEARCH_STATUS
DATE_ADDED
LAST_UPDATED

No code deployment should be required.

============================================================
4. DATA UPLOAD RULE
============================================================

Admin must be able to upload any supported source format:

XLSX
XLS
CSV
PDF
JSON
TXT

The system must:

UPLOAD
→ EXTRACT
→ DETECT DATE
→ DETECT VALUE
→ DETECT UNIT
→ DETECT CURRENCY
→ DETECT FREQUENCY
→ DETECT SOURCE
→ DETECT SERIES
→ VALIDATE
→ STANDARDIZE
→ SHOW PREVIEW
→ REQUIRE ADMIN APPROVAL
→ VERSION PCBI
→ TARGETED REPROCESS

Never silently accept a mismatch.

============================================================
5. GOVERNANCE RULE
============================================================

If any of the following fail:

SPECIFICATION
GRADE
UNIT
CURRENCY
GEOGRAPHY
FREQUENCY
HISTORY
SOURCE PROVENANCE
METHODOLOGY

then:

DO NOT GENERATE BENCHMARK
DO NOT GENERATE SAVINGS
DO NOT SEND TO MODULE 4

Instead assign the appropriate blocked status and Research/Admin Action.

============================================================
6. PRODUCTION MONITORING
============================================================

Create/maintain a production dashboard showing:

Total customer spend
PCBI covered spend
PCBI uncovered spend
Coverage %
Production-ready commodities
Partial-history commodities
No-history commodities
Source-unverified commodities
Methodology-pending commodities
Specification mismatches
Frequency mismatches
Non-benchmarkable commodities
P1/P2/P3/P4 research queue

Clearly label uncovered spend as:

PCBI COVERAGE GAP / UNCOVERED SPEND

NEVER label it as savings.

============================================================
7. MODULE 4 PRODUCTION RULE
============================================================

Module 4 may calculate an opportunity only when:

• customer classification is valid
• PCBI exists
• PCBI version is active
• specification is compatible
• geography is compatible
• unit is compatible
• currency methodology is approved
• frequency methodology is approved
• provenance is complete
• methodology is approved

Otherwise:

OPPORTUNITY = 0
STATUS = BLOCKED
REASON = explicit governance reason

============================================================
8. TARGETED REPROCESSING
============================================================

When a new PCBI is approved:

DO NOT unnecessarily reprocess the entire customer database.

Identify only the affected Module 2 commodity/classification records and reprocess those transactions.

Preserve:

previous PCBI version
previous calculations
previous customer results
approval ID
timestamp
user
checksum
methodology ID
change reason

============================================================
9. DEFECT-DRIVEN SOFTWARE POLICY
============================================================

No new architecture work should be initiated unless a production defect is identified.

A production defect must have:

DEFECT_ID
REPRODUCTION_STEPS
EXPECTED_RESULT
ACTUAL_RESULT
IMPACT
AFFECTED_MODULE
ROOT_CAUSE
FIX
REGRESSION_TEST
APPROVAL
DEPLOYMENT_RECORD

Do not classify normal commodity data gaps as software defects.

============================================================
10. FINAL HANDOVER
============================================================

Mark the following as COMPLETE:

BUSINESS UAT = PASSED
PRODUCTION SMOKE TEST = PASSED
MODULE 1→2→3→4 CONTINUITY = PASSED
MATHEMATICAL VALIDATION = PASSED
GOVERNANCE VALIDATION = PASSED
PCBI GAP HANDLING = PASSED
DYNAMIC PCBI POPULATION = PASSED
TARGETED REPROCESSING = PASSED
VERSIONING = PASSED
ROLLBACK = PASSED
PRODUCTION DEPLOYMENT = APPROVED

Final operating state:

FINAL_STATUS = PRODUCTION_OPERATIONAL

SOFTWARE = FROZEN / DEFECT_DRIVEN_ONLY
DATA = CONTINUOUS_PCBI_RESEARCH_AND_POPULATION

DO NOT GENERATE ANOTHER ARCHITECTURE VERSION.

Return only:

1. Final production handover confirmation
2. Current production monitoring status
3. Current PCBI research queue
4. Production deployment checklist
5. Defect-only change policy
6. Exact admin procedure for adding the next PCBI

No further architecture redesign is required.


## Prompt 211

continue
