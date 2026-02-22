# P0 Contrato de permisos por acción

Mapeo acción → rol/permiso requerido, servicio que debe validar, y política RLS de respaldo.

## Convenciones

- **Rol estático:** `admin`, `tesorero`, `comite_vigilancia`, `miembro`, `observador`, `platform_admin`.
- **Permiso dinámico:** si existe tabla `roles` con `permissions` JSONB, se usa `hasDynamic(permission)` además de `hasPermission(role, requiredRole)`.
- **Reglas de negocio:** `canPerformAction(action, role, financialStanding, rules)` para vote/propose/delegate/be_elected/quorum_excluded.

## Tabla de acciones críticas

| Acción | Rol mínimo / permiso | Servicio que debe validar | RLS / función |
|--------|----------------------|---------------------------|----------------|
| `create_community` | authenticated | identity.service (createCommunity) | communities INSERT: auth.uid() not null |
| `update_community` | admin | rules.service, identity | communities UPDATE: get_user_role(id) = 'admin' |
| `create_member` (invite accept) | self + invitation válida O admin | identity.service (acceptInvitation) | members INSERT: user_id = auth.uid() O get_user_role(community_id) = 'admin' (ver migración 052) |
| `create_invitation` | admin | identity.service (createInvitation) | invitations INSERT: get_user_role(community_id) = 'admin' |
| `update_member` | admin | identity.service | members UPDATE: get_user_role(community_id) = 'admin' |
| `create_proposal` | miembro + canPerformAction('propose') | proposal.service (createProposal) | proposals INSERT: get_user_role(community_id) IN ('admin','comite_vigilancia','tesorero','miembro') |
| `start_discussion` | admin | proposal.service (startDiscussion) | proposals UPDATE por RLS |
| `open_voting` | admin | proposal.service (openVotingFromDiscussion) | idem |
| `close_proposal` | admin / sistema (auto-close) | proposal.service (closeProposal) | idem |
| `cast_vote` | miembro + canPerformAction('vote') + no duplicado | vote.service (castVote) | votes INSERT: miembro de comunidad, RLS proposals/votes |
| `execute_proposal` | admin | proposal.service (executeProposal) | Ejecución financiera: solo admin |
| `appeal_proposal` | miembro | proposal.service (appealProposal) | RLS proposals |
| `create_assembly` | admin | assembly.service (createAssembly) | assemblies INSERT: get_user_role = admin |
| `update_assembly_status` | admin | assembly.service | assemblies UPDATE |
| `record_attendance` | admin | assembly.service (recordAttendance) | assembly_attendance |
| `create_transaction` | admin o tesorero | treasury.service | transactions INSERT: get_user_role IN ('admin','tesorero') |
| `create_payment_obligation` | admin o tesorero | treasury.service (createPaymentObligation) | payment_obligations INSERT |
| `mark_obligation_paid` | admin o tesorero | treasury.service (markObligationAsPaid) | payment_obligations UPDATE |
| `reconcile_payment` (manual/IFPE) | admin o tesorero | ifpe.service (manualReconcile, etc.) | ifpe_webhook_events: restringir a admin/tesorero (052) |
| `import_transactions` | tesorero (o permiso import_data) | ingestion.service | RLS data_sources, import_jobs |
| `update_community_rules` | admin | rules.service (updateCommunityRules) | rule_versions INSERT, communities UPDATE |
| `view_audit_log` | admin | audit.service | audit_log SELECT: get_user_role = admin |
| `send_email` (edge) | admin o rol autorizado + rate-limit | supabase/functions/send-email | Validar JWT y permisos en función |

## Mapeo servicio → acciones que debe validar

| Servicio | Acciones a validar antes de operar |
|----------|-------------------------------------|
| proposal.service | create_proposal, start_discussion, open_voting, close_proposal, execute_proposal, appeal_proposal |
| vote.service | cast_vote (incl. canPerformAction('vote') y standing) |
| treasury.service | create_transaction, create_payment_obligation, mark_obligation_paid |
| ifpe.service | reconcile_payment (manual/automático) |
| assembly.service | create_assembly, update_assembly_status, record_attendance |
| identity.service | create_invitation, accept_invitation, update_member, update_community |
| ingestion.service | import_transactions (createImportJob, importTransactions) |
| rules.service | update_community_rules |

## RLS: políticas P0 a añadir o corregir (referencia para migraciones)

- **members INSERT:** política controlada que permita (1) user_id = auth.uid() cuando exista invitación pendiente válida para ese email/community_id, o (2) get_user_role(community_id) = 'admin'. (Ver 046 que eliminó "Users can join via invitation"; restaurar con WITH CHECK correcto.)
- **ifpe_webhook_events SELECT:** restringir a get_user_role(community_id) IN ('admin','tesorero').
- **Índices:** columnas usadas en get_user_role(community_id) y en lookups por community_id ya indexadas donde aplique (049, 050, 051).

Documento de referencia para implementación de `permission.service` y validaciones en cada servicio.
