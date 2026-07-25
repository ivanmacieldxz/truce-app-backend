<div align="center">
  <h1>Truce - Backend API</h1>
  <p><b>Gamificando el bienestar digital y el control de tiempo en pantalla mediante presión social positiva.</b></p>
</div>

## 🚀 Acerca del Proyecto

**Truce** es una aplicación móvil diseñada para ayudar a los usuarios a reducir y controlar su tiempo de pantalla. A diferencia de los controles parentales tradicionales, Truce introduce dinámicas de **gamificación** y **presión de pares** (peer pressure). 

Los usuarios establecen límites de uso diario para sus aplicaciones. Si un usuario agota su tiempo permitido, su aplicación se bloquea y deberá **solicitar tiempo extra a sus amigos** dentro de la app. Los amigos tienen el poder de aprobar o rechazar estas peticiones de tiempo, fomentando un uso de pantalla consciente, compartido y responsable.

Este repositorio contiene el **Backend (API REST)** encargado de procesar la lógica de negocio, las relaciones de amistad, las métricas de tiempo de pantalla y la autenticación.

## 🛠️ Stack Tecnológico

El proyecto está construido bajo los estándares más modernos para asegurar su escalabilidad y fácil mantenimiento:

- **Framework:** [NestJS](https://nestjs.com/) (TypeScript) - Estructura modular, inyección de dependencias y fuertemente tipado.
- **Base de Datos:** [PostgreSQL](https://www.postgresql.org/) - Base de datos relacional sólida.
- **ORM:** [Prisma](https://www.prisma.io/) - Acceso a la base de datos tipado y migraciones sencillas.
- **Autenticación:** [Supabase Auth](https://supabase.com/auth) / JWT - Delegación completa de la seguridad y sesión de usuario.
- **Validación:** `class-validator` y `class-transformer` mediante el `ValidationPipe` global de NestJS.

## 📂 Estructura Principal

La arquitectura modular sigue los principios de NestJS:

- `src/auth/`: Lógica de validación de tokens JWT (vía Supabase).
- `src/user/`: Gestión de usuarios, perfiles y tokens FCM para notificaciones Push.
- `src/request/`: Core de la app. Gestión de las peticiones de tiempo de pantalla entre amigos (aprobaciones/rechazos).
- `src/prisma/`: Módulo global para la inyección de la conexión a la BD mediante Prisma Client.

## 🚦 Primeros Pasos

### Prerrequisitos

- Node.js (v18 o superior recomendado)
- PostgreSQL (Instalado localmente o mediante Docker / Cloud)

### Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/ivanmacieldxz/truce-app-backend.git
   cd truce-app-backend
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura las variables de entorno:
   Configura la variable `DATABASE_URL` en un archivo `.env` en la raíz del proyecto o directamente en `prisma.config.ts`.
   ```env
   DATABASE_URL="postgresql://usuario:password@localhost:5432/truce_db?schema=public"
   ```

4. Aplica las migraciones a tu base de datos:
   ```bash
   npx prisma migrate dev
   ```

5. Inicia el servidor de desarrollo:
   ```bash
   npm run start:dev
   ```

El servidor estará escuchando por defecto en `http://localhost:3000`.

