# Guia Rápido - Resolver Erro CORS no Desenho Profissional

## ⚠️ Erro Atual

```
Não foi possível exportar a imagem devido a restrições de segurança CORS.
```

## ✅ Solução Imediata - Usar Proxy do Backend

Criei um endpoint proxy no backend que resolve o problema de CORS. Use-o no frontend:

### Endpoint Criado

```
GET /api/storage/proxy-image?url={URL_DO_R2}
```

### Como Usar no Frontend

**Antes (causa erro CORS):**
```javascript
const img = new Image();
img.src = 'https://pub-xxx.r2.dev/radiografias/2024/01/imagem.png';
```

**Depois (usa proxy - funciona!):**
```javascript
const r2Url = 'https://pub-xxx.r2.dev/radiografias/2024/01/imagem.png';
const proxyUrl = `http://localhost:5000/api/storage/proxy-image?url=${encodeURIComponent(r2Url)}`;

const img = new Image();
img.crossOrigin = 'anonymous';
img.src = proxyUrl;
```

### Exemplo Completo para Canvas

```javascript
async function loadImageToCanvas(imageUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // Se a URL é do R2, usar proxy
    const r2Domain = 'https://pub-f6373861b23346918a681332b65f9a68.r2.dev';
    const finalUrl = imageUrl.startsWith(r2Domain)
      ? `http://localhost:5000/api/storage/proxy-image?url=${encodeURIComponent(imageUrl)}`
      : imageUrl;
    
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
    
    img.src = finalUrl;
  });
}

// Uso
try {
  const canvas = await loadImageToCanvas('https://pub-xxx.r2.dev/imagem.png');
  const dataUrl = canvas.toDataURL('image/png');
  // Agora funciona sem erro CORS!
} catch (error) {
  console.error('Erro:', error);
}
```

### Função Helper para Detectar e Usar Proxy

```javascript
function getImageUrlWithProxy(imageUrl) {
  const r2Domain = 'https://pub-f6373861b23346918a681332b65f9a68.r2.dev';
  const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  // Se for URL do R2, usar proxy
  if (imageUrl && imageUrl.startsWith(r2Domain)) {
    return `${apiBaseUrl}/api/storage/proxy-image?url=${encodeURIComponent(imageUrl)}`;
  }
  
  // Caso contrário, usar URL original
  return imageUrl;
}

// Uso simples
const img = new Image();
img.crossOrigin = 'anonymous';
img.src = getImageUrlWithProxy('https://pub-xxx.r2.dev/imagem.png');
```

## 🔧 Solução Definitiva - Configurar CORS no Cloudflare R2

Para resolver definitivamente (sem precisar do proxy):

1. Acesse: https://dash.cloudflare.com/
2. Vá em **R2** → Selecione seu bucket (`hml`)
3. Vá em **Settings** → **CORS Policy**
4. Adicione:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://seu-dominio.com"
    ],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

5. Salve e teste novamente

## 📝 Checklist

- [ ] Backend atualizado com endpoint proxy
- [ ] Frontend usando proxy para imagens do R2
- [ ] Testar carregamento de imagem no canvas
- [ ] Testar exportação do canvas (`toDataURL()`)
- [ ] (Opcional) Configurar CORS no R2 para solução definitiva

## 🧪 Teste Rápido

Execute no console do navegador:

```javascript
// Teste com proxy
const img = new Image();
img.crossOrigin = 'anonymous';
img.onload = () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);
  console.log('✅ Sucesso! Canvas exportado:', canvas.toDataURL().substring(0, 50));
};
img.src = 'http://localhost:5000/api/storage/proxy-image?url=' + 
  encodeURIComponent('https://pub-f6373861b23346918a681332b65f9a68.r2.dev/SUA_IMAGEM.png');
```

Se aparecer "✅ Sucesso!", está funcionando!
