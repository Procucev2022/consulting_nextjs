# Procucev Consulting Platform

Consulting & Procurement Intelligence Platform (Next.js Frontend, Node.js Backend, PostgreSQL Database).

## Architecture & Quick Start

- **Frontend**: Next.js 15 App Router (`frontend/`)
- **Backend**: Node.js / Express with Prisma ORM (`backend/`)
- **Database**: PostgreSQL 16 (`docker-compose.yml`)
- **Production Hosting**: Cloudflare Pages (`https://procucev-consulting-portal.pages.dev/`)

### Quick Start
```bash
# Install all dependencies
npm run install:all

# Start development servers (frontend & backend)
npm run dev

# Start PostgreSQL database (local)
docker compose up -d
npm run db:setup
```

## CI/CD & Deployment
Comprehensive documentation for the automated GitHub CI/CD pipeline, branch strategy, and Cloudflare Pages deployment is available in [docs/CI-CD.md](docs/CI-CD.md).
