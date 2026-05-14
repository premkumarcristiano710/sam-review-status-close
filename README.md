# Close CRM Leads Dashboard

A Next.js dashboard for viewing and syncing leads from Close CRM to Supabase.

## Features

- 🔄 **Automatic Syncing**: Hourly cron job to sync leads from Close CRM
- 🔍 **Advanced Search**: Filter leads by name, email, contact, or phone
- 🏷️ **Status Filtering**: View leads by their status
- 📱 **Responsive Design**: Clean, modern UI with Tailwind CSS
- ⚡ **Real-time Updates**: Instant data refresh with Supabase
- 🚀 **Vercel Ready**: Includes cron configuration for production

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **API Client**: Supabase JS SDK
- **Hosting**: Vercel (with cron support)

## Project Structure

```
├── app/
│   ├── api/
│   │   └── sync-leads/
│   │       └── route.ts          # Close CRM sync endpoint
│   ├── dashboard/
│   │   └── page.tsx              # Main dashboard page
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   └── globals.css               # Global styles
├── lib/
│   └── supabase.ts               # Supabase client & types
├── .env.local                    # Environment variables (fill these in)
├── vercel.json                   # Vercel cron configuration
└── SETUP.md                      # Detailed setup instructions
```

## Quick Start

1. **Clone and install**:
   ```bash
   npm install
   ```

2. **Set up environment variables** in `.env.local`:
   ```
   CLOSE_API_KEY=your_api_key
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. **Create Supabase table** (see SETUP.md for SQL)

4. **Run development server**:
   ```bash
   npm run dev
   ```

5. **Open** http://localhost:3000

## Deployment

This project is ready for Vercel deployment:

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel settings
4. Automatic syncing will run hourly via cron job

See SETUP.md for detailed deployment instructions.

## API Endpoints

- `GET /` - Home page
- `GET /dashboard` - Main dashboard
- `POST /api/sync-leads` - Sync leads from Close CRM (also supports GET for Vercel cron)

## Data Model

### Leads Table

```
id              TEXT PRIMARY KEY
display_name    TEXT
status_label    TEXT
email           TEXT
website_url     TEXT
contact_name    TEXT
phone           TEXT
synced_at       TIMESTAMPTZ
```

## Notes

- Status filter defaults to: `stat_wl1zOOUM1Hk95BfKVUImP261o1AjsnPjR0VNDCn8iJe`
- Pagination is handled automatically using Close CRM's cursor-based pagination
- Upsert on conflict means existing leads are updated, new ones are inserted
- All sync times are stored in UTC and displayed in the dashboard

## License

MIT
