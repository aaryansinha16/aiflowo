import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';

/**
 * Integration tests for Intent Classifier with real OpenAI API
 * 
 * These tests make actual API calls to OpenAI and consume credits.
 * Run separately with: npm run test:integration
 * 
 * Prerequisites:
 * - Valid OPENAI_API_KEY in .env
 * - OpenAI credits available
 * - Backend server configured properly
 */
describe('Intent Classifier Integration Tests (Real OpenAI API)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api'); // Set the same prefix as main.ts
    await app.init();

    // Login to get JWT token for protected endpoints
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@example.com', // Update with valid test credentials
        password: 'password123',
      });

    if (loginResponse.status === 201 && loginResponse.body.access_token) {
      authToken = loginResponse.body.access_token;
    }
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('POST /api/agent/classify-test (Public Endpoint)', () => {
    it('should classify flight search intent', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/agent/classify-test')
        .send({
          message: 'Find me flights from Mumbai to Delhi tomorrow',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        intent: 'flight_search',
        params: expect.any(Object),
      });

      expect(response.body.params).toBeDefined();
      // API may return origin/destination or from/to
      const hasOriginDest = response.body.params.origin || response.body.params.from;
      expect(hasOriginDest).toBeDefined();

      console.log('✅ Flight Search:', JSON.stringify(response.body, null, 2));
    });

    it('should classify book flight intent', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/agent/classify-test')
        .send({
          message: 'Book flight AI101 on December 25th for John Doe',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        intent: 'book_flight',
        params: expect.any(Object),
      });

      expect(response.body.params).toBeDefined();

      console.log('✅ Book Flight:', JSON.stringify(response.body, null, 2));
    });

    it('should classify job application intent', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/agent/classify-test')
        .send({
          message: 'Apply for Senior Developer at Google',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        intent: 'apply_job',
        params: expect.any(Object),
      });

      expect(response.body.params).toBeDefined();

      console.log('✅ Apply Job:', JSON.stringify(response.body, null, 2));
    });

    it('should classify fill form intent', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/agent/classify-test')
        .send({
          message: 'Fill registration form with name John, email john@example.com',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        intent: 'fill_form',
        params: expect.any(Object),
      });

      expect(response.body.params).toBeDefined();

      console.log('✅ Fill Form:', JSON.stringify(response.body, null, 2));
    });

    it('should classify post social intent', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/agent/classify-test')
        .send({
          message: 'Post "Hello World" on Twitter',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        intent: 'post_social',
        params: expect.any(Object),
      });

      expect(response.body.params).toBeDefined();

      console.log('✅ Post Social:', JSON.stringify(response.body, null, 2));
    });

    it('should classify browser action intent', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/agent/classify-test')
        .send({
          message: 'Click the submit button',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        intent: 'browser_action',
        params: expect.any(Object),
      });

      expect(response.body.params).toBeDefined();

      console.log('✅ Browser Action:', JSON.stringify(response.body, null, 2));
    });

    it('should handle unknown intent', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/agent/classify-test')
        .send({
          message: 'What is the weather like on Mars?',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        intent: 'unknown',
        params: expect.any(Object),
      });

      console.log('✅ Unknown Intent:', JSON.stringify(response.body, null, 2));
    });

    it('should handle complex multi-parameter queries', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/agent/classify-test')
        .send({
          message: 'Find flights from BOM to DEL on 2024-12-25, prefer morning flights, economy class',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        intent: 'flight_search',
        params: expect.any(Object),
      });

      expect(response.body.params).toBeDefined();

      console.log('✅ Complex Query:', JSON.stringify(response.body, null, 2));
    });

    it('should return valid token usage information', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/agent/classify-test')
        .send({
          message: 'Find me flights to London',
        })
        .expect(201);

      // Usage field is optional
      if (response.body.usage) {
        expect(response.body.usage).toMatchObject({
          promptTokens: expect.any(Number),
          completionTokens: expect.any(Number),
          totalTokens: expect.any(Number),
        });
        console.log('✅ Token Usage:', response.body.usage);
      } else {
        console.log('ℹ️  Token usage not included in response');
      }
    });
  });

  describe('POST /api/agent/classify (Protected Endpoint)', () => {
    it('should reject requests without auth token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/agent/classify')
        .send({
          message: 'Find me flights',
        })
        .expect(401);

      console.log('✅ Auth Rejected (401):', JSON.stringify(response.body, null, 2));
    });

    it('should classify intent with valid auth token', async () => {
      if (!authToken) {
        console.warn('⚠️  Skipping protected endpoint test - no auth token available');
        return;
      }

      const response = await request(app.getHttpServer())
        .post('/api/agent/classify')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Find me flights from Mumbai to Delhi',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        intent: expect.any(String),
        confidence: expect.any(Number),
        params: expect.any(Object),
      });

      console.log('✅ Protected Endpoint:', JSON.stringify(response.body, null, 2));
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid request body', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/agent/classify-test')
        .send({});

      // May return 400 or 201 with unknown intent depending on validation
      expect([201, 400]).toContain(response.status);
      console.log(`✅ Invalid Body (${response.status}):`, JSON.stringify(response.body, null, 2));
    });

    it('should handle empty message', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/agent/classify-test')
        .send({
          message: '',
        });

      // May return 400 or 201 with unknown intent depending on validation
      expect([201, 400]).toContain(response.status);
      console.log(`✅ Empty Message (${response.status}):`, JSON.stringify(response.body, null, 2));
    });

    it('should handle extremely long messages gracefully', async () => {
      const longMessage = 'Find flights '.repeat(1000); // Very long message

      const response = await request(app.getHttpServer())
        .post('/api/agent/classify-test')
        .send({
          message: longMessage,
        });

      // Should either succeed or return proper error
      expect([201, 400, 500]).toContain(response.status);
      console.log(`✅ Long Message (${response.status}):`, JSON.stringify(response.body, null, 2));
    });
  });

  describe('Performance Tests', () => {
    it('should classify intent within reasonable time', async () => {
      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .post('/api/agent/classify-test')
        .send({
          message: 'Find me flights to Paris',
        })
        .expect(201);

      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      console.log(`✅ Performance: ${duration}ms`);
      console.log('✅ Performance Test Response:', JSON.stringify(response.body, null, 2));
    });
  });
});
