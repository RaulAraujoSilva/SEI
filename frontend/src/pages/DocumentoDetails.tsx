import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  Divider,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Breadcrumbs,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tab,
  Tabs,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Delete,
  FileDownload,
  Psychology,
  Assignment,
  CalendarToday,
  Business,
  Category,
  Link as LinkIcon,
  Description,
  Warning,
  CheckCircle,
  Error,
  Schedule,
  Update,
  AttachFile,
  Tag,
  PictureAsPdf,
  Article,
  ExpandMore,
  SmartToy,
  AutoAwesome,
  Person,
  AccountBalance,
  MonetizationOn,
  LocationCity,
  TrendingUp,
  BusinessCenter,
} from '@mui/icons-material';
import StatusChip from '../components/StatusChip';
import { formatDate, formatFileSize } from '../utils';
import { Documento, StatusType } from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
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

const DocumentoDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const documentoId = parseInt(id || '0');
  
  // Estados locais
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [tabValue, setTabValue] = useState(0);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [analyzeDialog, setAnalyzeDialog] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Documento>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Dados mock realistas do documento SEI
  const documento: Documento = {
    id: documentoId,
    processo_id: 1,
    numero_documento: 'DOC-2024001234',
    url_documento: 'https://sei.rj.gov.br/sei/controlador.php?acao=documento_visualizar&id_documento=2024001234',
    tipo: 'Memorando',
    data_documento: '2024-07-16',
    data_inclusao: '2024-07-16T14:20:00Z',
    unidade: 'SEFAZ/COGET - Coordenação de Gestão Tecnológica',
    assunto_documento: 'Solicitação de orçamento para aquisição de equipamentos de tecnologia da informação para modernização do parque tecnológico da Secretaria de Fazenda',
    arquivo_path: '/uploads/sei_doc_2024001234.pdf',
    downloaded: true,
    detalhamento_status: 'concluido',
    detalhamento_modelo: 'gpt-4-turbo',
    detalhamento_tokens: 1250,
    detalhamento_data: '2024-07-17T10:30:00Z',

    created_at: '2024-07-16T14:20:00Z',
    updated_at: '2024-07-17T10:30:00Z',
  };

  // Dados mock de entidades extraídas por LLM
  const entidadesExtraidas = {
    pessoas: [
      { nome: 'João Silva Santos', cargo: 'Coordenador de Gestão Tecnológica', confianca: 0.98 },
      { nome: 'Subsecretário de Administração', cargo: 'Destinatário', confianca: 0.95 }
    ],
    orgaos: [
      { nome: 'SEFAZ/COGET', tipo: 'Unidade Remetente', confianca: 0.99 },
      { nome: 'Secretaria de Estado de Fazenda', tipo: 'Órgão Principal', confianca: 0.97 },
      { nome: 'Subsecretaria de Administração', tipo: 'Unidade Destinatária', confianca: 0.96 }
    ],
    valores: [
      { valor: 'R$ 1.250.000,00', descricao: 'Valor total estimado', confianca: 0.99 },
      { valor: '50', descricao: 'Computadores desktop', confianca: 0.95 },
      { valor: '25', descricao: 'Notebooks', confianca: 0.95 },
      { valor: '10', descricao: 'Servidores', confianca: 0.95 }
    ],
    datas: [
      { data: '2024-07-16', descricao: 'Data do documento', confianca: 0.99 },
      { data: 'próximo exercício fiscal', descricao: 'Prazo solicitado', confianca: 0.90 }
    ],
    assuntos: [
      { assunto: 'Aquisição de Equipamentos de TI', categoria: 'Principal', confianca: 0.98 },
      { assunto: 'Modernização Tecnológica', categoria: 'Secundário', confianca: 0.92 },
      { assunto: 'Orçamento', categoria: 'Secundário', confianca: 0.89 }
    ]
  };

  // Análise de sentimento e classificação
  const analiseCompleta = {
    classificacao: {
      tipo_documento: 'Memorando Interno',
      urgencia: 'Normal',
      confidencialidade: 'Pública',
      categoria: 'Solicitação Orçamentária',
      departamento: 'Tecnologia da Informação'
    },
    sentimento: {
      polaridade: 'Neutro',
      tom: 'Formal/Respeitoso',
      score: 0.1,
      confianca: 0.87
    },
    resumo_executivo: 'Memorando da SEFAZ/COGET solicitando orçamento de R$ 1.25 milhão para aquisição de equipamentos de TI, incluindo computadores, notebooks e servidores, visando modernização tecnológica e melhoria dos serviços aos contribuintes.',
    palavras_chave: ['orçamento', 'equipamentos', 'TI', 'modernização', 'SEFAZ', 'tecnologia', 'aquisição'],
    acoes_identificadas: [
      'Solicitar inclusão no orçamento',
      'Aprovar especificação técnica',
      'Avaliar disponibilidade orçamentária',
      'Iniciar processo licitatório'
    ]
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEdit = () => {
    setEditFormData(documento);
    setEditDialog(true);
  };

  const handleSaveEdit = async () => {
    try {
      console.log('Salvando alterações:', editFormData);
      setEditDialog(false);
    } catch (error) {
      console.error('Erro ao atualizar documento:', error);
    }
  };

  const handleDelete = async () => {
    try {
      console.log('Excluindo documento:', documentoId);
      setDeleteDialog(false);
      navigate(`/processos/${documento.processo_id}`);
    } catch (error) {
      console.error('Erro ao excluir documento:', error);
    }
  };

  const handleAnalyze = async () => {
    try {
      setIsAnalyzing(true);
      console.log('Iniciando análise do documento:', documentoId);
      setTimeout(() => {
        setIsAnalyzing(false);
        setAnalyzeDialog(false);
      }, 3000);
    } catch (error) {
      console.error('Erro ao analisar documento:', error);
      setIsAnalyzing(false);
    }
  };

  const handleDownload = () => {
    console.log('Baixando documento:', documento.arquivo_path);
    const link = document.createElement('a');
    link.href = documento.arquivo_path || '#';
    link.download = `${documento.numero_documento}.pdf`;
    link.click();
  };

  const getStatusIcon = (status: StatusType) => {
    switch (status) {
      case 'concluido': return <CheckCircle sx={{ color: 'success.main' }} />;
      case 'erro': return <Error sx={{ color: 'error.main' }} />;
      case 'processando': return <Schedule sx={{ color: 'warning.main' }} />;
      default: return <Warning sx={{ color: 'grey.500' }} />;
    }
  };

  const getTipoColor = (tipo: string) => {
    if (tipo.includes('Memorando') || tipo.includes('Ofício')) return 'primary';
    if (tipo.includes('Relatório') || tipo.includes('Análise')) return 'info';
    if (tipo.includes('Planilha') || tipo.includes('Orçamento')) return 'success';
    if (tipo.includes('Contrato') || tipo.includes('Termo')) return 'warning';
    if (tipo.includes('Parecer') || tipo.includes('Decisão')) return 'error';
    return 'default';
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !documento) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          Erro ao carregar detalhes do documento. {error?.message}
        </Alert>
        <Button variant="outlined" onClick={() => navigate(-1)}>
          Voltar
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Breadcrumbs sx={{ mb: 1 }}>
            <Link color="inherit" href="/processos" onClick={(e) => { e.preventDefault(); navigate('/processos'); }}>
              Processos
            </Link>
            <Link color="inherit" href={`/processos/${documento.processo_id}`} onClick={(e) => { e.preventDefault(); navigate(`/processos/${documento.processo_id}`); }}>
              SEI-070002/013015/2024
            </Link>
            <Typography color="text.primary">
              {documento.numero_documento}
            </Typography>
          </Breadcrumbs>
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton onClick={() => navigate(-1)}>
              <ArrowBack />
            </IconButton>
            <Box>
              <Typography variant="h4" component="h1">
                {documento.numero_documento}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {documento.tipo} • {documento.unidade}
              </Typography>
            </Box>
          </Box>
        </Box>
        
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<FileDownload />}
            onClick={handleDownload}
          >
            Download
          </Button>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={handleEdit}
          >
            Editar
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            onClick={() => setDeleteDialog(true)}
          >
            Excluir
          </Button>
          <Button
            variant="contained"
            startIcon={<LinkIcon />}
            href={documento.url_documento}
            target="_blank"
            rel="noopener noreferrer"
          >
            Abrir no SEI
          </Button>
        </Stack>
      </Box>

      {/* Informações Gerais do Documento */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Informações do Documento
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Assignment color="primary" />
                  <Typography variant="body2" color="text.secondary">
                    Número:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {documento.numero_documento}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Category color="primary" />
                  <Typography variant="body2" color="text.secondary">
                    Tipo:
                  </Typography>
                  <Chip
                    label={documento.tipo}
                    color={getTipoColor(documento.tipo) as any}
                    size="small"
                  />
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <CalendarToday color="primary" />
                  <Typography variant="body2" color="text.secondary">
                    Data Documento:
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(documento.data_documento || documento.created_at)}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Update color="primary" />
                  <Typography variant="body2" color="text.secondary">
                    Data Inclusão:
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(documento.data_inclusao || documento.created_at)}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Business color="primary" />
                  <Typography variant="body2" color="text.secondary">
                    Unidade:
                  </Typography>
                  <Typography variant="body1">
                    {documento.unidade}
                  </Typography>
                </Box>
              </Grid>

              {documento.assunto_documento && (
                <Grid item xs={12}>
                  <Box display="flex" alignItems="flex-start" gap={1}>
                    <Description color="primary" sx={{ mt: 0.5 }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Assunto (Gerado por IA):
                      </Typography>
                      <Typography variant="body1">
                        {documento.assunto_documento}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Grid>

          <Grid item xs={12} md={4}>
            {/* Status de Análise */}
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  {getStatusIcon(documento.detalhamento_status)}
                  <Typography variant="subtitle1">
                    Status da Análise
                  </Typography>
                </Box>
                <StatusChip status={documento.detalhamento_status} size="medium" />
                
                {documento.detalhamento_status === 'concluido' && (
                  <Box mt={2}>
                    <Typography variant="body2" color="text.secondary">
                      Modelo: {documento.detalhamento_modelo}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tokens: {documento.detalhamento_tokens?.toLocaleString('pt-BR')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Analisado: {formatDate(documento.detalhamento_data)}
                    </Typography>
                  </Box>
                )}

                {documento.detalhamento_status === 'pendente' && (
                  <Box mt={2}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<Psychology />}
                      onClick={() => setAnalyzeDialog(true)}
                    >
                      Analisar com IA
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Arquivo */}
            <Card variant="outlined">
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <AttachFile color="primary" />
                  <Typography variant="subtitle1">
                    Arquivo
                  </Typography>
                </Box>
                
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <PictureAsPdf color="error" />
                  <Typography variant="body2">
                    {documento.numero_documento}.pdf
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Tamanho: {formatFileSize(2048576)}
                </Typography>
                
                <Chip
                  label={documento.downloaded ? "Baixado" : "Não baixado"}
                  color={documento.downloaded ? "success" : "warning"}
                  size="small"
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs de Conteúdo */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="document content tabs">
            <Tab label="Conteúdo" icon={<Article />} iconPosition="start" />
            <Tab label="Entidades" icon={<Tag />} iconPosition="start" />
            <Tab label="Análise IA" icon={<SmartToy />} iconPosition="start" />
            <Tab label="Resumo" icon={<AutoAwesome />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Tab 1: Conteúdo do Documento */}
        <CustomTabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Conteúdo do Documento
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          {documento.detalhamento_status === 'concluido' ? (
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography 
                variant="body1" 
                component="pre" 
                sx={{ 
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.6
                }}
              >
                {'MEMORANDO Nº 123/2024/SEFAZ/COGET\n\nAo: Subsecretário de Administração\nDe: Coordenação de Gestão Tecnológica\nAssunto: Solicitação de Orçamento - Equipamentos de TI\n\n1. Apresentamos a necessidade de aquisição de equipamentos de tecnologia da informação para atualização do parque tecnológico desta Secretaria.\n\n2. Os equipamentos solicitados são essenciais para:\n   - Modernização dos serviços oferecidos aos contribuintes\n   - Melhoria da segurança da informação\n   - Aumento da eficiência operacional\n\n3. Segue em anexo a especificação técnica detalhada dos equipamentos necessários:\n   - 50 computadores desktop\n   - 25 notebooks\n   - 10 servidores\n   - Equipamentos de rede e segurança\n\n4. O valor estimado para a aquisição é de R$ 1.250.000,00 (um milhão, duzentos e cinquenta mil reais).\n\n5. Solicitamos a inclusão deste valor no orçamento do próximo exercício fiscal.\n\nRespeitosamente,\n\nJoão Silva Santos\nCoordenador de Gestão Tecnológica'}
              </Typography>
            </Paper>
          ) : (
            <Alert severity="info">
              Conteúdo do documento não foi extraído ainda. 
              {documento.detalhamento_status === 'pendente' && (
                <Button 
                  size="small" 
                  onClick={() => setAnalyzeDialog(true)}
                  sx={{ ml: 1 }}
                >
                  Analisar Agora
                </Button>
              )}
            </Alert>
          )}
        </CustomTabPanel>

        {/* Tab 2: Entidades Extraídas */}
        <CustomTabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Entidades Extraídas pela IA
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Person color="primary" />
                    <Typography variant="subtitle1">Pessoas ({entidadesExtraidas.pessoas.length})</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <List dense>
                    {entidadesExtraidas.pessoas.map((pessoa, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <Person fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={pessoa.nome}
                          secondary={`${pessoa.cargo} • Confiança: ${(pessoa.confianca * 100).toFixed(0)}%`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <AccountBalance color="primary" />
                    <Typography variant="subtitle1">Órgãos ({entidadesExtraidas.orgaos.length})</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <List dense>
                    {entidadesExtraidas.orgaos.map((orgao, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <LocationCity fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={orgao.nome}
                          secondary={`${orgao.tipo} • Confiança: ${(orgao.confianca * 100).toFixed(0)}%`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            </Grid>

            <Grid item xs={12} md={6}>
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <MonetizationOn color="primary" />
                    <Typography variant="subtitle1">Valores ({entidadesExtraidas.valores.length})</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <List dense>
                    {entidadesExtraidas.valores.map((valor, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <TrendingUp fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={valor.valor}
                          secondary={`${valor.descricao} • Confiança: ${(valor.confianca * 100).toFixed(0)}%`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CalendarToday color="primary" />
                    <Typography variant="subtitle1">Datas ({entidadesExtraidas.datas.length})</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <List dense>
                    {entidadesExtraidas.datas.map((data, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <CalendarToday fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={data.data}
                          secondary={`${data.descricao} • Confiança: ${(data.confianca * 100).toFixed(0)}%`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            </Grid>
          </Grid>
        </CustomTabPanel>

        {/* Tab 3: Análise Completa */}
        <CustomTabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Análise Inteligente do Documento
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Classificação
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Tipo:</Typography>
                      <Chip label={analiseCompleta.classificacao.tipo_documento} size="small" color="primary" />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Urgência:</Typography>
                      <Chip label={analiseCompleta.classificacao.urgencia} size="small" color="info" />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Categoria:</Typography>
                      <Chip label={analiseCompleta.classificacao.categoria} size="small" color="success" />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Departamento:</Typography>
                      <Chip label={analiseCompleta.classificacao.departamento} size="small" color="warning" />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Análise de Sentimento
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Typography variant="body2" color="text.secondary">Polaridade:</Typography>
                    <Chip label={analiseCompleta.sentimento.polaridade} size="small" />
                  </Box>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Typography variant="body2" color="text.secondary">Tom:</Typography>
                    <Typography variant="body2">{analiseCompleta.sentimento.tom}</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2" color="text.secondary">Confiança:</Typography>
                    <Typography variant="body2">{(analiseCompleta.sentimento.confianca * 100).toFixed(0)}%</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Palavras-chave
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {analiseCompleta.palavras_chave.map((palavra, index) => (
                      <Chip 
                        key={index} 
                        label={palavra} 
                        size="small" 
                        variant="outlined" 
                        color="primary" 
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Ações Identificadas
                  </Typography>
                  <List dense>
                    {analiseCompleta.acoes_identificadas.map((acao, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <CheckCircle color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={acao} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CustomTabPanel>

        {/* Tab 4: Resumo Executivo */}
        <CustomTabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Resumo Executivo
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body1" paragraph>
                {analiseCompleta.resumo_executivo}
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
                Pontos Principais:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><MonetizationOn color="primary" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Valor solicitado: R$ 1.250.000,00" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Assignment color="primary" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Finalidade: Modernização do parque tecnológico" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><BusinessCenter color="primary" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Unidade: SEFAZ/COGET" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Schedule color="primary" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Prazo: Próximo exercício fiscal" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </CustomTabPanel>
      </Paper>

      {/* Dialog de Edição */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Editar Documento</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Tipo"
                value={editFormData.tipo || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, tipo: e.target.value }))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Unidade"
                value={editFormData.unidade || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, unidade: e.target.value }))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Data do Documento"
                type="date"
                value={editFormData.data_documento || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, data_documento: e.target.value }))}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="URL do Documento"
                value={editFormData.url_documento || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, url_documento: e.target.value }))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Assunto (Gerado por IA)"
                value={editFormData.assunto_documento || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, assunto_documento: e.target.value }))}
                multiline
                rows={3}
                fullWidth
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSaveEdit} variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir o documento <strong>{documento.numero_documento}</strong>?
            Esta ação não pode ser desfeita e todas as análises serão perdidas.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>
            Cancelar
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Análise */}
      <Dialog open={analyzeDialog} onClose={() => !isAnalyzing && setAnalyzeDialog(false)}>
        <DialogTitle>Analisar Documento com IA</DialogTitle>
        <DialogContent>
          {isAnalyzing ? (
            <Box display="flex" flexDirection="column" alignItems="center" py={3}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography variant="body1">
                Analisando documento com GPT-4 Turbo...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Este processo pode levar alguns segundos.
              </Typography>
            </Box>
          ) : (
            <Typography>
              Esta ação irá analisar o documento usando inteligência artificial para extrair:
              <br />
              • Conteúdo textual completo
              • Entidades (pessoas, órgãos, valores, datas)
              • Classificação e categorização
              • Resumo executivo
              • Palavras-chave e ações identificadas
              <br /><br />
              O processo consume tokens do modelo de IA. Deseja continuar?
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          {!isAnalyzing && (
            <Button onClick={() => setAnalyzeDialog(false)}>
              Cancelar
            </Button>
          )}
          <Button 
            onClick={handleAnalyze} 
            variant="contained"
            disabled={isAnalyzing}
            startIcon={isAnalyzing ? <CircularProgress size={20} /> : <Psychology />}
          >
            {isAnalyzing ? 'Analisando...' : 'Analisar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentoDetails; 