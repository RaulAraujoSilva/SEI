# 🖼️ WIREFRAMES DETALHADOS - INTERFACE SEI-COM AI

## 🎯 Fluxos de Usuário Principais

### **Fluxo 1: Adicionar Novo Processo**
```
[Tela Inicial] → [Novo Processo] → [Inserir URL] → [Validar] → [Configurar Coleta] → [Iniciar] → [Status] → [Processo Criado]
     ↓              ↓                ↓              ↓            ↓                  ↓          ↓           ↓
  Dashboard    Formulário URL    Validação     Preview      Opções           Execução   Monitoramento  Visualização
```

### **Fluxo 2: Analisar Documentos**
```
[Lista Processos] → [Detalhes] → [Lista Docs] → [Selecionar] → [Analisar] → [Status] → [Resultados]
       ↓               ↓            ↓             ↓             ↓           ↓           ↓
   Navegação      Visualização   Documentos   Seleção      Configuração  Execução   Tags/Entidades
```

### **Fluxo 3: Monitoramento e Relatórios**
```
[Dashboard] → [Métricas] → [Gráficos] → [Drill-down] → [Filtros] → [Exportar]
     ↓           ↓           ↓             ↓            ↓           ↓
  Visão Geral  Estatísticas  Análise    Detalhamento  Refinamento  Relatório
```

---

## 📱 WIREFRAMES RESPONSIVOS

### **MOBILE (320px - 600px)**

#### **Dashboard Mobile**
```
┌─────────────────────┐
│ ☰ SEI-Com AI    🔔  │ ← Header compacto
├─────────────────────┤
│ 📊 MÉTRICAS         │
│ ┌─────┐ ┌─────┐     │
│ │ 150 │ │ 450 │     │
│ │Proc │ │Docs │     │
│ └─────┘ └─────┘     │
│ ┌─────┐ ┌─────┐     │
│ │ 200 │ │ R$45│     │
│ │Anal │ │Cost │     │
│ └─────┘ └─────┘     │
├─────────────────────┤
│ 📈 GRÁFICO          │
│ ┌─────────────────┐ │
│ │ Processos/Mês   │ │ ← Gráfico único
│ │ [Linha chart]   │ │
│ └─────────────────┘ │
├─────────────────────┤
│ 🔔 RECENTES         │
│ • Processo analis.. │
│ • 5 docs baixados.. │ ← Lista compacta
│ • Análise concluí.. │
├─────────────────────┤
│ [+] NOVO PROCESSO   │ ← FAB fixo
└─────────────────────┘
```

#### **Lista Processos Mobile**
```
┌─────────────────────┐
│ ← Processos     🔍  │ ← Header com busca
├─────────────────────┤
│ ┌─────────────────┐ │
│ │ 🔍 Buscar...    │ │ ← Campo de busca
│ └─────────────────┘ │
│ [Filtros ▼]         │ ← Filtros colapsados
├─────────────────────┤
│ ┌─────────────────┐ │
│ │ SEI-260002/001  │ │
│ │ Administrativo  │ │ ← Cards verticais
│ │ Em tramitação   │ │
│ │ 5 docs • ⋮      │ │
│ └─────────────────┘ │
│ ┌─────────────────┐ │
│ │ SEI-260002/002  │ │
│ │ Judicial        │ │
│ │ Concluído       │ │
│ │ 12 docs • ⋮     │ │
│ └─────────────────┘ │
├─────────────────────┤
│ ◀ 1 2 3 ... 15 ▶   │ ← Paginação
└─────────────────────┘
```

### **TABLET (600px - 900px)**

#### **Dashboard Tablet**
```
┌─────────────────────────────────────┐
│ ☰ SEI-Com AI        🔍    🔔   👤   │ ← Header expandido
├─────────────────────────────────────┤
│ 📊 MÉTRICAS                         │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐     │
│ │ 150 │ │ 450 │ │ 200 │ │ R$45│     │ ← Cards em linha
│ │Proc │ │Docs │ │Anal │ │Cost │     │
│ └─────┘ └─────┘ └─────┘ └─────┘     │
├─────────────────────────────────────┤
│ 📈 GRÁFICOS                         │
│ ┌─────────────────┐ ┌─────────────┐ │
│ │ Processos/Mês   │ │ Status Docs │ │ ← Dois gráficos
│ │ [Linha chart]   │ │ [Pizza]     │ │
│ └─────────────────┘ └─────────────┘ │
├─────────────────────────────────────┤
│ 🔔 ATIVIDADES RECENTES              │
│ • Processo SEI-123 analisado (2min) │
│ • 5 documentos baixados (10min)     │ ← Lista expandida
│ • Análise LLM concluída (1h)        │
└─────────────────────────────────────┘
```

