UPDATE user_profiles
SET trial_end_date = now() + INTERVAL '7 days',
    subscription_status = 'trialing'
WHERE 
    trial_end_date IS NULL 
    AND subscription_status IS NULL;
