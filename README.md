# SecureSecrets

A local-first security scanner that finds exposed API keys, tokens, and secrets on your machine before someone else does.

## Features

- **24 Detection Patterns** — Covers all major providers: OpenAI, Anthropic, GitHub, AWS, Stripe, Vercel, Convex, Discord, Telegram, Railway, Brave Search, Supabase, and more
- **Security Audit** — Analyzes your configuration for sandbox mode, CORS restrictions, execution approvals, sensitive path restrictions, logging redaction, and skill code safety
- **Fix Guides** — Step-by-step remediation instructions with platform-aware code snippets (macOS, Windows, Linux)
- **Enterprise Dashboard** — Tabbed layout with Overview, Findings, and Audit views
- **Light/Dark Theme** — Toggle between themes with localStorage persistence
- **100% Local** — Nothing leaves your machine. All scanning and analysis runs on localhost.

## Screenshots

### Overview Tab (Dark)
Score gauge, severity distribution bar, metric cards, critical findings preview, and audit summary — all in one executive view.

### Findings Tab
Filterable list of all detected secrets with expandable cards showing provider, pattern, file location, detected context, and fix guides.

### Audit Tab
Security configuration checks organized by severity: critical failures, warnings, and passed checks in a compact grid.

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
npm install
```

### Run

```bash
npm run dev
```

This starts the local server at `http://localhost:19384`. The scanner and web UI run entirely on your machine.

### Build

```bash
npm run build
```

## Architecture

```
packages/
  engine/     # Core scanning engine — pattern matching, scoring, audit checks
  cli/        # CLI interface and local HTTP server
  web/        # React + Vite frontend (dashboard UI)
```

### Web UI Components

| Component | Purpose |
|-----------|---------|
| `OverviewTab` | Executive summary: score gauge, severity bar, metrics, top findings |
| `FindingsList` | Filterable list of detected secrets |
| `FindingCard` | Expandable card with details and fix guide |
| `AuditTab` | Full audit results: critical, warnings, passed |
| `AuditCard` | Individual audit check with expandable details |
| `ScoreGauge` | Animated SVG circular gauge (0-100) |
| `SeverityBar` | Horizontal stacked severity distribution |
| `DashboardTabs` | Tab navigation with badges |
| `ThemeToggle` | Light/dark mode switcher |

### Theme System

CSS custom properties in `app.css` with `:root` (dark default) and `[data-theme="light"]` overrides. ThemeProvider context in `lib/theme.tsx` handles toggle, localStorage persistence, and `prefers-color-scheme` fallback.

## Detection Patterns

| Provider | Pattern | Severity |
|----------|---------|----------|
| OpenAI | `sk-` API keys | Critical |
| Anthropic | OAuth tokens, API keys | Critical |
| AWS | Access keys (`AKIA`), secret keys | Critical |
| GitHub | Personal access tokens (`ghp_`, `gho_`) | High |
| Stripe | Secret keys (`sk_live_`, `sk_test_`) | Critical |
| Vercel | Deployment tokens (`vcp_`) | Critical |
| Convex | Deploy keys | Critical |
| Discord | Bot tokens | High |
| Telegram | Bot tokens | High |
| Railway | API tokens | High |
| Brave Search | API keys | High |
| Supabase | JWT keys | Critical |
| + more | 24 patterns total | — |

## Security Audit Checks

- Gateway Authentication
- Gateway Binding Address
- Sandbox Mode
- CORS Restriction
- Sensitive Path Restrictions
- Logging Redaction
- Execution Approval Restrictions
- Skill Code Safety Analysis
- Device Pairing Security
- SecretRef Usage
- Node.js Version
- Verified Skills Only
- Reverse Proxy Headers
- Attack Surface Summary

## License

Private — all rights reserved.
