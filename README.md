# LeadEquator Admin Dashboard

Admin dashboard for managing users, transactions, events, and analytics.

## Tech Stack

- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express
- **Database**: Neon PostgreSQL + Drizzle ORM
- **Deployment**: Render

## Prerequisites

- Node.js 18+
- Neon Database account ([neon.tech](https://neon.tech))
- Render account ([render.com](https://render.com))

## Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd leadequator_admin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` and add your Neon database URL:
   ```
   NEON_DATABASE_URL=postgresql://user:password@host/database
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```
   
   This will start:
   - Client on `http://localhost:5173`
   - Server on `http://localhost:3000`

## Build for Production

```bash
npm run build
```

This will:
1. Build the React client to `dist/`
2. Build the Express server to `dist/server/`

To test the production build locally:
```bash
npm start
```

## Deployment to Render

### Option 1: Using render.yaml (Recommended)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Connect to Render**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect `render.yaml`

3. **Set Environment Variables**
   - In Render dashboard, go to your service settings
   - Add environment variable:
     - `NEON_DATABASE_URL`: Your Neon database connection string

### Option 2: Manual Setup

1. **Create Web Service**
   - Go to Render Dashboard
   - Click "New" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service**
   - **Name**: leadequator-admin
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

3. **Environment Variables**
   - Add `NEON_DATABASE_URL` with your database URL
   - Add `NODE_ENV` with value `production`

4. **Deploy**
   - Click "Create Web Service"
   - Render will automatically deploy

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEON_DATABASE_URL` | PostgreSQL connection string from Neon | Yes |
| `PORT` | Server port (set automatically by Render) | No |
| `NODE_ENV` | Environment (set to `production` in Render) | No |

## Project Structure

```
├── client/                 # React frontend
│   ├── components/        # React components
│   ├── pages/            # Page components
│   ├── hooks/            # Custom hooks
│   └── lib/              # Utilities
├── server/                # Express backend
│   ├── routes/           # API routes
│   └── src/
│       ├── config/       # Database schema
│       ├── lib/          # Database connection
│       └── server.ts     # Server setup
├── shared/               # Shared types and API
└── dist/                # Production build (generated)
```

## API Routes

### Public
- `GET /health` - Health check
- `GET /api/ping` - API status

### Admin
- `POST /api/admin/login` - Admin login
- `POST /api/admin/signup` - Admin signup
- `GET /api/admin/users` - List users
- `GET /api/admin/transactions` - List transactions
- `GET /api/admin/events` - List events
- `GET /api/analytics/dashboard` - Dashboard analytics
- `GET /api/analytics/geo` - Geographic analytics

## Database

The app uses Neon PostgreSQL with Drizzle ORM. Database schema is defined in `server/src/config/schema.ts`.

Tables:
- `users` - Application users
- `admins` - Admin users
- `transactions` - Transaction records
- `events` - Event logs
- `company_details` - Company information
- `target_market` - Target market data
- `onboarding_progress` - User onboarding state

## Scripts

- `npm run dev` - Start development servers (client + server)
- `npm run dev:client` - Start client only
- `npm run dev:server` - Start server only
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run typecheck` - Run TypeScript type checking
- `npm test` - Run tests
- `npm run format.fix` - Format code with Prettier

## Troubleshooting

### Build fails on Render
- Make sure `NEON_DATABASE_URL` is set in environment variables
- Check Render logs for specific error messages

### Database connection issues
- Verify your Neon database URL is correct
- Ensure your Neon project is not paused
- Check that SSL is enabled (required for Neon)

### Frontend not loading
- Make sure the build completed successfully
- Check that static files are being served from `dist/`

## License

Private - All rights reserved
