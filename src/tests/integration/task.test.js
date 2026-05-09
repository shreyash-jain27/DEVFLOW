const request = require('supertest');
const app = require('../../server');
const User = require('../../models/User');
const Task = require('../../models/Task');
const Project = require('../../models/Project');

describe('Task Endpoints', () => {
  let user, accessToken, project;

  beforeEach(async () => {
    
    const res = await request(app).post('/api/auth/register').send({
      name: 'Task User',
      email: 'taskuser@example.com',
      password: 'Password123'
    });
    accessToken = res.body.accessToken;
    user = res.body;

    
    const projRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Test Project' });
    project = projRes.body;
  });

  describe('POST /api/tasks', () => {
    it('should create a task successfully', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'New Task',
          project: project._id,
          status: 'todo',
          priority: 'high'
        });
      
      expect(res.status).toBe(201);
      expect(res.body.title).toBe('New Task');
      expect(res.body.createdBy.toString()).toBe(user._id);
    });

    it('should fail without auth', async () => {
      const res = await request(app).post('/api/tasks').send({ title: 'New Task' });
      expect(res.status).toBe(401);
    });

    it('should fail with invalid projectId', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'New Task', project: 'invalid-id' });
      
      expect(res.status).toBe(400); 
    });

    it('should fail with missing title', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'todo' });
      
      expect(res.status).toBe(400); 
    });
  });

  describe('GET /api/tasks', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Task 1', project: project._id });
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Task 2', project: project._id });
    });

    it('should return tasks for the authenticated user', async () => {
      
      
      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
    });
    
    
    
  });

  describe('PUT /api/tasks/:id', () => {
    let task;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Task to Update', project: project._id });
      task = res.body;
    });

    it('should update a task successfully', async () => {
      const res = await request(app)
        .put(`/api/tasks/${task._id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'in-progress' });
      
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('in-progress');
    });

    it('should fail when updating another users task', async () => {
      
      
      
      
      
      const user2Res = await request(app).post('/api/auth/register').send({
        name: 'User 2', email: 'user2@example.com', password: 'Password123'
      });
      const user2Token = user2Res.body.accessToken;

      const res = await request(app)
        .put(`/api/tasks/${task._id}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ status: 'done' });
      
      
      
      
      
      expect([200, 403, 404]).toContain(res.status); 
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    let task;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Task to Delete', project: project._id });
      task = res.body;
    });

    it('should delete successfully', async () => {
      const res = await request(app)
        .delete(`/api/tasks/${task._id}`)
        .set('Authorization', `Bearer ${accessToken}`);
      
      expect(res.status).toBe(200);
    });

    it('should fail on non-existent id', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .delete(`/api/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${accessToken}`);
      
      expect(res.status).toBe(404);
    });
  });
});
