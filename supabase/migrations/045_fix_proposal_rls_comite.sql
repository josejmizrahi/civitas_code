-- Fix proposals INSERT RLS policy to include comite_vigilancia role
-- Previously only allowed admin, tesorero, miembro — this excluded
-- the vigilancia committee from creating proposals despite having
-- sufficient hierarchy level.

DROP POLICY IF EXISTS "Active members can create proposals" ON proposals;

CREATE POLICY "Active members can create proposals"
  ON proposals FOR INSERT
  WITH CHECK (get_user_role(community_id) IN ('admin', 'comite_vigilancia', 'tesorero', 'miembro'));
