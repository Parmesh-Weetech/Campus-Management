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

export const setupProfessorUser = async (
    app: INestApplication,
    email: string,
    password: string
): Promise<string> => {
    const server = app.getHttpServer();

    let loginResponse = await request(server)
        .post('/api/auth/login')
        .send({
            email,
            password
        });

    if (loginResponse.status !== 200) {
        const { token: adminToken } = await setupAdminUser(app);

        const uniquePhone = `9${Date.now().toString().slice(-9)}`;
        const createResponse = await request(server)
            .post('/api/user/create/professor')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'E2E Professor',
                email,
                phoneNumber: uniquePhone,
                password
            });

        if (createResponse.status !== 201 && createResponse.status !== 409) {
            throw new InternalServerErrorException(
                `Failed to create professor test user. status=${createResponse.status}, body=${JSON.stringify(createResponse.body)}`
            );
        }

        loginResponse = await request(server)
            .post('/api/auth/login')
            .send({
                email,
                password,
            });

        if (loginResponse.status !== 200) {
            throw new InternalServerErrorException(
                `Failed to login professor test user after fallback create. status=${loginResponse.status}, body=${JSON.stringify(loginResponse.body)}`
            );
        }
    }

    expect(loginResponse.body.data).toBeDefined();
    expect(loginResponse.body.data.accessToken).toBeDefined();

    if (!loginResponse.body.data.accessToken) throw new InternalServerErrorException("Internal Server Error while processing login request!");

    const professorToken = loginResponse.body.data.accessToken;

    return professorToken
}

export const setupStudentUser = async (
    app: INestApplication,
    email: string,
    password: string
): Promise<string> => {
    const server = app.getHttpServer();

    let loginResponse = await request(server)
        .post('/api/auth/login')
        .send({
            email,
            password
        });

    if (loginResponse.status !== 200) {
        const { token: adminToken } = await setupAdminUser(app);

        const uniquePhone = `8${Date.now().toString().slice(-9)}`;
        const createResponse = await request(server)
            .post('/api/user/create/student')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'E2E Student',
                email,
                phoneNumber: uniquePhone,
                password
            });

        if (createResponse.status !== 201 && createResponse.status !== 409) {
            throw new InternalServerErrorException(
                `Failed to create student test user. status=${createResponse.status}, body=${JSON.stringify(createResponse.body)}`
            );
        }

        loginResponse = await request(server)
            .post('/api/auth/login')
            .send({
                email,
                password,
            });

        if (loginResponse.status !== 200) {
            throw new InternalServerErrorException(
                `Failed to login student test user after fallback create. status=${loginResponse.status}, body=${JSON.stringify(loginResponse.body)}`
            );
        }
    }

    expect(loginResponse.body.data).toBeDefined();
    expect(loginResponse.body.data.accessToken).toBeDefined();

    if (!loginResponse.body.data.accessToken) throw new InternalServerErrorException("Internal Server Error while processing login request!");

    const studentToken = loginResponse.body.data.accessToken;

    return studentToken;
}
