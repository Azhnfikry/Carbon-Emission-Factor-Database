# Supabase Setup Guide

This application uses Supabase PostgreSQL database to store emission factors.

## Quick Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up and create a new project
3. Choose PostgreSQL database
4. Wait for project to initialize (5-10 minutes)

### 2. Get Your Credentials
1. Go to **Settings > API**
2. Copy these values:
   - **Project URL** → `SUPABASE_URL`
   - **Anon Public Key** → `SUPABASE_KEY`

### 3. Create Database Table
1. Go to **SQL Editor** in Supabase dashboard
2. Click **New Query**
3. Copy & paste the contents of `supabase/migrations/001_create_emission_factors.sql`
4. Click **Run**

### 4. Seed Database
```bash
# Add your Supabase credentials to .env
cp .env.example .env
# Edit .env with your SUPABASE_URL and SUPABASE_KEY

# Run seed script to populate emission factors
npm run seed
```

### 5. Update Environment Variables
Create `.env` file:
```env
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_KEY="your-anon-key"
API_KEY="your-api-key"
NODE_ENV="development"
```

### 6. Run Application
```bash
npm run dev
```

## API Usage

### Get All Factors
```bash
curl -H "x-api-key: your-api-key" \
  "http://localhost:3000/api/factors"
```

### Search Factors
```bash
curl -H "x-api-key: your-api-key" \
  "http://localhost:3000/api/factors/search?q=natural+gas"
```

### Calculate Emissions
```bash
curl -X POST \
  -H "x-api-key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"activity_value": 100, "emission_factor_id": "1"}' \
  "http://localhost:3000/api/emissions/calculate"
```

## Supabase Dashboard

Access your data at: `https://app.supabase.com/project/[your-project-id]/editor`

## Deployment to Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `API_KEY`
5. Deploy

Vercel will automatically:
- Build your Vite app
- Run the Express server
- Connect to your Supabase database
