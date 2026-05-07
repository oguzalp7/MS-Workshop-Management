# Roadmap: Anonymous Mode & Session Persistence

This document outlines the implementation plan for supporting anonymous workshop operations and ensuring that guest sessions (both registered and anonymous) persist across browser restarts and PWA closes.

## 1. Persistent Session Layer
**Goal**: Ensure a guest never has to scan a QR code twice for the same event.

- [ ] **Persistent Cookie Implementation**: Update the authentication/session logic to set a long-lived `workshop_session_token` (30 days).
- [ ] **Bootloader Logic**: Add a check on the app's root page to detect an existing session and auto-redirect to the active cart/profile.
- [ ] **Device Fingerprinting (Simple)**: Use a combination of a generated UUID and LocalStorage to identify returning devices.

## 2. Anonymous Working Mode
**Goal**: Allow events where guests can order without registration or PWA installation.

- [ ] **Schema Update**:
    - Add `isAnonymous` boolean to the `Workshop` model.
    - Update `Cart` model to support `deviceToken` as an alternative to `guestId`.
- [ ] **Anonymous Routing**: Create a "Lite" version of the guest interface that bypasses forms and PWA prompts.
- [ ] **Anonymous Cart Identification**: Implement a system to label anonymous carts (e.g., "Guest #A4BC") for admin reference.

## 3. Workflow Differentiation
**Goal**: Clear separation between "Standard" and "Anonymous" events.

- [ ] **Feature Gating**:
    - Disable notifications for anonymous workshops.
    - Disable printing requirements for anonymous workshops.
    - Hide profile management for anonymous workshops.
- [ ] **Admin Dashboard Updates**: Add "Anonymous" badges to orders and filters to separate order types.

## 4. Session Recovery & Migration
**Goal**: Smooth transition for existing users.

- [ ] **Session "Stamp" on Entry**: Ensure the persistent token is set the moment a guest scans any QR code.
- [ ] **Manual Session Recovery**: Provide a "Restore Session" option in the settings if a user clears their cookies but has their ID.

---

## Technical Design Decisions
- **Persistence**: We will use `LocalStorage` for client-side state and `HttpOnly Cookies` for server-side auth.
- **Security**: Anonymous sessions will be scoped to a specific `workshopId` to prevent session leakage between different events.
- **PWA Experience**: The app will favor "Stand-alone" mode but gracefully degrade to "Web-view" for anonymous users to reduce friction.
