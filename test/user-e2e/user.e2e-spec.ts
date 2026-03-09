import { INestApplication } from "@nestjs/common"
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { defaultBeforeAll, setupAdminUser, setupProfessorUser, setupStudentUser } from "../utils/commonHooks";
import { generatePhoneNumber } from "../../src/app/user/helper/utils";
import { PROFILE_PHOTO_FILE_PATH, PROFILE_THUMBNAIL_FILE_PATH } from "../../src/app/user/helper/paths";
import request from 'supertest';
import { UserStatus } from "../../src/app/user/types/user-status";
import { UserRole } from "../../src/app/user/types/user-role";
import { DataSource } from "typeorm";
import { User } from "../../src/app/user/entities/user.entity";
import { RefreshToken } from "../../src/app/refresh-token/entities/refresh-token.entity";
import { createTempImage, extractFilename } from "../utils/image-operation";

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const ABS_PROFILE_PHOTO_DIR = path.resolve(PROJECT_ROOT, PROFILE_PHOTO_FILE_PATH);
const ABS_PROFILE_THUMBNAIL_DIR = path.resolve(PROJECT_ROOT, PROFILE_THUMBNAIL_FILE_PATH);

describe("UserController (e2e)", () => {
    let app: INestApplication;
    let server;
    let adminResponse: { token: string, id: string };
    let adminToken: string;
    let professorToken: string;
    let studentToken: string;
    let adminId: string;
    let professorId: string;
    let studentId: string;
    let specialNameProfessorId: string;
    let specialNameProfessorToken: string;
    let professorEmail: string;
    let professorPhoneNumber: string;
    let studentEmail: string;
    let studentPhoneNumber: string;
    let newUserEmail: string;
    let newUserPassword: string;
    let newUserName: string;
    let newUserPhoneNumber: string;
    let randomId = uuidv4();
    const tempFiles: string[] = [];
    const uploadedProfilePhotos: string[] = [];
    const uploadedProfileThumbnails: string[] = [];

    beforeAll(async () => {
        app = await defaultBeforeAll();
        server = app.getHttpServer();

        // Login Admin and Getting Admin Token
        adminResponse = await setupAdminUser(app);
        adminToken = adminResponse.token;
        adminId = adminResponse.id;

        newUserName = `testProfessorUser-${randomId}`;
        newUserEmail = `test-professor-user-${randomId}@example.com`;
        professorEmail = newUserEmail;
        newUserPassword = "P27m_09@b0";
        newUserPhoneNumber = generatePhoneNumber();
        professorPhoneNumber = newUserPhoneNumber;

        // Create Professor
        const successResponseProfessor = await request(server)
            .post('/api/user/create/professor')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: newUserName,
                email: newUserEmail,
                password: newUserPassword,
                phoneNumber: newUserPhoneNumber
            })
            .expect(201);

        expect(successResponseProfessor.body).toEqual(
            expect.objectContaining({
                success: true,
                data: expect.any(Object)
            })
        );
        expect(successResponseProfessor.body.data).toHaveProperty('id');
        expect(successResponseProfessor.body.data.email).toEqual(newUserEmail);
        expect(successResponseProfessor.body.data.status).toEqual(UserStatus.ACTIVE);

        professorId = successResponseProfessor.body.data.id;

        // Should get error as invalid token
        await request(server)
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
        studentEmail = newUserEmail;
        newUserPhoneNumber = generatePhoneNumber();
        studentPhoneNumber = newUserPhoneNumber;

        // Create Student
        const responseStudent = await request(server)
            .post('/api/user/create/student')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: newUserName,
                email: newUserEmail,
                password: newUserPassword,
                phoneNumber: newUserPhoneNumber
            })
            .expect(201);

        expect(responseStudent.body).toEqual(
            expect.objectContaining({
                success: true,
                data: expect.any(Object)
            })
        );
        expect(responseStudent.body.data).toHaveProperty('id');
        expect(responseStudent.body.data.email).toBe(newUserEmail);
        expect(responseStudent.body.data.status).toBe(UserStatus.ACTIVE);
        studentId = responseStudent.body.data.id;

        // Should get error as professor user cannot create user
        await request(server)
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
        await request(server)
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

        const specialNameProfessorEmail = `test-special-professor-user-${randomId}@example.com`;
        const specialNameProfessorPassword = "P27m_09@b0";

        const specialNameCreateResponse = await request(server)
            .post('/api/user/create/professor')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: '!!!',
                email: specialNameProfessorEmail,
                password: specialNameProfessorPassword,
                phoneNumber: generatePhoneNumber()
            })
            .expect(201);
        specialNameProfessorId = specialNameCreateResponse.body.data.id;

        const specialNameLoginResponse = await request(server)
            .post('/api/auth/login')
            .send({
                email: specialNameProfessorEmail,
                password: specialNameProfessorPassword
            })
            .expect(200);
        specialNameProfessorToken = specialNameLoginResponse.body.data.accessToken;
    });

    afterAll(async () => {
        for (const filePath of tempFiles) {
            if (fs.existsSync(filePath)) {
                fs.rmSync(filePath, { force: true });
            }
        }

        for (const fileName of uploadedProfilePhotos) {
            const fullPath = path.join(ABS_PROFILE_PHOTO_DIR, fileName);
            if (fs.existsSync(fullPath)) {
                fs.rmSync(fullPath, { force: true });
            }
        }

        for (const fileName of uploadedProfileThumbnails) {
            const fullPath = path.join(ABS_PROFILE_THUMBNAIL_DIR, fileName);
            if (fs.existsSync(fullPath)) {
                fs.rmSync(fullPath, { force: true });
            }
        }

        // No API as don't want the soft-delete.
        const dataSource = app.get(DataSource);
        const userRepository = dataSource.getRepository(User);
        const userIdsToDelete: string[] = [studentId, professorId, specialNameProfessorId].filter((id): id is string => Boolean(id));

        if (userIdsToDelete.length > 0) {
            await userRepository.delete(userIdsToDelete);
        }

        const emailsToDelete = [professorEmail, studentEmail, `test-special-professor-user-${randomId}@example.com`]
            .filter((email): email is string => Boolean(email));
        if (emailsToDelete.length > 0) {
            await userRepository
                .createQueryBuilder()
                .delete()
                .where('email IN (:...emails)', { emails: emailsToDelete })
                .execute();
        }

        await dataSource
            .createQueryBuilder()
            .delete()
            .from(RefreshToken)
            .execute();

        await app.close();
    });

    describe("User Profile Lifecycle", () => {
        it('Admin can access their own profile', async () => {
            const response = await request(server)
                .get('/api/user/profile')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body).toEqual(
                expect.objectContaining({
                    success: true,
                    data: expect.any(Object)
                })
            );
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data).toHaveProperty('userRole');
            expect(response.body.data.email).toBeDefined();
            expect(response.body.data.userRole).toBe(UserRole.ADMIN);
        });

        it('Professor can access their own profile', async () => {
            const response = await request(server)
                .get('/api/user/profile')
                .set('Authorization', `Bearer ${professorToken}`)
                .expect(200);

            expect(response.body).toEqual(
                expect.objectContaining({
                    success: true,
                    data: expect.any(Object)
                })
            );
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data).toHaveProperty('userRole');
            expect(response.body.data.email).toBeDefined();
            expect(response.body.data.userRole).toBe(UserRole.PROFESSOR);
        });

        it('Student can access their own profile', async () => {
            const response = await request(server)
                .get('/api/user/profile')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body).toEqual(
                expect.objectContaining({
                    success: true,
                    data: expect.any(Object)
                })
            );
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data).toHaveProperty('userRole');
            expect(response.body.data.email).toBeDefined();
            expect(response.body.data.userRole).toBe(UserRole.STUDENT);
        });

        it('Should return 401 if no token provided', async () => {
            await request(server)
                .get('/api/user/profile')
                .expect(401);
        });

        it('Should return 401 for invalid token', async () => {
            await request(server)
                .get('/api/user/profile')
                .set('Authorization', 'Bearer invalidtoken')
                .expect(401);
        });

        it('Should return 401 for invalid authorization format', async () => {
            await request(server)
                .get('/api/user/profile')
                .set('Authorization', 'Basic abc123')
                .expect(400);
        });
    });

    describe("User creation conflict and auth checks", () => {
        it('Should give conflict on duplicate professor email', async () => {
            await request(server)
                .post('/api/user/create/professor')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: `dup-prof-email-${randomId}`,
                    email: professorEmail,
                    password: newUserPassword,
                    phoneNumber: generatePhoneNumber()
                })
                .expect(409);
        });

        it('Should give conflict on duplicate professor phone', async () => {
            await request(server)
                .post('/api/user/create/professor')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: `dup-prof-phone-${randomId}`,
                    email: `dup-prof-phone-${randomId}@example.com`,
                    password: newUserPassword,
                    phoneNumber: professorPhoneNumber
                })
                .expect(409);
        });

        it('Should give conflict on duplicate student email', async () => {
            await request(server)
                .post('/api/user/create/student')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: `dup-student-email-${randomId}`,
                    email: studentEmail,
                    password: newUserPassword,
                    phoneNumber: generatePhoneNumber()
                })
                .expect(409);
        });

        it('Should give conflict on duplicate student phone', async () => {
            await request(server)
                .post('/api/user/create/student')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: `dup-student-phone-${randomId}`,
                    email: `dup-student-phone-${randomId}@example.com`,
                    password: newUserPassword,
                    phoneNumber: studentPhoneNumber
                })
                .expect(409);
        });

        it('Should give error on missing token for create professor', async () => {
            await request(server)
                .post('/api/user/create/professor')
                .send({
                    name: `no-token-prof-${randomId}`,
                    email: `no-token-prof-${randomId}@example.com`,
                    password: newUserPassword,
                    phoneNumber: generatePhoneNumber()
                })
                .expect(401);
        });

        it('Should give error on invalid auth format for create student', async () => {
            await request(server)
                .post('/api/user/create/student')
                .set('Authorization', 'Basic abc123')
                .send({
                    name: `basic-auth-student-${randomId}`,
                    email: `basic-auth-student-${randomId}@example.com`,
                    password: newUserPassword,
                    phoneNumber: generatePhoneNumber()
                })
                .expect(400);
        });
    });

    describe("Admin can access Professor and Student both profile", () => {
        it('Admin can access professor profile', async () => {
            const response = await request(server)
                .get(`/api/user/profile/${professorId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body).toEqual(
                expect.objectContaining({
                    success: true,
                    data: expect.any(Object)
                })
            );
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data).toHaveProperty('email');
            expect(response.body.data.email).toBeDefined();
            expect(response.body.data.id).toEqual(professorId);
        });

        it('Admin can access student profile', async () => {
            const response = await request(server)
                .get(`/api/user/profile/${studentId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body).toEqual(
                expect.objectContaining({
                    success: true,
                    data: expect.any(Object)
                })
            );
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data).toHaveProperty('email');
            expect(response.body.data.email).toBeDefined();
            expect(response.body.data.id).toEqual(studentId);
        });

        it('Should give error on invalid userId format', async () => {
            await request(server)
                .get('/api/user/profile/not-a-uuid')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
        });
    });

    describe("Professor can access student profile", () => {
        it('Professor can access student profile', async () => {
            const response = await request(server)
                .get(`/api/user/profile/${studentId}`)
                .set('Authorization', `Bearer ${professorToken}`)
                .expect(200);

            expect(response.body).toEqual(
                expect.objectContaining({
                    success: true,
                    data: expect.any(Object)
                })
            );
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data).toHaveProperty('email');
            expect(response.body.data.email).toBeDefined();
            expect(response.body.data.id).toEqual(studentId);
        });
    });

    describe("Professor cannot access admin profile", () => {
        it('Professor cannot access admin profile', async () => {
            await request(server)
                .get(`/api/user/profile/${adminId}`)
                .set('Authorization', `Bearer ${professorToken}`)
                .expect(403);
        });
    });

    describe('Student cannot access admin or professor profile', () => {
        it('Student cannot access admin profile', async () => {
            await request(server)
                .get(`/api/user/profile/${adminId}`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(403);
        });

        it('Student cannot access professor profile', async () => {
            await request(server)
                .get(`/api/user/profile/${professorId}`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(403);
        });
    });

    describe('User can upload their profile-photo', () => {
        it('Should upload profile-photo for admin', async () => {
            const tmpDir = path.join(__dirname, '..', '..', 'assets', 'profile-photo');
            const filePath = createTempImage(tmpDir, 'test-admin', 'dummy-image-content-admin');
            tempFiles.push(filePath);

            const response = await request(server)
                .post(`/api/user/upload/profile-photo`)
                .set('Authorization', `Bearer ${adminToken}`)
                .attach('file', filePath)
                .expect(200);

            const filename = extractFilename(response);

            expect(filename).toBeDefined();
            uploadedProfilePhotos.push(filename as string);
        });

        it('Should upload profile-photo for professor', async () => {
            const tmpDir = path.join(__dirname, '..', '..', 'assets', 'profile-photo');
            const filePath = createTempImage(tmpDir, 'test-professor', 'dummy-image-content-professor');
            tempFiles.push(filePath);

            const response = await request(server)
                .post(`/api/user/upload/profile-photo`)
                .set('Authorization', `Bearer ${professorToken}`)
                .attach('file', filePath)
                .expect(200);

            const filename = extractFilename(response);

            expect(filename).toBeDefined();
            uploadedProfilePhotos.push(filename as string);
        });

        it('Should upload profile-photo for student', async () => {
            const tmpDir = path.join(__dirname, '..', '..', 'assets', 'profile-photo');
            const filePath = createTempImage(tmpDir, 'test-student', 'dummy-image-content-student');
            tempFiles.push(filePath);

            const response = await request(server)
                .post(`/api/user/upload/profile-photo`)
                .set('Authorization', `Bearer ${studentToken}`)
                .attach('file', filePath)
                .expect(200);

            const filename = extractFilename(response);

            expect(filename).toBeDefined();
            uploadedProfilePhotos.push(filename as string);
        });

        it('Should fallback to user prefix when normalized name becomes empty', async () => {
            const tmpDir = path.join(__dirname, '..', '..', 'assets', 'profile-photo');
            const filePath = createTempImage(tmpDir, 'test-special-name', 'dummy-image-content-special');
            tempFiles.push(filePath);

            const response = await request(server)
                .post(`/api/user/upload/profile-photo`)
                .set('Authorization', `Bearer ${specialNameProfessorToken}`)
                .attach('file', filePath)
                .expect(200);

            const filename = extractFilename(response);
            expect(filename).toBeDefined();
            expect(String(filename).startsWith('user-')).toBe(true);
            uploadedProfilePhotos.push(filename as string);
        });

        it('Should give error on invalid file type', async () => {
            const tmpDir = path.join(__dirname, '..', '..', 'assets', 'profile-photo');
            if (!fs.existsSync(tmpDir)) {
                fs.mkdirSync(tmpDir, { recursive: true });
            }

            const invalidFilePath = path.join(tmpDir, `test-invalid-${uuidv4()}.txt`);
            fs.writeFileSync(invalidFilePath, 'not-an-image');
            tempFiles.push(invalidFilePath);

            const response = await request(server)
                .post(`/api/user/upload/profile-photo`)
                .set('Authorization', `Bearer ${studentToken}`)
                .attach('file', invalidFilePath)
                .expect(400);

            expect(response.body).toEqual(
                expect.objectContaining({
                    success: false,
                    message: 'Invalid file type'
                })
            );
        });

        it('Should give error on no token', async () => {
            const tmpDir = path.join(__dirname, '..', '..', 'assets', 'profile-photo');
            const filePath = createTempImage(tmpDir, 'test-student', 'dummy-image-content-student');
            tempFiles.push(filePath);

            await request(server)
                .post(`/api/user/upload/profile-photo`)
                .attach('file', filePath)
                .expect(401)
        });

        it('Should give error on invalid token', async () => {
            const tmpDir = path.join(__dirname, '..', '..', 'assets', 'profile-photo');
            const filePath = createTempImage(tmpDir, 'test-student', 'dummy-image-content-student');
            tempFiles.push(filePath);

            await request(server)
                .post(`/api/user/upload/profile-photo`)
                .set('Authorization', `Bearer invalid.token.withnodata`)
                .attach('file', filePath)
                .expect(401)
        });

        it('Should give error on invalid auth format', async () => {
            const tmpDir = path.join(__dirname, '..', '..', 'assets', 'profile-photo');
            const filePath = createTempImage(tmpDir, 'test-student', 'dummy-image-content-student');
            tempFiles.push(filePath);

            await request(server)
                .post(`/api/user/upload/profile-photo`)
                .set('Authorization', 'Basic abc123')
                .attach('file', filePath)
                .expect(400);
        });

        it('Should give error on missing file', async () => {
            const tmpDir = path.join(__dirname, '..', '..', 'assets', 'profile-photo');
            const filePath = createTempImage(tmpDir, 'test-student', 'dummy-image-content-student');
            tempFiles.push(filePath);

            await request(server)
                .post(`/api/user/upload/profile-photo`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(400)
        })
    });

    describe('User can upload their thumbnail-photo', () => {
        it('Should upload thumbnail-photo for admin', async () => {
            const tmpDir = path.join(__dirname, '..', '..', 'assets', 'thumbnail-photo');
            const filePath = createTempImage(tmpDir, 'test-admin', 'dummy-image-content-admin');
            tempFiles.push(filePath);

            const response = await request(server)
                .post(`/api/user/upload/profile-thumbnail`)
                .set('Authorization', `Bearer ${adminToken}`)
                .attach('file', filePath)
                .expect(200);

            const filename = extractFilename(response);

            expect(filename).toBeDefined();
            uploadedProfileThumbnails.push(filename as string);
        });

        it('Should upload thumbnail-photo for professor', async () => {
            const tmpDir = path.join(__dirname, '..', '..', 'assets', 'thumbnail-photo');
            const filePath = createTempImage(tmpDir, 'test-professor', 'dummy-image-content-professor');
            tempFiles.push(filePath);

            const response = await request(server)
                .post(`/api/user/upload/profile-thumbnail`)
                .set('Authorization', `Bearer ${professorToken}`)
                .attach('file', filePath)
                .expect(200);

            const filename = extractFilename(response);

            expect(filename).toBeDefined();
            uploadedProfileThumbnails.push(filename as string);
        });

        it('Should upload thumbnail-photo for student', async () => {
            const tmpDir = path.join(__dirname, '..', '..', 'assets', 'thumbnail-photo');
            const filePath = createTempImage(tmpDir, 'test-student', 'dummy-image-content-student');
            tempFiles.push(filePath);

            const response = await request(server)
                .post(`/api/user/upload/profile-thumbnail`)
                .set('Authorization', `Bearer ${studentToken}`)
                .attach('file', filePath)
                .expect(200);

            const filename = extractFilename(response);

            expect(filename).toBeDefined();
            uploadedProfileThumbnails.push(filename as string);
        });

        it('Should give error on invalid file type', async () => {
            const tmpDir = path.join(__dirname, '..', '..', 'assets', 'profile-photo');
            if (!fs.existsSync(tmpDir)) {
                fs.mkdirSync(tmpDir, { recursive: true });
            }

            const invalidFilePath = path.join(tmpDir, `test-invalid-${uuidv4()}.txt`);
            fs.writeFileSync(invalidFilePath, 'not-an-image');
            tempFiles.push(invalidFilePath);

            const response = await request(server)
                .post(`/api/user/upload/profile-thumbnail`)
                .set('Authorization', `Bearer ${studentToken}`)
                .attach('file', invalidFilePath)
                .expect(400);

            expect(response.body).toEqual(
                expect.objectContaining({
                    success: false,
                    message: 'Invalid file type'
                })
            );
        });

        it('Should give error on no token', async () => {
            const tmpDir = path.join(__dirname, '..', '..', 'assets', 'thumbnail-photo');
            const filePath = createTempImage(tmpDir, 'test-student', 'dummy-image-content-student');
            tempFiles.push(filePath);

            await request(server)
                .post(`/api/user/upload/profile-thumbnail`)
                .attach('file', filePath)
                .expect(401);
        });

        it('Should give error on invalid token', async () => {
            const tmpDir = path.join(__dirname, '..', '..', 'assets', 'thumbnail-photo');
            const filePath = createTempImage(tmpDir, 'test-student', 'dummy-image-content-student');
            tempFiles.push(filePath);

            await request(server)
                .post(`/api/user/upload/profile-thumbnail`)
                .set('Authorization', `Bearer invalid.token.withnodata`)
                .attach('file', filePath)
                .expect(401);
        });

        it('Should give error on invalid auth format', async () => {
            const tmpDir = path.join(__dirname, '..', '..', 'assets', 'thumbnail-photo');
            const filePath = createTempImage(tmpDir, 'test-student', 'dummy-image-content-student');
            tempFiles.push(filePath);

            await request(server)
                .post(`/api/user/upload/profile-thumbnail`)
                .set('Authorization', 'Basic abc123')
                .attach('file', filePath)
                .expect(400);
        });

        it('Should give error on missing file', async () => {
            await request(server)
                .post(`/api/user/upload/profile-thumbnail`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(400);
        });
    })
})
