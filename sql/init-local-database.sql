-- Script para inicializar banco de dados local
-- Execute este script após criar o banco de dados PostgreSQL

-- ============================================
-- 1. TABELAS BASE DE USUÁRIOS
-- ============================================

-- Tabela users (entidade base)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  cpf VARCHAR(255) NULL,
  telefone VARCHAR(255) NULL,
  cro VARCHAR(255) NULL,
  postal_code VARCHAR(255) NULL,
  address VARCHAR(255) NULL,
  address_number VARCHAR(255) NULL,
  complement VARCHAR(255) NULL,
  province VARCHAR(255) NULL,
  city VARCHAR(255) NULL,
  state VARCHAR(255) NULL,
  is_verified BOOLEAN DEFAULT false,
  verification_token VARCHAR(255) NULL,
  token_expires_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela clientes_master
CREATE TABLE IF NOT EXISTS clientes_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  nome_empresa VARCHAR(255) NOT NULL DEFAULT 'Empresa',
  cnpj VARCHAR(255) NULL,
  logo VARCHAR(500) NULL,
  cor VARCHAR(50) NULL,
  telefone_empresa VARCHAR(255) NULL,
  site VARCHAR(500) NULL,
  descricao TEXT NULL,
  outras_informacoes TEXT NULL,
  hash VARCHAR(36) UNIQUE NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_clientes_master_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela usuarios (usuários comuns)
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  cliente_master_id UUID NOT NULL,
  ativo BOOLEAN DEFAULT true,
  status VARCHAR(20) DEFAULT 'ativo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_usuarios_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_usuarios_cliente_master_id FOREIGN KEY (cliente_master_id) REFERENCES clientes_master(id) ON DELETE CASCADE
);

-- ============================================
-- 2. TABELAS DE PLANOS E ASSINATURAS
-- ============================================

-- Tabela planos
CREATE TABLE IF NOT EXISTS planos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  valor_original DECIMAL(10, 2) NOT NULL,
  valor_promocional DECIMAL(10, 2) NULL,
  limite_analises INTEGER NOT NULL,
  token_chat BIGINT DEFAULT 1500000,
  ativo BOOLEAN DEFAULT true,
  descricao TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela coupons
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  campaign_name VARCHAR(255) NOT NULL,
  discount_value DECIMAL(10, 2) NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  asaas_customer_id VARCHAR(255) NULL,
  asaas_subscription_id VARCHAR(255) NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  cpf VARCHAR(255) NOT NULL,
  phone VARCHAR(255) NULL,
  postal_code VARCHAR(255) NULL,
  address VARCHAR(255) NULL,
  address_number VARCHAR(255) NULL,
  complement VARCHAR(255) NULL,
  province VARCHAR(255) NULL,
  city VARCHAR(255) NULL,
  state VARCHAR(255) NULL,
  value DECIMAL(10, 2) NOT NULL,
  billing_type VARCHAR(255) NULL,
  credit_card_token VARCHAR(255) NULL,
  status VARCHAR(255) NULL,
  asaas_response TEXT NULL,
  admin_id VARCHAR(255) NULL,
  credit_card_number VARCHAR(255) NULL,
  credit_card_brand VARCHAR(255) NULL,
  coupon_id UUID NULL,
  plano_id UUID NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_subscriptions_user_id FOREIGN KEY (user_id) REFERENCES clientes_master(id) ON DELETE CASCADE,
  CONSTRAINT fk_subscriptions_coupon_id FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL,
  CONSTRAINT fk_subscriptions_plano_id FOREIGN KEY (plano_id) REFERENCES planos(id) ON DELETE SET NULL
);

-- ============================================
-- 3. TABELAS DE ANÁLISES E HISTÓRICO
-- ============================================

-- Tabela historico_mensal
CREATE TABLE IF NOT EXISTS historico_mensal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_master_id UUID NOT NULL,
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  tokens_utilizados BIGINT DEFAULT 0,
  analises_feitas INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_historico_mensal_cliente_master FOREIGN KEY (cliente_master_id) REFERENCES clientes_master(id) ON DELETE CASCADE,
  UNIQUE(cliente_master_id, ano, mes)
);

-- ============================================
-- 4. TABELAS DE PACIENTES
-- ============================================

-- Tabela pacientes
CREATE TABLE IF NOT EXISTS pacientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_master_id UUID NOT NULL,
  nome VARCHAR(255) NULL,
  cpf VARCHAR(14) NULL,
  data_nascimento DATE NULL,
  email VARCHAR(255) NULL,
  telefone VARCHAR(20) NULL,
  status VARCHAR(20) NULL,
  cep VARCHAR(10) NULL,
  rua VARCHAR(255) NULL,
  numero VARCHAR(20) NULL,
  complemento VARCHAR(255) NULL,
  bairro VARCHAR(255) NULL,
  cidade VARCHAR(255) NULL,
  estado VARCHAR(2) NULL,
  necessidades JSONB NULL,
  observacoes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_paciente_master_client FOREIGN KEY (cliente_master_id) REFERENCES clientes_master(id) ON DELETE CASCADE
);

-- Tabela historico_pacientes
CREATE TABLE IF NOT EXISTS historico_pacientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL,
  user_id UUID NULL,
  cliente_master_id UUID NULL,
  campo_alterado VARCHAR(100) NOT NULL,
  valor_anterior TEXT NULL,
  valor_novo TEXT NULL,
  descricao_alteracao TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_historico_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
  CONSTRAINT fk_historico_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_historico_cliente_master FOREIGN KEY (cliente_master_id) REFERENCES clientes_master(id) ON DELETE SET NULL
);

