# Qué hay en la app que NO está explicado en el whitepaper v4

El whitepaper describe las cinco primitivas (Identidad, Tesorería, Gobernanza, Censo, Federación), el rail fintech, el motor de reglas y la estrategia. La app incluye además lo siguiente, que **no** aparece o no se detalla en el documento.

---

## 1. Gamificación (XP, rachas, logros)

- **Qué es**: Sistema de puntos (XP), rachas de actividad, niveles y badges por acciones (votar, proponer, delegar, etc.).
- **Dónde**: `core/gamification/`, barra XP y racha en sidebar, BadgeGrid y toasts en dashboard/perfil.
- **En el whitepaper**: No se menciona. El doc se centra en derechos (voto, propuesta) y no en incentivos de participación.
- **Recomendación**: Dejarlo como capa de producto “engagement”; opcional: una línea en el whitepaper tipo “Participación puede reforzarse con mecanismos de engagement (p. ej. gamificación)”.

---

## 2. Documentos (almacén por categoría)

- **Qué es**: Página Documentos: subir/eliminar archivos por categoría (General, Acta, Contrato, Reglamento, Financiero, Otro), panel de retención.
- **Dónde**: `pages/documents/`, `core/documents/`, `DocumentRetentionPanel`.
- **En el whitepaper**: No hay una primitiva “Documentos”. Sí se habla de actas con firma SHA-256 en Gobernanza; el almacén genérico de archivos no está descrito.
- **Recomendación**: Considerar mencionar en el whitepaper “almacén de documentos de la comunidad (actas, contratos, reglamentos)” como parte de transparencia o de la capa de Gobernanza/Tesorería.

---

## 3. Partes relacionadas (Entities)

- **Qué es**: Entidades vinculadas a la comunidad (proveedores, contratistas, socios); CRUD, CLABE por entidad; se usan en contratos y posiblemente en propuestas.
- **Dónde**: `pages/entities/`, `core/entities/`.
- **En el whitepaper**: No se menciona. Table 2 habla de “Vendor selection” y pagos a proveedores, pero no un módulo de “related parties”.
- **Recomendación**: Añadir una frase en Tesorería o en “verticales”: “Las comunidades pueden mantener un registro de partes relacionadas (proveedores, contratistas) para contratos y desembolsos.”

---

## 4. Auditoría (audit log)

- **Qué es**: Registro de acciones por usuario (quién hizo qué, cuándo); página “Auditoría” en Settings (solo admin).
- **Dónde**: `shared/services/audit.service.ts`, `pages/settings/AuditLogPage.tsx`.
- **En el whitepaper**: En Security se dice “Full audit trail for every action”; no se detalla que hay una UI de auditoría para admins.
- **Recomendación**: Dejar como está; opcional: en la sección 14 (Security and Privacy) añadir “Los administradores pueden consultar un registro de auditoría de acciones en la comunidad.”

---

## 5. Tareas de implementación (implementation tasks)

- **Qué es**: Tras una propuesta aprobada, se pueden crear tareas de implementación (responsable, fecha, estado, progreso); “accountability” AC-001..AC-007.
- **Dónde**: `core/accountability/`, `ImplementationTracker` en detalle de propuesta.
- **En el whitepaper**: Se habla de “the decision IS the execution” (auto-ejecución financiera); no se habla de tareas de seguimiento para decisiones que requieren pasos manuales o no financieros.
- **Recomendación**: Añadir una frase: “Para decisiones que exigen pasos adicionales (no solo pago), el sistema permite crear tareas de implementación con responsable y seguimiento.”

---

## 6. Comité de vigilancia (Vigilancia)

- **Qué es**: Rol y página “Vigilancia” para comité (LPCI): informes de vigilancia, recomendaciones, seguimiento.
- **Dónde**: `pages/governance/VigilanciaPage.tsx`, `VigilanciaPanel`, rol `comite_vigilancia`.
- **En el whitepaper**: No se menciona LPCI ni comité de vigilancia. El doc es agnóstico de marco legal.
- **Recomendación**: Dejar como extensión normativa (LPCI); opcional: en Market o en una nota “Para verticales regulados (p. ej. condominios en México) el sistema soporta comités de vigilancia y obligaciones legales (LPCI).”

---

## 7. Moroso (aviso formal LPCI Art. 59)

- **Qué es**: Flujo de avisos formales a miembros morosos (pre-asamblea, advertencia, suspensión), notificación, acuse, resolución.
- **Dónde**: `core/identity/moroso.service.ts`, `MorosoAdminPanel`, `MorosoStatusBanner`, `MorosoNotice`, etc.
- **En el whitepaper**: Se dice que el moroso pierde derechos (pago condiciona voto); no se describe el flujo de notificación formal.
- **Recomendación**: Igual que vigilancia: extensión LPCI; opcional una línea en el whitepaper sobre “avisos formales y restricciones según marco legal”.

