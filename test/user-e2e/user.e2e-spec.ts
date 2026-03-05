import { INestApplication } from "@nestjs/common"
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { defaultBeforeAll, setupAdminUser, setupProfessorUser, setupStudentUser } from "../utils/commonHooks";
import { generatePhoneNumber } from "../../src/app/user/helper/utils";
import request from 'supertest';
import { UserStatus } from "../../src/app/user/types/user-status";
import { UserRole } from "../../src/app/user/types/user-role";

describe("UserController (e2e)", () => {
    let app: INestApplication;
    let adminResponse: { token: string, id: string };
    let adminToken: string;
    let professorToken: string;
    let studentToken: string;
    let adminId: string;
    let professorId: string;
    let studentId: string;
    let newUserEmail: string;
    let newUserPassword: string;
    let newUserName: string;
    let newUserPhoneNumber: string;
    let randomId = uuidv4();

    beforeAll(async () => {
        app = await defaultBeforeAll();

        // Login Admin and Getting Admin Token
        adminResponse = await setupAdminUser(app);
        adminToken = adminResponse.token;
        adminId = adminResponse.id;

        newUserName = `testProfessorUser-${randomId}`;
        newUserEmail = `test-professor-user-${randomId}@example.com`;
        newUserPassword = "P27m_09@b0";
        newUserPhoneNumber = generatePhoneNumber();

        // Create Professor
        const successResponseProfessor = await request(app.getHttpServer())
            .post('/api/user/create/professor')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: newUserName,
                email: newUserEmail,
                password: newUserPassword,
                phoneNumber: newUserPhoneNumber
            })
            .expect(201)

        expect(successResponseProfessor.body.data).toBeDefined();
        expect(successResponseProfessor.body.data.id).toBeDefined();
        expect(successResponseProfessor.body.data.email).toBe(newUserEmail);
        expect(successResponseProfessor.body.data.status).toBe(UserStatus.ACTIVE);
        professorId = successResponseProfessor.body.data.id;

        // Should get error as invalid token
        const errorResponseProfessor = await request(app.getHttpServer())
            .post('/api/user/create/professor')
            .set('Authorization', `Bearer randomestringwithnovalue`)
            .send({
                name: newUserName,
                email: newUserEmail,
                password: newUserPassword,
                phoneNumber: newUserPhoneNumber
            })
            .expect(401);

        // Login Professor
        const professorLoginResponse = await setupProfessorUser(app, newUserEmail, newUserPassword);
        professorToken = professorLoginResponse

        newUserName = `testStudentUser-${randomId}`;
        newUserEmail = `test-student-user-${randomId}@example.com`;
        newUserPhoneNumber = generatePhoneNumber();

        // Create Student
        const responseStudent = await request(app.getHttpServer())
            .post('/api/user/create/student')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: newUserName,
                email: newUserEmail,
                password: newUserPassword,
                phoneNumber: newUserPhoneNumber
            })
            .expect(201);

        expect(responseStudent.body.data).toBeDefined();
        expect(responseStudent.body.data.id).toBeDefined();
        expect(responseStudent.body.data.email).toBe(newUserEmail);
        expect(responseStudent.body.data.status).toBe(UserStatus.ACTIVE);
        studentId = responseStudent.body.data.id;

        // Should get error as professor user cannot create user
        await request(app.getHttpServer())
            .post('/api/user/create/student')
            .set('Authorization', `Bearer ${professorToken}`)
            .send({
                name: newUserName,
                email: newUserEmail,
                password: newUserPassword,
                phoneNumber: newUserPhoneNumber
            })
            .expect(403);

        // Should get error as token in invalid
        await request(app.getHttpServer())
            .post('/api/user/create/student')
            .set('Authorization', `Bearer invalidtokenwithnovalue`)
            .send({
                name: newUserName,
                email: newUserEmail,
                password: newUserPassword,
                phoneNumber: newUserPhoneNumber
            })
            .expect(401);

        // 5️⃣ Login student
        const studentLogin = await setupStudentUser(app, newUserEmail, newUserPassword);

        studentToken = studentLogin;
    });

    afterAll(async () => {
        await app.close();
    });

    describe("User Profile Lifecycle GET /api/user/profile", () => {
        it('Admin can access their own profile', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/user/profile')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.data).toBeDefined();
            expect(response.body.data.userRole).toBe(UserRole.ADMIN);
            expect(response.body.data.email).toBeDefined();
        });

        it('Professor can access their own profile', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/user/profile')
                .set('Authorization', `Bearer ${professorToken}`)
                .expect(200);

            expect(response.body.data).toBeDefined();
            expect(response.body.data.userRole).toBe(UserRole.PROFESSOR);
            expect(response.body.data.email).toBeDefined();
        });

        it('Student can access their own profile', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/user/profile')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.data).toBeDefined();
            expect(response.body.data.userRole).toBe(UserRole.STUDENT);
            expect(response.body.data.email).toBeDefined();
        });

        it('Should return 401 if no token provided', async () => {
            await request(app.getHttpServer())
                .get('/api/user/profile')
                .expect(401);
        });

        it('Should return 401 for invalid token', async () => {
            await request(app.getHttpServer())
                .get('/api/user/profile')
                .set('Authorization', 'Bearer invalidtoken')
                .expect(401);
        });
    });

    describe("Admin can access Professor and Student both profile", () => {
        it('Admin can access professor profile', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/user/profile/${professorId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.data.email).toBeDefined();
            expect(response.body.data.id).toEqual(professorId);
        });

        it('Admin can access student profile', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/user/profile/${studentId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.data.email).toBeDefined();
            expect(response.body.data.id).toEqual(studentId);
        });
    });

    describe("Professor can access student profile", () => {
        it('Professor can access student profile', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/user/profile/${studentId}`)
                .set('Authorization', `Bearer ${professorToken}`)
                .expect(200);

            expect(response.body.data.email).toBeDefined();
            expect(response.body.data.id).toEqual(studentId);
        });
    });

    describe("Professor cannot access admin profile", () => {
        it('Professor cannot access admin profile', async () => {
            await request(app.getHttpServer())
                .get(`/api/user/profile/${adminId}`)
                .set('Authorization', `Bearer ${professorToken}`)
                .expect(403);
        });
    });

    describe('Student cannot access admin or professor profile', () => {
        it('Student cannot access admin profile', async () => {
            await request(app.getHttpServer())
                .get(`/api/user/profile/${adminId}`)
                .set('Authorization', `Bearer ${studentToken}`)
            expect(403);
        });

        it('Student cannot access professor profile', async () => {
            await request(app.getHttpServer())
                .get(`/api/user/profile/${professorId}`)
                .set('Authorization', `Bearer ${studentToken}`)
            expect(403);
        });
    });

    describe('User can upload their profile-photo and thumbnail photo', () => {
        it('Should upload profile-photo for admin', async () => {
            // create temp file
            const tmpDir = path.join(__dirname, '..', '..', 'assets', 'profile-photo');

            if (!fs.existsSync(tmpDir)) {
                fs.mkdirSync(tmpDir, { recursive: true });
            }

            const filePath = path.join(tmpDir, `test-student-${uuidv4()}.jpeg`);

            // create dummy image file
            fs.writeFileSync(filePath, 'dummy-image-content-admin');

            const response = await request(app.getHttpServer())
                .post(`/api/user/upload/profile-photo`)
                .set('Authorization', `Bearer ${adminToken}`)
                .attach('file', filePath)
                .expect(200)

            // Normalise filename from response (could be returned as body string or text)
            let filename: string | undefined;
            if (typeof response.body === 'string') filename = response.body;
            else if (response.body && typeof response.body === 'object') {
                filename =
                    response.body.fileKey ||
                    response.body.data ||
                    response.body.name ||
                    response.body.filename ||
                    response.text;
            } else filename = response.text;

            expect(filename).toBeDefined();
        });

        it('Should upload profile-photo for professor', async () => {
            // create temp file
            const tmpDir = path.join(__dirname, '..', '..', 'assets', 'profile-photo');

            if (!fs.existsSync(tmpDir)) {
                fs.mkdirSync(tmpDir, { recursive: true });
            }

            const filePath = path.join(tmpDir, `test-professor-${uuidv4()}.jpeg`);

            // create dummy image file
            fs.writeFileSync(filePath, 'dummy-image-content-professor');

            const response = await request(app.getHttpServer())
                .post(`/api/user/upload/profile-photo`)
                .set('Authorization', `Bearer ${professorToken}`)
                .attach('file', filePath)
                .expect(200)

            // Normalise filename from response (could be returned as body string or text)
            let filename: string | undefined;
            if (typeof response.body === 'string') filename = response.body;
            else if (response.body && typeof response.body === 'object') {
                filename =
                    response.body.fileKey ||
                    response.body.data ||
                    response.body.name ||
                    response.body.filename ||
                    response.text;
            } else filename = response.text;

            expect(filename).toBeDefined();
        });

        it('Should upload profile-photo for student', async () => {
            // create temp file
            const tmpDir = path.join(__dirname, '..', '..', 'assets', 'profile-photo');

            if (!fs.existsSync(tmpDir)) {
                fs.mkdirSync(tmpDir, { recursive: true });
            }

            const filePath = path.join(tmpDir, `test-student-${uuidv4()}.jpeg`);

            // create dummy image file
            fs.writeFileSync(filePath, 'dummy-image-content-student');

            const response = await request(app.getHttpServer())
                .post(`/api/user/upload/profile-photo`)
                .set('Authorization', `Bearer ${studentToken}`)
                .attach('file', filePath)
                .expect(200)

            // Normalise filename from response (could be returned as body string or text)
            let filename: string | undefined;
            if (typeof response.body === 'string') filename = response.body;
            else if (response.body && typeof response.body === 'object') {
                filename =
                    response.body.fileKey ||
                    response.body.data ||
                    response.body.name ||
                    response.body.filename ||
                    response.text;
            } else filename = response.text;

            expect(filename).toBeDefined();
        });
    })
})
