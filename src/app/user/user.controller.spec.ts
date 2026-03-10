import { Test, TestingModule } from "@nestjs/testing";
import { UserController } from "../rest/controllers/user.controller"
import { UserService } from "./user.service";
import { UserRole } from "./types/user-role";
import { User } from "./entities/user.entity";
import { Express } from "express";

describe('UserController', () => {
    let userController: UserController;
    let userService: UserService;

    const mockUserService = {
        createUser: jest.fn(),
        findByIdOrThrow: jest.fn(),
        findUserProfileDetails: jest.fn(),
        uploadProfilePhoto: jest.fn(),
        uploadProfileThumbnail: jest.fn()
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UserController],
            providers: [
                {
                    provide: UserService,
                    useValue: mockUserService,
                },
            ],
        }).compile();

        userController = module.get<UserController>(UserController);
        userService = module.get<UserService>(UserService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Create Professor and Student as User', () => {
        it('Should call userService.createProfessor and return response', async () => {
            const createProfessorReq = {
                name: "professor",
                email: "professor@gmail.com",
                phoneNumber: "9808979897",
                password: "P27m_09@B0"
            }

            const mockResponse = {
                success: true,
                expired: false,
                message: "User Created Successfully.",
                data: {
                    id: '1',
                    name: createProfessorReq.name,
                    email: createProfessorReq.email,
                    phoneNumber: createProfessorReq.phoneNumber,
                    userRole: UserRole.PROFESSOR,
                    status: "ACTIVE",
                },
                statusCode: 201
            }

            mockUserService.createUser.mockResolvedValue(mockResponse);
            const result = await userController.createProfessor(createProfessorReq);

            expect(result).toEqual(mockResponse);
            expect(userService.createUser).toHaveBeenCalledWith(
                createProfessorReq,
                UserRole.PROFESSOR
            );
        });

        it('Should call userService.createStudent and return response', async () => {
            const createStudentReq = {
                name: "student",
                email: "student@gmail.com",
                phoneNumber: "9808979897",
                password: "P27m_09@B0"
            }

            const mockResponse = {
                success: true,
                expired: false,
                message: "User Created Successfully.",
                data: {
                    id: '1',
                    name: createStudentReq.name,
                    email: createStudentReq.email,
                    phoneNumber: createStudentReq.phoneNumber,
                    userRole: UserRole.STUDENT,
                    status: "ACTIVE",
                },
                statusCode: 201
            }

            mockUserService.createUser.mockResolvedValue(mockResponse);
            const result = await userController.createStudent(createStudentReq);

            expect(result).toEqual(mockResponse);
            expect(userService.createUser).toHaveBeenCalledWith(
                createStudentReq,
                UserRole.STUDENT
            );
        });
    });

    describe('Admin, Professor, and Student Profile', () => {
        it('Should call userService.findByIdOrThrow to see user own profile and return response', async () => {
            const user = { id: '1' } as User;

            const mockResponse = {
                success: true,
                expired: false,
                message: "User Profile fetched successfully",
                statusCode: 200,
                data: user
            }

            mockUserService.findByIdOrThrow.mockResolvedValue(mockResponse);
            const result = await userController.findProfileDetails(user);

            expect(result).toEqual(mockResponse);
            expect(userService.findByIdOrThrow).toHaveBeenCalledWith(
                user.id
            )
        });

        it('Admin, and Professor can see student profile', async () => {
            const user = { id: '1' } as User;
            const userId = '2';

            const mockResponse = {
                success: true,
                expired: false,
                message: "User Profile fetched successfully",
                statusCode: 200,
                data: user
            }

            mockUserService.findUserProfileDetails.mockResolvedValue(mockResponse);
            const result = await userController.findUserProfileDetails(
                userId,
                user
            );

            expect(result).toEqual(mockResponse);
            expect(userService.findUserProfileDetails).toHaveBeenCalledWith(
                userId,
                user
            );
        })
    })

    describe('Upload Profile Photos', () => {
        it('Should call userService.uploadProfilePhoto and return response', async () => {
            const user = { id: '1' } as User;
            const file = {
                originalname: 'profile.png',
                mimetype: 'image/png',
                filename: 'profile.png',
                path: '/tmp/profile.png'
            } as Express.Multer.File;

            const mockResponse = 'Profile photo uploaded successfully';

            mockUserService.uploadProfilePhoto.mockResolvedValue(mockResponse);
            const result = await userController.uploadProfilePhoto(file, user);

            expect(result).toEqual(mockResponse);
            expect(userService.uploadProfilePhoto).toHaveBeenCalledWith(
                file,
                user
            );
        });

        it('Should call userService.uploadProfileThumbnail and return response', async () => {
            const user = { id: '1' } as User;
            const file = {
                originalname: 'thumbnail.png',
                mimetype: 'image/png',
                filename: 'thumbnail.png',
                path: '/tmp/thumbnail.png'
            } as Express.Multer.File;

            const mockResponse = 'Profile thumbnail uploaded successfully';

            mockUserService.uploadProfileThumbnail.mockResolvedValue(mockResponse);
            const result = await userController.uploadProfileThumbnail(file, user);

            expect(result).toEqual(mockResponse);
            expect(userService.uploadProfileThumbnail).toHaveBeenCalledWith(
                file,
                user
            );
        });
    });
})
