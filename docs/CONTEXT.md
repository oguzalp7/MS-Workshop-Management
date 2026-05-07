# Project: Secure Workshop POS & PWA (Lightweight Monolith)

# Context & Scope
Build a specialized B2B/B2C retail web application for makeup workshops. The catalog (Products and Categories) is global, utilizing a many-to-many relationship. However, physical inventory is isolated per event using a `WorkshopStock` junction table. Guests access a passwordless PWA via unique QR codes. Admins manage the system and process check-outs via a real-time, minimalist dashboard.

# Technical Requirements
- Framework: Next.js (App Router) + TypeScript.
- Database: PostgreSQL (using Prisma ORM).
- Environment: Dockerized for local hosting behind Cloudflare Zero Trust.
- UI/UX: Strictly minimalist dashboard. High contrast, removal of all non-essential visual elements to support focused, distraction-free "deep work" for admins.
- Architecture: Offline-first principles for the Guest PWA to handle spotty hotel Wi-Fi.

# Core Features & Logic
1. Admin Authentication: Basic Auth (JWT or iron-session) supporting multiple `Admin` users for `/admin` routes.
2. Global Catalog & Local Stock: 
   - `Product` and `Category` have an implicit many-to-many relationship.
   - `WorkshopStock` explicitly tracks the `quantity` of a specific `Product` available at a specific `Workshop`.
3. QR Entry & Passwordless Session:
   - Guests scan a URL containing their UUID (`/join/[guest_uuid]`).
   - Middleware validates the UUID against active workshops.
   - If valid, a secure HTTP-only cookie is set for the guest session.
4. Guest View (PWA):
   - Category-filtered product catalog displaying items available in the current workshop's `WorkshopStock`.
   - Offline-resilient cart (localStorage syncs with DB).
5. Admin Dashboard:
   - Real-time "Active Carts" monitoring via Server-Sent Events (SSE).
   - "Check-out" action that deducts purchased quantities from the `WorkshopStock` table, NOT the global product table.
   - Dynamic Form Builder logic to populate `profileData` (JSONB) for Guests.
   - Data export to Excel (.xlsx) per workshop.

# Instructions for Output
1. Generate the complete `schema.prisma` using the provided models (Admin, Category, Product, Workshop, WorkshopStock, Guest, Cart, CartItem). Ensure the M2M logic for categories and the 1-to-many logic for WorkshopStock is correctly mapped.
2. Create the Next.js Middleware (`middleware.ts`) handling both the Admin Auth protection and Guest UUID validation.
3. Scaffold the Minimalist Admin Dashboard layout focusing on the "Active Carts" view.
4. Provide the Server-Sent Events (SSE) API route for real-time cart monitoring.
5. Provide the implementation for the Guest PWA Product Catalog with many-to-many category filtering.

Ensure code is highly modular, fully typed, and ready for Docker deployment.