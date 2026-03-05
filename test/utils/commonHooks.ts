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

export const setupAdminUser = async (app: INestApplication): Promise<{ token: string, id: string }> => {
    const adminEmail = mockAdmin().email;
    const adminPassword = mockAdmin().password;

    const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
            email: adminEmail,
            password: adminPassword
        })
        .expect(200);
    
    expect(loginResponse.body.data.accessToken).toBeDefined();

    if (!loginResponse.body.data.accessToken) throw new InternalServerErrorException("Internal Server Error while processing login request!");

    const adminToken = loginResponse.body.data.accessToken;

    const profileResponse = await request(app.getHttpServer())
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

    if (!profileResponse.body?.data?.id) {
        throw new InternalServerErrorException("Internal Server Error while fetching admin profile!");
    }

    return {
        token: adminToken,
        id: profileResponse.body.data.id
    }
}
