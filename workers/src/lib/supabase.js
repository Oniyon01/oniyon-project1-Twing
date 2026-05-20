export function createClient(supabaseUrl, serviceRoleKey) {
  const headers = {
    'Content-Type': 'application/json',
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    Prefer: 'return=representation',
  };

  async function insert(table, row) {
    const res = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(row),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message ?? `Supabase insert error ${res.status}`);
    return Array.isArray(data) ? data[0] : data;
  }

  async function getById(table, id) {
    const res = await fetch(`${supabaseUrl}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}&limit=1`, {
      headers,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message ?? `Supabase get error ${res.status}`);
    return data[0] ?? null;
  }

  async function update(table, id, patch) {
    const res = await fetch(`${supabaseUrl}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message ?? `Supabase update error ${res.status}`);
    return Array.isArray(data) ? data[0] : data;
  }

  // users 행이 없으면 생성, 있으면 그냥 넘어감
  // handle_new_user 트리거가 없거나 실행 전인 경우를 방어
  async function ensureUser(id) {
    const res = await fetch(`${supabaseUrl}/rest/v1/users`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'resolution=ignore-duplicates,return=minimal' },
      body: JSON.stringify({ id, username: id.slice(0, 8) }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message ?? `Supabase ensureUser error ${res.status}`);
    }
  }

  return { insert, getById, update, ensureUser };
}
