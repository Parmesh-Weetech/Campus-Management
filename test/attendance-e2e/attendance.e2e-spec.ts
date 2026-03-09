import request from 'supertest';
import { defaultBeforeAll, setupAdminUser, setupProfessorUser, setupStudentUser } from "../utils/commonHooks";
import { mockProfessor, mockStudent } from "../utils/mock-data";
import { formatDateAsYYYYMMDD } from "../utils/formatted-date";
import { DataSource } from "typeorm";
import { Attendance } from "../../src/app/attendance/entities/attendance.entity";
import { RefreshToken } from "../../src/app/refresh-token/entities/refresh-token.entity";
import { User } from "../../src/app/user/entities/user.entity";
import * as path from 'path';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import { TestContext } from "../utils/test-context";

describe('AttendanceController (e2e)', () => {
    const ctx: TestContext = {};
    let professorRefreshToken: string;
    let expiredProfessorAccessToken: string;
    let notBeforeProfessorAccessToken: string;

    let date: string;

    beforeAll(async () => {
        ctx.app = await defaultBeforeAll();
        ctx.server = ctx.app.getHttpServer();

        // Login Admin
        ctx.adminResponse = await setupAdminUser(ctx.app!);
        ctx.adminToken = ctx.adminResponse.token;

        // Get professor mock data
        ctx.professorMockData = mockProfessor();

        // Login Professor
        ctx.professorToken = await setupProfessorUser(ctx.app!, ctx.professorMockData.email, ctx.professorMockData.password);
        const professorProfileResponse = await request(ctx.server)
            .get('/api/user/profile')
            .set('Authorization', `Bearer ${ctx.professorToken}`)
            .expect(200);

        expect(professorProfileResponse.body.data).toHaveProperty('id');
        expect(professorProfileResponse.body.data).toHaveProperty('email');
        ctx.professorId = professorProfileResponse.body.data.id;

        const professorLoginResponse = await request(ctx.server)
            .post('/api/auth/login')
            .send({
                email: ctx.professorMockData.email,
                password: ctx.professorMockData.password
            })
            .expect(200);
        professorRefreshToken = professorLoginResponse.body.data.refreshToken;

        const privateKeyPath = path.resolve(process.cwd(), process.env.AUTH_PRIVATE_KEY_PATH ?? 'secrets/jwt_private.pem');
        const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
        const issuer = process.env.JWT_ISSUER ?? 'localhost:3000';
        const jwtPayload = {
            userId: ctx.professorId,
            email: ctx.professorMockData.email,
            userRole: 'PROFESSOR'
        };

        expiredProfessorAccessToken = jwt.sign(jwtPayload, privateKey, {
            algorithm: 'RS256',
            issuer,
            expiresIn: '-10s'
        });

        notBeforeProfessorAccessToken = jwt.sign(jwtPayload, privateKey, {
            algorithm: 'RS256',
            issuer,
            expiresIn: '1h',
            notBefore: '10m'
        });

        // Get student mock data
        ctx.studentMockData = mockStudent();

        // Login Student
        ctx.studentToken = await setupStudentUser(ctx.app!, ctx.studentMockData.email, ctx.studentMockData.password);
        const studentProfileResponse = await request(ctx.server)
            .get('/api/user/profile')
            .set('Authorization', `Bearer ${ctx.studentToken}`)
            .expect(200);

        expect(studentProfileResponse.body.data).toHaveProperty('id');
        expect(studentProfileResponse.body.data).toHaveProperty('email');
        ctx.studentId = studentProfileResponse.body.data.id;

        date = formatDateAsYYYYMMDD(new Date());
        ctx.adminClassName = `Drawing-${Date.now()}`;
        ctx.professorClassName = `Social-Science-${Date.now()}`;
    });

    afterAll(async () => {
        const dataSource = ctx.app!.get(DataSource);
        const attendanceRepository = dataSource.getRepository(Attendance);
        const userRepository = dataSource.getRepository(User);
        const attendanceIdsToDelete: string[] = [ctx.adminEntryAttendanceId, ctx.professorEntryAttendanceId]
            .filter((id): id is string => Boolean(id));

        if (attendanceIdsToDelete.length > 0) {
            await attendanceRepository.delete(attendanceIdsToDelete);
        }

        await dataSource
            .createQueryBuilder()
            .delete()
            .from(RefreshToken)
            .execute();

        const userIdsToDelete: string[] = [ctx.studentId, ctx.professorId].filter((id): id is string => Boolean(id));
        if (userIdsToDelete.length > 0) {
            await userRepository.delete(userIdsToDelete);
        }

        const testEmails = [ctx.studentMockData?.email, ctx.professorMockData?.email].filter(
            (email): email is string => Boolean(email)
        );
        if (testEmails.length > 0) {
            await userRepository
                .createQueryBuilder()
                .delete()
                .where('email IN (:...emails)', { emails: testEmails })
                .execute();
        }

        await ctx.app!.close();
    });

    describe('Attendance Lifecycle', () => {
        describe('Create Attendance', () => {
            it('Admin should able to create attendance', async () => {
                const response = await request(ctx.server)
                    .post(`/api/attendance/create/${ctx.studentId}`)
                    .set("Authorization", `Bearer ${ctx.adminToken}`)
                    .send({
                        date,
                        status: "PRESENT",
                        className: ctx.adminClassName
                    })
                    .expect(201);

                expect(response.body).toEqual(
                    expect.objectContaining({
                        success: true,
                        data: expect.any(Object)
                    })
                );
                expect(response.body.data).toHaveProperty('id');

                ctx.adminEntryAttendanceId = response.body.data.id;
            });

            it('Professor should able to create attendance', async () => {
                const response = await request(ctx.server)
                    .post(`/api/attendance/create/${ctx.studentId}`)
                    .set("Authorization", `Bearer ${ctx.professorToken}`)
                    .send({
                        date,
                        status: "PRESENT",
                        className: ctx.professorClassName
                    })
                    .expect(201);

                expect(response.body).toEqual(
                    expect.objectContaining({
                        success: true,
                        data: expect.any(Object)
                    })
                );
                expect(response.body.data).toHaveProperty('id');

                ctx.professorEntryAttendanceId = response.body.data.id;
            });

            it('Should give error on student create attendance', async () => {
                await request(ctx.server)
                    .post(`/api/attendance/create/${ctx.studentId}`)
                    .set('Authorization', `Bearer ${ctx.studentToken}`)
                    .send({
                        date,
                        status: "PRESENT",
                        className: ctx.professorClassName
                    })
                    .expect(403);
            });

            it('Should give conflict error on duplicate record', async () => {
                await request(ctx.server)
                    .post(`/api/attendance/create/${ctx.studentId}`)
                    .set('Authorization', `Bearer ${ctx.professorToken}`)
                    .send({
                        date,
                        status: "PRESENT",
                        className: ctx.professorClassName
                    })
                    .expect(409)
            })

            it('Should give error if studentId is not of student', async () => {
                await request(ctx.server)
                    .post(`/api/attendance/create/${ctx.professorId}`)
                    .set('Authorization', `Bearer ${ctx.professorToken}`)
                    .send({
                        date,
                        status: "PRESENT",
                        className: ctx.professorClassName
                    })
                    .expect(400);
            });

            it('Should give error on invalid token', async () => {
                await request(ctx.server)
                    .post(`/api/attendance/create/${ctx.studentId}`)
                    .set('Authorization', `Bearer nottoken.for.thisrequest`)
                    .send({
                        date,
                        status: "PRESENT",
                        className: ctx.professorClassName
                    })
                    .expect(401);
            });

            it('Should give error on no token provided', async () => {
                await request(ctx.server)
                    .post(`/api/attendance/create/${ctx.studentId}`)
                    .send({
                        date,
                        status: "PRESENT",
                        className: ctx.professorClassName
                    })
                    .expect(401);
            });

            it('Should give error on invalid studentId', async () => {
                await request(ctx.server)
                    .post(`/api/attendance/create/not-a-uuid`)
                    .set('Authorization', `Bearer ${ctx.adminToken}`)
                    .send({
                        date,
                        status: "PRESENT",
                        className: "Math"
                    })
                    .expect(400);
            });
        });

        describe('Update Attendance', () => {
            it('Admin should be able to update attendance', async () => {
                const response = await request(ctx.server)
                    .patch(`/api/attendance/update/${ctx.adminEntryAttendanceId}`)
                    .set('Authorization', `Bearer ${ctx.adminToken}`)
                    .send({
                        status: "ABSENT"
                    })
                    .expect(200);

                expect(response.body).toEqual(
                    expect.objectContaining({
                        success: true,
                        data: expect.any(Object)
                    })
                );
                expect(response.body.data).toHaveProperty('id');
                expect(response.body.data.id).toEqual(ctx.adminEntryAttendanceId);
            });

            it('Professor should be able to update attendance', async () => {
                const response = await request(ctx.server)
                    .patch(`/api/attendance/update/${ctx.professorEntryAttendanceId}`)
                    .set('Authorization', `Bearer ${ctx.professorToken}`)
                    .send({
                        status: "ABSENT"
                    })
                    .expect(200);

                expect(response.body).toEqual(
                    expect.objectContaining({
                        success: true,
                        data: expect.any(Object)
                    })
                );
                expect(response.body.data).toHaveProperty('id');
                expect(response.body.data.id).toEqual(ctx.professorEntryAttendanceId);
            });

            it('Should give conflict error when update creates duplicate combination', async () => {
                await request(ctx.server)
                    .patch(`/api/attendance/update/${ctx.adminEntryAttendanceId}`)
                    .set('Authorization', `Bearer ${ctx.adminToken}`)
                    .send({
                        className: ctx.professorClassName
                    })
                    .expect(409);
            });

            it('Should give error on student update attendance', async () => {
                await request(ctx.server)
                    .patch(`/api/attendance/update/${ctx.professorEntryAttendanceId}`)
                    .set('Authorization', `Bearer ${ctx.studentToken}`)
                    .send({
                        date,
                        status: "PRESENT",
                        className: ctx.professorClassName
                    })
                    .expect(403);
            });

            it('Should give error on missing attendanceId', async () => {
                await request(ctx.server)
                    .patch(`/api/attendance/update/`)
                    .set('Authorization', `Bearer ${ctx.professorToken}`)
                    .send({
                        className: "ABC"
                    })
                    .expect(404);
            });

            it('Should give error on invalid studentId', async () => {
                await request(ctx.server)
                    .patch(`/api/attendance/update/not-a-uuid`)
                    .set('Authorization', `Bearer ${ctx.professorToken}`)
                    .send({
                        date,
                        status: "PRESENT",
                        className: "Math"
                    })
                    .expect(400);
            });

            it('Should give error on empty payload', async () => {
                await request(ctx.server)
                    .patch(`/api/attendance/update/${ctx.professorEntryAttendanceId}`)
                    .set('Authorization', `Bearer ${ctx.professorToken}`)
                    .send({})
                    .expect(400);
            });

            it('Should give error on invalid token', async () => {
                await request(ctx.server)
                    .patch(`/api/attendance/update/${ctx.professorEntryAttendanceId}`)
                    .set('Authorization', 'Bearer invalid.token.value')
                    .send({
                        status: "PRESENT"
                    })
                    .expect(401);
            });

            it('Should give error on no token provided', async () => {
                await request(ctx.server)
                    .patch(`/api/attendance/update/${ctx.professorEntryAttendanceId}`)
                    .send({
                        status: "PRESENT"
                    })
                    .expect(401);
            });
        });

        describe('List Attendance', () => {
            it('Admin should be able to list attendance based on filters', async () => {
                const response = await request(ctx.server)
                    .get('/api/attendance/list')
                    .query({
                        studentId: ctx.studentId
                    })
                    .set('Authorization', `Bearer ${ctx.adminToken}`)
                    .expect(200);

                expect(response.body.data).toEqual(
                    expect.objectContaining({
                        items: expect.any(Array),
                        total: expect.any(Number)
                    })
                );
                expect(response.body.data).toHaveProperty('items');
                expect(response.body.data).toHaveProperty('total');
                expect(response.body.data.items.length).toBeLessThanOrEqual(10);
                expect(Array.isArray(response.body.data.items)).toBe(true);
            });

            it('Professor should be able to list attendance based on filters', async () => {
                const response = await request(ctx.server)
                    .get('/api/attendance/list')
                    .query({
                        studentId: ctx.studentId,
                        className: ctx.professorClassName
                    })
                    .set('Authorization', `Bearer ${ctx.professorToken}`)
                    .expect(200);

                expect(response.body.data).toEqual(
                    expect.objectContaining({
                        items: expect.any(Array),
                        total: expect.any(Number)
                    })
                );
                expect(response.body.data).toHaveProperty('items');
                expect(response.body.data).toHaveProperty('total');
                expect(response.body.data.items.length).toBeLessThanOrEqual(10);
                expect(Array.isArray(response.body.data.items)).toBe(true);
            });

            it('Should filter attendance by month', async () => {
                const response = await request(ctx.server)
                    .get('/api/attendance/list')
                    .query({
                        studentId: ctx.studentId,
                        month: date.slice(0, 7)
                    })
                    .set('Authorization', `Bearer ${ctx.adminToken}`)
                    .expect(200);

                expect(response.body.data).toEqual(
                    expect.objectContaining({
                        items: expect.any(Array),
                        total: expect.any(Number)
                    })
                );
                expect(response.body.data).toHaveProperty('items');
                expect(response.body.data).toHaveProperty('total');
                expect(response.body.data.items.length).toBeLessThanOrEqual(10);
                expect(Array.isArray(response.body.data.items)).toBe(true);
            });

            it('Should give error on invalid month format', async () => {
                await request(ctx.server)
                    .get('/api/attendance/list')
                    .query({
                        studentId: ctx.studentId,
                        month: '2026/03'
                    })
                    .set('Authorization', `Bearer ${ctx.adminToken}`)
                    .expect(400);
            });

            it('Should give error on invalid page and size values', async () => {
                await request(ctx.server)
                    .get('/api/attendance/list')
                    .query({
                        studentId: ctx.studentId,
                        page: 0,
                        size: 101
                    })
                    .set('Authorization', `Bearer ${ctx.adminToken}`)
                    .expect(400);
            });

            it('Should give error if student try to access it', async () => {
                await request(ctx.server)
                    .get('/api/attendance/list')
                    .query({
                        studentId: ctx.studentId
                    })
                    .set('Authorization', `Bearer ${ctx.studentToken}`)
                    .expect(403);
            });

            it('Should give error on missing studentId', async () => {
                await request(ctx.server)
                    .get('/api/attendance/list')
                    .set('Authorization', `Bearer ${ctx.professorToken}`)
                    .expect(400);
            });

            it('Should give error on invalid token', async () => {
                await request(ctx.server)
                    .get('/api/attendance/list')
                    .query({
                        studentId: ctx.studentId
                    })
                    .set('Authorization', 'Bearer invalid.token.value')
                    .expect(401);
            });

            it('Should give error on no token provided', async () => {
                await request(ctx.server)
                    .get('/api/attendance/list')
                    .query({
                        studentId: ctx.studentId
                    })
                    .expect(401);
            });

            it('Should give error on invalid auth format', async () => {
                await request(ctx.server)
                    .get('/api/attendance/list')
                    .query({
                        studentId: ctx.studentId
                    })
                    .set('Authorization', 'Basic abc123')
                    .expect(400);
            });

            it('Should give error on malformed bearer token', async () => {
                await request(ctx.server)
                    .get('/api/attendance/list')
                    .query({
                        studentId: ctx.studentId
                    })
                    .set('Authorization', 'Bearer')
                    .expect(400);
            });

            it('Should give error when refresh token is used as access token', async () => {
                await request(ctx.server)
                    .get('/api/attendance/list')
                    .query({
                        studentId: ctx.studentId
                    })
                    .set('Authorization', `Bearer ${professorRefreshToken}`)
                    .expect(401);
            });

            it('Should give error on expired access token', async () => {
                await request(ctx.server)
                    .get('/api/attendance/list')
                    .query({
                        studentId: ctx.studentId
                    })
                    .set('Authorization', `Bearer ${expiredProfessorAccessToken}`)
                    .expect(401);
            });

            it('Should give error on not-before access token', async () => {
                await request(ctx.server)
                    .get('/api/attendance/list')
                    .query({
                        studentId: ctx.studentId
                    })
                    .set('Authorization', `Bearer ${notBeforeProfessorAccessToken}`)
                    .expect(401);
            });
        });

        describe('Get Attendance By Date and Class', () => {
            it('Admin should able to get attendance based on date and class', async () => {
                const response = await request(ctx.server)
                    .get(`/api/attendance/${ctx.studentId}`)
                    .query({
                        date,
                        className: ctx.professorClassName
                    })
                    .set('Authorization', `Bearer ${ctx.adminToken}`)
                    .expect(200);

                expect(response.body).toEqual(
                    expect.objectContaining({
                        success: true,
                        data: expect.any(Object)
                    })
                );
                expect(response.body.data).toHaveProperty('id');
            });

            it('Professor should able to get attendance based on date and class', async () => {
                const response = await request(ctx.server)
                    .get(`/api/attendance/${ctx.studentId}`)
                    .query({
                        date,
                        className: ctx.professorClassName
                    })
                    .set('Authorization', `Bearer ${ctx.professorToken}`)
                    .expect(200);

                expect(response.body).toEqual(
                    expect.objectContaining({
                        success: true,
                        data: expect.any(Object)
                    })
                );
                expect(response.body.data).toHaveProperty('id');
            });

            it('Should give error on student access it', async () => {
                await request(ctx.server)
                    .get(`/api/attendance/${ctx.studentId}`)
                    .query({
                        date,
                        className: ctx.professorClassName
                    })
                    .set('Authorization', `Bearer ${ctx.studentToken}`)
                    .expect(403);
            });

            it('Should give error on missing className', async () => {
                await request(ctx.server)
                    .get(`/api/attendance/${ctx.studentId}`)
                    .query({
                        date
                    })
                    .set('Authorization', `Bearer ${ctx.professorToken}`)
                    .expect(400);
            });

            it('Should give error on non-existing record', async () => {
                await request(ctx.server)
                    .get(`/api/attendance/${ctx.studentId}`)
                    .query({
                        date: "2026-05-05",
                        className: "ABCD"
                    })
                    .set('Authorization', `Bearer ${ctx.professorToken}`)
                    .expect(404)
            });

            it('Should use today date when date is omitted', async () => {
                const response = await request(ctx.server)
                    .get(`/api/attendance/${ctx.studentId}`)
                    .query({
                        className: ctx.professorClassName
                    })
                    .set('Authorization', `Bearer ${ctx.professorToken}`)
                    .expect(200);

                expect(response.body).toEqual(
                    expect.objectContaining({
                        success: true,
                        data: expect.any(Object)
                    })
                );
            });

            it('Should give error on invalid studentId', async () => {
                await request(ctx.server)
                    .get('/api/attendance/not-a-uuid')
                    .query({
                        date,
                        className: ctx.professorClassName
                    })
                    .set('Authorization', `Bearer ${ctx.professorToken}`)
                    .expect(400);
            });

            it('Should give error on invalid token', async () => {
                await request(ctx.server)
                    .get(`/api/attendance/${ctx.studentId}`)
                    .query({
                        date,
                        className: ctx.professorClassName
                    })
                    .set('Authorization', 'Bearer invalid.token.value')
                    .expect(401);
            });

            it('Should give error on no token provided', async () => {
                await request(ctx.server)
                    .get(`/api/attendance/${ctx.studentId}`)
                    .query({
                        date,
                        className: ctx.professorClassName
                    })
                    .expect(401);
            });
        });

        describe('Delete Attendance', () => {
            it('Admin should able to delete attendance', async () => {
                const response = await request(ctx.server)
                    .delete(`/api/attendance/${ctx.adminEntryAttendanceId}`)
                    .set('Authorization', `Bearer ${ctx.adminToken}`)
                    .expect(200);

                expect(response.body).toEqual(
                    expect.objectContaining({
                        success: true,
                        data: expect.any(Object)
                    })
                );
                expect(response.body.success).toEqual(true);
            });

            it('Professor should able to delete attendance', async () => {
                const response = await request(ctx.server)
                    .delete(`/api/attendance/${ctx.professorEntryAttendanceId}`)
                    .set('Authorization', `Bearer ${ctx.professorToken}`)
                    .expect(200);

                expect(response.body).toEqual(
                    expect.objectContaining({
                        success: true,
                        data: expect.any(Object)
                    })
                );
                expect(response.body.success).toEqual(true);
            });

            it('Should give error on student try to delete it', async () => {
                await request(ctx.server)
                    .delete(`/api/attendance/${ctx.professorEntryAttendanceId}`)
                    .set('Authorization', `Bearer ${ctx.studentToken}`)
                    .expect(403);
            });

            it('Should give error on missing attendanceId', async () => {
                await request(ctx.server)
                    .delete(`/api/attendance/`)
                    .set('Authorization', `Bearer ${ctx.professorToken}`)
                    .expect(404);
            });

            it('Should give error on invalid attendanceId', async () => {
                await request(ctx.server)
                    .delete('/api/attendance/not-a-uuid')
                    .set('Authorization', `Bearer ${ctx.adminToken}`)
                    .expect(400);
            });

            it('Should give error on invalid token', async () => {
                await request(ctx.server)
                    .delete(`/api/attendance/${ctx.professorEntryAttendanceId}`)
                    .set('Authorization', 'Bearer invalid.token.value')
                    .expect(401);
            });

            it('Should give error on no token provided', async () => {
                await request(ctx.server)
                    .delete(`/api/attendance/${ctx.professorEntryAttendanceId}`)
                    .expect(401);
            });

            it('Should give error when record does not exist', async () => {
                await request(ctx.server)
                    .delete('/api/attendance/cf1796ce-5f99-4d06-a5ec-df74a0c1d7f8')
                    .set('Authorization', `Bearer ${ctx.adminToken}`)
                    .expect(404);
            });
        })
    });
})
