require('./setup');
const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');

// ── Shared State ───────────────────────────────────────────────────────────
let studentId;
let markId;

// ── Lifecycle ──────────────────────────────────────────────────────────────
beforeAll(async () => {
  // Create a student to attach marks to
  const res = await request(app).post('/api/students').send({
    first_name: 'Marks',
    last_name: 'Tester',
    email: `marks.tester.${Date.now()}@example.com`,
  });
  studentId = res.body.data.id;
});

afterAll(async () => {
  // Cascade delete cleans up marks automatically
  await db.query("DELETE FROM students WHERE email LIKE 'marks.tester.%@example.com'");
  await db.pool.end();
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/students/:id/marks — Add Mark
// ══════════════════════════════════════════════════════════════════════════════
describe('POST /api/students/:id/marks', () => {
  it('should add a mark for a valid student and return 201', async () => {
    const res = await request(app)
      .post(`/api/students/${studentId}/marks`)
      .send({ subject: 'Mathematics', score: 88, max_score: 100, exam_type: 'final' });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      subject: 'Mathematics',
      student_id: studentId,
    });
    markId = res.body.data.id;
  });

  it('should return 409 for duplicate subject + exam_type combination', async () => {
    const res = await request(app)
      .post(`/api/students/${studentId}/marks`)
      .send({ subject: 'Mathematics', score: 75, exam_type: 'final' });
    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already exist/i);
  });

  it('should return 400 if score is missing', async () => {
    const res = await request(app)
      .post(`/api/students/${studentId}/marks`)
      .send({ subject: 'Physics', exam_type: 'final' });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toHaveProperty('score');
  });

  it('should return 400 if score is out of range (> 100)', async () => {
    const res = await request(app)
      .post(`/api/students/${studentId}/marks`)
      .send({ subject: 'Chemistry', score: 150, exam_type: 'final' });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toHaveProperty('score');
  });

  it('should return 400 if score is negative', async () => {
    const res = await request(app)
      .post(`/api/students/${studentId}/marks`)
      .send({ subject: 'Chemistry', score: -10, exam_type: 'final' });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toHaveProperty('score');
  });

  it('should return 400 if subject is missing', async () => {
    const res = await request(app)
      .post(`/api/students/${studentId}/marks`)
      .send({ score: 80, exam_type: 'final' });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toHaveProperty('subject');
  });

  it('should return 404 for a non-existent student', async () => {
    const res = await request(app)
      .post('/api/students/9999999/marks')
      .send({ subject: 'Biology', score: 70, exam_type: 'final' });
    expect(res.statusCode).toBe(404);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/students/:id/marks — Get Marks
// ══════════════════════════════════════════════════════════════════════════════
describe('GET /api/students/:id/marks', () => {
  it('should return all marks for a student as an array', async () => {
    const res = await request(app).get(`/api/students/${studentId}/marks`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should return 404 for marks of a non-existent student', async () => {
    const res = await request(app).get('/api/students/9999999/marks');
    expect(res.statusCode).toBe(404);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// PUT /api/marks/:id — Update Mark
// ══════════════════════════════════════════════════════════════════════════════
describe('PUT /api/marks/:id', () => {
  it('should update the score and return the updated mark', async () => {
    const res = await request(app)
      .put(`/api/marks/${markId}`)
      .send({ score: 95 });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(parseFloat(res.body.data.score)).toBe(95);
  });

  it('should return 400 if updated score is out of range', async () => {
    const res = await request(app)
      .put(`/api/marks/${markId}`)
      .send({ score: 200 });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toHaveProperty('score');
  });

  it('should return 404 for a non-existent mark ID', async () => {
    const res = await request(app)
      .put('/api/marks/9999999')
      .send({ score: 80 });
    expect(res.statusCode).toBe(404);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// DELETE /api/marks/:id — Delete Mark
// ══════════════════════════════════════════════════════════════════════════════
describe('DELETE /api/marks/:id', () => {
  it('should delete the mark and return success', async () => {
    const res = await request(app).delete(`/api/marks/${markId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should return 404 when deleting an already-deleted mark', async () => {
    const res = await request(app).delete(`/api/marks/${markId}`);
    expect(res.statusCode).toBe(404);
  });
});
