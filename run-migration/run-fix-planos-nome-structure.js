const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });
require('dotenv').config();

async function fixPlanosNomeStructure() {
  console.log('🔍 Configuração de conexão:');
  console.log('  - DB_HOST:', process.env.DB_HOST || 'localhost');
  console.log('  - DB_PORT:', process.env.DB_PORT || '5432');
  console.log('  - DB_USERNAME:', process.env.DB_USERNAME || 'postgres');
  console.log('  - DB_NAME:', process.env.DB_NAME || 'nodondb');
  console.log('  - DB_SSL:', process.env.DB_SSL || 'false');

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
    await client.connect();
    console.log('✅ Conectado ao banco de dados');

    // 1. Verificar estado atual da coluna
    console.log('📊 Verificando estrutura atual da coluna nome...');
    const columnInfo = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'planos' AND column_name = 'nome'
    `);
    
    if (columnInfo.rows.length === 0) {
      console.log('❌ Coluna nome não encontrada na tabela planos');
      return;
    }

    console.log('📋 Estado atual da coluna nome:');
    console.log('  - Tipo:', columnInfo.rows[0].data_type);
    console.log('  - Permite NULL:', columnInfo.rows[0].is_nullable);
    console.log('  - Default:', columnInfo.rows[0].column_default);

    // 2. Verificar registros com NULL
    const nullCount = await client.query('SELECT COUNT(*) as count FROM planos WHERE nome IS NULL');
    console.log('📊 Registros com nome NULL:', nullCount.rows[0].count);

    if (parseInt(nullCount.rows[0].count) > 0) {
      console.log('🔧 Deletando registros com nome NULL...');
      const deleteResult = await client.query('DELETE FROM planos WHERE nome IS NULL');
      console.log('✅ Registros deletados:', deleteResult.rowCount);
    }

    // 3. Verificar se a coluna permite NULL
    if (columnInfo.rows[0].is_nullable === 'YES') {
      console.log('🔧 A coluna permite NULL. Adicionando constraint NOT NULL...');
      
      // Primeiro, garantir que não há valores NULL
      const checkNull = await client.query('SELECT COUNT(*) as count FROM planos WHERE nome IS NULL');
      if (parseInt(checkNull.rows[0].count) > 0) {
        throw new Error('Ainda existem registros com nome NULL. Não é possível adicionar constraint NOT NULL.');
      }

      // Adicionar constraint NOT NULL
      await client.query('ALTER TABLE planos ALTER COLUMN nome SET NOT NULL');
      console.log('✅ Constraint NOT NULL adicionada com sucesso');
    } else {
      console.log('✅ A coluna já tem constraint NOT NULL');
    }

    // 4. Verificar estado final
    const finalCheck = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'planos' AND column_name = 'nome'
    `);
    
    console.log('📈 Estado final da coluna nome:');
    console.log('  - Tipo:', finalCheck.rows[0].data_type);
    console.log('  - Permite NULL:', finalCheck.rows[0].is_nullable);

    const finalCount = await client.query(
      'SELECT COUNT(*) as total, COUNT(nome) as com_nome FROM planos'
    );
    console.log('📊 Estado da tabela planos:');
    console.log('  - Total de registros:', finalCount.rows[0].total);
    console.log('  - Com nome:', finalCount.rows[0].com_nome);

  } catch (error) {
    console.error('❌ Erro ao corrigir estrutura:', error);
    throw error;
  } finally {
    await client.end();
    console.log('✅ Conexão fechada');
  }
}

fixPlanosNomeStructure()
  .then(() => {
    console.log('✅ Correção concluída com sucesso');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro na correção:', error);
    process.exit(1);
  });
