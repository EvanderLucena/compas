-- Drop unique constraint on (name, nutritionist_id) to allow homonym patients
ALTER TABLE patient DROP CONSTRAINT IF EXISTS uk_patient_name_nutri;
