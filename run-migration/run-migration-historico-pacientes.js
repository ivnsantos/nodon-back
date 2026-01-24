const { readFileSync } = require('fs');
const { Client } = require('pg');
require('dotenv').config();

async function runMigration() {
  // SSL é obrigatório para conexões externas ou quando DB_SSL=true
  // Sempre usar SSL (igual ao TypeORM config)
  const useSsl = true;

  const client = new Client({
    host: process.env.DB_HOST?.trim(),
    port: parseInt(process.env.DB_PORT?.trim() || '5432', 10),
    user: process.env.DB_USERNAME?.trim(),
    password: process.env.DB_PASSWORD?.trim(),
    database: process.env.DB_NAME?.trim(),
    ssl: useSsl ? {
      rejectUnauthorized: false, // Necessário para alguns ambientes de hospedagem
    } : false,
  });

  try {
    console.log('🔌 Conectando ao banco de dados...');
    await client.connect();
    console.log('✅ Conectado com sucesso!');

    console.log('📄 Lendo arquivo de migração...');
    const sql = readFileSync('./create-historico-pacientes-table.sql', 'utf8');

    console.log('🚀 Executando migração...');
    await client.query(sql);

    console.log('✅ Migração executada com sucesso!');
    console.log('📊 Tabela "historico_pacientes" criada/atualizada.');
  } catch (error) {
    console.error('❌ Erro ao executar migração:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Conexão encerrada.');
  }
}

runMigration();
