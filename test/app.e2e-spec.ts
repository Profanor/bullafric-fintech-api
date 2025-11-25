/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Fintech App E2E', () => {
  let app: INestApplication;
  let jwtToken: string;
  let userId: number;
  let recipientId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  /** ------------------ USER MODULE ------------------ */
  it('Register user', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        username: 'tester',
        email: 'tester@example.com',
        password: 'pass1234',
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    userId = res.body.id;
  });

  it('Register recipient user', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        username: 'recipient',
        email: 'recipient@example.com',
        password: 'pass1234',
      })
      .expect(201);

    recipientId = res.body.id;
    expect(recipientId).toBeDefined();
  });

  it('Login user', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'tester@example.com', password: 'pass1234' })
      .expect(200);

    expect(res.body.access_token).toBeDefined();
    jwtToken = res.body.access_token;
  });

  it('Get user profile', async () => {
    const res = await request(app.getHttpServer())
      .get('/users/profile')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    expect(res.body.username).toBe('tester');
    expect(res.body.wallet).toBeDefined();
  });

  /** ------------------ WALLET MODULE ------------------ */
  it('Fund user wallet', async () => {
    const res = await request(app.getHttpServer())
      .post('/wallet/fund')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ amount: 500 })
      .expect(201);

    expect(res.body.success.balance).toBe(500);
  });

  it('Transfer funds to another user', async () => {
    const res = await request(app.getHttpServer())
      .post('/wallet/transfer')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ amount: 200, toUserId: recipientId })
      .expect(201);

    expect(res.body.success.senderBalance).toBe(300);
    expect(res.body.success.recipientBalance).toBe(200);
  });

  it('Withdraw funds', async () => {
    const res = await request(app.getHttpServer())
      .post('/wallet/withdraw')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ amount: 100 })
      .expect(201);

    expect(res.body.success.balance).toBe(200);
  });

  it('Get wallet balance', async () => {
    const res = await request(app.getHttpServer())
      .get('/wallet/balance')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    expect(res.body.balance).toBe(200);
  });

  /** ------------------ TRANSACTIONS MODULE ------------------ */
  it('Get user transactions', async () => {
    const res = await request(app.getHttpServer())
      .get('/transactions/user')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    expect(res.body.length).toBeGreaterThanOrEqual(3); // FUND, TRANSFER, WITHDRAW
    const types = res.body.map((t) => t.type);
    expect(types).toContain('FUND');
    expect(types).toContain('TRANSFER');
    expect(types).toContain('WITHDRAW');
  });
});
