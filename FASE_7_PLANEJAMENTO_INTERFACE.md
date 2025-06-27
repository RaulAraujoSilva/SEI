# 🎨 PLANEJAMENTO FASE 7 - INTERFACE WEB

## 🎯 Visão Geral da Interface

### **Objetivo Principal**
Criar uma interface web moderna, intuitiva e responsiva para o sistema SEI-Com AI, permitindo aos usuários gerenciar processos, visualizar documentos, monitorar análises de LLM e inserir novos processos para coleta.

### **Princípios de UX/UI**
- **Simplicidade:** Interface limpa e minimalista
- **Eficiência:** Fluxos rápidos para tarefas comuns
- **Consistência:** Padrões visuais uniformes
- **Responsividade:** Funciona em desktop, tablet e mobile
- **Acessibilidade:** Seguir padrões WCAG 2.1
- **Feedback Visual:** Estados de loading, sucesso e erro claros

### **Tecnologias Escolhidas**
- **Frontend:** React 18 + TypeScript
- **UI Framework:** Material-UI (MUI) v5
- **Estado:** Zustand (leve e simples)
- **Roteamento:** React Router v6
- **HTTP:** Axios + React Query
- **Gráficos:** Chart.js + react-chartjs-2
- **Ícones:** Material Icons + Lucide React
- **Tema:** Dark/Light mode toggle

---

## 🗺️ ESTRUTURA DE NAVEGAÇÃO

### **Layout Principal**
```
┌─────────────────────────────────────────────────────────────┐
│ Header: Logo | Título | Busca Global | Notificações | User  │
├─────────────────────────────────────────────────────────────┤
│ Sidebar │                                                   │
│ - Dashboard                                                 │
│ - Processos                                                 │
│ - Documentos                                                │
│ - Análises LLM                                              │
│ - Novo Processo                                             │
│ - Configurações                                             │
├─────────┼───────────────────────────────────────────────────┤
│         │ Conteúdo Principal                                │
│         │                                                   │
│         │                                                   │
│         │                                                   │
│         │                                                   │
└─────────┴───────────────────────────────────────────────────┘
```

### **Hierarquia de Navegação**
```
🏠 Dashboard (/)
├── 📊 Visão Geral
├── 📈 Estatísticas Rápidas
└── 🔔 Atividades Recentes

📋 Processos (/processos)
├── 📝 Lista de Processos (/processos)
├── 👁️ Detalhes do Processo (/processos/:id)
├── ✏️ Editar Processo (/processos/:id/editar)
└── 🔍 Busca Avançada (/processos/buscar)

📄 Documentos (/documentos)
├── 📑 Lista de Documentos (/documentos)
├── 👁️ Visualizar Documento (/documentos/:id)
├── 🏷️ Tags e Entidades (/documentos/:id/analise)
└── 📊 Estatísticas (/documentos/estatisticas)

🤖 Análises LLM (/llm)
├── 📊 Dashboard LLM (/llm)
├── 💰 Custos e Métricas (/llm/custos)
├── ⚙️ Configurações (/llm/config)
└── 📈 Histórico (/llm/historico)

➕ Novo Processo (/novo-processo)
├── 🌐 Inserir URL (/novo-processo)
├── 📝 Formulário Manual (/novo-processo/manual)
└── 📊 Status da Coleta (/novo-processo/status)

⚙️ Configurações (/configuracoes)
├── 👤 Perfil
├── 🎨 Tema
└── 🔧 Sistema
```

---

## 🖥️ DETALHAMENTO DAS TELAS

### 1. 🏠 **DASHBOARD - Tela Principal**

#### **Objetivo**
Visão geral do sistema com métricas principais e acesso rápido às funcionalidades.

#### **Layout**
```
┌─────────────────────────────────────────────────────────────┐
│ 📊 CARDS DE ESTATÍSTICAS                                   │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│ │ 150     │ │ 450     │ │ 200     │ │ R$ 45   │           │
│ │Processos│ │Docs     │ │Analisad.│ │Custos   │           │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
├─────────────────────────────────────────────────────────────┤
│ 📈 GRÁFICOS                                                 │
│ ┌─────────────────────┐ ┌─────────────────────────────────┐ │
│ │ Processos por Mês   │ │ Status dos Documentos           │ │
│ │ (Linha)             │ │ (Pizza)                         │ │
│ └─────────────────────┘ └─────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ 🔔 ATIVIDADES RECENTES                                      │
│ • Processo SEI-123 analisado (2 min atrás)                 │
│ • 5 documentos baixados (10 min atrás)                     │
│ • Análise LLM concluída (1h atrás)                         │
└─────────────────────────────────────────────────────────────┘
```

