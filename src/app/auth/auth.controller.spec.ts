import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { AuthController } from "../rest/controllers/auth.controller"
import { LoginReqDTO } from "src/app/rest/dto/request/login-req.dto";
import { User } from "src/app/user/entities/user.entity";

describe('AuthController', () => {
    let authController: AuthController;
    let authService: AuthService;

    const mockAuthService = {
        login: jest.fn(),
        logout: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                {
                    provide: AuthService,
                    useValue: mockAuthService,
                },
            ],
        }).compile();

        authController = module.get<AuthController>(AuthController);
        authService = module.get<AuthService>(AuthService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('login', () => {
        it('should call authService.login and return response', async () => {
            const loginDto: LoginReqDTO = {
                email: 'admin@test.com',
                password: 'password',
            };

            const mockResponse = {
                accessToken: 'accessToken',
                refreshToken: 'refreshToken',
            };

            mockAuthService.login.mockResolvedValue(mockResponse);

            const result = await authController.login(loginDto);

            expect(authService.login).toHaveBeenCalledWith(loginDto);
            expect(result).toEqual(mockResponse);
        });
    });

    describe('logout', () => {
        it('should call authService.logout with user id and refresh token', async () => {
            const user = { id: '1' } as User;

            const body = {
                refreshToken: 'refreshToken',
            };

            mockAuthService.logout.mockResolvedValue('Logged out');

            const result = await authController.logout(user, body);

            expect(authService.logout).toHaveBeenCalledWith(
                user.id,
                body.refreshToken,
            );

            expect(result).toBe('Logged out');
        });
    });

});
