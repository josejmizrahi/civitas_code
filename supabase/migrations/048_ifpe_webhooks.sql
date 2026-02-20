-- =========================================================================
-- 048: IFPE Webhook Events
--
-- Stores incoming SPEI payment notifications from the IFPE provider.
-- Supports reconciliation against payment_obligations.
-- =========================================================================

CREATE TABLE IF NOT EXISTS ifpe_webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('spei_received', 'spei_returned', 'clabe_created')),
  clabe_destino TEXT,
  clabe_origen TEXT,
  monto NUMERIC(12,2),
  referencia_numerica TEXT,
  concepto TEXT,
  nombre_ordenante TEXT,
  rfc_ordenante TEXT,
  fecha_operacion DATE,
  clave_rastreo TEXT UNIQUE,
  raw_payload JSONB NOT NULL DEFAULT '{}',
  reconciliation_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (reconciliation_status IN ('pending', 'matched', 'unmatched', 'manual', 'ignored')),
  matched_obligation_id UUID REFERENCES payment_obligations(id),
  matched_transaction_id UUID REFERENCES transactions(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ifpe_events_community ON ifpe_webhook_events(community_id);
CREATE INDEX IF NOT EXISTS idx_ifpe_events_status ON ifpe_webhook_events(reconciliation_status);
CREATE INDEX IF NOT EXISTS idx_ifpe_events_clabe ON ifpe_webhook_events(clabe_destino);
CREATE INDEX IF NOT EXISTS idx_ifpe_events_rastreo ON ifpe_webhook_events(clave_rastreo);

-- RLS: only community admins/tesoreros can view webhook events
ALTER TABLE ifpe_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their community webhook events"
  ON ifpe_webhook_events FOR SELECT
  USING (
    community_id IN (
      SELECT m.community_id FROM members m WHERE m.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage webhook events"
  ON ifpe_webhook_events FOR ALL
  USING (auth.role() = 'service_role');
