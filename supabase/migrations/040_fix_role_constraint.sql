-- =========================================================================
-- 040: Fix member role constraint
-- The original valid_role constraint only allowed 4 roles but the codebase
-- uses comite_vigilancia and platform_admin. This migration updates it.
-- =========================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'valid_role' AND table_name = 'members'
  ) THEN
    ALTER TABLE members DROP CONSTRAINT valid_role;
  END IF;
END $$;

ALTER TABLE members ADD CONSTRAINT valid_role
  CHECK (role IN ('platform_admin', 'admin', 'comite_vigilancia', 'tesorero', 'miembro', 'observador'));