#### **Componentes**
- **Cards de Métricas:** Total de processos, documentos, análises, custos
- **Gráfico de Linha:** Processos coletados por período
- **Gráfico de Pizza:** Status dos documentos (analisados/pendentes/erro)
- **Lista de Atividades:** Últimas 10 atividades do sistema
- **Botão FAB:** "Novo Processo" fixo no canto inferior direito

#### **Dados Exibidos**
- Estatísticas em tempo real via API
- Gráficos interativos com drill-down
- Feed de atividades com timestamps
- Links rápidos para áreas relevantes

---

### 2. 📋 **PROCESSOS - Gestão de Processos**

#### **2.1 Lista de Processos**

#### **Layout**
```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 BARRA DE BUSCA E FILTROS                                │
│ ┌─────────────────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌────────┐ │
│ │ Buscar...       │ │Tipo▼ │ │Sit.▼ │ │Data▼ │ │Limpar  │ │
│ └─────────────────┘ └──────┘ └──────┘ └──────┘ └────────┘ │
├─────────────────────────────────────────────────────────────┤
│ 📊 TABELA DE PROCESSOS                                      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Nº Processo    │ Tipo        │ Situação    │ Docs │ ⚙️  │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ SEI-260002/001 │ Admin.      │ Tramitação  │ 5    │ ... │ │
│ │ SEI-260002/002 │ Judicial    │ Concluído   │ 12   │ ... │ │
│ │ SEI-260002/003 │ Executivo   │ Suspenso    │ 3    │ ... │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ 📄 PAGINAÇÃO: ◀ 1 2 3 ... 15 ▶ (10 por página)           │
└─────────────────────────────────────────────────────────────┘
```

#### **Funcionalidades**
- **Busca Global:** Por número, assunto, interessado
- **Filtros Rápidos:** Tipo, situação, órgão, período
- **Ordenação:** Por qualquer coluna (ASC/DESC)
- **Ações por Linha:** Ver detalhes, editar, excluir, analisar
- **Seleção Múltipla:** Para ações em lote
- **Exportação:** CSV, PDF, Excel

#### **2.2 Detalhes do Processo**

#### **Layout**
```
┌─────────────────────────────────────────────────────────────┐
│ ← Voltar │ ✏️ Editar │ 🗑️ Excluir │ 📊 Analisar          │
├─────────────────────────────────────────────────────────────┤
│ 📋 INFORMAÇÕES BÁSICAS                                      │
│ Número: SEI-260002/001234/2025                              │
│ Tipo: Administrativo                                        │
│ Assunto: Solicitação de documentos                          │
│ Interessado: João Silva                                     │
│ Situação: Em tramitação                                     │
│ Data Autuação: 15/01/2025                                   │
│ Órgão: Secretaria de Administração                          │
├─────────────────────────────────────────────────────────────┤
│ 📄 DOCUMENTOS (5)                                           │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📄 Despacho Inicial        │ PDF │ ✅ │ 🏷️ │ 👁️ │ ⬇️ │ │
│ │ 📄 Parecer Técnico         │ DOC │ ⏳ │ 🏷️ │ 👁️ │ ⬇️ │ │
│ │ 📄 Anexo - Comprovantes    │ PDF │ ❌ │ 🏷️ │ 👁️ │ ⬇️ │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ 📈 ESTATÍSTICAS                                             │
│ • Total de Documentos: 5                                   │
│ • Analisados: 2 (40%)                                      │
│ • Pendentes: 2 (40%)                                       │
│ • Com Erro: 1 (20%)                                        │
│ • Custo Total LLM: R$ 0,15                                 │
└─────────────────────────────────────────────────────────────┘
```

#### **Funcionalidades**
- **Visualização Completa:** Todos os dados do processo
- **Lista de Documentos:** Com status de análise
- **Ações por Documento:** Visualizar, baixar, analisar
- **Estatísticas:** Métricas específicas do processo
- **Timeline:** Histórico de modificações
- **Botões de Ação:** Editar, excluir, analisar tudo

---

