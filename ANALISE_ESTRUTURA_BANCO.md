# 🔍 ANÁLISE ESTRUTURA DE BANCO - SEI-Com AI
**Data:** 27/01/2025  
**Análise:** Estrutura atual vs. Especificação do usuário

## 📊 COMPARAÇÃO: ATUAL vs. ESPECIFICADO

### ✅ **1. TABELA: AUTUAÇÃO**

#### **ESPECIFICADO pelo usuário:**
```
1. Processo (SEI-070002/013015/2024) - Informado pelo usuário
2. Tipo (Administrativo: Elaboração de Correspondência) - Webscrape  
3. Data de Geração (16/07/2024) - Webscrape
4. Interessados - Webscrape
5. URL - Informado pelo usuário
6. Observação do usuário - Opcional
7. Data da última atualização - Automático
```

#### **ATUAL no código:**
```sql
-- Tabela: processos (centralizada)
id                  - PK
numero              - String(50) UNIQUE (SEI-070002/013015/2024)
tipo                - String(200) (Webscrape)
assunto             - Text (Novo campo - não especificado)
interessado         - Text (Webscrape - interessados)
situacao            - String(50) (Em tramitação, Concluído, etc.)
data_autuacao       - Date (Webscrape - data_geracao)
orgao_autuador      - String(200) (Órgão responsável)
url_processo        - Text (URL informada pelo usuário)
hash_conteudo       - String(100) (Hash para detecção de mudanças)
created_at          - DateTime (Data de criação)
updated_at          - DateTime (Data última atualização)

-- Tabela: autuacoes (separada - REDUNDANTE)
id                  - PK
processo_id         - FK
numero_sei          - String(50)
tipo                - String(200) 
data_geracao        - Date
interessados        - Text
created_at          - DateTime
```

#### **🔧 PROBLEMAS IDENTIFICADOS:**
1. **❌ REDUNDÂNCIA**: Dados duplicados entre `processos` e `autuacoes`
2. **❌ CAMPO FALTANDO**: Observação do usuário não existe
3. **✅ OK**: URL do processo existe
4. **✅ OK**: Data última atualização existe (updated_at)

---

### ✅ **2. TABELA: PROTOCOLOS/DOCUMENTOS**

#### **ESPECIFICADO pelo usuário:**
```
1. Numero do Processo/Documento - Webscrape
2. Link para o documento - Webscrape  
3. Tipo - Webscrape
4. Data - Webscrape
5. Data de Inclusão - Webscrape
6. Unidade - Webscrape
7. Assunto do documento - LLM
```

#### **ATUAL no código:**
```sql
-- Tabela: documentos
id                      - PK
processo_id             - FK
numero_documento        - String(50) ✅ (Numero do Documento)
tipo                    - String(200) ✅ (Tipo)
data_documento          - Date ✅ (Data)
data_inclusao           - Date ✅ (Data de Inclusão)
unidade                 - String(100) ✅ (Unidade)
arquivo_path            - String(500) (Caminho local do arquivo)
downloaded              - Boolean (Se foi baixado)
url_documento           - String (❌ FALTANDO - Link para documento)

-- Campos LLM
detalhamento_texto      - Text (Texto extraído)
detalhamento_status     - String(20) (pendente/processando/concluido/erro)
detalhamento_data       - DateTime (Data análise)
detalhamento_modelo     - String(100) (Modelo LLM usado)
detalhamento_tokens     - Integer (Tokens utilizados)
assunto_documento       - Text (❌ FALTANDO - Assunto gerado pelo LLM)

created_at              - DateTime
updated_at              - DateTime
```

#### **🔧 PROBLEMAS IDENTIFICADOS:**
1. **❌ CAMPO FALTANDO**: `url_documento` (Link para o documento)
2. **❌ CAMPO FALTANDO**: `assunto_documento` (Gerado pelo LLM)
3. **✅ OK**: Todos os outros campos existem

---

### ✅ **3. TABELA: ANDAMENTO**

#### **ESPECIFICADO pelo usuário:**
```
1. Data/Hora - Webscrape
2. Unidade - Webscrape
3. Descrição - Webscrape
4. Localização atual - Sistema (unidade + data mais recente)
```

#### **ATUAL no código:**
```sql
-- Tabela: andamentos
id                  - PK
processo_id         - FK
data_hora           - DateTime ✅ (Data/Hora)
unidade             - String(100) ✅ (Unidade)
descricao           - Text ✅ (Descrição)
created_at          - DateTime

-- Campo derivado (lógica de aplicação)
localizacao_atual   - ❌ FALTANDO (deve ser computed)
```

#### **🔧 PROBLEMAS IDENTIFICADOS:**
1. **❌ CAMPO FALTANDO**: `localizacao_atual` (deve ser calculado automaticamente)
2. **✅ OK**: Todos os campos de webscrape existem

