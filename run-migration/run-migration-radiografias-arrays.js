const { Client } = require('pg');
require('dotenv').config();

async function runMigration() {
  const useSsl = true;

  const client = new Client({
    host: process.env.DB_HOST?.trim(),
    port: parseInt(process.env.DB_PORT?.trim() || '5432', 10),
    user: process.env.DB_USERNAME?.trim(),
    password: process.env.DB_PASSWORD?.trim(),
    database: process.env.DB_NAME?.trim(),
    ssl: useSsl ? {
      rejectUnauthorized: false,
    } : false,
  });

  try {
    console.log('🚀 Iniciando migração para converter achados_radiograficos e necessidades para arrays...');
    console.log('🔌 Conectando ao banco de dados...');
    await client.connect();
    console.log('✅ Conectado com sucesso!');

    // Verificar tipo atual das colunas
    const columnCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'radiografias' 
      AND column_name IN ('achados_radiograficos', 'necessidades')
    `);

    console.log('\n📋 Tipo atual das colunas:');
    columnCheck.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });

    // Converter dados existentes antes de alterar o tipo
    console.log('\n🔄 Convertendo dados existentes...');
    
    // Buscar todos os registros com dados para converter
    const radiografias = await client.query(`
      SELECT id, achados_radiograficos, necessidades 
      FROM radiografias
    `);

    console.log(`📊 Encontrados ${radiografias.rows.length} registro(s) para processar`);

    for (const row of radiografias.rows) {
      // Converter achados_radiograficos
      if (row.achados_radiograficos !== null) {
        let achadosValue = row.achados_radiograficos;
        
        // Se já for um array JSONB, manter
        if (typeof achadosValue === 'object' && Array.isArray(achadosValue)) {
          // Já é array, manter como está
        } else if (typeof achadosValue === 'string') {
          // Converter string para array
          achadosValue = JSON.stringify([achadosValue]);
        } else {
          // Converter para array
          achadosValue = JSON.stringify([String(achadosValue)]);
        }
        
        await client.query(
          `UPDATE radiografias SET achados_radiograficos = $1::text WHERE id = $2`,
          [achadosValue, row.id]
        );
      }

      // Converter necessidades
      if (row.necessidades !== null) {
        let necessidadesValue = row.necessidades;
        
        // Se já for um array JSONB, manter
        if (typeof necessidadesValue === 'object' && Array.isArray(necessidadesValue)) {
          // Já é array, manter como está
        } else if (typeof necessidadesValue === 'string') {
          // Converter string para array
          necessidadesValue = JSON.stringify([necessidadesValue]);
        } else {
          // Converter para array
          necessidadesValue = JSON.stringify([String(necessidadesValue)]);
        }
        
        await client.query(
          `UPDATE radiografias SET necessidades = $1::text WHERE id = $2`,
          [necessidadesValue, row.id]
        );
      }
    }

    console.log('✅ Dados convertidos');

    // Alterar tipo das colunas
    console.log('\n🔄 Alterando tipo das colunas para JSONB...');
    
    // Alterar achados_radiograficos
    try {
      await client.query(`
        ALTER TABLE radiografias
        ALTER COLUMN achados_radiograficos TYPE jsonb USING 
          CASE 
            WHEN achados_radiograficos IS NULL THEN NULL
            ELSE achados_radiograficos::jsonb
          END
      `);
      console.log('✅ Coluna achados_radiograficos alterada para JSONB');
    } catch (error) {
      console.error('❌ Erro ao alterar achados_radiograficos:', error.message);
      throw error;
    }

    // Alterar necessidades
    try {
      await client.query(`
        ALTER TABLE radiografias
        ALTER COLUMN necessidades TYPE jsonb USING 
          CASE 
            WHEN necessidades IS NULL THEN NULL
            ELSE necessidades::jsonb
          END
      `);
      console.log('✅ Coluna necessidades alterada para JSONB');
    } catch (error) {
      console.error('❌ Erro ao alterar necessidades:', error.message);
      throw error;
    }

    console.log('\n✅ Migração concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar migração:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
