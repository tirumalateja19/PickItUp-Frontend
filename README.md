# 📦 PickItUp — Courier Logistics Frontend

A React frontend for **PickItUp**, a courier logistics management platform. Admins create and track pickup jobs, assign them to delivery partners, and manage the full lifecycle — items, photo evidence, invoices, POD slips, and shipment — through to dispatch, with a complete audit trail for accountability.

This is the frontend half of a full-stack MERN application. It talks to a separate Node.js/Express/MongoDB backend (JWT auth, BullMQ + Puppeteer for background PDF generation, Cloudinary for file storage).

## 🌐 Live Demo

**https://pickit-up.netlify.app/**

> 🔗 **Backend Repository: https://github.com/tirumalateja19/PickItUp-Backend** 

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

1. **Admin** creates a job with client details and a scheduled pickup time.
2. **Admin** assigns it to a partner (or takes it themselves).
3. **Partner** (or admin, if self-assigned) works the job on-site — logging items, uploading photos, and recording receiver + package details as they go.
4. On completion, the job is **submitted** (generating an invoice and POD slip together) or the invoice is **deferred** to the office (POD slip only, invoice completed later by admin).
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
| State Management | React Context (auth) + local component state |

> Versions above reflect what this project was built against — check `package.json` for exact pinned versions.

## Features

### Admin

- **Dashboard** — searchable, filterable job list (status, assigned partner, date range, client name search with debounce)
- **Create Job** — client details, scheduling, and network/carrier selection
- **Partners** — view all partners, create new ones, deactivate/reactivate existing ones
- **Job Detail** — a single comprehensive view per job:
  - Assign to a partner, or self-assign
  - Manual status updates through the job lifecycle
  - Lock / unlock (with a required reason on lock)
  - Item management (add/edit/delete)
  - Photo uploads (labelled — ID proof, waybill, packed box, etc.)
  - Receiver details and **per-package** weight/dimensions (supports multiple packages per job)
  - Submit (self-assigned jobs) or complete a partner's deferred invoice
  - Invoice & POD slip: check readiness, download, and **regenerate** if the job has changed since the last generation
  - Shipment recording (tracking ID, carrier network)
  - A visual **progress timeline** and a live **job summary** panel
- **Audit Log** — browse jobs and drill into a full chronological event history for any one of them (created, assigned, locked/unlocked, status changes, documents generated, dispatched), with the actor responsible for each event

### Partner

- **My Jobs** — assigned jobs list, filterable by status and date range; locked jobs are blocked from being opened
- **Job Detail** — the on-site, save-as-you-go pickup flow:
  - Add/edit/delete items
  - Upload photos
  - Fill in receiver details and per-package weight/dimensions
  - **Submit** (generates invoice + POD slip together) or **Defer Invoice** (POD slip only; admin completes the invoice later)
  - Check and download the invoice once ready; regenerate if the job changes after submission

### Shared

- Role-aware authentication — one merged login screen with an Admin/Partner tab switch
- Change password
- Cookie-based sessions that persist across page refreshes
- Route protection by role — visiting a route you don't have access to redirects you to your own dashboard rather than erroring

## Architecture Notes

<img width="994" height="1496" alt="image" src="https://github.com/user-attachments/assets/4238e1f5-3d57-4c12-a19a-83f37c3a7315" />


- **Auth** is cookie-based (httpOnly, secure) — the frontend never touches the JWT directly. Session state is confirmed on every load via a `/me`-style request, so a refresh never logs you out unexpectedly.
- **Route protection** is handled by a single `AuthGate` component with three modes: guest-only (login page), role-restricted (admin/partner dashboards), and shared-authenticated (e.g. change password) — driven entirely by props, not duplicated logic per route.
- **Shared job components** (`Items`, `PhotoUpload`, `JobDetailsForm`, `SubmitSection`, `Shipment`, `JobTimeline`, `JobSummary`) live in one place and are reused across both the Admin and Partner job-detail pages, since the underlying actions (and API permissions) are largely identical for both roles.
- **PDF generation is asynchronous** — invoice and POD slip generation happen in a background queue on the backend. The frontend never polls automatically; it offers manual "check" actions the user can retry, and a "regenerate" action once documents already exist.

## Project Structure

```
src/
├── admin/            # Admin-only pages
│   ├── AdminDashboard.jsx
│   ├── AdminJobDetail.jsx
│   ├── AdminSubmit.jsx
│   ├── GenerateInvoice.jsx
│   ├── PdfDownloads.jsx
│   ├── Partners.jsx
│   ├── CreateJob.jsx
│   └── CreatePartner.jsx
├── partner/          # Partner-only pages
│   ├── PartnerDashboard.jsx
│   └── PartnerJobDetail.jsx
├── auth/             # Login, change password, logout
├── jobs/             # Shared components used by both Admin and Partner job-detail pages
│   ├── Items.jsx
│   ├── PhotoUpload.jsx
│   ├── JobDetailsForm.jsx
│   ├── SubmitSection.jsx
│   ├── Shipment.jsx
│   ├── JobTimeline.jsx
│   └── JobSummary.jsx
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

- No pagination yet on job lists or audit logs (fine at current data volume; worth revisiting as data grows).
- Photo viewing (a full list of uploaded photos per job) isn't built yet — the backend doesn't currently expose a `GET` endpoint for it, only upload.
- Partner-level audit events not tied to a specific job (e.g. account deactivation) aren't viewable through the current audit log flow, which is job-centric.

## License

This project is currently private/unlicensed.
