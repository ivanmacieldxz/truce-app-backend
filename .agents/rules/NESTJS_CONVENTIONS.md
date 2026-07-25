# Reglas de NestJS y TypeScript

- **Módulos:** Siempre colocar todo el código de un dominio dentro de su respectivo directorio en `src/modules/<dominio>`.
- **Estructura de Carpeta de Módulo:** Cada módulo debe contener subcarpetas `dto/`, `entities/` (si aplica) y exportar explícitamente los servicios si son usados por otros módulos.
- **DTOs y Validación:** 
  - Usar `class-validator` y `class-transformer` en todas las clases DTO.
  - Asegurarse de que el global `ValidationPipe` con `whitelist: true` esté configurado en `main.ts` para sanitizar payloads maliciosos o con datos extras.
- **Inyección de Dependencias:** Preferir la inyección en constructores de forma `private readonly` y no inyectar objetos masivos, sino servicios específicos.
- **Paths Absolutos / Relativos:** Preferir importaciones limpias usando decoradores de TS si están configurados (ej. `src/...`), de lo contrario rutas relativas organizadas.
- **Filtros y Excepciones:** No lanzar errores `500` genéricos por validaciones. Usar `HttpException` o excepciones especializadas de `@nestjs/common` (ej. `BadRequestException`, `NotFoundException`).
