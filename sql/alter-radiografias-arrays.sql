-- Migração para alterar achados_radiograficos e necessidades de TEXT para JSONB (array de strings)

-- Converter dados existentes de string para array
-- Se o campo já for um array JSONB válido, manter como está
-- Se for uma string, converter para array com um único item

UPDATE radiografias
SET achados_radiograficos = CASE
  WHEN achados_radiograficos IS NULL THEN NULL
  WHEN jsonb_typeof(achados_radiograficos::jsonb) = 'array' THEN achados_radiograficos::jsonb
  ELSE jsonb_build_array(achados_radiograficos)
END
WHERE achados_radiograficos IS NOT NULL;

UPDATE radiografias
SET necessidades = CASE
  WHEN necessidades IS NULL THEN NULL
  WHEN jsonb_typeof(necessidades::jsonb) = 'array' THEN necessidades::jsonb
  ELSE jsonb_build_array(necessidades)
END
WHERE necessidades IS NOT NULL;

-- Alterar tipo das colunas para JSONB
ALTER TABLE radiografias
ALTER COLUMN achados_radiograficos TYPE jsonb USING achados_radiograficos::jsonb;

ALTER TABLE radiografias
ALTER COLUMN necessidades TYPE jsonb USING necessidades::jsonb;
