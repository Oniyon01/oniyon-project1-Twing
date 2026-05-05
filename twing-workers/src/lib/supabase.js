/**
 * Supabase 호출 래퍼
 *
 * Cloudflare Workers에서는 supabase-js SDK도 가능하지만, 의존성을 최소화하려고
 * 그냥 PostgREST에 직접 fetch로 호출. Service Role Key를 사용 (Worker는 신뢰 환경).
 *
 * 보안: Service Role Key는 RLS를 우회하므로, Worker가 받는 user_id를 신뢰하면 안 됨.
 *      JWT 검증을 통해 진짜 유저인지 확인하는 단계는 별도 미들웨어로 추가 권장.
 *
 * @param {Object} env - { SUPABASE_URL, SUPABASE_SERVICE_KEY }
 */

class SupabaseClient {
  constructor(env) {
    this.url = env.SUPABASE_URL;
    this.key = env.SUPABASE_SERVICE_KEY;

    if (!this.url || !this.key) {
      throw new Error("SUPABASE_URL 또는 SUPABASE_SERVICE_KEY가 환경에 없음");
    }
  }

  _headers(extra = {}) {
    return {
      "Content-Type": "application/json",
      "apikey": this.key,
      "Authorization": `Bearer ${this.key}`,
      ...extra,
    };
  }

  /**
   * 새 행 삽입 후 삽입된 행 반환
   */
  async insert(table, row) {
    const res = await fetch(`${this.url}/rest/v1/${table}`, {
      method: "POST",
      headers: this._headers({ "Prefer": "return=representation" }),
      body: JSON.stringify(row),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new SupabaseError(`Insert ${table} failed: ${res.status} ${errText}`, res.status);
    }

    const rows = await res.json();
    return Array.isArray(rows) ? rows[0] : rows;
  }

  /**
   * 단일 행 조회 (id 기준)
   */
  async getById(table, id) {
    const res = await fetch(
      `${this.url}/rest/v1/${table}?id=eq.${id}&select=*`,
      { headers: this._headers() }
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new SupabaseError(`Get ${table}/${id} failed: ${res.status} ${errText}`, res.status);
    }

    const rows = await res.json();
    return rows[0] || null;
  }

  /**
   * 행 업데이트
   */
  async update(table, id, patch) {
    const res = await fetch(
      `${this.url}/rest/v1/${table}?id=eq.${id}`,
      {
        method: "PATCH",
        headers: this._headers({ "Prefer": "return=representation" }),
        body: JSON.stringify(patch),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new SupabaseError(`Update ${table}/${id} failed: ${res.status} ${errText}`, res.status);
    }

    const rows = await res.json();
    return Array.isArray(rows) ? rows[0] : rows;
  }
}

export class SupabaseError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "SupabaseError";
    this.status = status;
  }
}

/**
 * env에서 SupabaseClient 인스턴스 생성
 */
export function createSupabase(env) {
  return new SupabaseClient(env);
}
