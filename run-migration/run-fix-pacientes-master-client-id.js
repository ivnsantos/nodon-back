const { readFileSync } = require('fs');
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
    console.log('🔌 Conectando ao banco de dados...');
    await client.connect();
    console.log('✅ Conectado com sucesso!');

    // Verificar se a coluna existe
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'pacientes' AND column_name = 'cliente_master_id'
    `);
    
    if (columnCheck.rows.length === 0) {
      console.log('📝 Coluna cliente_master_id não existe. Criando...');
      
      // Verificar se há algum cliente master para usar como padrão
      const clientMasterCheck = await client.query('SELECT id FROM clientes_master LIMIT 1');
      
      if (clientMasterCheck.rows.length === 0) {
        console.error('❌ Não há clientes master no banco. Crie um cliente master primeiro!');
        process.exit(1);
      }
      
      const defaultclienteMasterId = clientMasterCheck.rows[0].id;
      console.log(`📋 Usando cliente master padrão: ${defaultclienteMasterId}`);
      
      // Adicionar coluna como nullable primeiro
      await client.query(`
        ALTER TABLE pacientes 
        ADD COLUMN cliente_master_id UUID NULL
      `);
      
      console.log('✅ Coluna cliente_master_id criada (nullable)');
      
      // Atribuir valor padrão aos registros existentes
      const updateResult = await client.query(`
        UPDATE pacientes 
        SET cliente_master_id = $1 
        WHERE cliente_master_id IS NULL
      `, [defaultclienteMasterId]);
      
      console.log(`📊 ${updateResult.rowCount} paciente(s) atualizado(s) com cliente_master_id padrão`);
      
      // Agora tornar a coluna NOT NULL
      await client.query(`
        ALTER TABLE pacientes 
        ALTER COLUMN cliente_master_id SET NOT NULL
      `);
      
      // Adicionar foreign key constraint
      await client.query(`
        ALTER TABLE pacientes 
        ADD CONSTRAINT fk_paciente_master_client 
        FOREIGN KEY (cliente_master_id) 
        REFERENCES clientes_master(id) 
        ON DELETE CASCADE
      `);
      
      console.log('✅ Constraint NOT NULL e foreign key aplicadas');
    } else {
      console.log('ℹ️ Coluna cliente_master_id já existe');
      
      // Verificar se há valores NULL
      const checkResult = await client.query('SELECT COUNT(*) as count FROM pacientes WHERE cliente_master_id IS NULL');
      const nullCount = parseInt(checkResult.rows[0].count);
      
      if (nullCount > 0) {
        console.log(`⚠️ Encontrados ${nullCount} paciente(s) com cliente_master_id NULL`);
        
        // Pegar um cliente master padrão
        const clientMasterCheck = await client.query('SELECT id FROM clientes_master LIMIT 1');
        if (clientMasterCheck.rows.length > 0) {
          const defaultclienteMasterId = clientMasterCheck.rows[0].id;
          const updateResult = await client.query(`
            UPDATE pacientes 
            SET cliente_master_id = $1 
            WHERE cliente_master_id IS NULL
          `, [defaultclienteMasterId]);
          console.log(`📊 ${updateResult.rowCount} paciente(s) atualizado(s)`);
        } else {
          console.log('⚠️ Não há clientes master. Deletando pacientes sem cliente_master_id...');
          const deleteResult = await client.query('DELETE FROM pacientes WHERE cliente_master_id IS NULL');
          console.log(`🗑️ ${deleteResult.rowCount} paciente(s) deletado(s)`);
        }
      }
      
      // Garantir que a coluna é NOT NULL
      try {
        await client.query('ALTER TABLE pacientes ALTER COLUMN cliente_master_id SET NOT NULL');
        console.log('✅ Constraint NOT NULL aplicada');
      } catch (err) {
        if (err.message.includes('already has constraint') || err.message.includes('already is not null')) {
          console.log('ℹ️ Constraint NOT NULL já existe');
        } else {
          throw err;
        }
      }
    }
    
    console.log('✅ Migração executada com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar migração:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Conexão encerrada.');
  }
}

runMigration();
