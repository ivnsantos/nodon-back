const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('Conectado ao banco de dados');

    // Verificar colunas existentes
    const res = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'radiografias' ORDER BY ordinal_position
    `);
    console.log('\nColunas atuais na tabela radiografias:');
    res.rows.forEach(row => console.log('  -', row.column_name));

    // Verificar se responsavel_id existe
    const hasResponsavel = res.rows.some(r => r.column_name === 'responsavel_id');
    
    if (!hasResponsavel) {
      console.log('\n➕ Adicionando coluna responsavel_id...');
      await client.query('ALTER TABLE radiografias ADD COLUMN responsavel_id UUID NULL');
      console.log('✅ Coluna responsavel_id adicionada com sucesso!');
    } else {
      console.log('\n✅ Coluna responsavel_id já existe');
    }

  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await client.end();
  }
}

run();
