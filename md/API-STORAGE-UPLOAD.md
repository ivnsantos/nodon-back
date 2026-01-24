# API - Upload de Imagens (Cloudflare R2)

## Endpoints

### 1. Upload de Logo

**POST** `/api/storage/upload/logo`

Faz upload de um logo para o Cloudflare R2.

### 2. Upload de Imagem Genérica

**POST** `/api/storage/upload/image`

Faz upload de uma imagem genérica para o Cloudflare R2.

## Autenticação

Requer autenticação JWT.

## Headers

```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

## Body

Form-data com campo `file` contendo a imagem.

## Validações

- Arquivo deve ser uma imagem (tipo MIME: `image/*`)
- Tamanho máximo: 5MB
- Formatos aceitos: PNG, JPG, JPEG, GIF, WebP, etc.

## Resposta de Sucesso

**Status:** 200 OK

```json
{
  "message": "Logo enviado com sucesso",
  "url": "https://pub-f6373861b23346918a681332b65f9a68.r2.dev/logos/2024/01/uuid.png",
  "path": "logos/2024/01/uuid.png"
}
```

## Erros

### 400 Bad Request
- "Nenhum arquivo foi enviado" - Campo `file` não foi enviado
- "O arquivo deve ser uma imagem" - Arquivo não é uma imagem
- "O arquivo deve ter no máximo 5MB" - Arquivo excede o tamanho máximo

### 401 Unauthorized
Token JWT inválido ou ausente.

### 500 Internal Server Error
- "Serviço de armazenamento não configurado" - Variáveis de ambiente do R2 não configuradas
- "Erro de configuração do servidor de armazenamento" - Erro de configuração do bucket
- "Sem permissão para fazer upload" - Erro de permissões
- "Erro de conexão com o servidor" - Erro de rede

## Exemplo CURL - Upload de Logo

```bash
curl -X POST https://api.exemplo.com/api/storage/upload/logo \
  -H "Authorization: Bearer seu-token-jwt" \
  -F "file=@/caminho/para/logo.png"
```

## Exemplo CURL - Upload de Imagem

```bash
curl -X POST https://api.exemplo.com/api/storage/upload/image \
  -H "Authorization: Bearer seu-token-jwt" \
  -F "file=@/caminho/para/imagem.jpg"
```

## Exemplo JavaScript (Fetch)

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('https://api.exemplo.com/api/storage/upload/logo', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const data = await response.json();
console.log('URL da imagem:', data.url);
```

## Estrutura de Pastas no R2

As imagens são organizadas por tipo e data:

- **Logos**: `logos/YYYY/MM/uuid.ext`
- **Imagens**: `images/YYYY/MM/uuid.ext`

Exemplo:
- `logos/2024/01/550e8400-e29b-41d4-a716-446655440000.png`
- `images/2024/01/550e8400-e29b-41d4-a716-446655440000.jpg`

## Variáveis de Ambiente Necessárias

Adicione ao seu arquivo `.env`:

```env
R2_ACCOUNT_ID=016184c3fec4e160e9b38a985a7fc4db
R2_ACCESS_KEY_ID=0cc461c690364ea512d5151cb4e41f38
R2_SECRET_ACCESS_KEY=5c456726242aee7b5ae71cf547e048ce89c6111ce636f6303df083876011cd6b
R2_BUCKET_NAME=hml
R2_PUBLIC_DOMAIN=https://pub-f6373861b23346918a681332b65f9a68.r2.dev
```

## Integração com ClienteMaster

Após fazer upload do logo, use a URL retornada na API de atualização de dados:

```bash
# 1. Upload do logo
curl -X POST https://api.exemplo.com/api/storage/upload/logo \
  -H "Authorization: Bearer token" \
  -F "file=@logo.png"

# Resposta: { "url": "https://..." }

# 2. Atualizar ClienteMaster com a URL do logo
curl -X POST https://api.exemplo.com/api/clientes-master/meus-dados \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{
    "logo": "https://pub-f6373861b23346918a681332b65f9a68.r2.dev/logos/2024/01/uuid.png"
  }'
```

