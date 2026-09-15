# VasukiPublication — Production Deployment Guide

VasukiPublication is optimized for deployment on Vercel or any containerized Next.js hosting environment with serverless MongoDB connectivity.

---

## 1. Environment Variables Configuration

Ensure the following environment variables are set in your production project dashboard (e.g. Vercel Project Settings > Environment Variables):

| Variable | Scope | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `MONGODB_URI` | Server | **Yes** | MongoDB Atlas or cluster connection string | `mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority` |
| `MONGODB_DATABASE` | Server | **Yes** | Database name | `vasukisquare` |
| `ADMIN_ACCESS_TOKEN` | Server | Optional | Secret token for administrative endpoints | `sec_abc123...` |
| `ADMIN_SESSION_SECRET` | Server | Optional | Session signing secret | `rnd_secret_string...` |
| `NEXT_PUBLIC_SITE_URL` | Client/Server | **Yes** | Production canonical domain | `https://vasukipublication.com` |
| `NEXT_PUBLIC_SITE_NAME` | Client/Server | **Yes** | Production site name | `Vasuki Publication` |
| `NODE_ENV` | System | **Yes** | Set to `production` | `production` |

---

## 2. Serverless MongoDB Pooling

In serverless execution environments (Vercel Functions):
- Connections are pooled globally across function executions using the client caching pattern in `lib/db/mongodb.ts`.
- Ensure your MongoDB Atlas cluster has sufficient connection limits for peak traffic.
- Set `maxIdleTimeMS` (default: 30000ms) to allow unused connections to close cleanly.

---

## 3. Production Deployment Checklist

- [ ] **Database Indexes**: Run index creation commands from `docs/mongodb.md` against the production MongoDB instance.
- [ ] **Environment Verification**: Confirm all required production variables are populated and valid.
- [ ] **Build Validation**: Execute `npm run build` locally or in CI/CD pipeline to verify zero TypeScript errors.
- [ ] **Security Audit**: Ensure `ADMIN_ACCESS_TOKEN` and `MONGODB_URI` do not appear in client-accessible bundles or public headers.
- [ ] **Custom Domain & SSL**: Configure production domain with HTTPS and configure canonical URL in `NEXT_PUBLIC_SITE_URL`.
- [ ] **Robots & Sitemap**: Verify `/robots.txt` and `/sitemap.xml` resolve and index public books correctly.

