// Script consolidado para corrigir o schema do banco de dados
// 1. Adiciona colunas OAuth faltantes (google_id, facebook_id, foto)
// 2. Corrige valores nulos em valor_original da tabela planos
const { Client } = require('pg');
require('dotenv').config();

async function fixDatabaseSchema() {
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

    // ============================================
    // PARTE 1: Adicionar colunas OAuth
    // ============================================
    console.log('\n📝 PARTE 1: Adicionando colunas OAuth...');

    // Adicionar coluna google_id
    console.log('  - Adicionando coluna google_id...');
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id_unique 
      ON users(google_id) WHERE google_id IS NOT NULL;
    `);
    console.log('  ✅ google_id adicionada!');

    // Adicionar coluna facebook_id
    console.log('  - Adicionando coluna facebook_id...');
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS facebook_id VARCHAR(255);
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_facebook_id_unique 
      ON users(facebook_id) WHERE facebook_id IS NOT NULL;
    `);
    console.log('  ✅ facebook_id adicionada!');

    // Adicionar coluna foto
    console.log('  - Adicionando coluna foto...');
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS foto VARCHAR(500);
    `);
    console.log('  ✅ foto adicionada!');

    // Tornar password nullable
    console.log('  - Tornando coluna password nullable...');
    await client.query(`
      ALTER TABLE users 
      ALTER COLUMN password DROP NOT NULL;
    `).catch(err => {
      if (err.message.includes('does not exist') || err.message.includes('column "password" is not null')) {
        console.log('  ⚠️ Coluna password já é nullable ou não existe');
      } else {
        throw err;
      }
    });
    console.log('  ✅ password atualizada!');

    // ============================================
    // PARTE 2: Corrigir valores nulos em planos
    // ============================================
    console.log('\n📝 PARTE 2: Corrigindo valores nulos em planos...');

    // Verificar registros com valor_original nulo
    const nullRecords = await client.query(`
      SELECT id, nome, valor_original, valor_promocional
      FROM planos
      WHERE valor_original IS NULL;
    `);

    if (nullRecords.rows.length === 0) {
      console.log('  ✅ Nenhum registro com valor_original nulo encontrado!');
    } else {
      console.log(`  ⚠️ Encontrados ${nullRecords.rows.length} registros com valor_original nulo`);
      
      // Atualizar registros nulos
      await client.query(`
        UPDATE planos
        SET valor_original = COALESCE(valor_promocional, 0)
        WHERE valor_original IS NULL;
      `);
      console.log(`  ✅ ${nullRecords.rows.length} registros atualizados!`);
    }

    // Tornar a coluna NOT NULL se ainda não for
    const columnInfo = await client.query(`
      SELECT is_nullable
      FROM information_schema.columns
      WHERE table_name = 'planos'
      AND column_name = 'valor_original';
    `);

    if (columnInfo.rows.length > 0 && columnInfo.rows[0].is_nullable === 'YES') {
      console.log('  - Tornando coluna valor_original NOT NULL...');
      await client.query(`
        ALTER TABLE planos
        ALTER COLUMN valor_original SET NOT NULL;
      `);
      console.log('  ✅ Coluna valor_original agora é NOT NULL!');
    } else {
      console.log('  ✅ Coluna valor_original já é NOT NULL!');
    }

    // ============================================
    // Verificação final
    // ============================================
    console.log('\n🔍 Verificação final...');

    // Verificar colunas OAuth
    const oauthColumns = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('google_id', 'facebook_id', 'foto')
      ORDER BY column_name;
    `);
    console.log(`  ✅ Colunas OAuth: ${oauthColumns.rows.length}/3 encontradas`);

    // Verificar planos
    const planosNull = await client.query(`
      SELECT COUNT(*) as count
      FROM planos
      WHERE valor_original IS NULL;
    `);
    console.log(`  ✅ Planos com valor_original nulo: ${planosNull.rows[0].count}`);

    console.log('\n✅ Todas as correções foram aplicadas com sucesso!');
    console.log('\n💡 Agora você pode reiniciar a aplicação.');

  } catch (error) {
    console.error('❌ Erro ao executar correções:', error.message);
    console.error('Detalhes:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Conexão encerrada.');
  }
}

fixDatabaseSchema();

