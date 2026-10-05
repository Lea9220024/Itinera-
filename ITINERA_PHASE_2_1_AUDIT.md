# ITINERA — INFORME DE AUDITORÍA FASE 2.1
**Hardening, Seguridad, Migración y Cierre de Arquitectura**

Fecha de ejecución: 2026-10-04  
Versión de arquitectura: 2.1.0  
Estado: Completado y Verificado (18/18 tests unitarios pasando, linter y build exitosos)

---

## 1. Matriz de Auditoría y Correcciones Ejecutadas

| Área | Estado Previo | Problema Detectado | Corrección Implementada |
| :--- | :--- | :--- | :--- |
| **IA (Inteligencia Artificial)** | Frontend llamaba por defecto a `/api/ai-assistant` (Express) en lugar de la función Supabase. | Duplicidad de mecanismos y falta de unificación bajo la Edge Function oficial. | Se actualizó `AIService.ts` para invocar primariamente `supabase.functions.invoke('ai-assistant')`. Se blindó la Edge Function (`supabase/functions/ai-assistant/index.ts`) con verificación de JWT de usuario, sanitización estricta de inputs (<1000 caracteres, anti-injection) y esquema estructurado garantizado. |
| **Auth (Autenticación)** | `AuthContext` gestionaba sesión pero las preferencias de usuario no sincronizaban bidireccionalmente con el perfil en pantalla. | Al cambiar preferencias en `ProfileView` no se reflejaba la cuenta activa ni se guardaban en Supabase si el usuario estaba logueado. | Se conectó `ProfileView` con `storage` activo (`SupabaseStorageService` cuando hay sesión, `LocalStorageService` en demo) y se añadió indicador visual del estado de cuenta conectada en Supabase. |
| **Supabase / Persistencia** | `SupabaseStorageService.ts` intentaba hacer `.upsert()` con `onConflict: 'id'` pasando strings no-UUID (como `trip-italia-2026` o `exp-1`) o `undefined`. | Error potencial en PostgreSQL al violar el tipo `UUID` o no encontrar restricción de conflicto única sobre claves nulas. | Se implementó el helper estricto `isValidUuid()`. Las entidades locales con IDs de texto ahora se insertan sin clave para que PostgreSQL ejecute `DEFAULT gen_random_uuid()`. La sincronización incluye conciliación y eliminación segura de registros huérfanos. |
| **Migración** | `MigrationService.ts` ejecutaba migración uno a uno, pero requería comprobación de integridad y evitar inserciones redundantes. | Si fallaba a mitad de camino, podía generar duplicados o quedar en estado inconsistente. | Se garantizó la idempotencia y verificación de inserciones en Supabase antes de sellar el flag versionado `CURRENT_MIGRATION_VERSION = '2.0.0'`. LocalStorage se preserva de forma no destructiva. |
| **Storage (Abstracción)** | Capa dividida entre local y Supabase con diferente manejo de IDs. | Falta de control sobre eliminación y ordenamiento de actividades en cascada. | Unificación del contrato `IStorageService`. Cascada controlada a nivel de esquema en base de datos (`ON DELETE CASCADE`) y conciliación por ID en el repositorio. |
| **PWA y Offline** | `public/sw.js` intentaba pre-cachear `/src/main.tsx` y `/src/index.css` que no existen en el build de producción compilado (`dist`). | Advertencias en consola del navegador y fallas silenciosas en la precarga del Service Worker. | Se depuró la lista de precache estático a activos inmutables (`/`, `/index.html`, `/manifest.json`, `/icon.svg`) y se adoptó estrategia Stale-While-Revalidate y caché dinámico v2.1. |
| **Tests** | Cobertura previa de 14 tests no cubría validación de UUIDs, sanitización de inyecciones de prompt ni fallback tolerante a fallos del parser de IA. | Posibles regresiones en sanitización y validación de esquemas Zod en producción. | Se expandió la suite Vitest a 18 tests (`tests/itinera.test.ts`), cubriendo `isValidUuid`, `TripContextBuilder` prompt sanitization, `AIActionValidator.validateResponse` y acciones completas (`ADD`, `MOVE`, `DELETE`, `UPDATE_BUDGET`). |

---

## 2. Flujo Arquitectónico Definitivo

### Flujo de Datos y Dominio:
```
React UI (Dashboard, Itinerario, Presupuesto, etc.)
   │
   ▼
Capa de Dominio & Estado (App.tsx / Contexts)
   │
   ▼
Contrato de Repositorio (IStorageService)
   ├─── Modo Autenticado ───► SupabaseStorageService ───► Supabase PostgreSQL (con RLS)
   └─── Modo Demo / Offline ─► LocalStorageService    ───► LocalStorage Navegador
```

### Flujo de Inteligencia Artificial (Segura y Estructurada):
```
Usuario realiza consulta en AIChatDrawer
   │
   ▼
TripContextBuilder (Sanitización anti-injection, contexto mínimo estricto)
   │
   ▼
AIService
   │
   ▼
Supabase Edge Function ('ai-assistant' vía supabase.functions.invoke)
   │  ├── Validación de token JWT de Auth
   │  ├── Sanitización de longitud y caracteres
   │  └── Llamada segura con GEMINI_API_KEY del servidor a Gemini 2.5 Flash
   ▼
Respuesta JSON Estructurada { message, action, title, description, payload }
   │
   ▼
AIActionValidator (Zod Schema Validation en el cliente)
   │
   ▼
AIActionProposal (Mostrado en UI con botones [Aceptar] y [Rechazar])
   │
   ▼ (Sólo tras confirmación explícita del usuario)
Lógica de Dominio en React ──► Repositorio IStorageService ──► Supabase / Local
```
**Regla inquebrantable:** La IA *nunca* modifica la base de datos de manera directa o autónoma. Siempre propone; el usuario aprueba; la aplicación ejecuta.

---

## 3. Verificación de Seguridad y Entorno

- **Cero claves expuestas:** `GEMINI_API_KEY` reside única y exclusivamente en los secretos de Supabase Edge Functions y el entorno del servidor.
- **Tipado TypeScript estricto:** `tsc --noEmit` completado sin errores.
- **Vite Clean Build:** Se corrigió el uso obsoleto de `__dirname` por `import.meta.dirname` en `vite.config.ts`.
- **Row Level Security:** Conservado al 100% en las 9 tablas de PostgreSQL bajo `auth.uid() = user_id`.

La Fase 2.1 queda completamente auditada, corregida, blindada y lista para la Fase 3.
