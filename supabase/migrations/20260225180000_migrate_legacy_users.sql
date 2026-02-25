-- Script para rodar no SQL Editor do Supabase local ou Produção

-- OPÇÃO 1: Dar PREMIUM VITALÍCIO aos dois primeiros usuários (Recomendado para beta testers):
UPDATE public.user_profiles
SET subscription_status = 'active', trial_end_date = null
WHERE subscription_status IS NULL;

-- OPÇÃO 2: Dar 7 dias de TRIAL aos dois primeiros usuários (a partir de agora):
-- UPDATE public.user_profiles
-- SET subscription_status = null, trial_end_date = now() + interval '7 days'
-- WHERE subscription_status IS NULL;
