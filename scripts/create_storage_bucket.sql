-- ============================================================
-- Crear bucket de Storage para documentos
-- Ejecutar en SQL Editor de Supabase
-- ============================================================

-- Crear el bucket 'documents' (público para lectura)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  true,
  52428800, -- 50MB
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/zip',
    'application/x-zip-compressed'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800;

-- Política: usuarios autenticados pueden subir archivos
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- Política: cualquiera puede leer archivos públicos
CREATE POLICY "Public read access for documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documents');

-- Política: usuarios autenticados pueden borrar sus archivos
CREATE POLICY "Authenticated users can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents');

SELECT 'Storage bucket created!' as result;
