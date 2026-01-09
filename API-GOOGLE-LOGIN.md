# API de Login com Google OAuth

## Configuração

### Variáveis de Ambiente

Adicione as seguintes variáveis de ambiente no seu arquivo `.env`:

```env
# Google OAuth
GOOGLE_CLIENT_ID=seu-client-id-do-google
GOOGLE_CLIENT_SECRET=seu-client-secret-do-google
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Frontend URL (para redirecionamento após login)
FRONTEND_URL=http://localhost:3000
```

### Como obter as credenciais do Google

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Vá em **APIs & Services** > **Credentials**
4. Clique em **Create Credentials** > **OAuth client ID**
5. Selecione **Web application**
6. Adicione as URLs de redirecionamento autorizadas:
   - `http://localhost:5000/api/auth/google/callback` (desenvolvimento)
   - `https://seu-dominio.com/api/auth/google/callback` (produção)
7. Copie o **Client ID** e **Client Secret**

### Migração do Banco de Dados

Execute o arquivo `add-google-id-column.sql` para adicionar a coluna `google_id` na tabela `users`:

```bash
psql -U seu_usuario -d seu_banco -f add-google-id-column.sql
```

---

## Endpoints

### 1. GET /auth/google

**Descrição:** Inicia o fluxo de autenticação OAuth com o Google.

**Endpoint:** `GET /api/auth/google`

**Autenticação:** Não requerida

**Comportamento:**
- Redireciona o usuário para a página de login do Google
- Após autenticação bem-sucedida, o Google redireciona para `/api/auth/google/callback`

---

### 2. GET /auth/google/callback

**Descrição:** Callback do Google OAuth. Processa a autenticação e redireciona para o frontend.

**Endpoint:** `GET /api/auth/google/callback`

**Autenticação:** Não requerida (usado pelo Google)

**Comportamento:**
- Recebe os dados do usuário autenticado do Google
- Cria ou atualiza o usuário no banco de dados
- Gera um token JWT
- Redireciona para: `{FRONTEND_URL}/auth/google/callback?token={access_token}`

---

### 3. POST /auth/google/token

**Descrição:** Login com Google usando dados já obtidos pelo frontend (ex: Google Sign-In SDK).

**Endpoint:** `POST /api/auth/google/token`

**Autenticação:** Não requerida

**Body:**
```json
{
  "googleId": "string (obrigatório)",
  "email": "string (obrigatório)",
  "nome": "string (obrigatório)",
  "foto": "string (opcional)"
}
```

**Resposta de Sucesso (200 OK):**

### Usuário novo ou existente:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nome": "João Silva",
    "email": "joao@gmail.com",
    "tipo": "master",
    "isAdmin": true,
    "isEmailVerified": true,
    "assinatura": null
  }
}
```

### Usuário com assinatura ativa:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nome": "João Silva",
    "email": "joao@gmail.com",
    "tipo": "master",
    "isAdmin": true,
    "isEmailVerified": true,
    "assinatura": {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "status": "ACTIVE",
      "planoId": "770e8400-e29b-41d4-a716-446655440000",
      "plano": {
        "id": "770e8400-e29b-41d4-a716-446655440000",
        "nome": "Plano Premium",
        "valorOriginal": 299,
        "valorPromocional": null,
        "limiteAnalises": 50,
        "tokenChat": 1500000,
        "descricao": "Até 50 análises por mês"
      }
    }
  }
}
```

**Resposta de Erro (400 Bad Request):**
```json
{
  "statusCode": 400,
  "message": "googleId, email e nome são obrigatórios",
  "error": "Bad Request"
}
```

---

## Fluxo de Autenticação

### Opção 1: Fluxo OAuth Tradicional (Redirecionamento)

```
1. Frontend → GET /api/auth/google
2. Backend → Redireciona para Google
3. Usuário → Faz login no Google
4. Google → Redireciona para /api/auth/google/callback
5. Backend → Processa login e redireciona para frontend com token
6. Frontend → Recebe token e armazena
```

### Opção 2: Google Sign-In no Frontend

```
1. Frontend → Usa Google Sign-In SDK
2. Frontend → Obtém dados do usuário (googleId, email, nome)
3. Frontend → POST /api/auth/google/token
4. Backend → Retorna access_token
5. Frontend → Armazena token
```

---

## Comportamento do Login

1. **Usuário novo:**
   - Cria um novo `UserBase` com o email do Google
   - Cria um novo `ClienteMaster` associado
   - O usuário já nasce com `isVerified: true`
   - Não requer senha (campo `password` é nullable)

2. **Usuário existente com mesmo email:**
   - Vincula a conta Google ao usuário existente
   - Adiciona o `googleId` ao registro

3. **Usuário existente com mesmo googleId:**
   - Faz login normalmente
   - Retorna as informações atualizadas

---

## Exemplo de Implementação no Frontend (React)

### Opção 1: Redirecionamento

```typescript
// Componente de botão de login
const GoogleLoginButton = () => {
  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  return (
    <button onClick={handleGoogleLogin}>
      Entrar com Google
    </button>
  );
};

// Página de callback
const GoogleCallback = () => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    if (token) {
      localStorage.setItem('access_token', token);
      window.location.href = '/dashboard';
    }
  }, []);

  return <div>Processando login...</div>;
};
```

### Opção 2: Google Sign-In SDK

```typescript
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

const GoogleLoginButton = () => {
  const handleSuccess = async (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    
    const response = await fetch('http://localhost:5000/api/auth/google/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        googleId: decoded.sub,
        email: decoded.email,
        nome: decoded.name,
        foto: decoded.picture,
      }),
    });

    const data = await response.json();
    localStorage.setItem('access_token', data.access_token);
  };

  return (
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={() => console.log('Erro no login')}
    />
  );
};
```

---

## Notas de Segurança

1. **Validação do Token Google:** Para produção, considere validar o token do Google no backend usando a biblioteca `google-auth-library`.

2. **HTTPS:** Sempre use HTTPS em produção para proteger os tokens.

3. **Variáveis de Ambiente:** Nunca commite as credenciais do Google no código.

