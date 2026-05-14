import { NextRequest, NextResponse } from 'next/server';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const CLOSE_API_KEY = process.env.CLOSE_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STATUS_ID = 'stat_wl1zOOUM1Hk95BfKVUImP261o1AjsnPjR0VNDCn8iJe';

interface CloseContact {
  id: string;
  name?: string;
  phones?: { phone: string }[];
  emails?: { email: string }[];
}

interface CloseLead {
  id: string;
  display_name: string;
  status_label: string;
  contacts?: CloseContact[];
  url?: string;
  date_created?: string;
}

interface SyncedLead {
  id: string;
  display_name: string;
  status_label: string;
  email: string | null;
  website_url: string | null;
  contact_name: string | null;
  phone: string | null;
  date_created: string | null;
  synced_at: string;
}

interface CloseSearchResponse {
  data: CloseLead[];
  cursor?: string | null;
}

async function fetchLeadsFromClose(cursor?: string): Promise<{
  data: CloseLead[];
  cursor: string | null;
}> {
  const auth = Buffer.from(`${CLOSE_API_KEY}:`).toString('base64');

  const body: Record<string, unknown> = {
    query: {
      type: 'and',
      queries: [
        {
          type: 'object_type',
          object_type: 'lead',
        },
        {
          type: 'field_condition',
          field: {
            type: 'regular_field',
            object_type: 'lead',
            field_name: 'status_id',
          },
          condition: {
            type: 'reference',
            reference_type: 'lead_status',
            object_ids: [STATUS_ID],
          },
        },
      ],
    },
    _fields: {
      lead: ['id', 'display_name', 'status_label', 'contacts', 'url', 'date_created'],
    },
    _limit: 100,
  };

  if (cursor) {
    body.cursor = cursor;
  }

  const headers: Record<string, string> = {
    Authorization: `Basic ${auth}`,
    'Content-Type': 'application/json',
  };

  const response = await fetch('https://api.close.com/api/v1/data/search/', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Close API response:', errorText);
    throw new Error(
      `Close API error: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const data: CloseSearchResponse = await response.json();
  return {
    data: data.data || [],
    cursor: data.cursor ?? null,
  };
}

function mapCloseLead(lead: CloseLead): SyncedLead {
  const contact = lead.contacts?.[0];
  const contactName = contact?.name ?? null;
  const phone = contact?.phones?.[0]?.phone ?? null;
  const website = lead.url ?? null;
  const email = contact?.emails?.[0]?.email ?? null;
  const dateCreated = lead.date_created ?? null;

  return {
    id: lead.id,
    display_name: lead.display_name,
    status_label: lead.status_label,
    email,
    website_url: website,
    contact_name: contactName,
    phone,
    date_created: dateCreated,
    synced_at: new Date().toISOString(),
  };
}

async function upsertLeadsToSupabase(leads: SyncedLead[]): Promise<void> {
  if (leads.length === 0) return;

  const response = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_SERVICE_KEY!,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify(leads),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Supabase REST API response:', errorText);
    throw new Error(
      `Supabase upsert error: ${response.status} ${response.statusText} - ${errorText}`
    );
  }
}

async function cleanupWrongEmails(): Promise<number> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_SERVICE_KEY!,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  });

  if (!response.ok) {
    console.error('Failed to fetch leads for cleanup');
    return 0;
  }

  const leads: SyncedLead[] = await response.json();
  const wrongEmails = leads.filter(
    (lead) => lead.email && !lead.email.includes('@')
  );

  if (wrongEmails.length === 0) {
    console.log('No records with wrong email format found');
    return 0;
  }

  console.log(
    `Found ${wrongEmails.length} records with wrong email format, fixing...`
  );

  const fixedLeads = wrongEmails.map((lead) => ({
    ...lead,
    email: null,
  }));

  const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_SERVICE_KEY!,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
    body: JSON.stringify(fixedLeads),
  });

  if (!updateResponse.ok) {
    console.error('Failed to update wrong email records');
    return 0;
  }

  console.log(`Fixed ${wrongEmails.length} records with wrong emails`);
  return wrongEmails.length;
}

async function syncAllLeads(): Promise<number> {
  let totalSynced = 0;
  let cursor: string | null | undefined = undefined;

  while (true) {
    const { data, cursor: nextCursor } = await fetchLeadsFromClose(
      cursor as string | undefined
    );

    if (data.length === 0) break;

    const mappedLeads = data.map(mapCloseLead);
    await upsertLeadsToSupabase(mappedLeads);

    totalSynced += data.length;
    console.log(
      `Synced ${data.length} leads, total so far: ${totalSynced}, next cursor: ${nextCursor}`
    );

    if (!nextCursor) break;
    cursor = nextCursor;
  }

  return totalSynced;
}

export async function POST(request: NextRequest) {
  try {
    if (!CLOSE_API_KEY) {
      return NextResponse.json(
        { error: 'CLOSE_API_KEY is not set' },
        { status: 500 }
      );
    }

    if (!SUPABASE_URL) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_SUPABASE_URL is not set' },
        { status: 500 }
      );
    }

    if (!SUPABASE_SERVICE_KEY) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY is not set' },
        { status: 500 }
      );
    }

    console.log('Starting cleanup of records with wrong email format...');
    const cleaned = await cleanupWrongEmails();

    console.log('Starting sync from Close CRM...');
    const totalSynced = await syncAllLeads();

    return NextResponse.json(
      {
        success: true,
        message: `Cleaned ${cleaned} records, synced ${totalSynced} leads from Close CRM`,
        cleaned,
        synced: totalSynced,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Sync leads error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
