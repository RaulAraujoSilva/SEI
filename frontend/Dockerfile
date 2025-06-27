# Build stage
FROM node:18-alpine AS build

# Definir diretório de trabalho
WORKDIR /app

# Copiar package files primeiro (para cache do Docker)
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Production stage
FROM nginx:alpine

# Copiar arquivos build para nginx
COPY --from=build /app/build /usr/share/nginx/html

# Copiar configuração nginx customizada
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor porta
EXPOSE 80

# Comando padrão (nginx já é o default no container)
CMD ["nginx", "-g", "daemon off;"] 