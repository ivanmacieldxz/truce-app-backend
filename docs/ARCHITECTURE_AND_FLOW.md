# Especificación de la API RESTful — Truce Backend

Esta especificación define la interfaz RESTful para la comunicación entre la aplicación Android y el servidor backend de Truce.

## Convenciones Globales

- **Prefijo base**: `/api/v1`
- **Autenticación**: Todos los endpoints (salvo rutas públicas de salud o webhooks) requieren un token JWT en el encabezado `Authorization: Bearer <token>`.
- **Formato de datos**: `application/json`
- **Respuestas de error**: Excepciones HTTP estándar (`400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Server Error`).

---

## 1. Módulo de Usuarios (`/api/v1/users`)

Maneja el perfil del usuario, la búsqueda de contactos y el registro del token de notificaciones push.

| Método | Endpoint | Descripción | Body (Request) | Respuesta |
|---|---|---|---|---|
| `GET` | `/users/me` | Obtiene el perfil del usuario autenticado | *-* | `UserDto` |
| `PATCH` | `/users/me` | Permite la actualización de datos de usuario, usado típicamente para registrar o actualizar el token FCM para notificaciones push. | `{ email: string, username: string, fcmToken: string }` | `UserDto` |
| `GET` | `/users` | Busca usuarios por `username` para enviar solicitudes de amistad | Query: `?q=username&page=1&limit=20` | `UserSummaryDto[]` |

---

## 2. Módulo de Amistades (`/api/v1/friends`)

Gestiona la red de contactos, incluyendo el envío, aceptación, rechazo y cancelación de relaciones de amistad.

| Método | Endpoint | Descripción | Body (Request) | Respuesta |
|---|---|---|---|---|
| `GET` | `/friends` | Obtiene la lista de amigos confirmados (`ACCEPTED`) | Query: `?page=1&limit=20` | `FriendDto[]` |
| `GET` | `/friends/requests` | Lista solicitudes de amistad pendientes (enviadas o recibidas) | Query: `?type=incoming\|outgoing&page=1&limit=20` | `FriendshipRequestDto[]` |
| `POST` | `/friends/requests` | Envía una solicitud de amistad a otro usuario | `{ targetUserId: string }` | `FriendshipDto` (`201 Created`) |
| `PATCH` | `/friends/requests/:id` | Acepta o rechaza una solicitud de amistad recibida | `{ status: "ACCEPTED" \| "REJECTED" }` | `FriendshipDto` |
| `DELETE` | `/friends/:friendId` | Elimina a un usuario de la lista de amigos | *-* | `204 No Content` |

---

## 3. Módulo de Solicitudes de Tiempo Extra (`/api/v1/time-requests`)

Gestiona el flujo de peticiones de tiempo de pantalla entre amigos (*peer pressure*).

| Método | Endpoint | Descripción | Body (Request) | Respuesta |
|---|---|---|---|---|
| `POST` | `/time-requests` | Crea y envía una solicitud de tiempo extra a uno o múltiples amigos | `{ receiverIds: string[], appId: string, amountRequested, message? }` | `TimeRequestDto` (`201 Created`) |
| `GET` | `/time-requests` | Historial de solicitudes de tiempo (enviadas y recibidas). En caso de que el parámetro status no esté presente, devuelve todas sin filtro | Query: `?status=PENDING\|APPROVED\|DENIED&type=OUTGOING\|INCOMING&page=1&limit=20` | `TimeRequestDto[]` |
| `GET` | `/time-requests/:id` | Detalle de una solicitud (incluye el uso diario actual del amigo para evaluar) | *-* | `TimeRequestDetailDto` |
| `PATCH` | `/time-requests/:id` | Aprueba o rechaza la solicitud de tiempo recibida | `{ status: "APPROVED" \| "DENIED" }` | `TimeRequestDto` |

---

## 4. Módulo de Estadísticas de Uso (`/api/v1/usage-stats`)

Permite la sincronización de métricas de uso recopiladas por el cliente Android y la consulta de estadísticas.

| Método | Endpoint | Descripción | Body (Request) | Respuesta |
|---|---|---|---|---|
| `POST` | `/usage-stats/sync` | Sincronización en lote (*batch*) del tiempo usado por app en el día | `{ date, stats: [{ packageName, name, timeSpent }] }` | `{ syncedCount: number }` |
| `GET` | `/usage-stats/me` | Obtiene las estadísticas de uso del usuario para una fecha | Query: `?date=YYYY-MM-DD&page=1&limit=20` | `UserAppTimeDto[]` |
| `GET` | `/usage-stats/friends/:friendId` | Permite ver las estadísticas de uso de un amigo | Query: `?date=YYYY-MM-DD&page=1&limit=20` | `UserAppTimeDto[]` |

---

## 5. Módulo de Configuración de Límites (`/api/v1/app-limits`)

