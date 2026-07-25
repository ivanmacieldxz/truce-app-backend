# Truce Backend - Visión General

Truce es una app diseñada para fomentar el bienestar digital mediante gamificación y peer pressure (presión social positiva). A diferencia de los controles parentales tradicionales, Truce delega el control en los amigos del usuario.

## Componentes Clave:
- **NestJS (Backend RESTful):** Procesa la lógica de negocio y conexiones.
- **Supabase Auth:** Proveedor de identidad delegada (Autenticación). El backend no guarda contraseñas, solo valida tokens JWT.
- **Prisma + PostgreSQL:** Capa de datos y almacenamiento.
- **Firebase Cloud Messaging (FCM):** Motor de notificaciones en tiempo real. Usado para empujar alertas a los usuarios cuando reciben peticiones de tiempo de pantalla o solicitudes de amistad.

## Dominios de la Aplicación:
1. `Users`: Perfiles y tokens FCM.
2. `Friendships`: Gestión de red de contactos.
3. `TimeRequests`: Sistema core de peticiones de tiempo extra.
4. `UsageStats` y `AppLimits`: Sincronización y almacenamiento del histórico de uso de aplicaciones de los usuarios y sus límites definidos.