### 3. 📄 **DOCUMENTOS - Gestão de Documentos**

#### **3.1 Lista de Documentos**

#### **Layout**
```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 BUSCA E FILTROS                                          │
│ ┌─────────────────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌────────┐ │
│ │ Buscar conteúdo │ │Tipo▼ │ │Proc▼ │ │Stat▼ │ │Buscar  │ │
│ └─────────────────┘ └──────┘ └──────┘ └──────┘ └────────┘ │
├─────────────────────────────────────────────────────────────┤
│ 📊 GRID DE DOCUMENTOS                                       │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│ │ 📄 Doc-001  │ │ 📄 Doc-002  │ │ 📄 Doc-003  │           │
│ │ Despacho    │ │ Parecer     │ │ Anexo       │           │
│ │ ✅ Analisado │ │ ⏳ Pendente  │ │ ❌ Erro     │           │
│ │ 5 tags      │ │ 0 tags      │ │ 0 tags      │           │
│ │ 👁️ 🏷️ ⬇️     │ │ 👁️ 🏷️ ⬇️     │ │ 👁️ 🏷️ ⬇️     │           │
│ └─────────────┘ └─────────────┘ └─────────────┘           │
├─────────────────────────────────────────────────────────────┤
│ 📄 PAGINAÇÃO: ◀ 1 2 3 ... 45 ▶ (12 por página)           │
└─────────────────────────────────────────────────────────────┘
```

#### **Funcionalidades**
- **Busca por Conteúdo:** Texto completo nos documentos
- **Filtros:** Tipo, processo, status de análise, data
- **Visualização:** Grid cards ou lista tabular
- **Preview:** Hover mostra resumo do documento
- **Ações Rápidas:** Ver, analisar, baixar

#### **3.2 Visualização de Documento**

#### **Layout**
```
┌─────────────────────────────────────────────────────────────┐
│ ← Voltar │ 🤖 Analisar │ ⬇️ Baixar │ 🔗 Processo           │
├─────────────────────────────────────────────────────────────┤
│ 📄 INFORMAÇÕES DO DOCUMENTO                                 │
│ Tipo: Despacho Inicial                                      │
│ Processo: SEI-260002/001234/2025                            │
│ Data: 15/01/2025                                            │
│ Status: ✅ Analisado                                         │
│ Modelo: gpt-4o-mini                                         │
│ Tokens: 485 | Custo: R$ 0,0002                             │
├─────────────────────────────────────────────────────────────┤
│ 🏷️ TAGS EXTRAÍDAS (8)                                       │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│ │despacho │ │admin    │ │deferido │ │urgente  │           │
│ │  98%    │ │  95%    │ │  92%    │ │  87%    │           │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
├─────────────────────────────────────────────────────────────┤
│ 👥 ENTIDADES IDENTIFICADAS (14)                             │
│ 👤 Pessoas: João Silva, Maria Santos                        │
│ 💰 Valores: R$ 15.000,00, R$ 2.500,00                      │
│ 📅 Datas: 15/01/2025, 20/01/2025                           │
│ 🏢 Órgãos: SEFAZ, SEPLAG                                    │
├─────────────────────────────────────────────────────────────┤
│ 📝 RESUMO DA ANÁLISE                                        │
│ O documento trata de um despacho administrativo             │
│ deferindo solicitação de documentos. Identifica            │
│ valores financeiros e prazos para cumprimento...           │
└─────────────────────────────────────────────────────────────┘
```

#### **Funcionalidades**
- **Visualização Completa:** Todos os dados extraídos
- **Tags Interativas:** Com percentual de confiança
- **Entidades Categorizadas:** Por tipo (pessoa, valor, data, etc.)
- **Resumo Inteligente:** Gerado pelo LLM
- **Histórico:** Timeline de análises
- **Ações:** Re-analisar, editar tags, exportar

---

### 4. 🤖 **ANÁLISES LLM - Dashboard de IA**

#### **4.1 Dashboard Principal**

