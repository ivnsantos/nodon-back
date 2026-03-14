// Script para verificar constraints da tabela evolucao_paciente
// Execute com: node run-check-constraints.js

const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config();

async function checkConstraints() {
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

    const sql = fs.readFileSync('sql/check-evolucao-constraints.sql', 'utf8');
    console.log('Verificando constraints da tabela evolucao_paciente...\n');
    const result = await client.query(sql);
    
    console.log('Constraints encontradas:');
    console.table(result.rows);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

checkConstraints();
