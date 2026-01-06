# API - Atualizar Dados do Cliente Master

## Endpoint

**POST** `/api/clientes-master/meus-dados`

Atualiza os dados da empresa do Cliente Master autenticado. **Suporta upload de logo que será automaticamente enviado para o Cloudflare R2.**

## Autenticação

Requer autenticação JWT. Apenas Clientes Master podem atualizar seus próprios dados.

## Headers

```
Authorization: Bearer {token}
Content-Type: multipart/form-data (com arquivo) ou application/json (sem arquivo)
```

## Body

### Opção 1: Com upload de logo (multipart/form-data)

Todos os campos são opcionais. Se enviar o campo `file`, a imagem será automaticamente enviada para o R2 e a URL será salva no campo `logo`. **Se enviar tanto `file` quanto `logo`, o `file` terá prioridade.**

```
file: [arquivo de imagem]
nomeEmpresa: "Nome da Empresa"
cnpj: "12.345.678/0001-90"
cor: "#FF5733"
telefoneEmpresa: "(11) 98765-4321"
site: "https://www.empresa.com.br"
descricao: "Descrição da empresa/clínica"
outrasInformacoes: "Informações adicionais"
```

### Opção 2: Com URL direta do logo (multipart/form-data ou application/json)

Você pode enviar a URL do logo diretamente no campo `logo`, sem fazer upload:

**multipart/form-data:**
```
logo: "https://exemplo.com/logo.png"
nomeEmpresa: "Nome da Empresa"
cnpj: "12.345.678/0001-90"
cor: "#FF5733"
```

**application/json:**
```json
{
  "nomeEmpresa": "Nome da Empresa",
  "cnpj": "12.345.678/0001-90",
  "documento": "123.456.789-00",
  "logo": "https://exemplo.com/logo.png",
  "cor": "#FF5733",
  "telefoneEmpresa": "(11) 98765-4321",
  "site": "https://www.empresa.com.br",
  "descricao": "Descrição da empresa/clínica",
  "outrasInformacoes": "Informações adicionais"
}
```

**Nota:** Você pode usar `cnpj` ou `documento` (que aceita CPF ou CNPJ). Se ambos forem fornecidos, `cnpj` terá prioridade.

## Campos

- `file` (arquivo, opcional): Arquivo de imagem para logo. Se enviado, será automaticamente enviado para R2 e a URL será salva em `logo`. **Se enviar tanto `file` quanto `logo`, o `file` terá prioridade.**
- `nomeEmpresa` (string, opcional): Nome da empresa/clínica (máx. 255 caracteres)
- `cnpj` (string, opcional): CNPJ da empresa (máx. 18 caracteres)
- `documento` (string, opcional): CPF ou CNPJ (alias para `cnpj`, máx. 18 caracteres). Se fornecido, será salvo no campo `cnpj`
- `logo` (string, opcional): URL do logo. Pode ser enviado diretamente (URL já existente) ou será preenchido automaticamente se `file` for enviado (máx. 500 caracteres)
- `cor` (string, opcional): Cor principal da empresa em hexadecimal ou nome (máx. 50 caracteres)
- `telefoneEmpresa` (string, opcional): Telefone da empresa (máx. 255 caracteres)
- `site` (string, opcional): Site da empresa (máx. 500 caracteres)
- `descricao` (string, opcional): Descrição da empresa
- `outrasInformacoes` (string, opcional): Outras informações da empresa (JSON ou texto)

## Validações do Upload de Logo

- **Tipo de arquivo**: Deve ser uma imagem (tipo MIME: `image/*`)
- **Tamanho máximo**: 5MB
- **Formatos aceitos**: PNG, JPG, JPEG, GIF, WebP, etc.

## Resposta de Sucesso

**Status:** 200 OK

```json
{
  "message": "Dados da empresa atualizados com sucesso",
  "clienteMaster": {
    "id": "uuid-do-cliente-master",
    "nomeEmpresa": "Nome da Empresa",
    "cnpj": "12.345.678/0001-90",
    "logo": "https://pub-f6373861b23346918a681332b65f9a68.r2.dev/logos/2024/01/uuid.png",
    "cor": "#FF5733",
    "telefoneEmpresa": "(11) 98765-4321",
    "site": "https://www.empresa.com.br",
    "descricao": "Descrição da empresa/clínica",
    "outrasInformacoes": "Informações adicionais",
    "ativo": true
  }
}
```

