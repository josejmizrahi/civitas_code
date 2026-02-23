# CIVITAS — Estructura de Navegación Completa

> Referencia definitiva de páginas, pestañas y secciones.
> Incluye el rediseño de Treasury con spend requests y la integración IFPE.
> Cada elemento indica: qué muestra, quién lo ve, y de dónde vienen los datos.
>
> **Origen:** `CIVITAS_NAVIGATION_STRUCTURE_1.md` (referencia de producto).
> **Brechas vs app actual:** ver `docs/NAVIGATION_GAP_ANALYSIS.md`.

---

## SIDEBAR (Navegación Principal)

Visible para todos los miembros de la comunidad.
Ruta base: `/c/:slug/`

```
🏠 Dashboard
👥 Comunidad
💰 Finanzas
⚖️ Gobernanza
🛡️ Vigilancia        ← solo rol: comite_vigilancia
⚙️ Configuración     ← solo rol: admin
```

---

## 1. DASHBOARD (`/c/:slug/dashboard`)

No tiene tabs. Es una vista consolidada de los 3 primitivos.

### Sección: KPIs (cards en la parte superior)

| KPI | Dato | Fuente |
|-----|------|--------|
| Saldo total | Ingresos - egresos (por fondo si separateFunds) | transactions |
| Ingresos del mes | SUM donde type=income, periodo actual | transactions |
| Egresos del mes | SUM donde type=expense, periodo actual | transactions |
| Tasa de cobranza | obligaciones cobradas / generadas × 100 | payment_obligations |
| Miembros morosos | COUNT donde standing=moroso | members |
| Saldo IFPE (si activo) | Query real-time a Broxel | ifpe API |

### Sección: Actividad Reciente (feed cronológico)

Últimas 10-15 acciones del sistema mezcladas:
- Transacciones registradas
- Propuestas creadas/cerradas
- Miembros que se unieron
- Cambios de standing
- Gastos ejecutados

Fuente: audit_log ORDER BY created_at DESC

### Sección: Propuestas Activas (si hay)

Cards de propuestas con status='active':
- Título, tipo (badge), fecha cierre
- Barra de quórum
- CTA: "Votar" (si el usuario no ha votado)

### Sección: Obligaciones Pendientes (vista del miembro)

Solo para el usuario actual:
- "Estás al corriente ✓" o "Debes $X"
- Lista de obligaciones pendientes con vencimiento
- CTA: referencia de pago SPEI (si modo IFPE)

### Sección: Alertas (si rol admin/vigilancia)

- Obligaciones vencidas sin acción
- Spend requests pendientes de aprobación
- Presupuestos excedidos

---

## 2. COMUNIDAD (`/c/:slug/community`)

### Tabs:

```
👥 Miembros | 📋 Directorio | 📊 Actividad
```

- **Miembros:** tabla administrativa, filtros, perfil de miembro con tabs (Pagos, Propuestas, Votos, Actividad).
- **Directorio:** vista social tipo tarjetas de contacto.
- **Actividad:** feed audit_log (member, community).

---

## 3. FINANZAS (`/c/:slug/treasury`)

### Tabs (doc):

```
📊 Dashboard | 📋 Solicitudes | 💳 Transacciones | 📐 Presupuestos | 🧾 Obligaciones | 🏢 Proveedores | 🏦 IFPE
```

Tab IFPE solo visible si treasury_mode IN ('ifpe', 'hybrid').

- **Dashboard:** KPIs, Ingresos vs Egresos, Desglose categoría, Presupuesto vs Real, Morosos.
- **Solicitudes:** spend requests (N1–N4), tabla/Kanban, detalle `/requests/:id`.
- **Transacciones:** tabla ejecutadas, detalle, "Registrar ingreso" / "Registrar corrección"; egresos solo vía solicitudes.
- **Presupuestos:** por categoría, gastado/disponible, propuesta que aprobó.
- **Obligaciones:** sub-tabs Cobranza | Cuotas Recurrentes | Mi Estado de Cuenta.
- **Proveedores:** entidades (lista + detalle, calificaciones).
- **IFPE:** sub-tabs Conciliación | Dispersiones | Rendimientos.

---

## 4. GOBERNANZA (`/c/:slug/governance`)

### Tabs (doc):

```
📝 Propuestas | 🏛️ Asambleas | 🤝 Delegaciones | 📜 Actas | ⚖️ Reglas
```

- **Propuestas:** lista, detalle con lifecycle, avales, discusión, votación, resultado, ejecución.
- **Asambleas:** lista + detalle (convocatoria, asistencia, proxies, propuestas tratadas).
- **Delegaciones:** estado actual, delegar/revocar.
- **Actas:** lista, detalle, firmar, PDF.
- **Reglas:** agrupadas (Quórum, Membresía, Tesorería, Morosos), historial, "Proponer cambio".

---

## 5. VIGILANCIA (`/c/:slug/vigilancia`)

Solo comite_vigilancia.

### Tabs (doc):

```
📋 Pendientes | 📊 Actividad | ⚠️ Alertas | 🚩 Marcadas | 🔍 Auditoría
```

---

## 6. CONFIGURACIÓN (`/c/:slug/settings`)

Solo admin.

### Tabs (doc):

```
🏢 General | 📂 Categorías | ✉️ Invitaciones | ⚖️ Reglas | 🔔 Notificaciones | 📋 Auditoría | 🔒 Privacidad
```

---

## 7. PÁGINAS ESPECIALES

- `/c/:slug/my-payments` — Mi estado de cuenta (acceso directo).
- `/profile` — Perfil usuario (fuera de comunidad).
- `/communities` — Selector de comunidad (si 2+).
- `/dashboard` — Multi-comunidad (doc: para admins multi-comunidad).
- `/onboarding` — Crear comunidad (6 pasos).
- `/invite/:token` — Aceptar invitación.

---

## RESUMEN: MAPA DE RUTAS (objetivo)

```
/dashboard          → Multi-comunidad
/communities        → Selector comunidad
/onboarding         → Crear comunidad
/profile            → Perfil usuario
/invite/:token      → Invitación

/c/:slug/dashboard
/c/:slug/community  → /members | /directory | /activity
/c/:slug/treasury   → /dashboard | /requests | /transactions | /budgets | /obligations | /entities | /ifpe
/c/:slug/governance → /proposals | /assemblies | /delegations | /minutes | /rules
/c/:slug/vigilancia → /pending | /activity | /alerts | /flagged | /audit
/c/:slug/settings   → /general | /categories | /invitations | /rules | /notifications | /audit | /privacy
/c/:slug/my-payments
```

---

## VISIBILIDAD POR ROL

| Sección       | Admin | Tesorero | Vigilancia | Miembro | Observador |
|---------------|-------|----------|------------|---------|------------|
| Dashboard     | ✓     | ✓        | ✓          | ✓       | ✓ limitado |
| Comunidad     | ✓+edit| ✓        | ✓          | ✓       | ✓ lectura  |
| Finanzas      | ✓+acc | ✓+acc    | ✓ verificar| ✓ ver   | ✓ ver      |
| Gobernanza    | ✓+gest| ✓ prop/vot | ✓ prop/vot | ✓ prop/vot | ✓ ver   |
| Vigilancia    | —     | —        | ✓          | —       | —          |
| Configuración | ✓     | —        | —          | —       | —          |

---

## CONEXIONES ENTRE SECCIONES (Cross-links)

Ver documento completo para la tabla: Treasury ↔ Governance ↔ Community ↔ Vigilancia ↔ IFPE (spend requests, propuestas, standing, conciliación, dispersiones).
