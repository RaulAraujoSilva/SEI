"""
Aplicação principal FastAPI
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

# Importar modelos para criar tabelas (será usado quando implementarmos as rotas)
from app.models import processo  # noqa: F401
from app.database.connection import create_tables

app = FastAPI(
    title="SEI Scraper API",
    description="Sistema de Web Scraping para Processos SEI",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especificar domínios
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Criar tabelas no startup (para desenvolvimento)
@app.on_event("startup")
async def startup_event():
    """Eventos de inicialização da aplicação"""
    if os.getenv("ENVIRONMENT") != "test":
        create_tables()

@app.get("/")
async def root():
    """Endpoint de status da API"""
    return {
        "message": "SEI Scraper API",
        "version": "1.0.0",
        "status": "ok"
    }

@app.get("/health")
async def health_check():
    """Health check da aplicação"""
    return {
        "status": "healthy",
        "database": "connected"  # TODO: Implementar verificação real do banco
    }

# Incluir routers da API
from app.api.routes import processos, documentos, llm

app.include_router(processos.router, prefix="/api/v1/processos", tags=["processos"])
app.include_router(documentos.router, prefix="/api/v1/documentos", tags=["documentos"])
app.include_router(llm.router, prefix="/api/v1/llm", tags=["llm"]) 