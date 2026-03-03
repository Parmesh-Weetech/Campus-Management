import { INestApplication, InternalServerErrorException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from 'supertest';
import { AppModule } from "../../src/app.module";
import { setupApp } from "../../src/setup-app";
import { mockAdmin } from "../../test/auth-e2e/auth-mock-data";

export const defaultBeforeAll = async (): Promise<INestApplication> => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
    }).compile();
    const app: INestApplication = moduleFixture.createNestApplication();
    await setupApp(app);
    await app.init();
    return app;
};

export const setupAdminUser = async (app: INestApplication): Promise<string> => {
    const adminEmail = mockAdmin().email;
    const adminPassword = mockAdmin().password;

    const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
            email: adminEmail,
            password: adminPassword
        })
        .expect(201);

    if (!loginResponse.body.data.accessToken) throw new InternalServerErrorException("Internal Server Error while processing login request!");

    return loginResponse.body.data.accessToken;
}