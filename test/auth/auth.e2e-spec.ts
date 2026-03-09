import { defaultBeforeAll } from "../utils/commonHooks";
import { mockAdmin } from "./auth-mock-data";
import request from 'supertest';
import { DataSource } from "typeorm";
import { RefreshToken } from "../../src/app/refresh-token/entities/refresh-token.entity";
import { TestContext } from "../utils/test-context";

describe('AuthController (e2e)', () => {
    const ctx: TestContext = {};

    beforeAll(async () => {
        ctx.app = await defaultBeforeAll();
        ctx.server = ctx.app.getHttpServer();

        const user = mockAdmin();
        ctx.adminEmail = user.email;
        ctx.adminPassword = user.password;
    });

    afterAll(async () => {
        const dataSource = ctx.app!.get(DataSource);
        await dataSource
            .createQueryBuilder()
            .delete()
            .from(RefreshToken)
            .execute();

        await ctx.app!.close();
    })

    describe('POST /api/auth/login Master Admin Login', () => {
        it('FAILURE: POST - Login with invalid credentials', async () => {
            await request(ctx.server)
                .post('/api/auth/login')
                .send({
                    email: ctx.adminEmail,
                    password: 'wrongpassword',
                })
                .expect(401);
        });

        it('SUCCESS: POST - Login with master admin credentials', async () => {

            const response = await request(ctx.server)
                .post('/api/auth/login')
                .send({
                    email: ctx.adminEmail,
                    password: ctx.adminPassword
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
            await request(ctx.server)
                .post('/api/auth/login')
                .send({
                    password: ctx.adminPassword
                })
                .expect(400)
        });

        it('Should give error on missing password', async () => {
            await request(ctx.server)
                .post('/api/auth/login')
                .send({
                    email: ctx.adminEmail
                })
                .expect(400);
        });

        it('Should give error on invalid email format', async () => {
            await request(ctx.server)
                .post('/api/auth/login')
                .send({
                    email: 'not-an-email',
                    password: ctx.adminPassword
                })
                .expect(400);
        });

        it('Should give error on uppercase email due to lowercase validation', async () => {
            await request(ctx.server)
                .post('/api/auth/login')
                .send({
                    email: ctx.adminEmail?.toUpperCase(),
                    password: ctx.adminPassword
                })
                .expect(400);
        });
    });
});
