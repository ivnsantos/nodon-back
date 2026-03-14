// Script para verificar estrutura da tabela evolucao_paciente
const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config();

async function checkSchema() {
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

    const sql = fs.readFileSync('sql/check-evolucao-schema.sql', 'utf8');
    const result = await client.query(sql);
    
    console.log('\n📋 Estrutura atual da tabela evolucao_paciente:');
    console.log('='.repeat(80));
    result.rows.forEach(row => {
      console.log(`${row.column_name.padEnd(25)} | ${row.data_type.padEnd(20)} | NULL: ${row.is_nullable}`);
    });
    console.log('='.repeat(80));
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

checkSchema();
