---
name: "Feature / Task Request"
about: "Create a task ticket for new features or API integrations"
title: "feat(domain): brief description of the task"
labels: "enhancement"
assignees: ""
---

## 📌 Overview

A brief description of what feature or backend integration needs to be built.

---

## 🎯 Target Pages & Components

- **Page:** `app/dashboard/...`
- **Components:** `components/...`

---

## 🔌 API Endpoints Involved

> _Use `lib/api.ts` for all requests. Refer to Swagger UI (`http://localhost:3000/api`) for request/response schemas._

- `METHOD /endpoint-path`
- `METHOD /endpoint-path`

---

## 📋 Requirements & User Flow

1. **Flow Step 1:** ...
2. **Flow Step 2:** ...
3. **Acceptance Criteria:**
   - [ ] Feature/UI requirement 1
   - [ ] Feature/UI requirement 2

---

## ⚠️ UI/UX & Edge Cases

- Check Swagger UI for expected backend exceptions (`400`, `401`, `403`, `404`).
- Ensure UI handles long text, tabular monospaced numbers (`JetBrains Mono`), and responsive viewports cleanly.

---

## 👨‍💻 Developer Reminders

1. Review existing code before editing.
2. Branch naming: `feature/<short-name>` or `fix/<short-name>`.
3. Do not create custom fetchers; use `lib/api.ts`.
4. Run manual verification tests before opening a PR.
