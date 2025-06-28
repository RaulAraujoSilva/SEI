# 📋 **TAREFAS DE CORREÇÃO DE INCONSISTÊNCIAS FRONTEND-BACKEND**

*Data de Identificação: 28/06/2025*  
*Baseado em análise do Codex e verificação manual*

---

## 🔍 **INCONSISTÊNCIAS CONFIRMADAS**

### ✅ **1. DADOS MOCK AINDA PRESENTES**

#### **📄 DocumentoDetails.tsx - CRÍTICO**
**Status**: ❌ **CONFIRMADO - DADOS MOCK HARDCODED**
```typescript
// PROBLEMA: Dados fixos no código
const documento: Documento = {
  id: documentoId,
  processo_id: 1,
  numero_documento: 'DOC-2024001234', // ❌ HARDCODED
  // ... mais dados mock
};

const entidadesExtraidas = {
  pessoas: [
    { nome: 'João Silva Santos', cargo: 'Coordenador' }, // ❌ HARDCODED
  ]
};
```

#### **📄 NovoProcesso.tsx - PARCIALMENTE CORRIGIDO**
**Status**: ⚠️ **MIXTO - API REAL + SIMULAÇÕES**
```typescript
// ✅ USA API REAL: useCreateProcesso()
const createProcessoMutation = useCreateProcesso();

// ❌ MAS TEM SIMULAÇÕES: setTimeout para verificação de URL
await new Promise(resolve => setTimeout(resolve, 1500)); // ❌ MOCK
```

### ✅ **2. INCONSISTÊNCIAS DE NOMENCLATURA CONFIRMADAS**

#### **🔄 Campo `numero` vs `numero_documento`**
- **Frontend**: Usa `numero_documento` em alguns lugares
- **Backend**: Usa `numero` (campo correto)
- **Status**: ❌ **INCONSISTENTE**

#### **🔄 Campo `descricao` vs `assunto_documento`**
- **Frontend**: Usa `assunto_documento` em alguns lugares  
- **Backend**: Usa `descricao` (campo correto)
- **Status**: ❌ **INCONSISTENTE**

#### **🔄 Hook useDocumentos**
- **Status**: ✅ **CORRETO - PASSA FILTROS**
- **Verificado**: `queryFn: () => apiService.getDocumentos(filters)`

### ✅ **3. PÁGINAS JÁ CORRIGIDAS** 

#### **📄 DocumentosList.tsx**
**Status**: ✅ **CORRETO - USA API REAL**
```typescript
const { data: documentosResponse, isLoading, error } = useDocumentos(filtros);
const { data: estatisticas } = useEstatisticasDocumentos();
```

#### **📄 ProcessoDetails.tsx**  
**Status**: ✅ **CORRETO - USA API REAL**
```typescript
const { data: processo } = useProcesso(processoId);
const { data: documentosResponse } = useDocumentos({ processo_id: processoId });
const { data: andamentosResponse } = useAndamentos(processoId);
```

---

## 📝 **PLANO DE CORREÇÃO**

### **🎯 TAREFA 1: Corrigir DocumentoDetails.tsx**
**Prioridade**: 🔴 **CRÍTICA**

#### **Ações**:
1. **Remover dados mock hardcoded**
2. **Implementar hooks reais da API**
3. **Usar useDocumento(id) para dados reais**
4. **Implementar useDocumentoTags() e useDocumentoEntidades()**
5. **Conectar botões de ação às APIs reais**

#### **Código de Exemplo**:
```typescript
// ❌ REMOVER
const documento: Documento = { /* dados hardcoded */ };

// ✅ IMPLEMENTAR
const { data: documento, isLoading, error } = useDocumento(documentoId);
const { data: tags } = useDocumentoTags(documentoId);
const { data: entidades } = useDocumentoEntidades(documentoId);
```

### **🎯 TAREFA 2: Finalizar NovoProcesso.tsx**
**Prioridade**: 🟡 **MÉDIA**

#### **Ações**:
1. **Remover setTimeout de simulação**
2. **Implementar validação real de URL SEI via API**
3. **Conectar upload de documentos às APIs reais**

#### **API Necessária**:
```typescript
// Backend precisa implementar
POST /processos/validar-url  // ✅ JÁ EXISTE
POST /documentos/upload      // ✅ JÁ EXISTE  
```

### **🎯 TAREFA 3: Padronizar Nomenclatura de Campos**
**Prioridade**: 🟡 **MÉDIA**

#### **Frontend - Usar Nomenclatura do Backend**:
```typescript
// ❌ TROCAR
interface Documento {
  numero_documento: string;  // ❌ Inconsistente
  assunto_documento: string; // ❌ Inconsistente
}

// ✅ PARA
interface Documento {
  numero: string;      // ✅ Alinhado com backend
  descricao: string;   // ✅ Alinhado com backend
}
```

### **🎯 TAREFA 4: Implementar Hooks Faltantes**
**Prioridade**: 🟡 **MÉDIA**

#### **Hooks a Criar**:
```typescript
// Em useApi.ts - adicionar
export const useDocumentoTags = (id: number) => { /* implementar */ };
export const useDocumentoEntidades = (id: number) => { /* implementar */ };
export const useValidarUrlSei = () => { /* implementar */ };
export const useUploadDocumento = () => { /* implementar */ };
```

---

## 📊 **RESUMO DE STATUS**

| Componente | Status Atual | Ação Necessária |
|------------|--------------|-----------------|
| **DocumentosList.tsx** | ✅ **Correto** | - |
| **ProcessoDetails.tsx** | ✅ **Correto** | - |
| **DocumentoDetails.tsx** | ❌ **Dados Mock** | 🔴 **Correção Crítica** |
| **NovoProcesso.tsx** | ⚠️ **Parcial** | 🟡 **Finalizar APIs** |
| **useDocumentos Hook** | ✅ **Correto** | - |
| **Tipos/Interfaces** | ⚠️ **Inconsistente** | 🟡 **Padronizar** |

---

## 🚀 **CRONOGRAMA SUGERIDO**

### **Fase 1 - Crítica (1-2 dias)**
1. ✅ Corrigir DocumentoDetails.tsx completamente
2. ✅ Implementar hooks faltantes

### **Fase 2 - Importante (2-3 dias)**  
1. ✅ Finalizar NovoProcesso.tsx
2. ✅ Padronizar nomenclatura de campos
3. ✅ Testar integração completa

### **Fase 3 - Validação (1 dia)**
1. ✅ Testes end-to-end
2. ✅ Verificação de consistência
3. ✅ Deploy e validação final

---

## ✅ **CRITÉRIOS DE ACEITAÇÃO**

### **✅ DocumentoDetails deve**:
- [ ] Carregar dados reais via API
- [ ] Exibir loading states adequados
- [ ] Tratar erros de API
- [ ] Mostrar tags/entidades reais do LLM
- [ ] Conectar ações aos endpoints corretos

### **✅ NovoProcesso deve**:
- [ ] Validar URL SEI via API real
- [ ] Upload de documentos funcional
- [ ] Criar processo via API sem simulações
- [ ] Auto-completar dados quando possível

### **✅ Nomenclatura deve**:
- [ ] Usar campos consistentes com backend
- [ ] Interfaces TypeScript alinhadas
- [ ] Mapeamento correto em todos os componentes

---

**📌 Conclusão**: A maior parte do sistema já está correta. O foco deve ser na correção do `DocumentoDetails.tsx` e finalização de algumas funcionalidades simuladas.

**🎯 Meta**: Sistema 100% integrado com dados reais sem simulações ou dados hardcoded. 