---

## 🚨 **PROBLEMAS CRÍTICOS ENCONTRADOS**

### **1. Redundância de Dados**
- Tabela `autuacoes` está **duplicando** dados da tabela `processos`
- **Solução**: Remover tabela `autuacoes` ou consolidar

### **2. Campos Ausentes para Webscrape**
- `url_documento` em documentos
- `observacao_usuario` em processos  
- `assunto_documento` (gerado por LLM)
- `localizacao_atual` em andamentos

### **3. Campos Desnecessários**
- `assunto` em processos (não especificado)
- `orgao_autuador` em processos (não especificado)
- `situacao` em processos (não especificado)

---

## 📋 **ESTRUTURA CORRIGIDA PROPOSTA**

### **Tabela: processos**
```sql
id                      INTEGER PRIMARY KEY
numero                  VARCHAR(50) UNIQUE NOT NULL    -- SEI-070002/013015/2024
tipo                    VARCHAR(200) NOT NULL          -- Webscrape
data_geracao            DATE NOT NULL                  -- Webscrape
interessados            TEXT                           -- Webscrape
url_processo            TEXT NOT NULL                  -- Usuário
observacao_usuario      TEXT                           -- Usuário (opcional)
hash_conteudo           VARCHAR(100)                   -- Sistema
created_at              TIMESTAMP DEFAULT NOW()
updated_at              TIMESTAMP DEFAULT NOW()
```

### **Tabela: documentos**
```sql
id                      INTEGER PRIMARY KEY
processo_id             INTEGER REFERENCES processos(id)
numero_documento        VARCHAR(50) NOT NULL           -- Webscrape
url_documento           TEXT                           -- Webscrape (NOVO)
tipo                    VARCHAR(200)                   -- Webscrape
data_documento          DATE                           -- Webscrape
data_inclusao           DATE                           -- Webscrape
unidade                 VARCHAR(100)                   -- Webscrape
assunto_documento       TEXT                           -- LLM (NOVO)

-- Campos técnicos
arquivo_path            VARCHAR(500)
downloaded              BOOLEAN DEFAULT FALSE
detalhamento_status     VARCHAR(20) DEFAULT 'pendente'
detalhamento_modelo     VARCHAR(100)
detalhamento_tokens     INTEGER
detalhamento_data       TIMESTAMP
created_at              TIMESTAMP DEFAULT NOW()
updated_at              TIMESTAMP DEFAULT NOW()
```

### **Tabela: andamentos**
```sql
id                      INTEGER PRIMARY KEY
processo_id             INTEGER REFERENCES processos(id)
data_hora               TIMESTAMP NOT NULL             -- Webscrape
unidade                 VARCHAR(100)                   -- Webscrape  
descricao               TEXT                           -- Webscrape
localizacao_atual       BOOLEAN DEFAULT FALSE          -- Sistema (NOVO)
created_at              TIMESTAMP DEFAULT NOW()
```

---

## 🎯 **RECOMENDAÇÕES**

### **Prioridade 1 - Crítica**
1. **Remover tabela `autuacoes`** - Redundante
2. **Adicionar `url_documento`** em documentos
3. **Adicionar `observacao_usuario`** em processos
4. **Adicionar `assunto_documento`** em documentos

### **Prioridade 2 - Importante**  
1. **Implementar `localizacao_atual`** em andamentos (trigger/view)
2. **Remover campos desnecessários** (assunto, orgao_autuador, situacao)
3. **Ajustar frontend** para usar apenas campos especificados

### **Prioridade 3 - Melhorias**
1. **Criar índices** adequados
2. **Validações** de formato SEI
3. **Constraints** de integridade

---

## 📊 **IMPACTO NAS TELAS**

### **Telas que precisam de ajuste:**
1. **Dashboard** - Remover estatísticas não disponíveis
2. **ProcessosList** - Usar apenas campos especificados  
3. **ProcessoDetails** - Focar em dados reais do SEI
4. **NovoProcesso** - Incluir campo observação

### **Dados disponíveis para dashboards:**
- ✅ Quantidade de processos
- ✅ Quantidade de documentos por processo
- ✅ Status de análise LLM
- ✅ Localização atual (andamento mais recente)
- ❌ Situação do processo (não especificado)
- ❌ Órgão autuador (não especificado)

---

## 🚀 **PRÓXIMOS PASSOS**

1. **Revisar e aprovar** estrutura corrigida
2. **Criar migration** para ajustar banco
3. **Atualizar modelos** SQLAlchemy
4. **Ajustar APIs** e schemas
5. **Corrigir frontend** para usar dados corretos
6. **Atualizar documentação** 