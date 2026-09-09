# Hellotree Developer Assessment

## General Instructions

This repository is a take-home developer assessment for Hellotree.

The total assessment has a hard 5-hour time cap. Prefer simple, maintainable solutions over over-engineering.

- Read existing code before modifying it.
- Make the smallest change that correctly solves the requirement.
- Do not modify working code unnecessarily.
- Do not add features that are not required by the assessment.
- Avoid unnecessary dependencies and abstractions.
- Clean and usable is more important than visual polish.
- If a requirement is ambiguous, make a sensible assumption and document it.
- Always verify changes with tests/builds where appropriate.
- Never rely only on frontend validation for business-critical rules.

## Part B

Part B is a small maintenance request tracker.

### Technology

Backend:
- Node.js
- Express
- TypeScript

Frontend:
- React
- Vite
- TypeScript

Database:
- PostgreSQL

### Client Requirements

A client can:
- Create a maintenance request.
- Provide a title.
- Provide a description.
- Select a priority: low, normal, or urgent.
- View their own requests.
- See the current status of each request.

### Admin Requirements

An admin can:
- See requests from all clients.
- Filter requests by status.
- Filter requests by client.
- Move requests through:
  - New
  - In Progress
  - Done

### Business Rules

Status transitions only move forward:

New -> In Progress
In Progress -> Done

The following are not allowed:

New -> Done
Done -> In Progress
Done -> New

A request cannot be moved to Done without a resolution note.

The resolution-note requirement MUST be enforced by the API/backend, not only by the frontend.

An urgent request that has remained in New for more than 24 hours must be visibly flagged in the admin request list.

### Authentication

Do NOT implement real authentication.

Use a simple hardcoded/demo user switch with:
- 2–3 fake clients
- 1 admin

Do not spend assessment time on login, passwords, OAuth, JWT, or production authentication.

### Seed Data

Provide seed data containing:
- A few fake clients
- One admin
- Approximately a dozen maintenance requests
- Different priorities
- Different statuses
- At least one urgent request that has been in New for more than 24 hours

The seed data must allow the 24-hour flag to be demonstrated immediately.

### Backend Principles

The backend is the source of truth for business rules.

Authorization must be enforced by the API.

Clients must only be able to access their own requests.

Clients must not be able to change request status.

Admins can manage requests according to the status transition rules.

Validate all important input on the backend.

### Development Workflow

Before implementing a feature:

1. Inspect the relevant existing code.
2. Understand the requirement.
3. Identify the simplest appropriate implementation.
4. Implement the feature.
5. Run relevant tests/build checks.
6. Fix issues found during verification.
7. Avoid unrelated changes.

## Scope

Do not over-engineer this assessment.

Do not add:
- Real authentication
- Microservices
- Complex permission systems
- Unnecessary design systems
- Unnecessary third-party services
- Features not requested by the assessment

Focus on:
- Correctness
- Business-rule enforcement
- Clean code
- Simple architecture
- Good API design
- Usability
- Testability