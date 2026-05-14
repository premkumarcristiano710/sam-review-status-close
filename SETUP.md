# Setup Guide

## Prerequisites

- Node.js 18+ and npm
- Supabase account with a project
- Close CRM API key

## 1. Install Dependencies

```bash
npm install
```

## 2. Create Supabase Table

In your Supabase project, run this SQL in the SQL Editor:

```sql
CREATE TABLE leads (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  status_label TEXT NOT NULL,
  email TEXT,
  website_url TEXT,
  contact_name TEXT,
  phone TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_status ON leads(status_label);
CREATE INDEX idx_leads_email ON leads(email);
```

## 3. Configure Environment Variables

Fill in the `.env.local` file with:

- **CLOSE_API_KEY**: Your Close CRM API key (found in Close CRM settings)
- **NEXT_PUBLIC_SUPABASE_URL**: Your Supabase project URL
- **NEXT_PUBLIC_SUPABASE_ANON_KEY**: Your Supabase anonymous key
- **SUPABASE_SERVICE_ROLE_KEY**: Your Supabase service role key (for server-side operations)

You can find these values in your Supabase project settings under "API".

## 4. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000 to access the dashboard.

## 5. Build for Production

```bash
npm run build
npm start
```

## 6. Deploy to Vercel

1. Push your code to a GitHub repository
2. Connect your repository to Vercel
3. Add the environment variables in Vercel project settings
4. The cron job in `vercel.json` will automatically run `/api/sync-leads` every hour

## API Routes

### POST /api/sync-leads

Syncs all leads from Close CRM with the specified status to the Supabase database.

- **Status ID**: `stat_wl1zOOUM1Hk95BfKVUImP261o1AjsnPjR0VNDCn8iJe`
- **Handles pagination**: Automatically fetches all results using cursor pagination
- **Upserts data**: Updates existing leads, inserts new ones

**Response**:
```json
{
  "success": true,
  "message": "Synced 42 leads from Close CRM",
  "synced": 42,
  "timestamp": "2024-05-14T10:30:00.000Z"
}
```

## Dashboard Features

- **Search**: Filter by lead name, email, contact name, or phone
- **Status Filter**: Filter by lead status
- **Sync Button**: Manually trigger a sync from Close CRM
- **View Count**: Shows current number of leads in database
- **Email/Phone Links**: Clickable mailto and tel links
- **Website Links**: Open websites in new tab

## Troubleshooting

### Table doesn't exist error
Make sure to create the Supabase table with the SQL provided above.

### Authentication errors
- Verify API keys are correct in `.env.local`
- Check that service role key is used for server-side operations
- Make sure anon key is used for client-side queries

### Sync not working
- Check API key is correct in Close CRM
- Verify the status_id is correct
- Check browser console and server logs for errors
