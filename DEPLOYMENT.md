# Deployment Checklist

Use this checklist before deploying to Render:

## Pre-Deployment

- [ ] All code is committed and pushed to GitHub
- [ ] `.env` file is **NOT** committed (should be in `.gitignore`)
- [ ] `.env.example` is committed with all required variables
- [ ] Database is set up on Neon and tested
- [ ] Build works locally (`npm run build` succeeds)
- [ ] Production server starts locally (`npm start` works)

## GitHub Setup

- [ ] Repository created on GitHub
- [ ] Local git initialized (`git init`)
- [ ] All files added (`git add .`)
- [ ] Initial commit made (`git commit -m "Initial commit"`)
- [ ] Remote added (`git remote add origin <url>`)
- [ ] Code pushed (`git push -u origin main`)

## Render Configuration

- [ ] Render account created
- [ ] New Web Service created or Blueprint connected
- [ ] GitHub repository connected
- [ ] Build command set: `npm install && npm run build`
- [ ] Start command set: `npm start`
- [ ] Environment variables configured:
  - [ ] `NEON_DATABASE_URL` (from Neon dashboard)
  - [ ] `NODE_ENV=production`

## Post-Deployment

- [ ] Health check endpoint working (`/health`)
- [ ] API endpoints responding (`/api/ping`)
- [ ] Frontend loads correctly
- [ ] Admin login works
- [ ] Database queries executing
- [ ] No errors in Render logs

## Common Issues

**Build fails:**
- Check Render logs for specific error
- Verify all dependencies are in `package.json`
- Make sure Node version is compatible (18+)

**Server won't start:**
- Verify `NEON_DATABASE_URL` is set
- Check that production build created `dist/server/production.mjs`
- Review Render logs for startup errors

**Database errors:**
- Confirm database URL is correct
- Ensure Neon project is not paused
- Check SSL settings are enabled

**404 errors:**
- Verify client built to `dist/` directory
- Check static file serving in `server/node-build.ts`
- Ensure all routes are properly configured