-- ============================================
-- 5. TABELAS DE RADIOGRAFIAS E DESENHOS
-- ============================================

-- Tabela radiografias
CREATE TABLE IF NOT EXISTS radiografias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_master_id UUID NOT NULL,
  nome_paciente VARCHAR(255) NOT NULL,
  email_paciente VARCHAR(255) NULL,
  radiografia VARCHAR(255) NULL,
  data DATE NOT NULL,
  tipo_exame VARCHAR(255) NULL,
  tratamento TEXT NULL,
  imagens JSONB NOT NULL,
  descricao_exame TEXT NULL,
  achados_radiograficos JSONB NULL,
  necessidades JSONB NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_radiografia_master_client FOREIGN KEY (cliente_master_id) REFERENCES clientes_master(id) ON DELETE CASCADE
);

-- Tabela desenhos_profissionais
CREATE TABLE IF NOT EXISTS desenhos_profissionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_master_id UUID NOT NULL,
  radiografia_id UUID NULL,
  titulo_desenho VARCHAR(255) NOT NULL,
  imagem_desenhada JSONB NOT NULL,
  dentes_anotacoes JSONB NOT NULL,
  necessidades JSONB NOT NULL,
  observacoes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_desenho_profissional_master_client FOREIGN KEY (cliente_master_id) REFERENCES clientes_master(id) ON DELETE CASCADE,
  CONSTRAINT fk_desenho_profissional_radiografia FOREIGN KEY (radiografia_id) REFERENCES radiografias(id) ON DELETE SET NULL
);

-- ============================================
-- 6. ÍNDICES PARA PERFORMANCE
-- ============================================

-- Índices para users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_cpf ON users(cpf);
CREATE INDEX IF NOT EXISTS idx_users_cro ON users(cro);

-- Índices para clientes_master
CREATE INDEX IF NOT EXISTS idx_clientes_master_user_id ON clientes_master(user_id);
CREATE INDEX IF NOT EXISTS idx_clientes_master_cnpj ON clientes_master(cnpj);
CREATE INDEX IF NOT EXISTS idx_clientes_master_hash ON clientes_master(hash);

-- Índices para usuarios
CREATE INDEX IF NOT EXISTS idx_usuarios_user_id ON usuarios(user_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_cliente_master_id ON usuarios(cliente_master_id);

-- Índices para subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plano_id ON subscriptions(plano_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_coupon_id ON subscriptions(coupon_id);

-- Índices para historico_mensal
CREATE INDEX IF NOT EXISTS idx_historico_mensal_cliente_master_id ON historico_mensal(cliente_master_id);
CREATE INDEX IF NOT EXISTS idx_historico_mensal_ano_mes ON historico_mensal(ano, mes);

-- Índices para pacientes
CREATE INDEX IF NOT EXISTS idx_pacientes_cliente_master_id ON pacientes(cliente_master_id);
CREATE INDEX IF NOT EXISTS idx_pacientes_cpf ON pacientes(cpf);
CREATE INDEX IF NOT EXISTS idx_pacientes_status ON pacientes(status);

-- Índices para historico_pacientes
CREATE INDEX IF NOT EXISTS idx_historico_paciente_id ON historico_pacientes(paciente_id);
CREATE INDEX IF NOT EXISTS idx_historico_user_id ON historico_pacientes(user_id);
CREATE INDEX IF NOT EXISTS idx_historico_cliente_master_id ON historico_pacientes(cliente_master_id);
CREATE INDEX IF NOT EXISTS idx_historico_created_at ON historico_pacientes(created_at DESC);

-- Índices para radiografias
CREATE INDEX IF NOT EXISTS idx_radiografias_cliente_master_id ON radiografias(cliente_master_id);
CREATE INDEX IF NOT EXISTS idx_radiografias_data ON radiografias(data DESC);
CREATE INDEX IF NOT EXISTS idx_radiografias_nome_paciente ON radiografias(nome_paciente);

-- Índices para desenhos_profissionais
CREATE INDEX IF NOT EXISTS idx_desenhos_profissionais_cliente_master_id ON desenhos_profissionais(cliente_master_id);
CREATE INDEX IF NOT EXISTS idx_desenhos_profissionais_radiografia_id ON desenhos_profissionais(radiografia_id);
CREATE INDEX IF NOT EXISTS idx_desenhos_profissionais_created_at ON desenhos_profissionais(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_desenhos_profissionais_titulo_desenho ON desenhos_profissionais(titulo_desenho);

-- ============================================
-- 7. DADOS INICIAIS (OPCIONAL)
-- ============================================

-- Inserir planos padrão (opcional)
INSERT INTO planos (id, nome, valor_original, limite_analises, token_chat, ativo, descricao)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Plano Básico', 99.00, 10, 500000, true, 'Plano básico com 10 análises por mês'),
  ('00000000-0000-0000-0000-000000000002', 'Plano Intermediário', 179.00, 30, 1500000, true, 'Plano intermediário com 30 análises por mês'),
  ('00000000-0000-0000-0000-000000000003', 'Plano Avançado', 299.00, 100, 5000000, true, 'Plano avançado com 100 análises por mês')
ON CONFLICT DO NOTHING;

-- ============================================
-- FIM DO SCRIPT
-- ============================================
