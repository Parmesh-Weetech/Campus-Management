import request from 'supertest';
import { mockAdmin } from '../auth/auth-mock-data';
import { defaultBeforeAll } from '../utils/commonHooks';
import { DataSource } from 'typeorm';
import { RefreshToken } from '../../src/app/refresh-token/entities/refresh-token.entity';
import { TestContext } from '../utils/test-context';

describe('RefreshTokenController (e2e)', () => {
    const ctx: TestContext = {};
    let refreshToken: string;
    let oldToken: string;

    beforeAll(async () => {
        ctx.app = await defaultBeforeAll();
        ctx.server = ctx.app.getHttpServer();

        ctx.adminEmail = mockAdmin().email;
        ctx.adminPassword = mockAdmin().password;

        const loginResponse = await request(ctx.server)
            .post('/api/auth/login')
            .send({
                email: ctx.adminEmail,
                password: ctx.adminPassword
            })
            .expect(200)

        expect(loginResponse.body.data).toHaveProperty('accessToken');
        expect(loginResponse.body.data).toHaveProperty('refreshToken');

        refreshToken = loginResponse.body.data.refreshToken;
    });

    afterAll(async () => {
        const dataSource = ctx.app!.get(DataSource);
        await dataSource
            .createQueryBuilder()
            .delete()
            .from(RefreshToken)
            .execute();

        await ctx.app!.close();
    });


    describe('Refresh The Access Token Lifycycle', () => {
        it('Should refresh the access token', async () => {
            await new Promise(resolve => setTimeout(resolve, 2000));

            const response = await request(ctx.server)
                .post('/api/refresh/access-token')
                .send({
                    refreshToken: `Bearer ${refreshToken}`
                })
                .expect(200);

            expect(response.body.data).toHaveProperty('accessToken');
            expect(response.body.data).toHaveProperty('refreshToken');

            oldToken = refreshToken;
            refreshToken = response.body.data.refreshToken;
        });

        it('Should give error on missing refresh token', async () => {
            await request(ctx.server)
                .post('/api/refresh/access-token')
                .expect(400);
        });

        it('Should give not found error on invalid refresh token', async () => {
            const response = await request(ctx.server)
                .post('/api/refresh/access-token')
                .send({
                    refreshToken: "Bearer swfllsl.sdvksnvl.sdvksdv"
                })
                .expect(404)
        });

        it('Should give invalid token error on not passing token value', async () => {
            await request(ctx.server)
                .post('/api/refresh/access-token')
                .send({
                    refreshToken: "Bearer "
                })
                .expect(400);
        });

        it('Should give invalid authorization format for non-bearer token', async () => {
            await request(ctx.server)
                .post('/api/refresh/access-token')
                .send({
                    refreshToken: `Token ${refreshToken}`
                })
                .expect(400);
        });

        it('Should give not found error on using existing token', async () => {
            const response = await request(ctx.server)
                .post('/api/refresh/access-token')
                .send({
                    refreshToken: `Bearer ${oldToken}`
                })
                .expect(404)
        });
    })
})
