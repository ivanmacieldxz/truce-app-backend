# Modelo de Datos - Truce Backend

El modelo de datos de Truce está diseñado para soportar eficientemente las relaciones de amistad, el registro del tiempo de uso diario y el sistema de peticiones de tiempo. Utilizamos **PostgreSQL** administrado a través de **Prisma ORM**.

A continuación se detalla la estructura y propósito de cada entidad del sistema:

## Entidades Principales

### 1. User (Usuario)
Representa a los usuarios de la aplicación. La autenticación real está delegada a Supabase, por lo que esta tabla almacena los datos de perfil y la información necesaria para notificaciones.

- `id`: UUID único (suele coincidir o mapearse con el ID del usuario en Supabase).
- `email`: Correo electrónico (único).
- `username`: Nombre de usuario visible para otros (único).
- `fcmToken`: Token de Firebase Cloud Messaging. Es vital para poder enviarle notificaciones push cuando recibe solicitudes de amistad o peticiones de tiempo.
- `createdAt` / `updatedAt`: Fechas de auditoría.

*Relaciones:* Posee relaciones uno-a-muchos con las solicitudes de tiempo enviadas y recibidas, las amistades (iniciadas y recibidas), y las estadísticas de uso de aplicaciones.

### 2. Friendship (Amistad / Solicitud de Amistad)
Maneja el grafo social de la aplicación. Sirve tanto para representar solicitudes de amistad pendientes como conexiones confirmadas.

- `id`: UUID.
- `userId1`: Referencia al usuario que inicia la solicitud.
- `userId2`: Referencia al usuario que recibe la solicitud.
- `status`: Estado actual de la relación. Valores posibles: `PENDING` (solicitud enviada), `ACCEPTED` (son amigos), `REJECTED` (solicitud rechazada).
- `createdAt` / `updatedAt`: Fechas de registro y última actualización.

> **Nota:** Existe una restricción única (`@@unique([userId1, userId2])`) para evitar que dos usuarios tengan múltiples registros de amistad simultáneos.

### 3. TimeRequest (Solicitud de Tiempo Extra)
Registra las peticiones (peer pressure) que un usuario hace a un amigo cuando agota su límite de tiempo en pantalla.

- `id`: UUID.
- `senderId`: ID del usuario que se quedó sin tiempo y pide más.
- `receiverId`: ID del amigo al que se le solicita el tiempo.
- `amountRequested`: Cantidad de tiempo solicitada (en minutos).
- `message`: Mensaje opcional enviado por el solicitante (ej. "¡Porfa, estoy en medio de una partida!").
- `status`: Estado de la petición. Valores: `PENDING`, `APPROVED`, `DENIED`.
- `createdAt` / `updatedAt`: Tiempos de creación y resolución de la solicitud.

### 4. App (Aplicación)
Catálogo global de las aplicaciones instaladas en los dispositivos para evitar duplicación de texto y estandarizar los datos.

- `id`: UUID.
- `packageName`: Identificador único de la aplicación (ej. `com.whatsapp`, `com.instagram.android`).
- `name`: Nombre legible de la aplicación ("WhatsApp", "Instagram").

### 5. UserAppTime (Tiempo de Uso y Estadísticas)
Almacena cuánto tiempo ha usado un usuario una aplicación específica en un día en particular, así como su límite diario establecido. 

- `id`: UUID.
- `userId`: Referencia al usuario.
- `appId`: Referencia a la aplicación.
- `timeSpent`: Tiempo total utilizado en el día actual (en minutos). Este valor se actualiza periódicamente desde el cliente Android.
- `dailyLimit`: Límite máximo de tiempo permitido para esa app en ese día (en minutos).
- `date`: Fecha correspondiente al registro (sin considerar la hora, para agrupar estadísticas por día).

> **Caso de uso:** Cuando un amigo revisa una `TimeRequest`, el backend consultará esta tabla usando la fecha de hoy, el `senderId` y el `appId` involucrado (si la solicitud estuviese vinculada a una app específica) para mostrarle cuánto tiempo lleva usado realmente el solicitante.

## Diagrama de Relaciones Conceptual

```mermaid
erDiagram
    User ||--o{ Friendship : "Inicia (userId1)"
    User ||--o{ Friendship : "Recibe (userId2)"
    User ||--o{ TimeRequest : "Envía (senderId)"
    User ||--o{ TimeRequest : "Recibe (receiverId)"
    User ||--o{ UserAppTime : "Registra"
    App ||--o{ UserAppTime : "Es medida en"

    User {
        String id PK
        String email
        String username
        String fcmToken
    }
    Friendship {
        String id PK
        String status
    }
    TimeRequest {
        String id PK
        Int amountRequested
        String message
        String status
    }
    App {
        String id PK
        String packageName
        String name
    }
    UserAppTime {
        String id PK
        Int timeSpent
        Int dailyLimit
        DateTime date
    }
```
