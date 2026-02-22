-- =========================================================================
-- 054: Monthly financial statement automation
-- - Generate previous month statements for all communities/funds
-- - Notify each community when statements are ready
-- - Schedule pg_cron monthly run
-- =========================================================================

CREATE OR REPLACE FUNCTION generate_monthly_statements_for_all_communities()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_community record;
  v_fund text;
  v_period text := to_char((date_trunc('month', now()) - interval '1 month')::date, 'YYYY-MM');
  v_count int := 0;
BEGIN
  FOR v_community IN
    SELECT id
    FROM communities
    WHERE COALESCE((rules -> 'treasury' ->> 'monthly_statement_auto')::boolean, true) = true
  LOOP
    FOR v_fund IN SELECT unnest(ARRAY['mantenimiento'::text, 'reserva'::text])
    LOOP
      BEGIN
        PERFORM generate_monthly_statement(v_community.id, v_period, v_fund, NULL);
        PERFORM notify_community(
          v_community.id,
          'monthly_statement_ready',
          'Estado financiero mensual disponible',
          'Se generó el estado financiero de ' || v_period || ' para el fondo ' || v_fund || '.',
          jsonb_build_object('period', v_period, 'fund_type', v_fund)
        );
        v_count := v_count + 1;
      EXCEPTION WHEN OTHERS THEN
        -- Continue with next community/fund if one fails
        CONTINUE;
      END;
    END LOOP;
  END LOOP;

  RETURN v_count;
END;
$fn$;

GRANT EXECUTE ON FUNCTION generate_monthly_statements_for_all_communities() TO authenticated;

DO $cron$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN
      PERFORM cron.unschedule('generate-monthly-statements');
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;

    -- 06:30 UTC on the 1st day of every month
    PERFORM cron.schedule(
      'generate-monthly-statements',
      '30 6 1 * *',
      'SELECT generate_monthly_statements_for_all_communities()'
    );
  END IF;
END
$cron$;
