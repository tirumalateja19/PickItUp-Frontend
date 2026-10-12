# 📦 PickItUp — Courier Logistics Frontend

A React frontend for **PickItUp**, a courier logistics management platform. Admins create and track pickup jobs, assign them to delivery partners, and manage the full lifecycle — box-wise package details, items, photo evidence, payment, and POD slip generation — through to dispatch, with a complete audit trail for accountability.

This is the frontend half of a full-stack MERN application. It talks to a separate Node.js/Express/MongoDB backend (JWT auth, BullMQ + Puppeteer for background PDF generation, Cloudinary for file storage).

## 🌐 Live Demo

Want to try it out? Use these to log in on the [live demo](https://pickit-up.netlify.app/):

## 🔑 Demo Credentials

**Admin**
- Username: `Tester`
- Password: `Asdf@001`

**Partner**
- Username: `Tester2`
- Password: `Asdf@002`

> If these credentials aren't working, feel free to email me at **tirumalateja.jampani@gmail.com** and I'll get you access.

---

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-Build-646CFF?logo=vite&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-7-CA4245?logo=reactrouter&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![DaisyUI](https://img.shields.io/badge/DaisyUI-5-1AD1A5?logo=daisyui&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-HTTP_Client-5A29E4?logo=axios&logoColor=white)

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
  - [Admin](#admin)
  - [Partner](#partner)
  - [Shared](#shared)
- [Architecture Notes](#architecture-notes)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Known Limitations](#known-limitations)
- [License](#license)

---

## Overview

PickItUp digitizes the courier pickup workflow end to end:

1. **Admin** creates a job with client details and a scheduled pickup time, choosing the partner to assign right in the creation form (or taking it themselves).
2. **Admin** sends the job details to the partner over **WhatsApp** (click-to-chat) from a popup shown right after creation.
3. **Partner** (or admin, if self-assigned) works the job on-site — logging boxes and items, uploading labelled photos, recording receiver details, and capturing payment as they go.
4. On completion, the job is **submitted**, generating a single POD slip PDF (invoice and box-wise details first, then one page per uploaded photo).
5. **Admin** records the shipment once dispatched.
6. Every step along the way is logged to an **audit trail** for accountability and dispute resolution.

## Tech Stack

| Category | Technology |
|---|---|
| UI Library | React 19 |
| Build Tool | Vite |
| Routing | React Router v7 |
| Styling | Tailwind CSS v4 + DaisyUI |
| HTTP Client | Axios |
| Icons | Lucide React |
| Notifications | react-hot-toast |
| Charts | Recharts |
| State Management | React Context (auth) + local component state |

> Versions above reflect what this project was built against — check `package.json` for exact pinned versions.

## Features

### Admin

- **Dashboard** — searchable (debounced client name), filterable (status, assigned partner, date range) job list with server-side pagination, and CSV export
- **Create Job** — client details, scheduling, network/carrier selection, **partner assignment at creation**, and an optional pasted map link. After creation, a **WhatsApp popup** (`wa.me` click-to-chat) lets you send the job message to the partner
- **Edit Job** — update a job's creation fields after the fact
- **Partners** — view all partners, search by username/contact, create new partners, deactivate/reactivate existing ones, jump straight to a partner's assigned jobs
- **Create Admin** — a second admin account can be created directly from the Partners area, reachable via a button on the Create Partner header
- **Job Detail** — a single comprehensive view per job:
  - Compact **Reassign** control (with the WhatsApp popup), available only before pickup
  - **Box-wise package info** — one box card by default, add more boxes as needed, per-box dimensions with a cm/inch unit select, and per-box items
  - Item management (add/edit/delete) with name suggestions drawn from previously used item names; names are unique within a box
  - **Payment** — Paid / Not paid; if paid, Cash or UPI, with UPI requiring a proof image (camera or gallery)
  - Photo uploads from device or camera, plus a gallery of everything uploaded so far, grouped by label, with delete and a click-to-enlarge lightbox
  - Receiver details
  - Submit to generate the POD slip
  - POD slip: **Generate** and **Download** buttons, with status polling and automatic state restore if a slip already exists
  - Shipment recording (tracking ID, carrier network)
  - A visual **progress timeline** and a live **job summary** panel
  - Status updates and lock / unlock (with a required reason on lock) at the bottom of the page
- **Stats** — dashboard-level charts (Recharts) built on the backend's admin stats endpoint
- **Audit Log** — browse jobs and drill into a full chronological event history for any one of them (created, edited, assigned, locked/unlocked, status changes, items/photos/payment edited, POD slip generated, dispatched), with the actor responsible for each event
- **Archive** — jobs in a dispatched/cancelled state can be archived out of the main list, viewable separately

> Once a job is **locked**, nobody — admin included — can add or delete photos or change payment. Admin keeps the lock/unlock override.

### Partner

- **My Jobs** — assigned jobs list, filterable by status and date range, paginated; locked jobs are blocked from being opened
- **Job Detail** — the on-site, save-as-you-go pickup flow:
  - Add boxes with dimensions, and add/edit/delete items per box, with name suggestions
  - Upload photos from device or camera, and browse/delete previously uploaded ones (until the job is locked)
  - Record payment (Paid / Not paid, Cash / UPI with proof)
  - Fill in receiver details
  - **Submit** to generate the POD slip
  - Generate and download the POD slip once ready

### Shared

- Role-aware authentication — one merged login screen with an Admin/Partner tab switch
- Change password
- Cookie-based sessions that persist across page refreshes
- Route protection by role — visiting a route you don't have access to redirects you to your own dashboard rather than erroring

## Architecture Notes

- **Auth** is cookie-based (httpOnly, secure) — the frontend never touches the JWT directly. Session state is confirmed on every load via a `/me`-style request, so a refresh never logs you out unexpectedly.
- **Route protection** is handled by a single `AuthGate` component with three modes: guest-only (login page), role-restricted (admin/partner dashboards), and shared-authenticated (e.g. change password) — driven entirely by props, not duplicated logic per route.
- **Shared job components** (`PhotoUpload`, `JobDetailsForm`, `SubmitSection`, `Shipment`, `JobTimeline`, `JobSummary`, plus the package, item, and payment components) live in one place and are reused across both the Admin and Partner job-detail pages, since the underlying actions (and API permissions) are largely identical for both roles.
- **Box weights are calculated by the backend**, and the frontend displays what the server returns, so the rounding rules live in one place.
- **PDF generation is asynchronous** — POD slip generation happens in a background queue on the backend. After you trigger generation, the frontend polls the slip status using a recursive `setTimeout` with a 20-attempt ceiling, and reflects the backend's states (`pending`, `ready`, `unchanged`, `failed`).
- **Item name suggestions** are fetched once per form load and filtered entirely client-side as the user types, rather than querying the backend on every keystroke — appropriate given the expected total is only ever a few hundred distinct names.
- **WhatsApp sharing** uses `wa.me` click-to-chat, so the admin taps a button to open WhatsApp with a prefilled message; no WhatsApp Business API is involved.
- **Sidebar layout** uses `position: sticky` with a fixed viewport height at desktop widths, independent of how tall the main content area grows, so the footer (avatar, change password, logout) always stays pinned to the bottom of the viewport rather than being pushed down by a long job list.

## Project Structure

```
src/
├── admin/            # Admin-only pages
│   ├── AdminDashboard.jsx
│   ├── AdminJobDetail.jsx
│   ├── AdminSubmit.jsx
│   ├── Partners.jsx
│   ├── CreateJob.jsx
│   ├── CreatePartner.jsx
│   ├── CreateAdmin.jsx
│   ├── Stats.jsx
│   └── AuditLogs.jsx
├── partner/          # Partner-only pages
│   ├── PartnerDashboard.jsx
│   └── PartnerJobDetail.jsx
├── auth/             # Login, change password, logout
├── jobs/             # Shared components used by both Admin and Partner job-detail pages
│   ├── ItemNameInput.jsx
│   ├── PhotoUpload.jsx
│   ├── JobDetailsForm.jsx
│   ├── SubmitSection.jsx
│   ├── Shipment.jsx
│   ├── JobTimeline.jsx
│   ├── JobSummary.jsx
│   └── ...           # Package/box info and payment components
├── components/       # App shell
│   ├── Layout.jsx
│   ├── AuthGate.jsx
│   └── Landing.jsx
├── context/          # Auth state
│   ├── AuthContext.jsx
│   └── useAuth.js
├── api/              # Configured axios instance
│   └── axios.js
└── assets/
```

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- A running instance of the PickItUp backend, reachable from the frontend

### Installation

```bash
git clone https://github.com/tirumalateja19/CourierApp-Frontend.git
cd CourierApp-Frontend
npm install
```

### Run the dev server

```bash
npm run dev
```

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_API_URL=http://localhost:5000
```

Point this at wherever your backend is actually running. Restart the dev server after changing this file — Vite doesn't hot-reload `.env` changes.

## Known Limitations

- Partner-level audit events not tied to a specific job (e.g. account deactivation) aren't viewable through the current audit log flow, which is job-centric.
- Cancelled jobs don't auto-archive after a delay; archiving is manual only.
- Single-tenant only — multi-tenancy for multiple courier companies is planned but deferred.
