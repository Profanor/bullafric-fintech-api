/* eslint-disable @typescript-eslint/no-misused-promises */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { UserEventsListener } from '../src/auth/user-event-listener';
import { PrismaService } from '@bullafric-lib/database/prisma.service';

describe('Fintech App E2E (Correct Order)', () => {
  let app: INestApplication;
  let server: any;
  let prisma: PrismaService;

  let userEmail: string;
  let recipientEmail: string;
  let userId: number;
  let recipientId: number;
  let jwtToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Mock event listeners
    const userListener = app.get(UserEventsListener);
    jest
      .spyOn(userListener, 'handleSendVerification')
      .mockImplementation(async () => {});
    jest
      .spyOn(userListener, 'handleUserCreated')
      .mockImplementation(async () => {});

    prisma = app.get(PrismaService);

    await app.init();

    // Reset database
    await prisma.transaction.deleteMany({});
    await prisma.wallet.deleteMany({});
    await prisma.user.deleteMany({});

    server = app.getHttpServer();

    const ts = Date.now();
    userEmail = `tester_${ts}@example.com`;
    recipientEmail = `recipient_${ts}@example.com`;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  async function deleteUserIfExists(email: string) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      await prisma.user.delete({ where: { id: existingUser.id } });
    }
  }

  /** ------------------ AUTH & USERS ------------------ */

  it('Register user', async () => {
    await deleteUserIfExists(userEmail);

    const res = await request(server)
      .post('/auth/register')
      .send({
        username: 'tester',
        email: userEmail,
        password: 'pass1234',
        phoneNumber: '08012345678',
        acceptTerms: true,
      })
      .expect(201);

    userId = res.body.id;
    expect(userId).toBeDefined();
  });

  it('Register recipient user', async () => {
    await deleteUserIfExists(recipientEmail);

    const res = await request(server)
      .post('/auth/register')
      .send({
        username: 'recipient',
        email: recipientEmail,
        password: 'pass1234',
        phoneNumber: '08098765432',
        acceptTerms: true,
      })
      .expect(201);

    recipientId = res.body.id;
    expect(recipientId).toBeDefined();
  });

  it('Login user', async () => {
    const res = await request(server)
      .post('/auth/login')
      .send({ email: userEmail, password: 'pass1234' })
      .expect(200);

    jwtToken = res.body.accessToken;
    expect(jwtToken).toBeDefined();
  });

  it('Get user profile', async () => {
    const res = await request(server)
      .get('/users/me')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    expect(res.body.username).toBe('tester');
    expect(res.body.wallet).toBeDefined();
  });

  /** ------------------ TRANSACTIONS BEFORE OPERATIONS ------------------ */

  it('Get user transactions BEFORE any wallet operation → should be 0', async () => {
    const res = await request(server)
      .get('/users/me/transactions')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    expect(res.body.length).toBe(0);
  });

  /** ------------------ WALLET OPERATIONS ------------------ */

  it('Fund wallet', async () => {
    const res = await request(server)
      .post('/wallets/fund')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ amount: 500 })
      .expect(201);

    expect(res.body.success.balance).toBe(500);
  });

  it('Transfer funds to recipient', async () => {
    const res = await request(server)
      .post('/wallets/transfer')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ amount: 200, toUserId: recipientId })
      .expect(201);

    expect(res.body.success.senderBalance).toBe(300);
    expect(res.body.success.recipientBalance).toBe(200);
  });

  it('Withdraw funds', async () => {
    const res = await request(server)
      .post('/wallets/withdraw')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ amount: 100 })
      .expect(201);

    expect(res.body.success.balance).toBe(200);
  });

  /** ------------------ TRANSACTIONS AFTER OPERATIONS ------------------ */

  it('Get user transactions AFTER operations → should be >= 3', async () => {
    const res = await request(server)
      .get('/users/me/transactions')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    expect(res.body.length).toBeGreaterThanOrEqual(3);
  });

  /** ------------------ WALLET BALANCE ------------------ */

  it('Get wallet balance', async () => {
    const res = await request(server)
      .get('/wallets/balance')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    expect(res.body.balance).toBe(200);
  });
});
