import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  LinearProgress,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  ArrowBack,
  Search,
  Refresh,
  Save,
  CheckCircle,
  Error,
  Description,
  Timeline,
  ExpandMore,
  OpenInNew,
  Download,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { 
  useScrapingPreview, 
  ScrapingPreviewResponse,
  SalvarProcessoCompletoRequest 
} from '../hooks/useScrapingPreview';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const NovoProcessoSEI: React.FC = () => {
  const navigate = useNavigate();
  const { previewScraping, salvarProcessoCompleto, isLoading } = useScrapingPreview();
  
  const [url, setUrl] = useState('');
  const [dadosCarregados, setDadosCarregados] = useState<ScrapingPreviewResponse | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [tabAtiva, setTabAtiva] = useState(0);
  const [paginaProtocolos, setPaginaProtocolos] = useState(0);
  const [paginaAndamentos, setPaginaAndamentos] = useState(0);
  const [linhasPorPagina] = useState(5);

  const realizarScraping = async () => {
    if (!url || !url.includes('sei.rj.gov.br')) {
      setErro('URL inválida. Digite uma URL válida do SEI-RJ.');
      return;
    }

    setErro(null);
    
    try {
      const resultado = await previewScraping.mutateAsync(url);
      setDadosCarregados(resultado);
    } catch (error: any) {
      setErro(error.message || 'Erro ao carregar dados do SEI. Verifique a URL e tente novamente.');
    }
  };

  const salvarProcesso = async () => {
    if (!dadosCarregados) return;

    try {
      const request: SalvarProcessoCompletoRequest = {
        url: dadosCarregados.url_original,
        autuacao: dadosCarregados.autuacao,
        protocolos: dadosCarregados.protocolos,
        andamentos: dadosCarregados.andamentos
      };

      await salvarProcessoCompleto.mutateAsync(request);
      setSucesso(true);
    } catch (error: any) {
      setErro(error.message || 'Erro ao salvar processo no sistema.');
    }
  };

  const recarregarDados = () => {
    setDadosCarregados(null);
    setErro(null);
    setSucesso(false);
    realizarScraping();
  };

  if (sucesso) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" color="success.main" gutterBottom>
            Processo Importado com Sucesso!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            O processo <strong>{dadosCarregados?.autuacao.numero}</strong> foi importado e salvo no sistema.
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/processos')}
            sx={{ mr: 2 }}
          >
            Ver Processos
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => window.location.reload()}
          >
            Importar Novo Processo
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Importar Processo SEI
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Importe automaticamente dados de processos do Sistema Eletrônico de Informações
          </Typography>
        </Box>
      </Box>

      {/* Entrada da URL */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          URL do Processo SEI
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Cole a URL completa do processo no SEI-RJ para importar automaticamente todas as informações.
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://sei.rj.gov.br/sei/modulos/pesquisa/md_pesq_processo_exibir.php?..."
            disabled={isLoading}
            variant="outlined"
          />
          <Button
            variant="contained"
            onClick={realizarScraping}
            disabled={isLoading || !url}
            startIcon={isLoading ? <CircularProgress size={20} /> : <Search />}
            sx={{ minWidth: 140, height: 84 }}
          >
            {isLoading ? 'Carregando...' : 'Carregar Dados'}
          </Button>
        </Box>

        {isLoading && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Extraindo dados do SEI-RJ... Isso pode levar alguns segundos.
            </Typography>
          </Box>
        )}

        {erro && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {erro}
          </Alert>
        )}
      </Paper>

      {/* Dados Carregados */}
      {dadosCarregados && (
        <Paper sx={{ overflow: 'hidden' }}>
          {/* Informações da Autuação */}
          <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Informações da Autuação
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton
                  onClick={recarregarDados}
                  disabled={isLoading}
                  title="Recarregar dados"
                >
                  <Refresh />
                </IconButton>
                <Button
                  variant="contained"
                  color="success"
                  onClick={salvarProcesso}
                  disabled={isLoading}
                  startIcon={<Save />}
                >
                  Salvar Processo
                </Button>
              </Box>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6} lg={3}>
                <Card variant="outlined" sx={{ borderLeft: 4, borderLeftColor: 'primary.main' }}>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      Processo
                    </Typography>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Description color="primary" />
                      {dadosCarregados.autuacao.numero}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6} lg={3}>
                <Card variant="outlined" sx={{ borderLeft: 4, borderLeftColor: 'success.main' }}>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      Tipo
                    </Typography>
                    <Typography variant="body1">
                      {dadosCarregados.autuacao.tipo}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6} lg={3}>
                <Card variant="outlined" sx={{ borderLeft: 4, borderLeftColor: 'secondary.main' }}>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      Data de Geração
                    </Typography>
                    <Typography variant="body1">
                      {dadosCarregados.autuacao.data_autuacao}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {dadosCarregados.autuacao.interessado && (
                <Grid item xs={12} md={6} lg={3}>
                  <Card variant="outlined" sx={{ borderLeft: 4, borderLeftColor: 'warning.main' }}>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        Interessado
                      </Typography>
                      <Chip 
                        label={dadosCarregados.autuacao.interessado} 
                        color="warning" 
                        size="small"
                      />
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Box>

          {/* Tabs para Protocolos e Andamentos */}
          <Box>
            <Tabs 
              value={tabAtiva} 
              onChange={(_, newValue) => setTabAtiva(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab 
                icon={<Description />} 
                label={`Protocolos (${dadosCarregados.total_protocolos})`}
                iconPosition="start"
              />
              <Tab 
                icon={<Timeline />} 
                label={`Andamentos (${dadosCarregados.total_andamentos})`}
                iconPosition="start"
              />
            </Tabs>

            {/* Tab Protocolos */}
            <TabPanel value={tabAtiva} index={0}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Protocolo</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Data</TableCell>
                      <TableCell>Data Inclusão</TableCell>
                      <TableCell>Unidade</TableCell>
                      <TableCell>Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dadosCarregados.protocolos
                      .slice(paginaProtocolos * linhasPorPagina, paginaProtocolos * linhasPorPagina + linhasPorPagina)
                      .map((protocolo, index) => (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Typography variant="body2" color="primary" fontWeight="bold">
                            {protocolo.numero}
                          </Typography>
                        </TableCell>
                        <TableCell>{protocolo.tipo}</TableCell>
                        <TableCell>{protocolo.data}</TableCell>
                        <TableCell>{protocolo.data_inclusao}</TableCell>
                        <TableCell>
                          <Chip label={protocolo.unidade} size="small" />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {protocolo.url && (
                              <IconButton size="small" title="Visualizar no SEI">
                                <OpenInNew fontSize="small" />
                              </IconButton>
                            )}
                            <IconButton size="small" title="Baixar documento">
                              <Download fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {dadosCarregados.protocolos.length > linhasPorPagina && (
                <TablePagination
                  component="div"
                  count={dadosCarregados.protocolos.length}
                  page={paginaProtocolos}
                  onPageChange={(_, newPage) => setPaginaProtocolos(newPage)}
                  rowsPerPage={linhasPorPagina}
                  rowsPerPageOptions={[linhasPorPagina]}
                  labelDisplayedRows={({ from, to, count }) => 
                    `${from}-${to} de ${count} protocolos`
                  }
                />
              )}
            </TabPanel>

            {/* Tab Andamentos */}
            <TabPanel value={tabAtiva} index={1}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Data/Hora</TableCell>
                      <TableCell>Unidade</TableCell>
                      <TableCell>Descrição</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dadosCarregados.andamentos
                      .slice(paginaAndamentos * linhasPorPagina, paginaAndamentos * linhasPorPagina + linhasPorPagina)
                      .map((andamento, index) => (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {andamento.data_hora}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={andamento.unidade} color="secondary" size="small" />
                        </TableCell>
                        <TableCell>{andamento.descricao}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {dadosCarregados.andamentos.length > linhasPorPagina && (
                <TablePagination
                  component="div"
                  count={dadosCarregados.andamentos.length}
                  page={paginaAndamentos}
                  onPageChange={(_, newPage) => setPaginaAndamentos(newPage)}
                  rowsPerPage={linhasPorPagina}
                  rowsPerPageOptions={[linhasPorPagina]}
                  labelDisplayedRows={({ from, to, count }) => 
                    `${from}-${to} de ${count} andamentos`
                  }
                />
              )}
            </TabPanel>
          </Box>
        </Paper>
      )}

      {/* Instruções de Uso */}
      {!dadosCarregados && !isLoading && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Como usar esta ferramenta
          </Typography>
          
          <Box sx={{ mt: 2 }}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Chip label="1" color="primary" size="small" />
                  <Typography fontWeight="bold">
                    Obter a URL do processo
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography color="text.secondary">
                  Acesse o SEI-RJ, navegue até o processo desejado e copie a URL completa da página.
                  A URL deve começar com "https://sei.rj.gov.br/sei/modulos/pesquisa/..."
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Chip label="2" color="primary" size="small" />
                  <Typography fontWeight="bold">
                    Importar dados automaticamente
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography color="text.secondary">
                  Cole a URL no campo acima e clique em "Carregar Dados". O sistema irá extrair automaticamente:
                  informações de autuação, lista completa de protocolos e histórico de andamentos.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Chip label="3" color="primary" size="small" />
                  <Typography fontWeight="bold">
                    Revisar e salvar
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography color="text.secondary">
                  Revise os dados importados e clique em "Salvar Processo" para adicionar ao sistema.
                  Todos os documentos ficam vinculados às suas URLs originais no SEI.
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Box>
        </Paper>
      )}
    </Container>
  );
};

export default NovoProcessoSEI; 