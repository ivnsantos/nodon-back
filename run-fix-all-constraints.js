// Script para executar a migração completa das constraints
// Execute com: node run-fix-all-constraints.js

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

    const sql = fs.readFileSync('sql/fix-all-evolucao-constraints.sql', 'utf8');
    console.log('Removendo todas as constraints antigas e recriando...');
    await client.query(sql);
    
    console.log('✅ Migração executada com sucesso!');
    console.log('✅ Todas as foreign keys foram recriadas corretamente');
  } catch (error) {
    console.error('❌ Erro ao executar migração:', error.message);
    console.error('Detalhes:', error.detail);
  } finally {
    await client.end();
  }
}

runMigration();
