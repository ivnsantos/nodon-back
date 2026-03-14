// Script para executar a migração da coluna observacao
// Execute com: node run-evolucao-observacao-migration.js

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

    const sql = fs.readFileSync('sql/update-evolucao-observacao-nullable.sql', 'utf8');
    console.log('Executando migração para tornar observacao nullable...');
    await client.query(sql);
    
    console.log('✅ Migração executada com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar migração:', error.message);
  } finally {
    await client.end();
  }
}

runMigration();
