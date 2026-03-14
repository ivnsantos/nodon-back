// Script para executar a refatoração da tabela evolucao_paciente
// Execute com: node run-refactor-evolucao.js

const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config();

async function runMigration() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('Conectando ao banco de dados...');
    await client.connect();
    console.log('Conectado!');

    const sql = fs.readFileSync('sql/refactor-evolucao-profissional.sql', 'utf8');
    console.log('Refatorando tabela evolucao_paciente...');
    console.log('- Removendo profissional_id');
    console.log('- Adicionando cliente_master_id e usuario_comum_id');
    await client.query(sql);
    
    console.log('✅ Migração executada com sucesso!');
    console.log('✅ Tabela evolucao_paciente refatorada');
  } catch (error) {
    console.error('❌ Erro ao executar migração:', error.message);
    console.error('Detalhes:', error.detail);
  } finally {
    await client.end();
  }
}

runMigration();