Gestiona los límites diarios que cada usuario configura por aplicación.

| Método | Endpoint | Descripción | Body (Request) | Respuesta |
|---|---|---|---|---|
| `GET` | `/app-limits` | Obtiene todos los límites configurados por el usuario | Query: `?page=1&limit=20` | `UserAppLimitDto[]` |
| `GET` | `/app-limits/:id` | Obtiene el detalle de un límite configurado | *-* | `UserAppLimitDto` |
| `POST` | `/app-limits` | Crea el límite diario para una aplicación | `{ packageName, name, dailyLimit }` | `UserAppLimitDto` (`201 Created`) |
| `PATCH` | `/app-limits/:id` | Modifica el límite diario configurado de una aplicación | `{ dailyLimit }` | `UserAppLimitDto` (`200 OK`) |
| `DELETE` | `/app-limits/:id` | Elimina el límite configurado para una app | *-* | `204 No Content` |

---

## 6. Módulo de Solicitudes de Gestión de Límites (`/api/v1/limit-requests`)

Gestiona las solicitudes de modificación (`MODIFY`), desactivación (`DISABLE`) y eliminación (`DELETE`) de límites diarios bajo el mecanismo de rendición de cuentas social (*peer pressure*).

| Método | Endpoint | Descripción | Body (Request) | Respuesta |
|---|---|---|---|---|
| `POST` | `/limit-requests` | Crea y envía una solicitud de modificación, desactivación o eliminación de límite a uno o múltiples amigos | `{ receiverIds: string[], appId: string, type: "MODIFY" \| "DISABLE" \| "DELETE", proposedLimit?: number, reason?: string }` | `LimitRequestDto` (`201 Created`) |
| `GET` | `/limit-requests` | Historial de solicitudes de límites (enviadas y recibidas). | Query: `?status=PENDING\|APPROVED\|REJECTED&type=OUTGOING\|INCOMING&page=1&limit=20` | `LimitRequestDto[]` |
| `GET` | `/limit-requests/:id` | Detalle completo de una solicitud (incluye el uso diario actual y estado del límite) | *-* | `LimitRequestDetailDto` |
| `PATCH` | `/limit-requests/:id` | Aprueba o rechaza la solicitud de límite recibida | `{ status: "APPROVED" \| "REJECTED" }` | `LimitRequestDto` |

### Lógica del Sistema en la Aprobación de Solicitudes de Límite

Cuando un amigo aprueba una solicitud (`PATCH /api/v1/limit-requests/:id` con `status: "APPROVED"`):

1. **Validación**: Se verifica que el usuario autenticado sea un destinatario pendiente de la solicitud.
2. **Transacción Atómica**:
   - Se actualiza el destinatario y la solicitud a `APPROVED`.
   - Se cancelan/rechazan las respuestas de otros amigos pendientes para esta solicitud.
   - Se aplica la acción correspondiente sobre el registro `UserAppLimit`:
     - `MODIFY`: Actualiza `dailyLimit` al valor de `proposedLimit`.
     - `DISABLE`: Actualiza `isEnabled` a `false`.
     - `DELETE`: Elimina físicamente el registro `UserAppLimit`.
3. **Notificación Push (FCM)**: Se emite un mensaje push con payload al solicitante:
   ```json
   {
     "type": "LIMIT_REQUEST_RESOLVED",
     "action": "SYNC_INBOX",
     "requestId": "uuid-de-la-solicitud",
     "requestType": "MODIFY | DISABLE | DELETE",
     "status": "APPROVED"
   }
   ```

---

## Lógica del Sistema en la Aprobación de Tiempo Extra

Cuando un amigo responde a una solicitud con estado `"APPROVED"` a través del endpoint `PATCH /api/v1/time-requests/:id`:

1. **Validación**: El servicio verifica que el usuario autenticado coincida con un destinatario (`receiverId`) de la solicitud y que el estado de su respuesta particular sea `PENDING`.
2. **Persistencia y Resolución de Conflictos**: Se actualiza el estado del registro individual (`TimeRequestRecipient`) a `APPROVED`. Inmediatamente, la solicitud general (`TimeRequest`) cambia a `APPROVED`. Para evitar dar tiempo duplicado, todas las demás respuestas pendientes de los otros amigos para esta misma solicitud se cancelan (pasan a `EXPIRED` o `DENIED`). Finalmente, el tiempo extra se suma al límite diario (`UserAppLimit`) del solicitante para esa aplicación (`appId`).
3. **Notificación Push (FCM)**: Se emite un mensaje push al token FCM del usuario solicitante (`senderId`) con la siguiente estructura de payload:

```json
{
  "type": "TIME_REQUEST_APPROVED",
  "requestId": "uuid-de-la-solicitud",
  "amountGranted": 15 // amount (number)
}
```
