# Compliance con la ley mexicana — Referencia app Civitas

Este documento mapea las leyes y normas mexicanas que la aplicación implementa o tiene en cuenta. Sirve como referencia para producto, legal y auditoría. **No sustituye asesoría jurídica.**

---

## 1. LPCI CDMX — Ley de Propiedad en Condominio de Inmuebles

Aplicable al vertical **condominio residencial** y a comunidades que elijan reglas compatibles con LPCI.

| Artículo / tema | Qué exige / regula | Dónde está en la app |
|-----------------|--------------------|----------------------|
| **Art. 2** (definiciones; moroso) | Condómino en mora: pérdida de derechos de voto y de ser electo; exclusión del quórum. Umbral típico: 2 cuotas ordinarias o 1 extraordinaria. | `rules.service.ts`: `canPerformAction` con `moroso_restrictions` (vote, be_elected, quorum_excluded). `identity.moroso_threshold_ordinary/extraordinary`, `payment_to_vote_enabled`. Mensajes UI: "Art. 2 LPCI". `MorosoAdminPanel`, `MorosoStatusBanner`, `CreateProposalDialog`, `ProposalContextPanel`, `EleccionFields` (aviso morosos no elegibles). |
| **Art. 31** | Asambleas ordinarias al menos cada tres meses; temas extraordinarios (ej. cambio de cuota) con quórum/mayoría calificada. | `GovernanceRules`: `quarterly_assembly_required`, `quorum_by_type` / `majority_by_type` (ordinary, extraordinary, amendment). `proposal-templates.ts`: guía para cambio de cuota como tema extraordinario. |
| **Art. 33** | Quórum por convocatoria: 1ª convocatoria 75% valor indiviso; 2ª 50%+1; 3ª quienes asistan. | `assembly.service.ts`: `computeQuorumTiers` (3 niveles). `GovernanceRules`: `quorum_first_call`, `quorum_second_call`, `quorum_third_call`. `QuorumTierIndicator`, `rules-catalog.ts` (legalRef Art. 33). |
| **Art. 34** | Convocatoria con anticipación mínima (ej. 7 días) antes de la asamblea. | `GovernanceRules`: `minimum_notice_days`. `assembly.service.ts`: validación al crear asamblea. `CreateAssemblyDialog`: mensaje "Art. 34 LPCI". |
| **Art. 36** | Poderes: administrador no puede representar a otros; un condómino no puede representar a más de 2 personas. | `proxy.service.ts`: validaciones antes de `grantProxy`; mensajes "Art. 36 LPCI". `ProxyManager` en detalle de asamblea. |
| **Art. 42** | Términos de administración: máximo de periodos consecutivos (ej. 2) y duración (ej. 12 meses). | `IdentityRules`: `admin_max_consecutive_terms`, `admin_term_months`. `terms.service.ts`: `admin_terms`, inicio/fin de periodo, `getCurrentTerm`. `AdminTermTracker`, pestaña Términos en Settings. `ProposalContextPanel`, `EleccionFields`: aviso reelección Art. 42. |
| **Art. 43** | Estados de cuenta mensuales a disposición de condóminos (por fondo mantenimiento/reserva). | `TreasuryRules`: `monthly_statement_auto`. `statement.service.ts`, `StatementList`, `StatementPDF`: generación y aprobación de estados; texto "Art. 43 LPCI CDMX" en PDF. |
| **Art. 45-46** | Comité de vigilancia: supervisión y reportes. | Rol `comite_vigilancia`. `terms.service.ts`: `VigilanciaReport` (reportes de vigilancia). `VigilanciaPanel`, `VigilanciaPage`: creación, envío y listado de reportes. Texto "LPCI CDMX Art. 45-46". |
| **Art. 57-58** | Dos fondos: mantenimiento y reserva; porcentaje a reserva. | `TreasuryRules`: `reserva_fund_percentage`, `FundType` mantenimiento/reserva. `FundSelector`, `TreasuryPage` (selector por fondo), `PresupuestoFields`/`GastoFields` (fondo en propuestas). `vertical-presets.ts`: preset residencial con 5% reserva. `rules-catalog.ts`: legalRef Art. 57-58. |
| **Art. 59** (avisos al moroso) | Notificación formal al moroso (pre-asamblea, advertencia, etc.). | `moroso.service.ts`: `MorosoNotice`, `createMorosoNotice`, `acknowledgeMorosoNotice`, `resolveMorosoNotice`, `getMorosoNotices`. Tipos de aviso y flujo de notificación/acuse. |
| Actas | Actas de asamblea con referencia a LPCI. | `governance.service.ts`: `generateMinutes` incluye texto "Conforme a la Ley de Propiedad en Condominio (LPCI CDMX)" y bloque Comité de Vigilancia en actas para vertical residencial. |

