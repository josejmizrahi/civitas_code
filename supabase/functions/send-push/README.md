# send-push (Edge Function)

Función Edge para enviar notificaciones Web Push a miembros concretos usando sus suscripciones en `push_subscriptions`.

## Payload esperado

```json
{
  "member_ids": ["uuid-miembro-1", "uuid-miembro-2"],
  "title": "Título notificación",
  "body": "Contenido de la notificación",
  "data": { "approval_id": "..." }
}
```

## Secrets requeridos

En Supabase → Edge Functions → `send-push` → Secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT` (ej. `mailto:soporte@tu-dominio.com`)

Si faltan secretos VAPID, la función responde en `dry_run` (no rompe flujo).

## Generar claves VAPID

```bash
npx web-push generate-vapid-keys
```

Usa el `publicKey` en frontend (`VITE_VAPID_PUBLIC_KEY`) y ambos secretos en Supabase (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`).

## Deploy

```bash
supabase functions deploy send-push
```

## Verificación rápida

Desde este repo:

```bash
node scripts/verify-send-push.mjs
```

Variables esperadas para el script:

- `SEND_PUSH_TEST_MEMBER_IDS` (csv de member_ids)
- `SEND_PUSH_TEST_TITLE` (opcional)
- `SEND_PUSH_TEST_BODY` (opcional)
- `SUPABASE_SERVICE_ROLE_KEY` (recomendado para test directo sin sesión de usuario)

## Plantilla de payload (copiar/pegar)

```json
{
  "member_ids": [
    "11111111-1111-1111-1111-111111111111",
    "22222222-2222-2222-2222-222222222222"
  ],
  "title": "Aprobación discrecional pendiente",
  "body": "Hay una solicitud de gasto esperando tu decisión.",
  "data": {
    "type": "discretionary_request",
    "approval_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "community_id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
  }
}
```

## Checklist si no llegan push

1. **Secrets**: verifica `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` y `SUPABASE_URL` en la función.
2. **Frontend VAPID**: confirma `VITE_VAPID_PUBLIC_KEY` en el frontend y que coincida con la pública del servidor.
3. **Suscripción activa**: revisa que exista fila en `push_subscriptions` para el `member_id` destino (`endpoint` + `keys`).
4. **Permiso navegador**: valida que el usuario aceptó notificaciones (`Notification.permission === 'granted'`).
5. **Service Worker**: confirma que `/sw.js` esté registrado y activo.
6. **Prueba script**: ejecuta `npm run verify:send-push` con `SEND_PUSH_TEST_MEMBER_IDS`.
7. **Respuesta función**: si devuelve `dry_run`, faltan secretos; si `sent: 0`, no encontró suscripciones válidas.
8. **Logs Edge Function**: revisa logs de `send-push` para errores por suscripción expirada/inválida.

## Notas

- La función intenta enviar a cada suscripción y acumula `sent/skipped`.
- Si una suscripción falla (expirada/inválida), se marca como `skipped` y continúa con las demás.