#### **Layout**
```
┌─────────────────────────────────────────────────────────────┐
│ 📊 MÉTRICAS DE PROCESSAMENTO                                │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│ │ 200     │ │ 185     │ │ 15      │ │ 92.5%   │           │
│ │Analisad.│ │Sucesso  │ │Falhas   │ │Taxa Suc.│           │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
├─────────────────────────────────────────────────────────────┤
│ 💰 CUSTOS E TOKENS                                          │
│ ┌─────────────────────┐ ┌─────────────────────────────────┐ │
│ │ Custos por Dia      │ │ Tokens por Documento            │ │
│ │ (Linha)             │ │ (Histograma)                    │ │
│ └─────────────────────┘ └─────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ ⚙️ CONFIGURAÇÃO ATUAL                                       │
│ Modelo: gpt-4o-mini | Temp: 0.1 | Max Tokens: 4000        │
│ Custo/1K: $0.00015 input, $0.0006 output                  │
│ Timeout: 60s | Chunks: 5 max                               │
│ ┌─────────────┐                                            │
│ │ ⚙️ Configurar │                                            │
│ └─────────────┘                                            │
└─────────────────────────────────────────────────────────────┘
```

#### **Funcionalidades**
- **Métricas em Tempo Real:** Atualizadas automaticamente
- **Gráficos Interativos:** Drill-down por período
- **Monitoramento de Custos:** Alertas de orçamento
- **Configuração Rápida:** Ajustar parâmetros do LLM
- **Estimativas:** Custo previsto para análises pendentes

#### **4.2 Configurações LLM**

#### **Layout**
```
┌─────────────────────────────────────────────────────────────┐
│ ⚙️ CONFIGURAÇÕES DO LLM                                     │
├─────────────────────────────────────────────────────────────┤
│ 🤖 MODELO                                                   │
│ ┌─────────────────────┐ ┌─────────────────────────────────┐ │
│ │ Provider: OpenAI ▼  │ │ Modelo: gpt-4o-mini ▼           │ │
│ └─────────────────────┘ └─────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ 🎛️ PARÂMETROS                                               │
│ Temperature: [====•----] 0.1                               │
│ Max Tokens: [========•-] 4000                              │
│ Chunk Size: [======•---] 8000                              │
│ Max Chunks: [==•-------] 5                                 │
│ Timeout: [====•----] 60s                                   │
├─────────────────────────────────────────────────────────────┤
│ 💰 CUSTOS                                                   │
│ Input (1K tokens): $0.00015                                │
│ Output (1K tokens): $0.0006                                │
│ Orçamento Mensal: R$ 500,00                                │
│ Alerta em: R$ 400,00 (80%)                                 │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐                       │
│ │ Salvar  │ │ Testar  │ │ Reset   │                       │
│ └─────────┘ └─────────┘ └─────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

#### **Funcionalidades**
- **Configuração Visual:** Sliders para parâmetros
- **Teste em Tempo Real:** Validar configurações
- **Controle de Custos:** Orçamento e alertas
- **Presets:** Configurações pré-definidas
- **Histórico:** Versões anteriores das configurações

---

### 5. ➕ **NOVO PROCESSO - Entrada de Dados**

#### **5.1 Inserção por URL (Principal)**

#### **Layout**
```
┌─────────────────────────────────────────────────────────────┐
│ ➕ ADICIONAR NOVO PROCESSO                                   │
├─────────────────────────────────────────────────────────────┤
│ 🌐 INSERIR URL DO SEI                                       │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ https://sei.rj.gov.br/sei/modulos/pesquisa/...         │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────┐ ┌─────────────┐                           │
│ │ 🔍 Validar  │ │ 📝 Manual   │                           │
│ └─────────────┘ └─────────────┘                           │
├─────────────────────────────────────────────────────────────┤
│ ✅ URL VÁLIDA - DADOS ENCONTRADOS                           │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Número: SEI-260002/001234/2025                          │ │
│ │ Tipo: Administrativo                                    │ │
│ │ Assunto: Solicitação de documentos                      │ │
│ │ Interessado: João Silva                                 │ │
│ │ Situação: Em tramitação                                 │ │
│ │ Documentos: 5 encontrados                               │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ ⚙️ OPÇÕES DE COLETA                                         │
│ ☑️ Coletar documentos automaticamente                       │
│ ☑️ Analisar documentos com LLM                              │
│ ☑️ Notificar quando concluído                               │
│ ☐ Agendar coleta recorrente                                │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐                           │
│ │ 🚀 Iniciar  │ │ ❌ Cancelar │                           │
│ └─────────────┘ └─────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