**Preset vertical**: `shared/config/vertical-presets.ts` — tipo `residential` con descripción "Configuración para condominios bajo LPCI CDMX" y reglas por defecto alineadas a los artículos anteriores.

---

## 2. LFPDPPP — Ley Federal de Protección de Datos Personales en Posesión de los Particulares

Aplicable al tratamiento de datos personales de usuarios y miembros en México.

| Artículo / tema | Qué exige / regula | Dónde está en la app |
|-----------------|--------------------|----------------------|
| **Art. 15** (aviso de privacidad) | Identidad del responsable, datos recabados, finalidades, mecanismos ARCO, revocación, cambios al aviso, cookies/tecnologías de rastreo. | `PrivacyNoticeModal`: aviso completo con referencias a LFPDPPP; bloques para Art. 15 I–VII. `ConsentCheckbox`: aceptación conforme LFPDPPP. |
| **Art. 21-34** (derechos ARCO) | Acceso, rectificación, cancelación y oposición; procedimiento para ejercerlos. | `ARCORightsPanel`: explicación de derechos ARCO y tipos de solicitud (acceso, rectificación, cancelación, oposición). `privacy.service.ts`: creación de solicitudes ARCO, exportación de datos; comentario "Required by LFPDPPP 2025 Art. 21-34". |
| Revocación del consentimiento | Posibilidad de revocar consentimiento y dejar de recibir comunicaciones. | `PrivacyNoticeModal`: sección revocación; referencia a solicitud ARCO de oposición. |

**Nota**: El archivo `shared/types/rules.ts` incluye en comentario "LFPDPPP 2025" como marco de cumplimiento.

---

## 3. Ley para Regular las Instituciones de Tecnología Financiera (Ley Fintech)

El whitepaper describe el modelo de **alianza con un IFPE** (Institución de Fondos de Pago Electrónico) para el rail de pagos. La app no opera el rail; prepara la configuración y la UX para cuando exista el socio.

| Tema | En la app |
|------|-----------|
| Modo de tesorería "Rail fintech" | `TreasuryRules.mode`: `fintech_rail`; selector en Settings; explicación en `CollectionView` (CLABE única, webhook, reconciliación). |
| CLABE y referencia de pago | Reglas: `clabe`, `payment_reference_prefix`, etc.; mostradas en Cuenta y cobro e instrucciones SPEI. |
| Referencia normativa | Whitepaper: "[2] Ley para Regular las Instituciones de Tecnología Financiera (2018). DOF Mexico." |

La implementación real del rail (API IFPE, webhooks, reconciliación automática) es Fase 2 y no está documentada en este doc de compliance de producto actual.

---

## 4. Código de Comercio y NOM-151

| Tema | Qué exige / regula | Dónde está en la app |
|------|--------------------|----------------------|
| Conservación de documentos (Código de Comercio Art. 38-52) | Plazos de guarda de documentación mercantil. | `retention.service.ts`: comentario "Document Retention — Código de Comercio Art. 38-52, NOM-151". |
| NOM-151 (mensajes de datos, conservación) | Conservación de mensajes de datos en formato que permita verificar integridad. | Referencia en tipos de gobernanza: `Document Retention — Código de Comercio Art. 38-52, NOM-151`. |
| UI de retención | Configuración de plazos por categoría de documento. | `DocumentRetentionPanel` en página Documentos; categorías y plazos. |

---

## 5. Resumen por ley

| Ley / norma | Alcance en la app |
|-------------|-------------------|
| **LPCI CDMX** | Moroso, quórum por convocatoria, convocatoria, poderes, términos administrativos, comité de vigilancia, fondos duales, estados de cuenta, actas, avisos formales moroso (Art. 59). |
| **LFPDPPP** | Aviso de privacidad (Art. 15), derechos ARCO (Art. 21-34), panel de solicitudes y exportación de datos. |
| **Ley Fintech** | Modelo descrito en whitepaper; app con modo `fintech_rail`, CLABE y referencia para futuro IFPE. |
| **Código de Comercio / NOM-151** | Lógica y UI de retención documental referenciadas en código y en tipos. |

---

## 6. Qué no está en el whitepaper

El whitepaper v4 **no** describe este marco de compliance mexicano. Menciona condominios como mercado y "pago condiciona voto"; no entra en LPCI, LFPDPPP ni retención. Para comunicar cumplimiento normativo (ventas, legal, condominios) conviene:

- Mantener este documento actualizado cuando se añadan artículos o funcionalidades.
- Opcional: añadir en el whitepaper una subsección breve tipo "Compliance y marcos legales" que indique que, para mercados como México, la plataforma soporta configuraciones alineadas a LPCI (condominios), LFPDPPP (datos personales) y preparación para operación con IFPE bajo Ley Fintech.
