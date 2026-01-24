const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
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

    const sql = fs.readFileSync(
      path.join(__dirname, '..', 'sql', 'add-image-urls-chat-messages.sql'),
      'utf8'
    );

    console.log('Executando SQL...');
    await client.query(sql);
    
    console.log('✅ Coluna image_urls adicionada com sucesso!');
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await client.end();
  }
}

run();
