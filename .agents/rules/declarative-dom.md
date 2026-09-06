# Mandatory Declarative UI & Strict Prohibition of Direct DOM Manipulation Policy

## 1. Strict Prohibition of Direct DOM Manipulation
- Direct manipulation of the Document Object Model (DOM) using low-level browser APIs or imperative manipulation libraries (`document.getElementById`, `document.querySelector`, `document.createElement`, `element.appendChild`, `element.removeChild`, `element.innerHTML`, `element.innerText`, manual `classList.add/remove`, or jQuery) within the application framework is STRICTLY PROHIBITED.
- Direct DOM manipulation bypasses the framework's reconciliation engine, creates state desynchronization, introduces hydration bugs, and causes performance degradation.

## 2. Framework View Engine as Single Source of Truth
- All UI state, conditional renders, dynamic classes, DOM attributes, event bindings, and animations must be handled exclusively through the framework's declarative state management patterns (React state, hooks, context, props).
- All UI elements, overlays, and download anchors must be declared within the component render tree (JSX/TSX).
- Use React `useRef` strictly for non-destructive interactions (focus management, measuring layout, or dispatching declarative file inputs/downloads), never for mutating DOM nodes or injecting HTML.

## 3. Declarative Alternatives
- **Dynamic Classes & Styles**: Use declarative conditional class strings or utility functions rather than imperative `classList.add/remove`.
- **File Downloads**: Render declarative hidden `<a download href={...} />` elements bound to component state and refs, avoiding temporary `document.createElement('a')` and `document.body.appendChild`.
- **Dynamic Content**: Bind state directly in JSX expressions rather than mutating `element.innerText` or `element.innerHTML`.

## 4. Quality Pipeline & 90% Unit Test Coverage
- All declarative UI components, hooks, and utilities must maintain >= 90% unit test code coverage individually across statements, branches, functions, and lines (`perFile: true`).
- Test assertions must evaluate components through framework-idiomatic testing libraries (`@testing-library/react`) rather than inspecting global DOM trees directly.
