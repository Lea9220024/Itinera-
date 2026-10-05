# ITINERA — INFORME DE AUDITORÍA FASE 2
**Corrección Arquitectónica, Supabase, Persistencia e IA Segura**

Fecha de ejecución: 2026-10-04  
Versión de arquitectura: 2.0.0

---

## 1. Arquitectura del Sistema

### Qué se modificó
- **Frontend desacoplado de bases de datos e IA:** Los componentes React ya no realizan llamadas directas a APIs con claves privadas ni interactúan con almacenamiento de bajo nivel de forma desordenada.
- **Capa de Abstracción de Persistencia (`IStorageService`):**
  - `LocalStorageService`: Implementación para Demo Mode y fallback offline sin credenciales.
  - `SupabaseStorageService`: Implementación de producción para usuarios autenticados con Row Level Security en PostgreSQL.
- **Backend / Edge Functions:**
  - `server.ts`: Servidor Express seguro que aloja la ruta de proxy `/api/ai-assistant`, manteniendo `GEMINI_API_KEY` exclusivamente en el servidor.
  - `supabase/functions/ai-assistant/index.ts`: Edge Function oficial de Supabase con validación CORS, autenticación y esquema JSON estructurado.

---

## 2. Base de Datos (PostgreSQL en Supabase)

### Tablas creadas en `supabase/migrations/20261004000001_initial_schema.sql`:
1. **`profiles`**: Identidad de usuario (`id uuid PK references auth.users(id)`, `name`, `email`, `avatar_url`, `created_at`, `updated_at`).
2. **`user_preferences`**: Calibración del viajero (`id uuid PK`, `user_id uuid FK`, `travel_style jsonb`, `budget_level`, `interests jsonb`, `preferred_currency`).
3. **`trips`**: Viajes (`id uuid PK`, `user_id uuid FK`, `name`, `destination`, `description`, `start_date`, `end_date`, `travelers_count`, `budget_amount`, `budget_currency`, `travel_style`, `status`, `cover_image_url`).
4. **`trip_days`**: Jornadas del viaje (`id uuid PK`, `trip_id uuid FK ON DELETE CASCADE`, `day_number`, `date`, `city`, `notes`, `UNIQUE(trip_id, day_number)`).
5. **`activities`**: Actividades detalladas (`id uuid PK`, `trip_day_id uuid FK ON DELETE CASCADE`, `name`, `description`, `category`, `start_time`, `end_time`, `duration_minutes`, `location_name`, `address`, `latitude`, `longitude`, `estimated_cost`, `currency`, `notes`, `status`, `sort_order`).
6. **`expenses`**: Gastos (`id uuid PK`, `trip_id uuid FK ON DELETE CASCADE`, `category`, `description`, `amount`, `currency`, `date`).
7. **`checklist_items`**: Tareas preparatorias (`id uuid PK`, `trip_id uuid FK ON DELETE CASCADE`, `title`, `category`, `completed`, `sort_order`).
8. **`places`**: Puntos de interés guardados (`id uuid PK`, `trip_id uuid FK ON DELETE CASCADE`, `external_id`, `name`, `category`, `description`, `address`, `latitude`, `longitude`, `rating`, `image_url`, `metadata jsonb`).
9. **`memories`**: Diario de viaje (`id uuid PK`, `trip_id uuid FK ON DELETE CASCADE`, `title`, `description`, `image_url`, `date`, `location`).

---

## 3. Row Level Security (RLS)

- **Aislamiento Estricto por Usuario:** Se habilitó RLS en las 9 tablas (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).
- **Políticas Basadas en `auth.uid()`:**
  - `profiles`: Solo el propio usuario puede leer y actualizar su perfil (`auth.uid() = id`).
  - `user_preferences`: Solo el propietario puede acceder (`auth.uid() = user_id`).
  - `trips`: Operaciones `SELECT`, `INSERT`, `UPDATE`, `DELETE` restringidas a `auth.uid() = user_id`.
  - `trip_days`, `expenses`, `checklist_items`, `places`, `memories`: Cascada de propiedad mediante cláusulas `EXISTS (SELECT 1 FROM trips WHERE trips.id = trip_id AND trips.user_id = auth.uid())`.
  - `activities`: Doble unión de seguridad validando que `trip_days.trip_id -> trips.user_id = auth.uid()`.
- **Cero Políticas Globales Permisivas:** Ninguna tabla utiliza `true` para acceso indiscriminado.

---

## 4. Autenticación

- **Proveedor Centralizado (`src/contexts/AuthContext.tsx`):**
  - Implementa `useAuth()`, `signIn(email, password)`, `signUp(email, password, name)`, `signOut()`, `resetPassword(email)`.
  - Detección de sesión activa mediante `supabase.auth.getSession()` y suscripción a `onAuthStateChange`.
  - Creación automática de `profiles` y `user_preferences` mediante trigger PostgreSQL `on_auth_user_created` en `auth.users`.
