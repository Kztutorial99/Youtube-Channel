import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default sql;

/** Pastikan tabel ada (dijalankan saat pertama kali) */
export async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS download_counts (
      filename  TEXT PRIMARY KEY,
      count     BIGINT NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export async function incrementCount(filename: string): Promise<bigint> {
  const rows = await sql`
    INSERT INTO download_counts (filename, count)
    VALUES (${filename}, 1)
    ON CONFLICT (filename)
    DO UPDATE SET count = download_counts.count + 1, updated_at = NOW()
    RETURNING count
  `;
  return rows[0].count as bigint;
}

export async function getCounts(): Promise<Record<string, number>> {
  const rows = await sql`SELECT filename, count FROM download_counts`;
  return Object.fromEntries(rows.map((r: { filename: string; count: number }) => [r.filename, Number(r.count)]));
}
