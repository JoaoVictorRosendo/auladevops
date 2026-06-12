# ESTÁGIO 1: Build
FROM node:18-alpine AS builder
WORKDIR /app

# Copia apenas os arquivos de dependências primeiro
COPY package*.json ./

# Instala todas as dependências
RUN npm install

# Copia o restante do código
COPY . .

# ESTÁGIO 2: Produção (Imagem Final)
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copia apenas os arquivos necessários do estágio anterior
COPY --from=builder /app .

# Instala apenas o necessário para rodar (limpa o cache do npm no final)
RUN npm install --only=production && rm -rf /root/.npm

EXPOSE 4000
CMD ["npm", "start"]
