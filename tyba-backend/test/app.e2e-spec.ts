import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('E2E: Auth & Transactions', () => {
  let app: INestApplication;
  let jwtToken: string;
  let userId: string;
  let uniqueEmail: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true })
    );
    await app.init();
    uniqueEmail = `e2euser_${Date.now()}@example.com`;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET / should return service status', async () => {
    const res = await request(app.getHttpServer()).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/Hello World!|Service is running!/);
  });

  it('POST /auth/register should register a new user', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: uniqueEmail, password: 'e2ePassword1' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('access_token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe(uniqueEmail);
    jwtToken = res.body.access_token;
    userId = res.body.user.id;
  });

  it('POST /auth/login should login and return JWT', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: uniqueEmail, password: 'e2ePassword1' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('access_token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe(uniqueEmail);
    jwtToken = res.body.access_token;
    userId = res.body.user.id;
  });

  it('POST /auth/login should fail with wrong password', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: uniqueEmail, password: 'wrongPassword' });
    expect(res.status).toBe(401);
  });

  it('GET /transactions should fail without JWT', async () => {
    const res = await request(app.getHttpServer()).get('/transactions');
    expect(res.status).toBe(401);
  });

  it('GET /transactions should return empty array for new user', async () => {
    const res = await request(app.getHttpServer())
      .get('/transactions')
      .set('Authorization', `Bearer ${jwtToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /transactions/search should create a transaction by city', async () => {
    const res = await request(app.getHttpServer())
      .post('/transactions/search')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ city: 'Bogota' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('transaction');
    expect(res.body.transaction.city).toBe('Bogota');
  });

  it('POST /transactions/search should create a transaction by coordinates', async () => {
    const res = await request(app.getHttpServer())
      .post('/transactions/search')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ coordinates: '10,20' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('transaction');
    expect(res.body.transaction.coordinates).toBe('10,20');
  });

  it('GET /transactions should return user transactions', async () => {
    const res = await request(app.getHttpServer())
      .get('/transactions')
      .set('Authorization', `Bearer ${jwtToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  it('POST /auth/logout should logout and blacklist the token', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${jwtToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/Logged out successfully/);
  });

  it('GET /transactions should fail with blacklisted token', async () => {
    const res = await request(app.getHttpServer())
      .get('/transactions')
      .set('Authorization', `Bearer ${jwtToken}`);
    expect(res.status).toBe(403);
  });
});
