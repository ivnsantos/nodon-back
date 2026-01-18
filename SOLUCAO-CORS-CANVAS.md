# Solução para Erro de Canvas "Tainted" no Desenho Profissional

## Problema

O erro `SecurityError: Failed to execute 'toDataURL' on 'HTMLCanvasElement': Tainted canvases may not be exported` ocorre quando:

1. Uma imagem é carregada de um domínio diferente (cross-origin) no canvas
2. O servidor não envia headers CORS apropriados
3. O navegador bloqueia a exportação do canvas por segurança

## Solução 1: Configurar CORS no Cloudflare R2 (Recomendado)

### Passo 1: Acessar o Dashboard do Cloudflare R2

1. Acesse: https://dash.cloudflare.com/
2. Vá em **R2** → Selecione seu bucket
3. Vá em **Settings** → **CORS Policy**

### Passo 2: Configurar CORS Policy

Adicione a seguinte configuração CORS:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

**Para produção, substitua `"*"` por domínios específicos:**

```json
[
  {
    "AllowedOrigins": [
      "https://seu-dominio.com",
      "https://www.seu-dominio.com",
      "http://localhost:3000",
      "http://localhost:5173"
    ],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

### Passo 3: Verificar Configuração

Após salvar, teste carregando uma imagem do R2 no canvas:

```javascript
const img = new Image();
img.crossOrigin = 'anonymous'; // IMPORTANTE: Adicionar este atributo
img.src = 'https://pub-xxx.r2.dev/caminho/da/imagem.png';

img.onload = () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);
  
  // Agora deve funcionar sem erro
  const dataUrl = canvas.toDataURL('image/png');
  console.log('Sucesso!', dataUrl);
};
```

## Solução 2: Carregar Imagem com `crossOrigin` no Frontend

No código do frontend (`DiagnosticoDesenho.jsx`), certifique-se de que todas as imagens sejam carregadas com o atributo `crossOrigin`:

```javascript
// ❌ ERRADO - Causa erro de canvas tainted
const img = new Image();
img.src = 'https://pub-xxx.r2.dev/imagem.png';

// ✅ CORRETO - Permite exportação do canvas
const img = new Image();
img.crossOrigin = 'anonymous'; // Adicionar esta linha
img.src = 'https://pub-xxx.r2.dev/imagem.png';
```

### Exemplo Completo para Canvas

```javascript
async function loadImageToCanvas(imageUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // CRÍTICO: Adicionar crossOrigin antes de definir src
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      resolve(canvas);
    };
    
    img.onerror = (error) => {
      reject(new Error(`Erro ao carregar imagem: ${error}`));
    };
    
    img.src = imageUrl;
  });
}

// Uso
try {
  const canvas = await loadImageToCanvas('https://pub-xxx.r2.dev/imagem.png');
  const dataUrl = canvas.toDataURL('image/png');
  // Agora pode enviar para a API
} catch (error) {
  console.error('Erro:', error);
}
```

## Solução 3: Proxy através do Backend (Alternativa)

Se não for possível configurar CORS no R2, você pode criar um endpoint proxy no backend:

### Backend - Criar endpoint proxy

```typescript
// src/storage/storage.controller.ts

@Get('proxy-image')
async proxyImage(@Query('url') url: string, @Res() res: Response) {
  try {
    const response = await axios.get(url, {
      responseType: 'stream',
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
    
    res.setHeader('Content-Type', response.headers['content-type']);
    res.setHeader('Access-Control-Allow-Origin', '*');
    response.data.pipe(res);
  } catch (error) {
    throw new NotFoundException('Imagem não encontrada');
  }
}
```

### Frontend - Usar proxy

```javascript
// Em vez de usar a URL direta do R2
const r2Url = 'https://pub-xxx.r2.dev/imagem.png';

// Usar o proxy do backend
const proxyUrl = `http://localhost:5000/api/storage/proxy-image?url=${encodeURIComponent(r2Url)}`;

const img = new Image();
img.crossOrigin = 'anonymous';
img.src = proxyUrl;
```

## Solução 4: Converter Canvas para Blob e Enviar Diretamente

Em vez de usar `toDataURL()`, você pode converter o canvas para Blob e enviar diretamente:

```javascript
async function saveDrawing(canvas) {
  return new Promise((resolve, reject) => {
    // Usar toBlob em vez de toDataURL
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error('Erro ao converter canvas para blob'));
        return;
      }
      
      // Converter blob para base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result; // data:image/png;base64,...
        
        // Enviar para API
        try {
          const response = await fetch('/api/desenhos-profissionais?masterClientId=xxx', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              tituloDesenho: 'Meu Desenho',
              imagemDesenhada: {
                url: base64, // Enviar base64 diretamente
              },
              // ... outros campos
            }),
          });
          
          resolve(await response.json());
        } catch (error) {
          reject(error);
        }
      };
      
      reader.readAsDataURL(blob);
    }, 'image/png', 0.95);
  });
}
```

## Checklist de Verificação

- [ ] CORS configurado no bucket do Cloudflare R2
- [ ] Imagens carregadas com `img.crossOrigin = 'anonymous'`
- [ ] Testar em ambiente de desenvolvimento
- [ ] Testar em ambiente de produção
- [ ] Verificar console do navegador para erros CORS

## Teste Rápido

Execute no console do navegador:

```javascript
const img = new Image();
img.crossOrigin = 'anonymous';
img.onload = () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);
  console.log('Canvas exportado:', canvas.toDataURL().substring(0, 50));
};
img.src = 'https://pub-f6373861b23346918a681332b65f9a68.r2.dev/SUA_IMAGEM.png';
```

Se não houver erro, o CORS está configurado corretamente!
