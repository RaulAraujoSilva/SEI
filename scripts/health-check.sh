#!/bin/bash

# =============================================================================
# Health Check Script - SEI-Com AI
# =============================================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Functions
check_service() {
    local service_name="$1"
    local url="$2"
    local description="$3"
    
    echo -n "Verificando $description... "
    
    if curl -f "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ OK${NC}"
        return 0
    else
        echo -e "${RED}❌ FALHOU${NC}"
        return 1
    fi
}

check_docker_service() {
    local service_name="$1"
    local description="$2"
    
    echo -n "Verificando $description... "
    
    if docker-compose ps "$service_name" | grep -q "Up"; then
        echo -e "${GREEN}✅ Rodando${NC}"
        return 0
    else
        echo -e "${RED}❌ Parado${NC}"
        return 1
    fi
}

get_service_stats() {
    echo -e "\n${BLUE}=== ESTATÍSTICAS DOS SERVIÇOS ===${NC}"
    docker-compose ps
    echo ""
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
}

main() {
    echo -e "${BLUE}=== HEALTH CHECK SEI-COM AI ===${NC}"
    echo ""
    
    failed=0
    
    # Check Docker services
    echo -e "${YELLOW}Docker Services:${NC}"
    check_docker_service "postgres" "PostgreSQL Container" || ((failed++))
    check_docker_service "redis" "Redis Container" || ((failed++))
    check_docker_service "backend" "Backend Container" || ((failed++))
    check_docker_service "frontend" "Frontend Container" || ((failed++))
    
    echo ""
    
    # Check HTTP endpoints
    echo -e "${YELLOW}HTTP Endpoints:${NC}"
    check_service "backend-health" "http://localhost:8000/health" "Backend API" || ((failed++))
    check_service "frontend-health" "http://localhost:3000/health" "Frontend" || ((failed++))
    check_service "api-docs" "http://localhost:8000/docs" "API Documentation" || ((failed++))
    
    echo ""
    
    # Check database connection
    echo -e "${YELLOW}Database:${NC}"
    echo -n "Verificando PostgreSQL... "
    if docker-compose exec -T postgres pg_isready -U sei_user -d sei_scraper > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Conectado${NC}"
    else
        echo -e "${RED}❌ Erro de conexão${NC}"
        ((failed++))
    fi
    
    # Check Redis
    echo -n "Verificando Redis... "
    if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Respondendo${NC}"
    else
        echo -e "${RED}❌ Não responde${NC}"
        ((failed++))
    fi
    
    # Show stats
    get_service_stats
    
    # Summary
    echo ""
    if [ $failed -eq 0 ]; then
        echo -e "${GREEN}🎉 TODOS OS SERVIÇOS ESTÃO SAUDÁVEIS!${NC}"
        exit 0
    else
        echo -e "${RED}❌ $failed serviço(s) com problema(s)${NC}"
        echo ""
        echo -e "${YELLOW}Para debug, execute:${NC}"
        echo "  docker-compose logs -f"
        exit 1
    fi
}

main "$@" 