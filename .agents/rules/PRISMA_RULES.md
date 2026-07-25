# Reglas de Prisma ORM

- **Generación:** No olvidar correr `npx prisma generate` cada vez que se modifique `schema.prisma`.
- **Servicio Centralizado:** Todos los queries a base de datos deben realizarse inyectando `PrismaService` proveniente del `PrismaModule` global, nunca instanciando el cliente directamente.
- **Relaciones (Includes):** Solo cargar las relaciones necesarias (`include: { ... }`) para evitar problemas de N+1 queries o retornos masivos de datos. Seleccionar (usando `select: { ... }`) aquellos campos específicos si no se necesita el registro completo.
- **Transacciones:** Cuando se modifiquen múltiples tablas relacionadas dependientes entre sí (ej. aprobar una solicitud y guardar un log o cambiar estados múltiples), se deben empaquetar dentro de un `$transaction`.
