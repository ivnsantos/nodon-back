# 🎨 Guia Frontend - Integração com API de Anamneses

Este documento mostra como integrar a API de anamneses no frontend.

## 📋 Índice

1. [Configuração Inicial](#configuração-inicial)
2. [Serviços/API Client](#serviçosapi-client)
3. [Exemplos de Uso](#exemplos-de-uso)
4. [Componentes React](#componentes-react)

---

## 🔧 Configuração Inicial

### 1. Variáveis de Ambiente

```typescript
// .env
REACT_APP_API_URL=http://localhost:3000
```

### 2. Configuração do Axios/Fetch

```typescript
// src/config/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
});

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 📡 Serviços/API Client

### Serviço de Anamneses

```typescript
// src/services/anamneses.service.ts
import api from '../config/api';

export interface Pergunta {
  id?: string;
  texto: string;
  tipoResposta: 'texto' | 'numero' | 'booleano' | 'multipla_escolha' | 'data';
  opcoes?: string[];
  obrigatoria?: boolean;
  ordem?: number;
}

export interface Anamnese {
  id: string;
  clienteMasterId: string;
  titulo: string;
  descricao?: string;
  ativa: boolean;
  perguntas?: Pergunta[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnamneseDto {
  clienteMasterId: string;
  titulo: string;
  descricao?: string;
  ativa?: boolean;
  perguntas?: Omit<Pergunta, 'id'>[];
}

export interface RespostaPergunta {
  id: string;
  perguntaId: string;
  valor: string | null;
  pergunta?: Pergunta;
}

export interface RespostaAnamnese {
  id: string;
  anamneseId: string;
  pacienteId: string;
  concluida: boolean;
  anamnese?: Anamnese;
  paciente?: {
    id: string;
    nome: string;
  };
  respostasPerguntas?: RespostaPergunta[];
  createdAt: string;
  updatedAt: string;
}

export interface ResponderAnamneseDto {
  respostaAnamneseId: string;
  concluida: boolean;
  respostas: {
    perguntaId: string;
    valor: string | null;
  }[];
}

class AnamnesesService {
  // Criar anamnese
  async create(data: CreateAnamneseDto): Promise<Anamnese> {
    const response = await api.post('/anamneses', data);
    return response.data;
  }

  // Listar anamneses de um cliente master
  async findAll(clienteMasterId: string): Promise<Anamnese[]> {
    const response = await api.get(`/anamneses?clienteMasterId=${clienteMasterId}`);
    return response.data;
  }

  // Buscar anamnese específica
  async findOne(id: string): Promise<Anamnese> {
    const response = await api.get(`/anamneses/${id}`);
    return response.data;
  }

  // Atualizar anamnese
  async update(id: string, data: Partial<CreateAnamneseDto>): Promise<Anamnese> {
    const response = await api.put(`/anamneses/${id}`, data);
    return response.data;
  }

  // Deletar anamnese
  async delete(id: string): Promise<void> {
    await api.delete(`/anamneses/${id}`);
  }

  // Vincular anamnese a paciente
  async vincularPaciente(anamneseId: string, pacienteId: string): Promise<RespostaAnamnese> {
    const response = await api.post('/anamneses/vincular-paciente', {
      anamneseId,
      pacienteId,
    });
    return response.data;
  }

  // Responder anamnese
  async responder(data: ResponderAnamneseDto): Promise<RespostaAnamnese> {
    const response = await api.put('/anamneses/responder', data);
    return response.data;
  }

  // Buscar respostas de um paciente
  async buscarRespostasPorPaciente(pacienteId: string): Promise<RespostaAnamnese[]> {
    const response = await api.get(`/anamneses/paciente/${pacienteId}`);
    return response.data;
  }

  // Buscar resposta específica
  async buscarResposta(id: string): Promise<RespostaAnamnese> {
    const response = await api.get(`/anamneses/resposta/${id}`);
    return response.data;
  }
}

export default new AnamnesesService();
```

---

## 💡 Exemplos de Uso

### 1. Criar Anamnese

```typescript
import anamnesesService from './services/anamneses.service';

const criarAnamnese = async () => {
  try {
    const anamnese = await anamnesesService.create({
      clienteMasterId: 'uuid-cliente-master',
      titulo: 'Anamnese Geral',
      descricao: 'Questionário geral de saúde bucal',
      ativa: true,
      perguntas: [
        {
          texto: 'Você possui alguma alergia?',
          tipoResposta: 'texto',
          obrigatoria: true,
          ordem: 0,
        },
        {
          texto: 'Você está tomando algum medicamento?',
          tipoResposta: 'booleano',
          obrigatoria: true,
          ordem: 1,
        },
        {
          texto: 'Qual seu tipo sanguíneo?',
          tipoResposta: 'multipla_escolha',
          opcoes: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
          obrigatoria: false,
          ordem: 2,
        },
      ],
    });
    console.log('Anamnese criada:', anamnese);
  } catch (error) {
    console.error('Erro ao criar anamnese:', error);
  }
};
```

### 2. Listar Anamneses

```typescript
const listarAnamneses = async (clienteMasterId: string) => {
  try {
    const anamneses = await anamnesesService.findAll(clienteMasterId);
    console.log('Anamneses:', anamneses);
    return anamneses;
  } catch (error) {
    console.error('Erro ao listar anamneses:', error);
    return [];
  }
};
```

### 3. Vincular Anamnese a Paciente

```typescript
const vincularAnamnese = async (anamneseId: string, pacienteId: string) => {
  try {
    const resposta = await anamnesesService.vincularPaciente(anamneseId, pacienteId);
    console.log('Anamnese vinculada:', resposta);
    return resposta;
  } catch (error) {
    console.error('Erro ao vincular anamnese:', error);
    throw error;
  }
};
```

### 4. Responder Anamnese

```typescript
const responderAnamnese = async (
  respostaAnamneseId: string,
  respostas: { perguntaId: string; valor: string | null }[]
) => {
  try {
    const resposta = await anamnesesService.responder({
      respostaAnamneseId,
      concluida: true,
      respostas,
    });
    console.log('Anamnese respondida:', resposta);
    return resposta;
  } catch (error) {
    console.error('Erro ao responder anamnese:', error);
    throw error;
  }
};
```

---

## ⚛️ Componentes React

### Componente: Lista de Anamneses

```tsx
// src/components/AnamnesesList.tsx
import React, { useEffect, useState } from 'react';
import anamnesesService, { Anamnese } from '../services/anamneses.service';

interface Props {
  clienteMasterId: string;
  onSelectAnamnese?: (anamnese: Anamnese) => void;
}

const AnamnesesList: React.FC<Props> = ({ clienteMasterId, onSelectAnamnese }) => {
  const [anamneses, setAnamneses] = useState<Anamnese[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnamneses();
  }, [clienteMasterId]);

  const loadAnamneses = async () => {
    try {
      setLoading(true);
      const data = await anamnesesService.findAll(clienteMasterId);
      setAnamneses(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar anamneses');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Carregando...</div>;
  if (error) return <div className="error">Erro: {error}</div>;

  return (
    <div className="anamneses-list">
      <h2>Anamneses</h2>
      {anamneses.length === 0 ? (
        <p>Nenhuma anamnese cadastrada</p>
      ) : (
        <ul>
          {anamneses.map((anamnese) => (
            <li key={anamnese.id}>
              <h3>{anamnese.titulo}</h3>
              <p>{anamnese.descricao}</p>
              <p>
                <strong>Perguntas:</strong> {anamnese.perguntas?.length || 0}
              </p>
              <p>
                <strong>Status:</strong> {anamnese.ativa ? 'Ativa' : 'Inativa'}
              </p>
              {onSelectAnamnese && (
                <button onClick={() => onSelectAnamnese(anamnese)}>
                  Selecionar
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AnamnesesList;
```

### Componente: Formulário de Criar Anamnese

```tsx
// src/components/CreateAnamneseForm.tsx
import React, { useState } from 'react';
import anamnesesService, { Pergunta } from '../services/anamneses.service';

interface Props {
  clienteMasterId: string;
  onSuccess?: () => void;
}

const CreateAnamneseForm: React.FC<Props> = ({ clienteMasterId, onSuccess }) => {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [perguntas, setPerguntas] = useState<Omit<Pergunta, 'id'>[]>([]);
  const [loading, setLoading] = useState(false);

  const adicionarPergunta = () => {
    setPerguntas([
      ...perguntas,
      {
        texto: '',
        tipoResposta: 'texto',
        obrigatoria: false,
        ordem: perguntas.length,
      },
    ]);
  };

  const atualizarPergunta = (index: number, campo: string, valor: any) => {
    const novasPerguntas = [...perguntas];
    novasPerguntas[index] = { ...novasPerguntas[index], [campo]: valor };
    setPerguntas(novasPerguntas);
  };

  const removerPergunta = (index: number) => {
    setPerguntas(perguntas.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await anamnesesService.create({
        clienteMasterId,
        titulo,
        descricao,
        ativa: true,
        perguntas,
      });
      alert('Anamnese criada com sucesso!');
      setTitulo('');
      setDescricao('');
      setPerguntas([]);
      onSuccess?.();
    } catch (error: any) {
      alert(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="create-anamnese-form">
      <h2>Criar Nova Anamnese</h2>
      
      <div>
        <label>Título:</label>
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          required
        />
      </div>

      <div>
        <label>Descrição:</label>
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
      </div>

      <div>
        <h3>Perguntas</h3>
        {perguntas.map((pergunta, index) => (
          <div key={index} className="pergunta-item">
            <input
              type="text"
              placeholder="Texto da pergunta"
              value={pergunta.texto}
              onChange={(e) => atualizarPergunta(index, 'texto', e.target.value)}
              required
            />
            
            <select
              value={pergunta.tipoResposta}
              onChange={(e) =>
                atualizarPergunta(index, 'tipoResposta', e.target.value)
              }
            >
              <option value="texto">Texto</option>
              <option value="numero">Número</option>
              <option value="booleano">Sim/Não</option>
              <option value="multipla_escolha">Múltipla Escolha</option>
              <option value="data">Data</option>
            </select>

            {pergunta.tipoResposta === 'multipla_escolha' && (
              <input
                type="text"
                placeholder="Opções separadas por vírgula (ex: A+, A-, B+)"
                onChange={(e) =>
                  atualizarPergunta(
                    index,
                    'opcoes',
                    e.target.value.split(',').map((o) => o.trim())
                  )
                }
              />
            )}

            <label>
              <input
                type="checkbox"
                checked={pergunta.obrigatoria}
                onChange={(e) =>
                  atualizarPergunta(index, 'obrigatoria', e.target.checked)
                }
              />
              Obrigatória
            </label>

            <button type="button" onClick={() => removerPergunta(index)}>
              Remover
            </button>
          </div>
        ))}

        <button type="button" onClick={adicionarPergunta}>
          Adicionar Pergunta
        </button>
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Criando...' : 'Criar Anamnese'}
      </button>
    </form>
  );
};

export default CreateAnamneseForm;
```

### Componente: Responder Anamnese

```tsx
// src/components/ResponderAnamnese.tsx
import React, { useEffect, useState } from 'react';
import anamnesesService, { RespostaAnamnese } from '../services/anamneses.service';

interface Props {
  respostaAnamneseId: string;
  onSuccess?: () => void;
}

const ResponderAnamnese: React.FC<Props> = ({ respostaAnamneseId, onSuccess }) => {
  const [respostaAnamnese, setRespostaAnamnese] = useState<RespostaAnamnese | null>(null);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRespostaAnamnese();
  }, [respostaAnamneseId]);

  const loadRespostaAnamnese = async () => {
    try {
      setLoading(true);
      const data = await anamnesesService.buscarResposta(respostaAnamneseId);
      setRespostaAnamnese(data);
      
      // Inicializar respostas com valores existentes
      const respostasIniciais: Record<string, string> = {};
      data.respostasPerguntas?.forEach((rp) => {
        if (rp.valor) {
          respostasIniciais[rp.perguntaId] = rp.valor;
        }
      });
      setRespostas(respostasIniciais);
    } catch (error) {
      console.error('Erro ao carregar resposta:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespostaChange = (perguntaId: string, valor: string) => {
    setRespostas({ ...respostas, [perguntaId]: valor });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!respostaAnamnese) return;

    try {
      setSaving(true);
      const respostasArray = respostaAnamnese.anamnese?.perguntas?.map((pergunta) => ({
        perguntaId: pergunta.id!,
        valor: respostas[pergunta.id!] || null,
      })) || [];

      await anamnesesService.responder({
        respostaAnamneseId,
        concluida: true,
        respostas: respostasArray,
      });

      alert('Anamnese respondida com sucesso!');
      onSuccess?.();
    } catch (error: any) {
      alert(`Erro: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Carregando...</div>;
  if (!respostaAnamnese) return <div>Resposta não encontrada</div>;

  return (
    <form onSubmit={handleSubmit} className="responder-anamnese">
      <h2>{respostaAnamnese.anamnese?.titulo}</h2>
      <p>{respostaAnamnese.anamnese?.descricao}</p>

      {respostaAnamnese.anamnese?.perguntas?.map((pergunta) => {
        const valorAtual = respostas[pergunta.id!] || '';

        return (
          <div key={pergunta.id} className="pergunta-resposta">
            <label>
              {pergunta.texto}
              {pergunta.obrigatoria && <span className="obrigatoria">*</span>}
            </label>

            {pergunta.tipoResposta === 'texto' && (
              <textarea
                value={valorAtual}
                onChange={(e) => handleRespostaChange(pergunta.id!, e.target.value)}
                required={pergunta.obrigatoria}
              />
            )}

            {pergunta.tipoResposta === 'numero' && (
              <input
                type="number"
                value={valorAtual}
                onChange={(e) => handleRespostaChange(pergunta.id!, e.target.value)}
                required={pergunta.obrigatoria}
              />
            )}

            {pergunta.tipoResposta === 'booleano' && (
              <select
                value={valorAtual}
                onChange={(e) => handleRespostaChange(pergunta.id!, e.target.value)}
                required={pergunta.obrigatoria}
              >
                <option value="">Selecione...</option>
                <option value="true">Sim</option>
                <option value="false">Não</option>
              </select>
            )}

            {pergunta.tipoResposta === 'multipla_escolha' && (
              <select
                value={valorAtual}
                onChange={(e) => handleRespostaChange(pergunta.id!, e.target.value)}
                required={pergunta.obrigatoria}
              >
                <option value="">Selecione...</option>
                {pergunta.opcoes?.map((opcao) => (
                  <option key={opcao} value={opcao}>
                    {opcao}
                  </option>
                ))}
              </select>
            )}

            {pergunta.tipoResposta === 'data' && (
              <input
                type="date"
                value={valorAtual}
                onChange={(e) => handleRespostaChange(pergunta.id!, e.target.value)}
                required={pergunta.obrigatoria}
              />
            )}
          </div>
        );
      })}

      <button type="submit" disabled={saving}>
        {saving ? 'Salvando...' : 'Salvar Respostas'}
      </button>
    </form>
  );
};

export default ResponderAnamnese;
```

---

## 🎯 Exemplo de Página Completa

```tsx
// src/pages/AnamnesesPage.tsx
import React, { useState } from 'react';
import AnamnesesList from '../components/AnamnesesList';
import CreateAnamneseForm from '../components/CreateAnamneseForm';
import ResponderAnamnese from '../components/ResponderAnamnese';

const AnamnesesPage: React.FC = () => {
  const clienteMasterId = 'uuid-cliente-master'; // Pegar do contexto/state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedRespostaId, setSelectedRespostaId] = useState<string | null>(null);

  return (
    <div className="anamneses-page">
      <h1>Anamneses Odontológicas</h1>

      {!showCreateForm && !selectedRespostaId && (
        <>
          <button onClick={() => setShowCreateForm(true)}>
            Criar Nova Anamnese
          </button>
          <AnamnesesList clienteMasterId={clienteMasterId} />
        </>
      )}

      {showCreateForm && (
        <CreateAnamneseForm
          clienteMasterId={clienteMasterId}
          onSuccess={() => setShowCreateForm(false)}
        />
      )}

      {selectedRespostaId && (
        <ResponderAnamnese
          respostaAnamneseId={selectedRespostaId}
          onSuccess={() => setSelectedRespostaId(null)}
        />
      )}
    </div>
  );
};

export default AnamnesesPage;
```

---

**Pronto para usar!** 🚀