---

## 8. Asambleas, convocatorias, poderes (proxy)

- **Qué es**: Asambleas con convocatorias, asistentes, quórum, poderes (delegación para asamblea), registro de entrega de convocatoria.
- **Dónde**: `core/governance/assembly.service.ts`, `proxy.service.ts`, asambleas en UI.
- **En el whitepaper**: No se detalla; se habla de “governance” en abstracto.
- **Recomendación**: Considerar una frase: “Para comunidades que celebran asambleas presenciales o híbridas, el sistema soporta convocatorias, registro de asistencia y poderes.”

---

## 9. Actas con firma (minutes signing)

- **Qué es**: Actas por propuesta, firma con hash verificable (SHA-256), aprobación.
- **Dónde**: `governance.service.ts` (generateMinutes, signMinutes, approveMinutes).
- **En el whitepaper**: Sí: “Las firmas digitales de actas usan hashing SHA-256 para garantizar la integridad.”
- **Conclusión**: Está alineado; no hace falta añadir más.

---

## 10. Fase de discusión y declaración de resultado

- **Qué es**: Propuestas con fase de discusión (startDiscussion, openVotingFromDiscussion), declaración de resultado (declareOutcome), ventana de apelación (appealProposal).
- **Dónde**: `governance.service.ts`, flujo en `ProposalDetail`.
- **En el whitepaper**: Se habla de “proposals” y “voting”; no se detalla discusión → votación → resultado → apelación.
- **Recomendación**: Opcional: “Las propuestas pueden tener fase de discusión, votación, declaración de resultado y ventana de apelación configurables.”

---

## 11. Avales (endorsements)

- **Qué es**: Para que una propuesta pase a votación, puede requerir un número mínimo de avales de otros miembros; roles que pueden saltarse el requisito.
- **Dónde**: `governance.service.ts` (endorsements_required, addEndorsement, removeEndorsement), UI en propuestas.
- **En el whitepaper**: Table 5 y texto hablan de “proposal rights”; no se menciona explícitamente el aval como paso previo a votación.
- **Recomendación**: Opcional: “Las comunidades pueden exigir un número mínimo de avales antes de abrir la votación.”

---

## 12. Notificaciones (in-app y push)

- **Qué es**: Centro de notificaciones (campana), notificaciones in-app; opcional push (service worker, suscripción).
- **Dónde**: `NotificationBell`, `notification.service.ts`, `push-notification.service.ts`, Settings.
- **En el whitepaper**: No se menciona.
- **Recomendación**: No es necesario detallarlo en el whitepaper; es capa de UX estándar.

---

## 13. Onboarding (crear/elegir comunidad)

- **Qué es**: Wizard para crear una nueva comunidad o elegir una existente tras el registro.
- **Dónde**: `pages/onboarding/OnboardingWizard.tsx`.
- **En el whitepaper**: No se describe el flujo de onboarding.
- **Recomendación**: Opcional: una línea en Deployment o en Architecture: “Los usuarios nuevos pueden crear una comunidad o unirse a una existente mediante un flujo guiado.”

---

## 14. Vertical residencial (unidades, solicitudes de mantenimiento, áreas comunes)

- **Qué es**: Página y flujo específicos para vertical “residential”: directorio de unidades, solicitudes de mantenimiento, áreas comunes. **No está enlazada en rutas** (no hay `/residential` en el router).
- **Dónde**: `pages/residential/ResidentialPage.tsx`, `verticals/residential/`.
- **En el whitepaper**: Se mencionan condominios como mercado; no se describe un módulo “unidades / mantenimiento / áreas comunes”.
- **Recomendación**: Si se activa el vertical residencial en rutas, añadir en el whitepaper que el vertical residencial incluye unidades, solicitudes de mantenimiento y áreas comunes. Si no se usa, dejarlo como código preparado para el vertical.

---

## 15. Contratos (con parcialidades) y recurrentes

- **Qué es**: Tesorería: contratos con planes de pago (parcialidades) y cronogramas recurrentes (cobro/pago recurrente).
- **Dónde**: `ContractList`, `RecurringScheduleList`, servicios en treasury.
- **En el whitepaper**: Table 2 menciona “Vendor selection”, “Budget allocation”; no se habla de “contratos con N parcialidades” ni de “recurrentes” como entidad.
- **Recomendación**: Una frase en Tesorería: “Soporta contratos con planes de pago (parcialidades) y cobros o pagos recurrentes configurables.”

