// Script para corrigir valores nulos na coluna valor_original da tabela planos
const { Client } = require('pg');
require('dotenv').config();

async function fixValorOriginal() {
  // Determinar se deve usar SSL (mesma lógica do TypeORM config)
  const dbHost = process.env.DB_HOST?.trim();
  const dbSsl = process.env.DB_SSL?.trim();
  const isLocalhost = dbHost === 'localhost' || dbHost === '127.0.0.1';
  const useSsl = dbSsl === 'true' || (!isLocalhost && process.env.VERCEL);

  const client = new Client({
    host: dbHost,
    port: parseInt(process.env.DB_PORT, 10),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: useSsl ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔌 Conectando ao banco de dados...');
    await client.connect();
    console.log('✅ Conectado!');

    // Verificar registros com valor_original nulo
    console.log('\n🔍 Verificando registros com valor_original nulo...');
    const nullRecords = await client.query(`
      SELECT id, nome, valor_original, valor_promocional
      FROM planos
      WHERE valor_original IS NULL;
    `);

    if (nullRecords.rows.length === 0) {
      console.log('✅ Nenhum registro com valor_original nulo encontrado!');
    } else {
      console.log(`⚠️ Encontrados ${nullRecords.rows.length} registros com valor_original nulo:`);
      nullRecords.rows.forEach(row => {
        console.log(`  - ${row.nome}: valor_original = ${row.valor_original}, valor_promocional = ${row.valor_promocional}`);
      });

      // Atualizar registros nulos: usar valor_promocional se existir, senão usar 0
      console.log('\n📝 Corrigindo valores nulos...');
      await client.query(`
        UPDATE planos
        SET valor_original = COALESCE(valor_promocional, 0)
        WHERE valor_original IS NULL;
      `);
      console.log(`✅ ${nullRecords.rows.length} registros atualizados!`);

      // Verificar novamente
      const checkResult = await client.query(`
        SELECT COUNT(*) as count
        FROM planos
        WHERE valor_original IS NULL;
      `);
      
      if (parseInt(checkResult.rows[0].count) === 0) {
        console.log('✅ Todos os valores foram corrigidos!');
      } else {
        console.log(`⚠️ Ainda existem ${checkResult.rows[0].count} registros com valor nulo.`);
      }
    }

    // Tornar a coluna NOT NULL se ainda não for
    console.log('\n📝 Verificando constraint da coluna valor_original...');
    const columnInfo = await client.query(`
      SELECT is_nullable
      FROM information_schema.columns
      WHERE table_name = 'planos'
      AND column_name = 'valor_original';
    `);

    if (columnInfo.rows.length > 0 && columnInfo.rows[0].is_nullable === 'YES') {
      console.log('📝 Tornando coluna valor_original NOT NULL...');
      await client.query(`
        ALTER TABLE planos
        ALTER COLUMN valor_original SET NOT NULL;
      `);
      console.log('✅ Coluna valor_original agora é NOT NULL!');
    } else {
      console.log('✅ Coluna valor_original já é NOT NULL!');
    }

    console.log('\n✅ Correção concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao executar correção:', error.message);
    console.error('Detalhes:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Conexão encerrada.');
  }
}

fixValorOriginal();

