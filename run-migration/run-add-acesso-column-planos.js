const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });
require('dotenv').config();

async function runMigration() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nodondb',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔌 Tentando conectar ao banco de dados...');
    console.log('  - Host:', process.env.DB_HOST || 'localhost');
    console.log('  - Database:', process.env.DB_NAME || 'nodondb');
    await client.connect();
    console.log('✅ Conectado ao banco de dados');

    // Verificar se a coluna já existe
    console.log('🔍 Verificando se a coluna acesso existe...');
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'planos' AND column_name = 'acesso'
    `);

    if (checkColumn.rows.length > 0) {
      console.log('✅ Coluna acesso já existe na tabela planos');
    } else {
      console.log('🔧 Adicionando coluna acesso à tabela planos...');
      
      // Adicionar a coluna diretamente
      await client.query(`
        ALTER TABLE planos 
        ADD COLUMN acesso VARCHAR(255) DEFAULT 'all'
      `);
      
      // Atualizar registros existentes
      await client.query(`
        UPDATE planos SET acesso = 'all' WHERE acesso IS NULL
      `);
      
      console.log('✅ Coluna acesso adicionada com sucesso');
    }

    // Verificar o estado final
    const finalCheck = await client.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'planos' AND column_name = 'acesso'
    `);

    if (finalCheck.rows.length > 0) {
      console.log('📋 Estado da coluna acesso:');
      console.log('  - Tipo:', finalCheck.rows[0].data_type);
      console.log('  - Default:', finalCheck.rows[0].column_default);
      console.log('  - Permite NULL:', finalCheck.rows[0].is_nullable);
    }

  } catch (error) {
    console.error('❌ Erro ao executar migração:', error);
    throw error;
  } finally {
    await client.end();
    console.log('✅ Conexão fechada');
  }
}

runMigration()
  .then(() => {
    console.log('✅ Migração concluída com sucesso');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  });
