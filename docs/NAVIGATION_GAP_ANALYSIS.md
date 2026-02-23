# Brechas: Estructura de navegación (doc vs app actual)

Referencia: **docs/CIVITAS_NAVIGATION_STRUCTURE.md** (resumen) y el documento completo de producto (CIVITAS_NAVIGATION_STRUCTURE_1.md).

---

## 1. URL y contexto de comunidad

| Doc | App actual |
|-----|------------|
| Ruta base **`/c/:slug/`** para toda la navegación dentro de una comunidad. Slug en URL. | Rutas **planas** sin slug: `/dashboard`, `/treasury`, `/members`, etc. Comunidad por **contexto** (selector en sidebar + `localStorage`). |
| `/c/:slug/dashboard`, `/c/:slug/treasury`, etc. | `/dashboard`, `/treasury`, etc. |

**Brecha:** La app no usa `slug` en la URL. Cambiar a `/c/:slug/...` implica:
- Envolver rutas protegidas en un layout que lea `slug` de la URL y fije `communityId` en contexto.
- Actualizar todos los `<Link>` y `navigate()` para incluir el slug (o un helper `communityPath()`).
- Selector de comunidad: ir a `/c/{slug}/dashboard` en lugar de solo cambiar contexto.

---

## 2. Sidebar (agrupación y ítems)

| Doc | App actual |
|-----|------------|
| **5 ítems principales:** Dashboard, Comunidad, Finanzas, Gobernanza, Vigilancia (solo vigilancia), Configuración (solo admin). | **Más ítems:** Dashboard, Tesorería, Gobernanza, Reglas, Miembros, Entidades, Documentos, Censo, Importación (+ Settings, Vigilancia para admin/vigilancia). |
| “Comunidad” agrupa: Miembros, Directorio, Actividad. | “Miembros” es ítem suelto. No hay “Directorio” ni “Actividad” como vistas. |
| “Finanzas” agrupa: Dashboard, Solicitudes, Transacciones, Presupuestos, Obligaciones, Proveedores, IFPE. | “Tesorería” es una sola ruta con **tabs internos** (Cobranza, Movimientos, Config) — no hay rutas hijas como `/treasury/requests`. |
| “Gobernanza” agrupa: Propuestas, Asambleas, Delegaciones, Actas, Reglas. | Gobernanza tiene tabs por **estado** (activas, discusión, borrador, cerradas, todas, asambleas). Reglas es **página aparte** (`/rules`). |
| Vigilancia: ruta propia `/c/:slug/vigilancia` con 5 tabs. | Vigilancia bajo `/governance/vigilancia`. |
| Configuración: solo admin, 7 tabs. | Settings en `/settings` con tabs (General, Categorías, Invitaciones, Reglas, Privacidad, Términos, etc.). Auditoría en `/settings/audit` como ruta separada. |

**Brechas:**
- Unificar sidebar en 5 bloques (Dashboard, Comunidad, Finanzas, Gobernanza, Vigilancia, Configuración) y mover Reglas/Censo/Documentos/Entidades dentro de esos bloques según el doc.
- Crear “Comunidad” con sub-rutas o tabs: Miembros, Directorio, Actividad.
- Finanzas: pasar a tabs/rutas por **función** (Dashboard, Solicitudes, Transacciones, Presupuestos, Obligaciones, Proveedores, IFPE) en lugar de Cobranza | Movimientos | Config.
- Gobernanza: tabs por **tipo de contenido** (Propuestas, Asambleas, Delegaciones, Actas, Reglas) en lugar de por estado.
- Vigilancia: ruta de primer nivel (o bajo `/c/:slug/vigilancia`) con tabs Pendientes, Actividad, Alertas, Marcadas, Auditoría.

---

## 3. Finanzas (Treasury) — detalle

| Doc | App actual |
|-----|------------|
| **Tab Solicitudes** (`/treasury/requests`): spend requests, niveles N1–N4, detalle `/requests/:id`. | No existe flujo unificado de “solicitudes de gasto” con N1–N4. Hay gastos manuales, aprobaciones discrecionales, propuestas; no una tabla/Kanban de “solicitudes” con este lifecycle. |
| **Tab Transacciones:** tabla con “Solicitud vinculada”, “Registrar ingreso”, “Registrar corrección”. Egresos solo vía solicitudes. | Transacciones listadas; no siempre enlazadas a “solicitud”; hay captura manual de egreso. |
| **Tab Presupuestos** como tab principal. | Presupuestos dentro de Tesorería > Config > Presupuestos (sub-tab). |
| **Tab Obligaciones** con sub-tabs: Cobranza | Cuotas Recurrentes | Mi Estado de Cuenta. | Cobranza está en tab principal; Recurrentes y “Mi estado” están en Config o en vista miembro. |
| **Tab Proveedores** (`/treasury/entities`). | Entidades en ruta aparte `/entities`. |
| **Tab IFPE** con Conciliación | Dispersiones | Rendimientos. | Panel IFPE (conciliación) existe dentro de Cobranza/CollectionView; no hay tabs Dispersiones ni Rendimientos. |