### **DESKTOP (1200px+)**

#### **Layout Completo Desktop**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🏠 SEI-Com AI          🔍 Busca Global         🔔 Notif    👤 User          │
├─────────────┬───────────────────────────────────────────────────────────────┤
│ SIDEBAR     │ CONTEÚDO PRINCIPAL                                            │
│             │                                                               │
│ 🏠 Dashboard│ ┌─────────────────────────────────────────────────────────┐   │
│ 📋 Processos│ │ 📊 DASHBOARD                                            │   │
│ 📄 Documentos│ │                                                         │   │
│ 🤖 LLM      │ │ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                       │   │
│ ➕ Novo     │ │ │ 150 │ │ 450 │ │ 200 │ │ R$45│                       │   │
│ ⚙️ Config   │ │ │Proc │ │Docs │ │Anal │ │Cost │                       │   │
│             │ │ └─────┘ └─────┘ └─────┘ └─────┘                       │   │
│             │ │                                                         │   │
│             │ │ ┌─────────────────┐ ┌─────────────────────────────────┐ │   │
│             │ │ │ Processos/Mês   │ │ Status dos Documentos           │ │   │
│             │ │ │ [Linha chart]   │ │ [Pizza chart]                   │ │   │
│             │ │ └─────────────────┘ └─────────────────────────────────┘ │   │
│             │ │                                                         │   │
│             │ │ 🔔 ATIVIDADES RECENTES                                  │   │
│             │ │ • Processo SEI-123 analisado (2 min atrás)             │   │
│             │ │ • 5 documentos baixados (10 min atrás)                 │   │
│             │ │ • Análise LLM concluída (1h atrás)                     │   │
│             │ └─────────────────────────────────────────────────────────┘   │
└─────────────┴───────────────────────────────────────────────────────────────┘
```

---

## 🎨 COMPONENTES INTERATIVOS

### **1. StatusChip Component**
```
Estados visuais:
✅ Concluído   - Verde (#2e7d32)
⏳ Pendente    - Laranja (#ed6c02)
❌ Erro        - Vermelho (#d32f2f)
🔄 Processando - Azul (#1976d2)

Animações:
- Processando: Spinner rotativo
- Hover: Elevação sutil
- Click: Ripple effect
```

### **2. ProcessCard Component**
```
┌─────────────────────────────────────┐
│ 📋 SEI-260002/001234/2025      ⋮   │ ← Número + Menu
│ Administrativo                      │ ← Tipo
│ Solicitação de documentos           │ ← Assunto (truncado)
│ ──────────────────────────────────  │
│ 👤 João Silva                       │ ← Interessado
│ 🏢 Secretaria de Administração      │ ← Órgão
│ ──────────────────────────────────  │
│ 📄 5 docs • ✅ 2 analisados         │ ← Métricas
│ 💰 R$ 0,15 • 📅 15/01/2025          │ ← Custo + Data
└─────────────────────────────────────┘

Interações:
- Hover: Elevação + border
- Click: Navegar para detalhes
- Menu: Editar, Excluir, Analisar
```

### **3. DocumentGrid Component**
```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ 📄 Doc-001  │ │ 📄 Doc-002  │ │ 📄 Doc-003  │
│ ┌─────────┐ │ │ ┌─────────┐ │ │ ┌─────────┐ │
│ │ [thumb] │ │ │ │ [thumb] │ │ │ │ [thumb] │ │ ← Thumbnail
│ └─────────┘ │ │ └─────────┘ │ │ └─────────┘ │
│ Despacho    │ │ Parecer     │ │ Anexo       │ ← Tipo
│ ✅ Analisado │ │ ⏳ Pendente  │ │ ❌ Erro     │ ← Status
│ 5 tags      │ │ 0 tags      │ │ 0 tags      │ ← Contadores
│ 👁️ 🏷️ ⬇️     │ │ 👁️ 🏷️ ⬇️     │ │ 👁️ 🏷️ ⬇️     │ ← Ações
└─────────────┘ └─────────────┘ └─────────────┘

Responsivo:
- Desktop: 4 colunas
- Tablet: 2-3 colunas  
- Mobile: 1 coluna
```

### **4. ProgressTracker Component**
```
Coleta de Processo: SEI-260002/001234/2025

🔄 PROGRESSO GERAL (75%)
████████████████████████████████████████████████████░░░░░░

✅ Validação da URL (2s)
✅ Extração de dados básicos (5s)
✅ Coleta de documentos (45s)
🔄 Análise LLM dos documentos (30s restantes)
⏳ Finalização e notificação

Estados:
- ✅ Concluído (verde)
- 🔄 Em andamento (azul + animação)
- ⏳ Pendente (cinza)
- ❌ Erro (vermelho)
```

---

## 📊 GRÁFICOS E VISUALIZAÇÕES

### **1. Dashboard Charts**

#### **Gráfico de Linha - Processos por Período**
```
Processos Coletados por Mês
 50 ┤
    │    ●
 40 ┤   ╱ ╲
    │  ╱   ╲
 30 ┤ ╱     ╲
    │╱       ●
 20 ┤         ╲
    │          ╲
 10 ┤           ●
    │
  0 └────────────────
    Jan  Fev  Mar  Abr

Interações:
- Hover: Tooltip com valores
- Click: Drill-down para período
- Zoom: Scroll para ampliar
```

#### **Gráfico de Pizza - Status Documentos**
```
Status dos Documentos

    Analisados (45%)
      ████████
    ╱        ╲
   ╱ Pendentes ╲
  ╱   (35%)     ╲
 ╱              ╲
╱    Erro (20%)  ╲
╲                ╱
 ╲              ╱
  ╲            ╱
   ╲__________╱

Cores:
- Analisados: Verde
- Pendentes: Laranja  
- Erro: Vermelho
```

### **2. LLM Dashboard Charts**

#### **Gráfico de Barras - Tokens por Dia**
```
Tokens Utilizados (Últimos 7 dias)

5K ┤     ██
   │     ██
4K ┤  ██ ██
   │  ██ ██
3K ┤  ██ ██ ██
   │  ██ ██ ██
2K ┤  ██ ██ ██ ██
   │  ██ ██ ██ ██
1K ┤  ██ ██ ██ ██ ██
   │  ██ ██ ██ ██ ██
 0 └─────────────────
   14 15 16 17 18 19 20
   Jan

Cores:
- Sucesso: Verde
- Erro: Vermelho
- Timeout: Laranja
```

---

## 🔄 ANIMAÇÕES E TRANSIÇÕES

### **Micro-interações**
```
Botões:
- Hover: Scale(1.02) + Elevação
- Click: Scale(0.98) + Ripple
- Loading: Spinner + Disabled

Cards:
- Hover: Elevação + Border highlight
- Click: Scale(0.99) + Feedback

Formulários:
- Focus: Border color + Label animation
- Error: Shake + Red border
- Success: Green border + Checkmark

Navegação:
- Page transition: Slide lateral
- Modal: Fade in + Scale up
- Drawer: Slide from side
```

### **Loading States**
```
Skeleton Loading:
┌─────────────────────────────────────┐
│ ████████████████░░░░░░░░░░░░░░░░░░░ │ ← Shimmer animation
│ ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ████████████░░░░░░░░░░░░░░░░░░░░░░░ │
│ ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└─────────────────────────────────────┘

Progress Bar:
████████████████████████████████████████████████████░░░░░░ 85%

Spinner:
    ⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠧ ⠇ ⠏ (rotativo)
```

---

## 🎯 FLUXOS DE ERRO E RECUPERAÇÃO

### **Erro de Conexão**
```
┌─────────────────────────────────────┐
│ 🔌 SEM CONEXÃO COM A API            │
│                                     │
│ Não foi possível conectar com      │
│ o servidor. Verifique sua conexão  │
│ e tente novamente.                  │
│                                     │
│ ┌─────────────┐ ┌─────────────┐     │
│ │ 🔄 Tentar   │ │ 📊 Offline  │     │
│ │   Novamente │ │   Mode      │     │
│ └─────────────┘ └─────────────┘     │
└─────────────────────────────────────┘
```

### **Página 404**
```
┌─────────────────────────────────────┐
│            🔍                       │
│         404 - Não Encontrado        │
│                                     │
│ A página que você procura não       │
│ existe ou foi movida.               │
│                                     │
│ ┌─────────────┐ ┌─────────────┐     │
│ │ 🏠 Início   │ │ ← Voltar    │     │
│ └─────────────┘ └─────────────┘     │
└─────────────────────────────────────┘
```

### **Lista Vazia**
```
┌─────────────────────────────────────┐
│            📋                       │
│      Nenhum processo encontrado     │
│                                     │
│ Você ainda não tem processos        │
│ cadastrados no sistema.             │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ➕ Adicionar Primeiro Processo  │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## 🎨 TEMAS E PERSONALIZAÇÃO

### **Tema Claro**
```
Background: #ffffff
Surface: #f5f5f5
Primary: #1976d2
Secondary: #dc004e
Text: #212121
Text Secondary: #757575
```

### **Tema Escuro**
```
Background: #121212
Surface: #1e1e1e
Primary: #90caf9
Secondary: #f48fb1
Text: #ffffff
Text Secondary: #b0b0b0
```

### **Modo de Alto Contraste**
```
Background: #000000
Surface: #1a1a1a
Primary: #ffff00
Secondary: #00ffff
Text: #ffffff
Text Secondary: #cccccc
```

---

## 📱 NOTIFICAÇÕES E FEEDBACK

### **Toast Notifications**
```
Sucesso:
┌─────────────────────────────────────┐
│ ✅ Processo criado com sucesso!     │ ← Verde, 3s
└─────────────────────────────────────┘

Erro:
┌─────────────────────────────────────┐
│ ❌ Erro ao conectar com a API       │ ← Vermelho, 5s
└─────────────────────────────────────┘

Info:
┌─────────────────────────────────────┐
│ ℹ️ Análise iniciada em background   │ ← Azul, 4s
└─────────────────────────────────────┘
```

### **Centro de Notificações**
```
┌─────────────────────────────────────┐
│ 🔔 NOTIFICAÇÕES (3)                 │
├─────────────────────────────────────┤
│ ✅ Processo SEI-123 analisado       │
│    2 minutos atrás                  │
├─────────────────────────────────────┤
│ 📄 5 documentos baixados            │
│    10 minutos atrás                 │
├─────────────────────────────────────┤
│ 🤖 Análise LLM concluída            │
│    1 hora atrás                     │
├─────────────────────────────────────┤
│ 🗑️ Limpar Todas                     │
└─────────────────────────────────────┘
```

---

## 🎯 PRÓXIMA ETAPA: IMPLEMENTAÇÃO

Com este planejamento detalhado, estamos prontos para iniciar a **Fase 7 - Desenvolvimento da Interface Web**. 

### **Ordem de Implementação Recomendada:**

1. **Setup do Projeto** (Dia 1)
   - Create React App + TypeScript
   - Material-UI + tema customizado
   - React Router + Zustand

2. **Layout Base** (Dia 1-2)
   - Header, Sidebar, Layout responsivo
   - Navegação básica

3. **Dashboard** (Dia 2-3)
   - Cards de métricas
   - Gráficos básicos
   - Lista de atividades

4. **Gestão de Processos** (Dia 3-4)
   - Lista com filtros
   - Detalhes do processo
   - Formulário de edição

5. **Novo Processo** (Dia 5-6)
   - Formulário de URL
   - Status de coleta
   - Integração com API

6. **Documentos e LLM** (Dia 7-8)
   - Lista de documentos
   - Dashboard LLM
   - Configurações

7. **Polimento Final** (Dia 9-10)
   - Responsividade
   - Animações
   - Testes E2E

**🚀 Pronto para começar a implementação!**

---

*Wireframes criados em: 20/01/2025*  
*Próximo passo: Setup do projeto React* 