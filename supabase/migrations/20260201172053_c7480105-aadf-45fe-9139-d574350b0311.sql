-- Refresh PostgREST schema cache after blog tables creation
NOTIFY pgrst, 'reload schema';