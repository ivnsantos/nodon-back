// Script para executar as migrações OAuth (Google, Facebook e Foto)
// Execute com: node run-oauth-migrations.js

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigrations() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔌 Conectando ao banco de dados...');
    await client.connect();
    console.log('✅ Conectado!');

    // Executar migração do Google
    console.log('\n📝 Executando migração: Google OAuth (google_id)...');
    const googleSql = fs.readFileSync(path.join(__dirname, 'add-google-id-column.sql'), 'utf8');
    await client.query(googleSql);
    console.log('✅ Migração Google executada com sucesso!');

    // Executar migração do Facebook
    console.log('\n📝 Executando migração: Facebook OAuth (facebook_id)...');
    const facebookSql = fs.readFileSync(path.join(__dirname, 'add-facebook-id-column.sql'), 'utf8');
    await client.query(facebookSql);
    console.log('✅ Migração Facebook executada com sucesso!');

    // Executar migração da foto
    console.log('\n📝 Executando migração: Foto de perfil (foto)...');
    const fotoSql = fs.readFileSync(path.join(__dirname, 'add-foto-column.sql'), 'utf8');
    await client.query(fotoSql);
    console.log('✅ Migração Foto executada com sucesso!');

    // Verificar se as colunas foram criadas
    console.log('\n🔍 Verificando colunas criadas...');
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('google_id', 'facebook_id', 'foto')
      ORDER BY column_name;
    `);

    console.log('\n📊 Colunas encontradas:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    if (result.rows.length === 3) {
      console.log('\n✅ Todas as migrações foram executadas com sucesso!');
    } else {
      console.log(`\n⚠️ Apenas ${result.rows.length} de 3 colunas foram encontradas.`);
    }

  } catch (error) {
    console.error('❌ Erro ao executar migrações:', error.message);
    console.error('Detalhes:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Conexão encerrada.');
  }
}

runMigrations();
