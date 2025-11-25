/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { UserEventsListener } from '../src/auth/user-event-listener';

describe('Fintech App E2E (Idempotent Minimal)', () => {
  let app: INestApplication;
  let server: any;
  let userEmail: string;
  let recipientEmail: string;
  let userId: string;
  let recipientId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // MOCK EVENT LISTENERS to prevent async issues
    const userListener = app.get(UserEventsListener);
    jest
      .spyOn(userListener, 'handleSendVerification')
      .mockImplementation(async () => {});
    jest
      .spyOn(userListener, 'handleUserCreated')
      .mockImplementation(async () => {});

    await app.init();
    server = app.getHttpServer();

    // Unique emails for this run
    const timestamp = Date.now();
    userEmail = `tester_${timestamp}@example.com`;
    recipientEmail = `recipient_${timestamp}@example.com`;
  });

  afterAll(async () => {
    await app.close();
  });

  /** ------------------ AUTH & USERS ------------------ */
  it('Register user', async () => {
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
  });

  it('Register recipient user', async () => {
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
  });
});
