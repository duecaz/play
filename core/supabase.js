/* Thin Supabase REST client — no SDK dependency */
const BASE = 'https://llqjcrolnknvgkvnzzli.supabase.co/rest/v1'
const KEY  = 'sb_publishable_piMHx4MUnCDLri00LEcHJw_fZzZg5uE'

const AUTH = { apikey: KEY, Authorization: `Bearer ${KEY}` }

export async function sbList(table) {
  const r = await fetch(`${BASE}/${table}?select=id,data&order=updated_at.desc`, {
    headers: AUTH
  })
  if (!r.ok) throw new Error(`[sb] list ${table}: ${r.status}`)
  return r.json()          // [{id, data}, ...]
}

export async function sbUpsert(table, row) {
  const r = await fetch(`${BASE}/${table}`, {
    method:  'POST',
    headers: {
      ...AUTH,
      'Content-Type': 'application/json',
      'Prefer':       'resolution=merge-duplicates,return=minimal'
    },
    body: JSON.stringify(row)
  })
  if (!r.ok) throw new Error(`[sb] upsert ${table}: ${r.status}`)
}

export async function sbDelete(table, id) {
  const r = await fetch(`${BASE}/${table}?id=eq.${encodeURIComponent(id)}`, {
    method:  'DELETE',
    headers: AUTH
  })
  if (!r.ok) throw new Error(`[sb] delete ${table}: ${r.status}`)
}
