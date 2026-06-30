import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://rescate-vz.com'
const SOURCE_NAME = 'RescateVZ'
const EXPIRY = '2028-12-31T00:00:00Z'

function pfifStatus(status: string): string {
  switch (status) {
    case 'alive':    return 'believed_alive'
    case 'critical': return 'believed_alive'
    case 'deceased': return 'believed_dead'
    default:         return 'information_sought'
  }
}

function xml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const minDate = searchParams.get('min_entry_date')
  const maxResults = Math.min(parseInt(searchParams.get('max_results') || '500'), 500)

  const supabase = getSupabase()

  let query = supabase
    .from('victims')
    .select('id, name, physical_description, estimated_age, status, found_location, created_at, updated_at')
    .eq('is_minor', false)
    .order('updated_at', { ascending: false })
    .limit(maxResults)

  if (minDate) query = query.gte('updated_at', minDate)

  const { data: victims, error } = await query

  if (error) return new NextResponse('Internal error', { status: 500 })

  const now = new Date().toISOString()

  const entries = (victims || []).map(v => `
  <entry>
    <pfif:person>
      <pfif:person_record_id>${APP_URL}/person.${v.id}</pfif:person_record_id>
      <pfif:entry_date>${v.created_at}</pfif:entry_date>
      <pfif:expiry_date>${EXPIRY}</pfif:expiry_date>
      <pfif:author_name>${SOURCE_NAME}</pfif:author_name>
      <pfif:source_name>${SOURCE_NAME}</pfif:source_name>
      <pfif:source_url>${APP_URL}</pfif:source_url>
      <pfif:source_date>${v.updated_at}</pfif:source_date>
      ${v.name ? `<pfif:full_name>${xml(v.name)}</pfif:full_name>` : ''}
      ${v.estimated_age ? `<pfif:age>${v.estimated_age}</pfif:age>` : ''}
      <pfif:description>${xml(v.physical_description)}</pfif:description>
      <pfif:last_known_location>${xml(v.found_location)}</pfif:last_known_location>
      <pfif:status>${pfifStatus(v.status)}</pfif:status>
    </pfif:person>
  </entry>`).join('')

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom"
      xmlns:pfif="http://zesty.ca/pfif/1.3">
  <id>tag:rescatevz,2026:pfif-feed</id>
  <title>RescateVZ – Terremoto Venezuela 2026</title>
  <subtitle>Víctimas registradas del terremoto de Venezuela del 24 de junio de 2026</subtitle>
  <updated>${now}</updated>
  <author>
    <name>${SOURCE_NAME}</name>
    <uri>${APP_URL}</uri>
  </author>
  <link rel="self" href="${APP_URL}/api/pfif/feed"/>
  <link rel="alternate" href="${APP_URL}"/>
${entries}
</feed>`

  return new NextResponse(feed, {
    headers: {
      'Content-Type': 'application/atom+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'X-Robots-Tag': 'noindex',
    },
  })
}
