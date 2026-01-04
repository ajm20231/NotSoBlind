-- Quick test to verify database schema
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('users', 'nominations', 'endorsements', 'messages')
ORDER BY table_name;
