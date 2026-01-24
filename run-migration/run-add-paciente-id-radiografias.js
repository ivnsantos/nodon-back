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

    // Adicionar coluna paciente_id
    console.log('➕ Adicionando coluna paciente_id...');
    await client.query('ALTER TABLE radiografias ADD COLUMN IF NOT EXISTS paciente_id UUID NULL');
    console.log('✅ Coluna paciente_id adicionada');

    // Criar índice
    console.log('➕ Criando índice...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_radiografias_paciente_id ON radiografias(paciente_id)');
    console.log('✅ Índice criado');

    console.log('\n✅ Migração concluída com sucesso!');
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await client.end();
  }
}

run();