---

## 16. Planes de pago (payment plans) para morosos

- **Qué es**: Propuesta de plan de pago para un miembro con deuda; aprobación/cancelación; no está enlazado en la navegación.
- **Dónde**: `PaymentPlanManager`, `ProposePaymentPlan`, `PaymentPlanDetail`; no hay ruta ni entrada en menú.
- **En el whitepaper**: No se menciona.
- **Recomendación**: Integrar en la UI (Tesorería o perfil de miembro) o documentar como “próximamente”; y opcionalmente una línea en el whitepaper sobre “planes de pago para regularización de morosos”.

---

## 17. Privacidad (ARCO, aviso de privacidad)

- **Qué es**: Aviso de privacidad, derechos ARCO (acceso, rectificación, cancelación, oposición), panel y flujo.
- **Dónde**: `core/privacy/`, `PrivacyGate`, `ARCORightsPanel`, `PrivacyNoticeModal`.
- **En el whitepaper**: En Security/Privacy se habla de aislamiento y transparencia; no se menciona cumplimiento ARCO ni aviso de privacidad.
- **Recomendación**: Añadir en la sección 14: “Cumplimiento de aviso de privacidad y derechos ARCO (México) donde aplica.”

---

## 18. Exportar (PDF, Excel)

- **Qué es**: Exportar vista actual a PDF y listado de transacciones a Excel desde Tesorería.
- **Dónde**: `export.service.ts`, botones en `TreasuryPage`.
- **En el whitepaper**: No se menciona.
- **Recomendación**: No hace falta; es funcionalidad estándar de reporting.

---

## 19. Tema claro/oscuro

- **Qué es**: Selector de tema en el sidebar.
- **En el whitepaper**: No se menciona.
- **Recomendación**: No hace falta.

---

## Resumen

| En la app | En whitepaper | Acción sugerida |
|-----------|----------------|------------------|
| Gamificación | No | Dejar; opcional 1 línea |
| Documentos | No | Opcional: almacén de documentos |
| Partes relacionadas | No | Opcional: 1 frase en Tesorería/verticales |
| Audit log | Implícito (audit trail) | Opcional: 1 frase en Security |
| Tareas de implementación | No | Opcional: 1 frase |
| Vigilancia / Moroso / Asambleas / Poderes | No (LPCI) | Opcional: nota sobre marcos legales |
| Actas firmadas | Sí | Nada |
| Discusión / resultado / apelación | Parcial | Opcional: 1 frase |
| Avales | Parcial | Opcional: 1 frase |
| Notificaciones / Push | No | No necesario |
| Onboarding | No | Opcional: 1 frase |
| Vertical residencial | Implícito (condominios) | Activar ruta o documentar |
| Contratos / Recurrentes | No | Opcional: 1 frase en Tesorería |
| Planes de pago | No | Integrar en UI o “próximamente” |
| Privacidad ARCO | No | Añadir 1 frase en Security |
| Export PDF/Excel, tema | No | No necesario |

---

## Compliance con la ley mexicana

Todo el marco de **cumplimiento normativo mexicano** que implementa la app **no está explicado en el whitepaper**. El whitepaper es agnóstico de jurisdicción; la app incluye soporte explícito para:

- **LPCI CDMX** (Ley de Propiedad en Condominio de Inmuebles para la Ciudad de México): moroso (Art. 2, 36), avisos formales (Art. 59), quórum por convocatoria (Art. 33), convocatoria con anticipación (Art. 34), asambleas ordinarias trimestrales (Art. 31), poderes/representación (Art. 36), términos administrativos y reelección (Art. 42), comité de vigilancia y reportes (Art. 45-46), fondos mantenimiento/reserva (Art. 57-58), estados de cuenta mensuales (Art. 43), actas “conforme a LPCI”.
- **LFPDPPP** (Ley Federal de Protección de Datos Personales en Posesión de los Particulares): aviso de privacidad (Art. 15), derechos ARCO (Art. 21-34), revocación del consentimiento, panel de solicitudes ARCO.
- **Ley Fintech** (referencia en el whitepaper): el rail de pagos vía IFPE (Institución de Fondos de Pago Electrónico) está descrito en el whitepaper; la app prepara CLABE, referencia de pago y modo “fintech_rail” para cuando exista el socio.
- **Código de Comercio y NOM-151**: retención de documentos (plazos, categorías) en `retention.service` y `DocumentRetentionPanel`.

**Resumen**: El whitepaper no menciona LPCI, LFPDPPP ni retención documental. Para producto y legal conviene tener un documento de referencia que mapee ley → artículos → funcionalidad en app. Ver **`docs/compliance-ley-mexicana.md`**.
