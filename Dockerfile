# Etapa 1: Build
FROM node:20-slim AS builder

# Instalar dependencias necesarias para Prisma (OpenSSL es típicamente requerido por los engines de Prisma)
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar TODAS las dependencias (incluyendo las de desarrollo para compilar)
RUN npm ci

# Generar el cliente de Prisma
RUN npx prisma generate

# Copiar el resto del código fuente
COPY . .

# Compilar la aplicación NestJS
RUN npm run build

# Etapa 2: Producción
FROM node:20-slim AS production

# Instalar OpenSSL
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Configurar el entorno en producción
ENV NODE_ENV=production

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar SOLO las dependencias de producción
RUN npm ci --omit=dev

# Generar el cliente de Prisma para producción
RUN npx prisma generate

# Copiar los archivos compilados desde la etapa de build
COPY --from=builder /app/dist ./dist

# Exponer el puerto (Render lo sobreescribirá dinámicamente inyectando PORT en las variables de entorno)
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "run", "start:prod"]
