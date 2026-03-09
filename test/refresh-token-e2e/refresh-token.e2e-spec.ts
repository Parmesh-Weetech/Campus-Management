import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { mockAdmin } from '../auth-e2e/auth-mock-data';
import { defaultBeforeAll } from '../utils/commonHooks';
import { DataSource } from 'typeorm';
import { RefreshToken } from '../../src/app/refresh-token/entities/refresh-token.entity';

describe('RefreshTokenController (e2e)', () => {
    let app: INestApplication;
    let server;
    let refreshToken: string;
    let email: string;
    let password: string;
    let oldToken: string;

    beforeAll(async () => {
        app = await defaultBeforeAll();
        server = app.getHttpServer();

        email = mockAdmin().email;
        password = mockAdmin().password;

        const loginResponse = await request(server)
            .post('/api/auth/login')
            .send({
                email,
                password
            })
            .expect(200)

        expect(loginResponse.body.data).toHaveProperty('accessToken');
        expect(loginResponse.body.data).toHaveProperty('refreshToken');

        refreshToken = loginResponse.body.data.refreshToken;
    });

    afterAll(async () => {
        const dataSource = app.get(DataSource);
        await dataSource
            .createQueryBuilder()
            .delete()
            .from(RefreshToken)
            .execute();

        await app.close();
    });

    
    describe('Refresh The Access Token Lifycycle', () => {
        it('Should refresh the access token', async () => {
            await new Promise(resolve => setTimeout(resolve, 2000));

            const response = await request(server)
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
            await request(server)
                .post('/api/refresh/access-token')
                .expect(400);
        });

        it('Should give not found error on invalid refresh token', async () => {
            const response = await request(server)
                .post('/api/refresh/access-token')
                .send({
                    refreshToken: "Bearer swfllsl.sdvksnvl.sdvksdv"
                })
                .expect(404)
        });

        it('Should give invalid token error on not passing token value', async () => {
            await request(server)
                .post('/api/refresh/access-token')
                .send({
                    refreshToken: "Bearer "
                })
                .expect(400);
        });

        it('Should give invalid authorization format for non-bearer token', async () => {
            await request(server)
                .post('/api/refresh/access-token')
                .send({
                    refreshToken: `Token ${refreshToken}`
                })
                .expect(400);
        });

        it('Should give not found error on using existing token', async () => {
            const response = await request(server)
                .post('/api/refresh/access-token')
                .send({
                    refreshToken: `Bearer ${oldToken}`
                })
                .expect(404)
        });
    })
})