**Brechas:**
- Introducir modelo y UI de **spend requests** (N1–N4) y tab/ruta dedicada.
- Alinear transacciones con “solicitud vinculada” y restringir egresos a “solo por solicitud aprobada”.
- Subir Presupuestos y Obligaciones (Cobranza, Recurrentes, Mi Estado) a tabs de primer nivel de Finanzas.
- Mover Entidades bajo Finanzas como “Proveedores” (o mantener ruta pero enlazada desde Finanzas).
- Completar IFPE: sub-tabs Conciliación | Dispersiones | Rendimientos y rutas si se usa `/c/:slug/treasury/ifpe`.

---

## 4. Comunidad

| Doc | App actual |
|-----|------------|
| **Tab Directorio:** vista “tarjetas de contacto”, social. | No existe. |
| **Tab Actividad:** feed `audit_log` (member, community). | No existe como vista. |
| **Perfil de miembro:** tabs Pagos | Propuestas | Votos | Actividad. | MemberDetailPage existe; verificar si tiene esos 4 tabs. |

**Brechas:**
- Añadir vistas Directorio y Actividad (o tabs bajo “Comunidad”).
- Revisar perfil de miembro y alinear tabs con Pagos, Propuestas, Votos, Actividad.

---

## 5. Gobernanza

| Doc | App actual |
|-----|------------|
| Tabs: **Propuestas | Asambleas | Delegaciones | Actas | Reglas**. | Tabs por estado (activas, discusión, borrador, cerradas, todas, asambleas). Reglas en página aparte. |
| **Delegaciones** y **Actas** como tabs/páginas propias. | Delegación y actas existen en el producto pero pueden no estar como tabs de primer nivel en Gobernanza. |

**Brechas:**
- Reorganizar Gobernanza a tabs por **tipo**: Propuestas, Asambleas, Delegaciones, Actas, Reglas.
- Asegurar rutas o deep-links: `/governance/proposals`, `/governance/assemblies`, `/governance/delegations`, `/governance/minutes`, `/governance/rules`.

---

## 6. Vigilancia

| Doc | App actual |
|-----|------------|
| Tabs: **Pendientes | Actividad | Alertas | Marcadas | Auditoría**. | VigilanciaPage existe; revisar si tiene estos 5 tabs y vistas. |

**Brecha:** Verificar que existan las 5 pestañas y contenidos (sobre todo Alertas automáticas y Marcadas).

---

## 7. Configuración (Settings)

| Doc | App actual |
|-----|------------|
| Tabs: **General | Categorías | Invitaciones | Reglas | Notificaciones | Auditoría | Privacidad**. | General, Categorías, Invitaciones, Reglas, Privacidad, Términos; Notificaciones (push); Auditoría en ruta aparte. |

**Brecha:** Alinear nombres y conjunto de tabs (p. ej. Notificaciones con los 16 triggers del doc, Auditoría dentro de Settings como tab).

---

## 8. Páginas especiales

| Doc | App actual |
|-----|------------|
| `/c/:slug/my-payments` — acceso directo a “Mi estado de cuenta”. | No hay ruta `/my-payments`; el estado de cuenta del miembro está en Tesorería (vista miembro) o similar. |
| `/communities` — selector si 2+ comunidades. | Selector en sidebar (dropdown); no hay ruta dedicada. |
| `/dashboard` — multi-comunidad para admins. | Dashboard actual es por comunidad (contexto). |

**Brechas:**
- Añadir ruta “Mi estado de cuenta” (p. ej. `/my-payments` o `/c/:slug/my-payments`).
- Opcional: ruta `/communities` y dashboard multi-comunidad.

---

## 9. Resumen de prioridad para alinear

1. **Estructura de rutas y sidebar**  
   Decidir si se migra a `/c/:slug/...` y se reduce el sidebar a los 5 bloques del doc.

2. **Finanzas**  
   - Spend requests (N1–N4) y tab Solicitudes.  
   - Tabs: Dashboard, Solicitudes, Transacciones, Presupuestos, Obligaciones, Proveedores, IFPE.  
   - IFPE: Conciliación | Dispersiones | Rendimientos.

3. **Comunidad**  
   - Agrupar bajo “Comunidad” y añadir Directorio y Actividad.

4. **Gobernanza**  
   - Tabs por tipo (Propuestas, Asambleas, Delegaciones, Actas, Reglas).

5. **Vigilancia y Configuración**  
   - Completar 5 tabs de Vigilancia y 7 de Settings según doc.

6. **Mi estado de cuenta**  
   - Ruta directa `/my-payments` o equivalente.

Si indicas por qué parte quieres empezar (URLs, sidebar, Treasury, Comunidad, etc.), se puede bajar a tareas concretas por archivo y componente.
