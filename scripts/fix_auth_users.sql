-- ============================================================
-- FIX: Limpiar TODOS los datos de seed y usuarios corruptos
-- Ejecutar en SQL Editor de Supabase
-- ============================================================

-- Primero borrar TODOS los datos de las tablas públicas
-- (en orden de dependencias, tablas hijas primero)
DELETE FROM ratings;
DELETE FROM contract_installments;
DELETE FROM contracts;
DELETE FROM recurring_schedules;
DELETE FROM entity_contacts;
DELETE FROM entities;
DELETE FROM census_snapshots;
DELETE FROM audit_log;
DELETE FROM payment_obligations;
DELETE FROM budgets;
DELETE FROM minutes;
DELETE FROM votes;
DELETE FROM delegations;
DELETE FROM documents;
DELETE FROM invitations;
DELETE FROM proposals;
DELETE FROM transactions;
DELETE FROM categories;
DELETE FROM members;
DELETE FROM communities;

-- Ahora limpiar auth (en orden de dependencias)
DELETE FROM auth.sessions;
DELETE FROM auth.refresh_tokens;
DELETE FROM auth.mfa_amr_claims;
DELETE FROM auth.mfa_challenges;
DELETE FROM auth.mfa_factors;
DELETE FROM auth.identities;
DELETE FROM auth.users;

SELECT 'All data cleaned! Ready to recreate users via API.' as result;
