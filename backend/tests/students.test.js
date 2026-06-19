require('./setup');
const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');

// ── Helpers ────────────────────────────────────────────────────────────────
const validStudent = {
  first_name: 'Test',
  last_name: 'User',
  email: `test.user.${Date.now()}@example.com`, // unique per run
  phone: '+9999999999',
  date_of_birth: '2000-06-15',
};

let createdStudentId;

// ── Lifecycle ──────────────────────────────────────────────────────────────
afterAll(async () => {
  // Clean up any test students created during this run
  await db.query("DELETE FROM students WHERE email LIKE 'test.%@example.com'");
  await db.pool.end();
});

// ══════════════════════════════════════════════════════════════════════════════
// Health Check
// ══════════════════════════════════════════════════════════════════════════════
describe('GET /api/health', () => {
  it('should return status UP', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body).toHaveProperty('timestamp');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 404 Handler
// ══════════════════════════════════════════════════════════════════════════════
describe('Unknown Routes', () => {
  it('should return 404 for unregistered routes', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/not found/i);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/students — Create Student
// ══════════════════════════════════════════════════════════════════════════════
describe('POST /api/students', () => {
  it('should create a student with valid data and return 201', async () => {
    const res = await request(app).post('/api/students').send(validStudent);
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      first_name: validStudent.first_name,
      last_name: validStudent.last_name,
      email: validStudent.email.toLowerCase(),
    });
    expect(res.body.data).toHaveProperty('id');
    createdStudentId = res.body.data.id;
  });

  it('should return 400 if first_name is missing', async () => {
    const res = await request(app)
      .post('/api/students')
      .send({ last_name: 'Doe', email: 'a@b.com' });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toHaveProperty('first_name');
  });

  it('should return 400 if email is invalid', async () => {
    const res = await request(app)
      .post('/api/students')
      .send({ first_name: 'A', last_name: 'B', email: 'not-an-email' });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toHaveProperty('email');
  });

  it('should return 409 if email already exists', async () => {
    // Try inserting the same student again
    const res = await request(app).post('/api/students').send(validStudent);
    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it('should return 400 if body is empty JSON', async () => {
    const res = await request(app).post('/api/students').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/students — List Students with Pagination
// ══════════════════════════════════════════════════════════════════════════════
describe('GET /api/students', () => {
  it('should return a paginated list with meta', async () => {
    const res = await request(app).get('/api/students?page=1&limit=5');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toMatchObject({
      currentPage: 1,
      limit: 5,
    });
    expect(res.body.meta).toHaveProperty('totalRecords');
    expect(res.body.meta).toHaveProperty('totalPages');
  });

  it('should default to page=1, limit=10 when params are omitted', async () => {
    const res = await request(app).get('/api/students');
    expect(res.statusCode).toBe(200);
    expect(res.body.meta.currentPage).toBe(1);
    expect(res.body.meta.limit).toBe(10);
  });

  it('should clamp negative page to 1', async () => {
    const res = await request(app).get('/api/students?page=-3&limit=5');
    expect(res.statusCode).toBe(200);
    expect(res.body.meta.currentPage).toBe(1);
  });

  it('should cap limit at 100', async () => {
    const res = await request(app).get('/api/students?page=1&limit=999');
    expect(res.statusCode).toBe(200);
    expect(res.body.meta.limit).toBe(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/students/:id — Get Student by ID
// ══════════════════════════════════════════════════════════════════════════════
describe('GET /api/students/:id', () => {
  it('should return the student with a nested marks array', async () => {
    const res = await request(app).get(`/api/students/${createdStudentId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(createdStudentId);
    expect(Array.isArray(res.body.data.marks)).toBe(true);
  });

  it('should return 404 for a non-existent student ID', async () => {
    const res = await request(app).get('/api/students/9999999');
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 for a non-numeric ID', async () => {
    const res = await request(app).get('/api/students/not-a-number');
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// PUT /api/students/:id — Update Student
// ══════════════════════════════════════════════════════════════════════════════
describe('PUT /api/students/:id', () => {
  it('should update allowed fields and return updated student', async () => {
    const res = await request(app)
      .put(`/api/students/${createdStudentId}`)
      .send({ first_name: 'Updated', phone: '+1234500000' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.first_name).toBe('Updated');
    expect(res.body.data.phone).toBe('+1234500000');
  });

  it('should clear optional fields (date_of_birth, phone) when empty strings are sent', async () => {
    const res = await request(app)
      .put(`/api/students/${createdStudentId}`)
      .send({ date_of_birth: '', phone: '' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.date_of_birth).toBeNull();
    expect(res.body.data.phone).toBeNull();
  });

  it('should return 400 if email format is invalid on update', async () => {
    const res = await request(app)
      .put(`/api/students/${createdStudentId}`)
      .send({ email: 'bad-email' });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toHaveProperty('email');
  });

  it('should return 404 for updating a non-existent student', async () => {
    const res = await request(app)
      .put('/api/students/9999999')
      .send({ first_name: 'Ghost' });
    expect(res.statusCode).toBe(404);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// DELETE /api/students/:id — Delete Student
// ══════════════════════════════════════════════════════════════════════════════
describe('DELETE /api/students/:id', () => {
  it('should delete the student and return success', async () => {
    const res = await request(app).delete(`/api/students/${createdStudentId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should return 404 when deleting already-deleted student', async () => {
    const res = await request(app).delete(`/api/students/${createdStudentId}`);
    expect(res.statusCode).toBe(404);
  });
});
