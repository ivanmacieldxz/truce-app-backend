# Truce Backend - Visión General

Truce es una app diseñada para fomentar el bienestar digital mediante gamificación y peer pressure (presión social positiva). A diferencia de los controles parentales tradicionales, Truce delega el control en los amigos del usuario.

**Cliente Principal:** El consumidor primario de esta API RESTful es una **aplicación nativa Android**, la cual se encarga de recopilar el tiempo de uso localmente y comunicarse con este backend para sincronizar métricas y enviar/recibir peticiones.

## Componentes Clave:
- **NestJS (Backend RESTful):** Procesa la lógica de negocio, validaciones y peticiones.
- **Supabase Auth:** Proveedor de identidad delegada. El backend no maneja contraseñas; valida tokens JWT.
- **Prisma + PostgreSQL:** Capa de acceso a datos y almacenamiento estructurado relacional.
- **Firebase Cloud Messaging (FCM):** Motor de notificaciones push en tiempo real para alertar a los usuarios en sus dispositivos Android sobre peticiones de amistad o de tiempo.

## Lógica de Negocio Central (Peer Pressure)
El núcleo de la aplicación radica en que un usuario que ha agotado su tiempo (`AppLimit`) puede pedirle tiempo extra a un amigo (`TimeRequest`). Para que el amigo tome una decisión informada, **al visualizar la petición, el backend debe proveerle las estadísticas de uso diarias (`UsageStats`) del solicitante**. 
Si el amigo aprueba la solicitud, el estado de la petición central (`TimeRequest`) se actualiza y se emite una notificación push automática (vía FCM) al dispositivo Android del solicitante.

## Dominios de la Aplicación (Módulos):
La arquitectura sigue un enfoque modular aislado en `src/modules/`:

1. `Auth`: Responsable de integrar y validar los tokens JWT emitidos por Supabase.
2. `Users`: Gestión del perfil del usuario y registro de sus tokens de dispositivo (FCM) para notificaciones.
3. `Friendships`: Gestión del grafo social (envío, aceptación y cancelación de solicitudes de amistad).
4. `TimeRequests`: Motor central de peticiones de tiempo de pantalla. Maneja tanto la solicitud global como los destinatarios individuales (`TimeRequestRecipient`).
5. `UsageStats`: Responsable de la sincronización en lote (batch) de las métricas de uso recopiladas por el cliente Android, y almacenamiento histórico diario por aplicación. (También absorbe la gestión de `AppLimits`).
6. `Notifications`: Módulo de infraestructura enfocado exclusivamente en la emisión de mensajes push a través de Firebase.
