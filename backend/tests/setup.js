// Test environment setup — uses the same DB but isolates each test with transactions
// so tests never leave dirty data behind.

process.env.NODE_ENV = 'test';
// Point at local DB — tests run against real postgres, not mocks
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL || 'postgresql://yashdhoke@localhost:5432/student_db';
process.env.PORT = '5099'; // Separate port to avoid conflicts with dev server