## Erros

### 401 Unauthorized
Token JWT inválido ou ausente.

### 404 Not Found
- "Apenas Clientes Master podem atualizar dados da empresa" - Usuário comum tentou acessar
- "Cliente Master não encontrado" - Cliente Master não existe

### 400 Bad Request
- Dados inválidos (validação do DTO)
- "Erro ao fazer upload da imagem: {mensagem}" - Erro ao fazer upload para R2
- "O arquivo deve ser uma imagem" - Arquivo não é uma imagem
- "O arquivo deve ter no máximo 5MB" - Arquivo excede o tamanho máximo

### 500 Internal Server Error
Erro interno do servidor.

## Exemplos CURL

### Exemplo 1: Com upload de logo

```bash
curl -X POST http://localhost:5000/api/clientes-master/meus-dados \
  -H "Authorization: Bearer seu-token-jwt" \
  -F "file=@/caminho/para/logo.png" \
  -F "nomeEmpresa=Clínica Odontológica Exemplo" \
  -F "cnpj=12.345.678/0001-90" \
  -F "cor=#00A8FF" \
  -F "telefoneEmpresa=(11) 98765-4321" \
  -F "site=https://www.clinicaexemplo.com.br" \
  -F "descricao=Clínica especializada em odontologia estética" \
  -F "outrasInformacoes={\"especialidades\": [\"implantes\", \"ortodontia\"]}"
```

### Exemplo 2: Com URL direta do logo (sem upload)

```bash
curl -X POST http://localhost:5000/api/clientes-master/meus-dados \
  -H "Authorization: Bearer seu-token-jwt" \
  -H "Content-Type: application/json" \
  -d '{
    "nomeEmpresa": "Clínica Odontológica Exemplo",
    "cnpj": "12.345.678/0001-90",
    "logo": "https://exemplo.com/logo.png",
    "cor": "#00A8FF",
    "telefoneEmpresa": "(11) 98765-4321",
    "site": "https://www.clinicaexemplo.com.br",
    "descricao": "Clínica especializada em odontologia estética",
    "outrasInformacoes": "{\"especialidades\": [\"implantes\", \"ortodontia\"]}"
  }'
```

### Exemplo 3: Apenas atualizar dados (sem logo)

```bash
curl -X POST http://localhost:5000/api/clientes-master/meus-dados \
  -H "Authorization: Bearer seu-token-jwt" \
  -H "Content-Type: application/json" \
  -d '{
    "nomeEmpresa": "Clínica Odontológica Exemplo",
    "cnpj": "12.345.678/0001-90",
    "cor": "#00A8FF"
  }'
```

### Exemplo 4: Apenas upload de logo (sem outros campos)

```bash
curl -X POST http://localhost:5000/api/clientes-master/meus-dados \
  -H "Authorization: Bearer seu-token-jwt" \
  -F "file=@/caminho/para/logo.png"
```

### Exemplo 5: URL do logo via multipart/form-data

```bash
curl -X POST http://localhost:5000/api/clientes-master/meus-dados \
  -H "Authorization: Bearer seu-token-jwt" \
  -F "logo=https://exemplo.com/logo.png" \
  -F "nomeEmpresa=Minha Clínica" \
  -F "cor=#FF5733"
```

## Fluxo de Upload de Logo

1. O arquivo é recebido via `multipart/form-data` no campo `file`
2. O sistema valida se é uma imagem e se o tamanho é válido (máx. 5MB)
3. Um caminho único é gerado: `logos/YYYY/MM/uuid.ext`
4. O arquivo é enviado para o Cloudflare R2
5. A URL pública retornada do R2 é automaticamente salva no campo `logo` do ClienteMaster
6. Os dados são atualizados no banco de dados
7. Retorna status 200 com os dados atualizados

## Notas

- Apenas o Cliente Master autenticado pode atualizar seus próprios dados
- Todos os campos são opcionais - apenas os campos enviados serão atualizados
- O endpoint identifica automaticamente qual Cliente Master está fazendo a requisição através do token JWT
- **Upload de arquivo vs URL direta:**
  - Se enviar o campo `file`, a imagem será enviada para R2 e a URL será salva em `logo` (o campo `logo` no body será ignorado)
  - Se não enviar `file`, pode enviar `logo` diretamente com uma URL já existente
  - Se enviar tanto `file` quanto `logo`, o `file` terá prioridade e o `logo` será sobrescrito pela URL do R2
