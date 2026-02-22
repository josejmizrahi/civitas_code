# Documentación de producto y brechas

Índice de los documentos de referencia para alinear whitepaper, app y compliance.

| Documento | Propósito |
|-----------|-----------|
| [whitepaper-v4-gap.md](./whitepaper-v4-gap.md) | Comparación PDF whitepaper v4 vs versión web. Estado: web alineada al PDF. |
| [whitepaper-to-app-gap.md](./whitepaper-to-app-gap.md) | App vs whitepaper: qué está implementado, qué falta, qué sobra, checklist por fase y recomendaciones. |
| [app-not-in-whitepaper.md](./app-not-in-whitepaper.md) | Todo lo que está en la app y no está explicado en el whitepaper (gamificación, documentos, entidades, compliance ley mexicana, etc.). |
| [compliance-ley-mexicana.md](./compliance-ley-mexicana.md) | Referencia de cumplimiento: LPCI CDMX, LFPDPPP, Ley Fintech, Código de Comercio/NOM-151 → artículos y ubicación en código. |
| [implementation-plan.md](./implementation-plan.md) | Plan de implementación: tareas por fase (planes de pago, IFPE, RLS, whitepaper opcional, etc.). |

## CI/CD y release

- **Pipeline**: [../.github/workflows/ci.yml](../.github/workflows/ci.yml) — lint, build, tests unitarios + cobertura, E2E smoke (opcional), audit.
- **Release**: Verificar que CI esté en verde, etiquetar versión y desplegar. Las migraciones de Supabase se aplican según el entorno (local con `supabase db push`, hosted desde el Dashboard o CLI).

## Mantenimiento

- Al añadir **features nuevas** en la app: revisar si deben aparecer en [app-not-in-whitepaper.md](./app-not-in-whitepaper.md).
- Al añadir **flujos o artículos legales** (LPCI, LFPDPPP, etc.): actualizar [compliance-ley-mexicana.md](./compliance-ley-mexicana.md).
- Al cerrar tareas del plan: actualizar estado en [implementation-plan.md](./implementation-plan.md).
