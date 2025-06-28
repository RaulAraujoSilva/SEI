import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import Layout from './components/Layout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import ProcessosList from './pages/ProcessosList';
import ProcessoDetails from './pages/ProcessoDetails';
import DocumentosList from './pages/DocumentosList';
import DocumentoDetails from './pages/DocumentoDetails';
import LLMDashboard from './pages/LLMDashboard';
import NovoProcesso from './pages/NovoProcesso';
import NovoProcessoSEI from './pages/NovoProcessoSEI';
import Configuracoes from './pages/Configuracoes';
import NotFound from './pages/NotFound';

const App: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Rota padrão carrega a Home */}
          <Route index element={<Home />} />
          
          {/* Dashboard */}
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* Processos */}
          <Route path="processos" element={<ProcessosList />} />
          <Route path="processos/:id" element={<ProcessoDetails />} />
          <Route path="processos/:id/editar" element={<ProcessoDetails />} />
          <Route path="processos/buscar" element={<ProcessosList />} />
          
          {/* Documentos */}
          <Route path="documentos" element={<DocumentosList />} />
          <Route path="documentos/:id" element={<DocumentoDetails />} />
          <Route path="documentos/:id/analise" element={<DocumentoDetails />} />
          <Route path="documentos/estatisticas" element={<DocumentosList />} />
          
          {/* LLM */}
          <Route path="llm" element={<LLMDashboard />} />
          <Route path="llm/custos" element={<LLMDashboard />} />
          <Route path="llm/config" element={<LLMDashboard />} />
          <Route path="llm/historico" element={<LLMDashboard />} />
          
          {/* Novo Processo */}
          <Route path="novo-processo" element={<NovoProcesso />} />
          <Route path="novo-processo/manual" element={<NovoProcesso />} />
          <Route path="novo-processo/status" element={<NovoProcesso />} />
          
          {/* Importar Processo SEI */}
          <Route path="processos/importar" element={<NovoProcessoSEI />} />
          
          {/* Configurações */}
          <Route path="configuracoes" element={<Configuracoes />} />
          
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Box>
  );
};

export default App; 