- **Modo Demostración No Bloqueante:** Si el usuario no ha iniciado sesión, puede explorar todos los módulos del viaje demo local sin interrupciones.
- **Componente Modal (`src/components/auth/AuthModal.tsx`):** UI elegante para Iniciar Sesión, Registro y Recuperación de contraseña.

---

## 5. Arquitectura de IA Segura

- **Eliminación Total de `VITE_GEMINI_API_KEY`:** La clave de API de Gemini ya no se inyecta en variables de entorno accesibles por el cliente.
- **Canal Seguro:** `Usuario -> Frontend (AIService) -> Backend / Edge Function -> Gemini 3.8 Flash -> Validación Zod -> Frontend (AIActionProposal) -> Confirmación de Usuario -> Mutación de Datos`.
- **Respuestas Estructuradas sin Parsing Frágil:**
  - Eliminado el hack `split("---ACTION_PROPOSAL---")`.
  - Se emplea `StructuredAIResponseSchema` con Zod validando `{ message, action, title, description, payload }`.
  - Acciones soportadas: `NONE`, `ADD_ACTIVITY`, `MOVE_ACTIVITY`, `DELETE_ACTIVITY`, `UPDATE_BUDGET`, `OPTIMIZE_DAY`.
- **Protección contra Inyección de Prompts (`TripContextBuilder`):**
  - Saneamiento de textos de entrada.
  - Envío exclusivo del contexto mínimo necesario (fechas, ciudades, presupuesto y resumen de actividades), nunca la base de datos completa.
- **Aprobación Obligatoria:** La IA nunca modifica la base de datos de forma autónoma. Emite una propuesta visual con botones `[ACEPTAR]` y `[CANCELAR]`.

---

## 6. Migración desde LocalStorage

- **Servicio `MigrationService` (`src/services/MigrationService.ts`):**
  - Identifica datos existentes y el flag versionado `itinera_migration_version = '2.0.0'`.
  - Si el usuario inicia sesión y tiene viajes locales, el banner `MigrationBanner` le ofrece sincronizarlos.
  - Proceso no destructivo: Valida la integridad de la inserción en Supabase antes de marcar la versión migrada. LocalStorage nunca se vacía arbitrariamente.

---

## 7. PWA y Estado Offline

- **Detección de Red en Tiempo Real (`useNetworkStatus`):**
  - Indicador discreto en el Navbar: `ONLINE` (en verde) o `MODO OFFLINE` (en ámbar).
- **Service Worker (`public/sw.js`):**
  - Precacheo de cascarón HTML/CSS/JS y assets visuales.
  - Estrategia Network-First para APIs y Cache-First para estáticos.
  - Capacidad de consultar itinerarios previamente cacheados sin conexión.

---

## 8. Cobertura de Tests

Suite ejecutada con **Vitest** en `tests/itinera.test.ts` (14/14 tests pasando):
1. **Creación y Cálculo de Fechas:** Días y noches entre fechas, viajes de una jornada.
2. **Cálculo Presupuestario:** Gastos reales, costes estimados de actividades y saldo disponible.
3. **Ordenamiento y Movimiento de Actividades:** Orden cronológico por hora y transferencia entre días.
4. **Motor de Optimización (`ItineraryOptimizer`):**
   - Detección de solapamiento horario.
   - Cálculo de scores multi-criterio (`logistics`, `pacing`, `budget`, `distribution`, `overall`).
5. **Validación de Acciones de IA (`AIActionValidator`):**
   - Validación de payloads válidos de `ADD_ACTIVITY`.
   - Rechazo de horarios inválidos (ej. `25:99`).
   - Validación de `MOVE_ACTIVITY` y `UPDATE_BUDGET`.
   - Rechazo de presupuestos negativos.
6. **Integridad de Migración:** Constantes de versión y detección de estado de migración.

---

## 9. Seguridad Auditada

- **Cero API Keys en bundle cliente:** `GEMINI_API_KEY` reside exclusivamente en Node.js/Deno.
- **Validación Estricta de Entradas con Zod:** Los payloads no confiables son rechazados antes de llegar al estado o la base de datos.
- **RLS Verificado:** Nadie puede leer o mutar viajes de otros usuarios.
- **Sanitización de Contexto:** Previene vectores de Jailbreak o Prompt Injection desde notas del usuario.

---

## 10. Pendientes para Fase 3
- Integración de SDKs cartográficos de producción (Google Maps Platform / Mapbox) con routing y tiempos de tráfico en vivo.
- Autocompletado de lugares con Google Places API.
- Carga directa de imágenes en Supabase Storage (`user/{id}/trips/{id}/memories/`).
- Sincronización en tiempo real con WebSockets/Supabase Realtime para viajes compartidos y colaboradores.
