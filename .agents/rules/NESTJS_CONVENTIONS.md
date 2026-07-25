# Reglas de NestJS y TypeScript

## 1. Tipado Estático Estricto (TypeScript)
- **Cero `any`**: Está estrictamente prohibido el uso del tipo `any`. Utiliza tipos explícitos, interfaces, genéricos o `unknown` con type guards si el tipo no se conoce a priori.
- **Retornos Explícitos**: Todas las funciones, métodos de servicios y handlers de controladores deben declarar explícitamente su tipo de retorno (ej. `async createRequest(...): Promise<TimeRequestDto>`).
- **Modo Estricto**: Respetar `strictNullChecks` y manejar explícitamente los casos `null` y `undefined`.
- **DTOs Inmutables**: Utilizar `readonly` en las propiedades de las clases DTO.

## 2. Arquitectura y Convenciones de NestJS
- **Inyección de Dependencias**: Depender siempre de abstracciones/servicios a través de la inyección por constructor nativa de NestJS. Preferir la inyección `private readonly`.
- **Separación Estricta de Responsabilidades**:
  - **Controllers**: Únicamente gestionan peticiones HTTP, validación de entrada (vía DTOs) y respuesta. Cero lógica de negocio.
  - **Services**: Contienen la lógica de negocio pura y orquestan la comunicación con la base de datos o APIs externas.
  - **Modules**: Cada dominio funcional debe estar encapsulado en su propio directorio dentro de `src/modules/<dominio>` (`AuthModule`, `UsersModule`, `TimeRequestsModule`, etc.).
- **Validación de Entradas (DTOs)**:
  - Usar `class-validator` y `class-transformer` en todos los DTOs de entrada (`@Body()`, `@Query()`, `@Param()`).
  - Habilitar `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` globalmente en `main.ts` para sanitizar payloads.
- **Manejo Centralizado de Excepciones**: Utilizar las excepciones HTTP nativas de NestJS (`NotFoundException`, `BadRequestException`, `ForbiddenException`). No retornar respuestas de error manuales con código 200, ni lanzar errores `500` genéricos por validaciones.

## 3. Clean Code & Naming Conventions
- **Archivos**: Usar convención kebab-case con el sufijo de NestJS (ej. `time-requests.controller.ts`, `create-time-request.dto.ts`).
- **Clases**: PascalCase (ej. `TimeRequestsService`).
- **Métodos y Variables**: camelCase (ej. `approveRequest`).
- **Comentarios**: Código auto-documentado. Evitar comentarios redundantes; usar nombres descriptivos de métodos y variables.
- **Paths Absolutos / Relativos**: Preferir importaciones limpias usando decoradores de TS si están configurados (ej. `src/...`), de lo contrario rutas relativas organizadas.
