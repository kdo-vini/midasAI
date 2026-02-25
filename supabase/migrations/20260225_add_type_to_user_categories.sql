-- Adicionar a coluna 'type' determinando se é Receita ou Gasto
ALTER TABLE user_categories ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'EXPENSE';

-- Atualizar registros que possam ter categorização baseada no nome
UPDATE user_categories 
SET type = 'INCOME' 
WHERE name ILIKE '%receita%' OR name ILIKE '%salário%' OR name ILIKE '%salario%';
