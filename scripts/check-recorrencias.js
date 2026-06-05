const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST,
  port: 5432,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  const total = await client.query('SELECT COUNT(*)::int AS c FROM recorrencias');
  const hoje = await client.query(
    "SELECT (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date AS hoje",
  );
  const atrasadas = await client.query(`
    SELECT id, assinatura_id, next_due_date::text AS venc, valor
    FROM recorrencias
    WHERE next_due_date::date <= (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date
    ORDER BY next_due_date ASC
  `);
  const todas = await client.query(`
    SELECT id, next_due_date::text AS venc
    FROM recorrencias
    ORDER BY next_due_date ASC
  `);
  const igualHoje = await client.query(`
    SELECT COUNT(*)::int AS c FROM recorrencias
    WHERE next_due_date::date = (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date
  `);
  console.log('Total recorrencias:', total.rows[0].c);
  console.log('Hoje Brasil:', hoje.rows[0].hoje);
  console.log('Com vencimento = hoje:', igualHoje.rows[0].c);
  console.log('Com vencimento <= hoje:', atrasadas.rows.length);
  console.log('Vencidas:', JSON.stringify(atrasadas.rows, null, 2));
  console.log('Todas:', JSON.stringify(todas.rows, null, 2));
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
