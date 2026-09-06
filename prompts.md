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
