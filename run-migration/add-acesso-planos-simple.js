const { Client } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env.local') });
require('dotenv').config();

async function addAcessoColumn() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nodondb',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('Conectando ao banco...');
    await client.connect();
    console.log('Conectado!');

    // Verificar se existe
    const exists = await client.query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'planos' AND column_name = 'acesso'
    `);

    if (exists.rows.length === 0) {
      console.log('Adicionando coluna acesso...');
      await client.query(`ALTER TABLE planos ADD COLUMN acesso VARCHAR(255) DEFAULT 'all'`);
      await client.query(`UPDATE planos SET acesso = 'all' WHERE acesso IS NULL`);
      console.log('Coluna acesso adicionada!');
    } else {
      console.log('Coluna acesso já existe!');
    }

    await client.end();
    console.log('Pronto!');
  } catch (error) {
    console.error('Erro:', error.message);
    process.exit(1);
  }
}

addAcessoColumn();
