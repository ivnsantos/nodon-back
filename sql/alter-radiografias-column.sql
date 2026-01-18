-- Migração para alterar coluna radiografia de BOOLEAN para VARCHAR

ALTER TABLE radiografias 
ALTER COLUMN radiografia TYPE VARCHAR(255) USING CASE 
  WHEN radiografia::boolean = true THEN 'true' 
  WHEN radiografia::boolean = false THEN 'false' 
  ELSE NULL 
END;