#### **Funcionalidades**
- **Validação em Tempo Real:** Verificar URL e extrair dados
- **Preview dos Dados:** Mostrar informações encontradas
- **Opções de Coleta:** Configurar comportamento automático
- **Feedback Visual:** Estados de loading, sucesso, erro
- **Alternativa Manual:** Para casos especiais

#### **5.2 Status da Coleta**

#### **Layout**
```
┌─────────────────────────────────────────────────────────────┐
│ 📊 STATUS DA COLETA - SEI-260002/001234/2025               │
├─────────────────────────────────────────────────────────────┤
│ 🔄 PROGRESSO GERAL (75%)                                    │
│ ████████████████████████████████████████████████████░░░░░░ │
├─────────────────────────────────────────────────────────────┤
│ ✅ ETAPAS CONCLUÍDAS                                        │
│ ✅ Validação da URL (2s)                                    │
│ ✅ Extração de dados básicos (5s)                           │
│ ✅ Coleta de documentos (45s)                               │
│ 🔄 Análise LLM dos documentos (30s restantes)               │
│ ⏳ Finalização e notificação                                │
├─────────────────────────────────────────────────────────────┤
│ 📄 DOCUMENTOS COLETADOS (5/5)                               │
│ ✅ Despacho Inicial - Analisado                             │
│ ✅ Parecer Técnico - Analisado                              │
│ 🔄 Anexo Comprovantes - Analisando...                       │
│ ✅ Documento Complementar - Analisado                        │
│ ✅ Despacho Final - Analisado                               │
├─────────────────────────────────────────────────────────────┤
│ 💰 CUSTOS DA OPERAÇÃO                                       │
│ Tokens utilizados: 2.450                                   │
│ Custo estimado: R$ 0,85                                    │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐                           │
│ │ 👁️ Ver Proc. │ │ 🏠 Dashboard│                           │
│ └─────────────┘ └─────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

#### **Funcionalidades**
- **Progresso em Tempo Real:** WebSocket ou polling
- **Detalhamento por Etapa:** Status individual
- **Monitoramento de Custos:** Estimativa e real
- **Logs de Erro:** Se houver falhas
- **Ações Pós-Coleta:** Navegar para processo ou dashboard

---

### 6. ⚙️ **CONFIGURAÇÕES - Personalização**

#### **Layout**
```
┌─────────────────────────────────────────────────────────────┐
│ ⚙️ CONFIGURAÇÕES DO SISTEMA                                 │
├─────────────────────────────────────────────────────────────┤
│ 👤 PERFIL                                                   │
│ Nome: Administrador                                         │
│ Email: admin@sistema.com                                    │
│ Função: Gestor de Processos                                 │
├─────────────────────────────────────────────────────────────┤
│ 🎨 APARÊNCIA                                                │
│ Tema: ● Dark  ○ Light  ○ Auto                              │
│ Idioma: Português (BR) ▼                                   │
│ Densidade: ○ Compacta  ● Normal  ○ Confortável             │
├─────────────────────────────────────────────────────────────┤
│ 🔔 NOTIFICAÇÕES                                             │
│ ☑️ Processo coletado com sucesso                             │
│ ☑️ Erro na coleta de processo                                │
│ ☑️ Análise LLM concluída                                     │
│ ☑️ Orçamento LLM atingindo limite                           │
│ ☐ Relatório semanal por email                              │
├─────────────────────────────────────────────────────────────┤
│ 🔧 SISTEMA                                                  │
│ Versão: 1.0.0                                              │
│ API: Conectada ✅                                           │
│ Banco: PostgreSQL ✅                                        │
│ LLM: OpenAI ✅                                              │
│ ┌─────────────┐ ┌─────────────┐                           │
│ │ 🔄 Atualizar│ │ 📊 Logs     │                           │
│ └─────────────┘ └─────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 DESIGN SYSTEM

### **Paleta de Cores**
```
Primária: #1976d2 (Material Blue)
Secundária: #dc004e (Material Pink)
Sucesso: #2e7d32 (Green)
Aviso: #ed6c02 (Orange)
Erro: #d32f2f (Red)
Info: #0288d1 (Light Blue)

Cinzas:
- 50: #fafafa
- 100: #f5f5f5
- 200: #eeeeee
- 300: #e0e0e0
- 400: #bdbdbd
- 500: #9e9e9e
- 600: #757575
- 700: #616161
- 800: #424242
- 900: #212121
```

