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

    // Adicionar coluna total_tokens
    console.log('➕ Adicionando coluna total_tokens...');
    await client.query('ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS total_tokens INT DEFAULT 0');
    console.log('✅ Coluna total_tokens adicionada');

    // Atualizar totais das conversas existentes
    console.log('🔄 Atualizando totais das conversas existentes...');
    await client.query(`
      UPDATE chat_conversations c 
      SET total_tokens = COALESCE((
        SELECT SUM(tokens_used) 
        FROM chat_messages m 
        WHERE m.conversation_id = c.id AND m.tokens_used IS NOT NULL
      ), 0)
    `);
    console.log('✅ Totais atualizados');

    // Verificar resultado
    const result = await client.query('SELECT id, title, total_tokens FROM chat_conversations');
    console.log('\n📋 Conversas com total_tokens:');
    result.rows.forEach(row => {
      console.log(`  - ${row.title}: ${row.total_tokens} tokens`);
    });

  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await client.end();
  }
}

run();
