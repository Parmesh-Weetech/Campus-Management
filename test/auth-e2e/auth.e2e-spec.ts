import { INestApplication } from "@nestjs/common";
import { defaultBeforeAll } from "../utils/commonHooks";
import { mockAdmin } from "./auth-mock-data";
import request from 'supertest';
import { DataSource } from "typeorm";
import { RefreshToken } from "../../src/app/refresh-token/entities/refresh-token.entity";

describe('AuthController (e2e)', () => {
    let app: INestApplication;
    let defaultEmail: string;
    let defaultPassword: string;

    beforeAll(async () => {
        app = await defaultBeforeAll();

        const user = mockAdmin();
        defaultEmail = user.email;
        defaultPassword = user.password;
    });

    afterAll(async () => {
        const dataSource = app.get(DataSource);
        await dataSource
            .createQueryBuilder()
            .delete()
            .from(RefreshToken)
            .execute();

        await app.close();
    })

    describe('POST /api/auth/login Master Admin Login', () => {
        it('FAILURE: POST - Login with invalid credentials', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: defaultEmail,
                    password: 'wrongpassword',
                })
                .expect(401);
        });

        it('SUCCESS: POST - Login with master admin credentials', async () => {

            const response = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: defaultEmail,
                    password: defaultPassword
                })
                .expect(200);

            expect(response.body).toEqual(
                expect.objectContaining({
                    success: true,
                    data: expect.any(Object)
                })
            );
            expect(response.body.data).toHaveProperty('accessToken');
            expect(response.body.data).toHaveProperty('refreshToken');
        });

        it('Should give error on missing field', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    password: defaultPassword
                })
                .expect(400)
        })
    });
});
