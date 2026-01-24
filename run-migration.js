// Script para executar a migração do Google OAuth
// Execute com: node run-migration.js

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

    const sql = fs.readFileSync('add-google-id-column.sql', 'utf8');
    console.log('Executando migração...');
    await client.query(sql);
    
    console.log('✅ Migração executada com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar migração:', error.message);
  } finally {
    await client.end();
  }
}

runMigration();