### **Tipografia**
```
Fonte Principal: 'Roboto', sans-serif
Fonte Código: 'Roboto Mono', monospace

Tamanhos:
- h1: 2.125rem (34px)
- h2: 1.5rem (24px)
- h3: 1.25rem (20px)
- h4: 1.125rem (18px)
- body1: 1rem (16px)
- body2: 0.875rem (14px)
- caption: 0.75rem (12px)
```

### **Espaçamentos**
```
Base: 8px

xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
xxl: 48px
```

### **Componentes Customizados**

#### **StatusChip**
```tsx
interface StatusChipProps {
  status: 'concluido' | 'pendente' | 'erro' | 'processando'
  label: string
}

// Cores por status:
// concluido: green
// pendente: orange
// erro: red
// processando: blue
```

#### **ProcessCard**
```tsx
interface ProcessCardProps {
  processo: Processo
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}

// Layout: Card com hover effects
// Ações: Menu dropdown no canto
// Status: Chip colorido
// Métricas: Documentos, análises
```

#### **DocumentGrid**
```tsx
interface DocumentGridProps {
  documentos: Documento[]
  viewMode: 'grid' | 'list'
  onSelect: (doc: Documento) => void
}

// Grid responsivo: 1-4 colunas
// Preview on hover
// Status visual claro
```

---

## 📱 RESPONSIVIDADE

### **Breakpoints**
```
xs: 0px (mobile)
sm: 600px (tablet portrait)
md: 900px (tablet landscape)
lg: 1200px (desktop)
xl: 1536px (large desktop)
```

### **Adaptações por Tela**

#### **Mobile (xs - sm)**
- Sidebar colapsada em drawer
- Cards em coluna única
- Tabelas viram listas
- FAB para ações principais
- Bottom navigation opcional

#### **Tablet (md)**
- Sidebar fixa mas estreita
- Grid de 2 colunas
- Tabelas com scroll horizontal
- Touch-friendly targets

#### **Desktop (lg+)**
- Layout completo
- Grid de 3-4 colunas
- Todas as funcionalidades visíveis
- Atalhos de teclado

---

## 🔄 ESTADOS DA APLICAÇÃO

### **Loading States**
- **Skeleton screens** durante carregamento inicial
- **Progress bars** para operações longas
- **Spinners** para ações rápidas
- **Shimmer effect** em listas

### **Error States**
- **Página 404** customizada
- **Erro de conexão** com retry
- **Erro de validação** inline
- **Erro geral** com suporte

### **Empty States**
- **Lista vazia** com CTA
- **Busca sem resultados** com sugestões
- **Primeira utilização** com onboarding

---

## 🚀 FUNCIONALIDADES ESPECIAIS

### **Busca Global**
- **Autocomplete** inteligente
- **Busca por categoria** (processos, documentos)
- **Histórico** de buscas
- **Filtros rápidos**

### **Notificações**
- **Toast messages** para feedback
- **Badge** no ícone de notificações
- **Centro de notificações** com histórico
- **Push notifications** (futuro)

### **Atalhos de Teclado**
```
Ctrl+K: Busca global
Ctrl+N: Novo processo
Ctrl+D: Dashboard
Ctrl+P: Lista de processos
Ctrl+L: Análises LLM
Esc: Fechar modais/drawers
```

### **Exportação**
- **CSV** para listas
- **PDF** para relatórios
- **Excel** para análises
- **JSON** para dados técnicos

---

## 🎯 PRÓXIMOS PASSOS

### **Fase 7.1: Setup e Estrutura (2 dias)**
1. Configurar projeto React + TypeScript
2. Instalar e configurar Material-UI
3. Configurar roteamento e estado
4. Criar layout base e navegação

### **Fase 7.2: Páginas Principais (3 dias)**
1. Dashboard com gráficos
2. Lista de processos com filtros
3. Detalhes do processo
4. Lista de documentos

### **Fase 7.3: Funcionalidades Avançadas (3 dias)**
1. Novo processo (URL + manual)
2. Análises LLM dashboard
3. Configurações
4. Status de coleta em tempo real

### **Fase 7.4: Polimento e Testes (2 dias)**
1. Responsividade
2. Estados de loading/erro
3. Testes E2E básicos
4. Performance e otimizações

**Total: 10 dias para interface completa e funcional**

---

*Planejamento criado em: 20/01/2025*  
*Próximo passo: Iniciar desenvolvimento da Fase 7* 