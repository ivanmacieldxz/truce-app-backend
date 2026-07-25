# Convenciones de Base de Datos y Prisma ORM

## Estándares del Schema (`schema.prisma`)
- **Nombres de Tablas**: Usar PascalCase en los modelos de Prisma y mapear a snake_case en PostgreSQL mediante `@@map("nombre_tabla")`.
- **Nombres de Campos**: Usar camelCase en Prisma y mapear a snake_case en PostgreSQL mediante `@map("nombre_campo")`.
- **Claves Primarias**: Usar UUID v4 (`@id @default(uuid())`).
- **Timestamps**: Todas las tablas principales deben incluir `createdAt` (`@default(now())`) y `updatedAt` (`@updatedAt`).

## Relaciones Clave a Implementar
- **User**:
  - Un usuario tiene muchas `Friendships` (como iniciador o receptor).
  - Un usuario tiene un `fcmToken` asociado en su perfil principal para notificaciones.
  - Un usuario tiene muchas `TimeRequests` y `TimeRequestRecipients` (enviadas y recibidas).
- **TimeRequest**:
  - Un `TimeRequest` general está asociado al usuario emisor (`senderId`).
  - Tiene múltiples destinatarios a través de la relación uno a muchos con `TimeRequestRecipient`.

## Buenas Prácticas de Consultas
- Inyectar `PrismaService` en los servicios de NestJS. Todos los queries a base de datos deben realizarse a través de este servicio global, nunca instanciando el cliente directamente.
- Seleccionar únicamente los campos necesarios utilizando `select` en consultas complejas para evitar sobrecargar la memoria. Lo mismo aplica para relaciones (`include: { ... }`) para evitar problemas de N+1 queries o retornos masivos.
- Utilizar transacciones de Prisma (`prisma.$transaction`) al modificar múltiples tablas relacionadas dependientes entre sí (ej. actualizar estado de solicitud y decrementar créditos o contadores).
- **Generación:** No olvidar correr `npx prisma generate` cada vez que se modifique `schema.prisma`.
