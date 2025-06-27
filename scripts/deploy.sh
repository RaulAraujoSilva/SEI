#!/bin/bash

# =============================================================================
# Script de Deploy Automatizado - SEI-Com AI
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Verificando pré-requisitos..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker não está instalado!"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose não está instalado!"
        exit 1
    fi
    
    log_success "Pré-requisitos OK"
}

# Check environment file
check_environment() {
    log_info "Verificando configurações de ambiente..."
    
    if [ ! -f "backend/.env" ]; then
        log_warning "Arquivo .env não encontrado. Criando a partir do exemplo..."
        if [ -f "backend/.env.example" ]; then
            cp backend/.env.example backend/.env
            log_warning "IMPORTANTE: Edite backend/.env com suas configurações!"
        else
            log_error "Arquivo .env.example não encontrado!"
            exit 1
        fi
    fi
    
    log_success "Configurações de ambiente OK"
}

# Build images
build_images() {
    log_info "Construindo imagens Docker..."
    
    docker-compose build --no-cache
    
    log_success "Imagens construídas com sucesso"
}

# Deploy services
deploy_services() {
    log_info "Fazendo deploy dos serviços..."
    
    # Stop existing services
    docker-compose down
    
    # Start services
    docker-compose up -d
    
    log_success "Serviços iniciados"
}

# Wait for services
wait_for_services() {
    log_info "Aguardando serviços ficarem prontos..."
    
    # Wait for PostgreSQL
    until docker-compose exec -T postgres pg_isready -U sei_user -d sei_scraper; do
        log_info "Aguardando PostgreSQL..."
        sleep 5
    done
    
    # Wait for backend
    until curl -f http://localhost:8000/health > /dev/null 2>&1; do
        log_info "Aguardando Backend..."
        sleep 5
    done
    
    # Wait for frontend
    until curl -f http://localhost:3000/health > /dev/null 2>&1; do
        log_info "Aguardando Frontend..."
        sleep 5
    done
    
    log_success "Todos os serviços estão prontos!"
}

# Run health checks
health_checks() {
    log_info "Executando verificações de saúde..."
    
    # Backend health
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        log_success "Backend: OK"
    else
        log_error "Backend: FALHOU"
        return 1
    fi
    
    # Frontend health
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        log_success "Frontend: OK"
    else
        log_error "Frontend: FALHOU"
        return 1
    fi
    
    # Database health
    if docker-compose exec -T postgres pg_isready -U sei_user -d sei_scraper > /dev/null 2>&1; then
        log_success "PostgreSQL: OK"
    else
        log_error "PostgreSQL: FALHOU"
        return 1
    fi
    
    log_success "Todas as verificações passaram!"
}

# Show deployment info
show_deployment_info() {
    log_success "=== DEPLOY CONCLUÍDO ==="
    echo ""
    echo "🌐 URLs de Acesso:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend:  http://localhost:8000"
    echo "   API Docs: http://localhost:8000/docs"
    echo ""
    echo "📊 Comandos Úteis:"
    echo "   Logs:     docker-compose logs -f"
    echo "   Status:   docker-compose ps"
    echo "   Stop:     docker-compose down"
    echo ""
    echo "📋 Checklist Pós-Deploy:"
    echo "   [ ] Configurar backup automático"
    echo "   [ ] Configurar monitoramento"
    echo "   [ ] Configurar SSL/HTTPS"
    echo "   [ ] Testar funcionalidades principais"
    echo ""
}

# Main deployment process
main() {
    echo ""
    log_info "=== INICIANDO DEPLOY SEI-COM AI ==="
    echo ""
    
    check_prerequisites
    check_environment
    build_images
    deploy_services
    wait_for_services
    health_checks
    show_deployment_info
    
    log_success "🎉 Deploy concluído com sucesso!"
}

# Run main function
main "$@" 