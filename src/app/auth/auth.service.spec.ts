import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './services/auth.service';
import { UserService } from '../user/services/user.service';
import { JwtService } from '../jwt/services/jwt.service';
import { RefreshTokenService } from '../refresh-token/services/refresh-token.service';
import { CryptoService } from '../crypto/services/crypto.service';
import { ErrorCode } from '../common/exception/error-code';
import { CustomException } from '../common/exception/custom-exception';

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;
  let jwtService: JwtService<{ userId: string; email: string; userRole: string }>;
  let refreshTokenService: RefreshTokenService;
  let cryptoService: CryptoService;

  const mockUserService = {
    findByEmailOrThrow: jest.fn(),
    findByIdOrThrow: jest.fn(),
  };

  const mockJwtService = {
    signAccessToken: jest.fn(),
    signRefreshToken: jest.fn(),
  };

  const mockRefreshTokenService = {
    saveRefreshToken: jest.fn(),
    deleteToken: jest.fn(),
  };

  const mockCryptoService = {
    asymmetricDecrypt: jest.fn(),
    compareHash: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: RefreshTokenService, useValue: mockRefreshTokenService },
        { provide: CryptoService, useValue: mockCryptoService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService<{ userId: string; email: string; userRole: string }>>(JwtService);
    refreshTokenService = module.get<RefreshTokenService>(RefreshTokenService);
    cryptoService = module.get<CryptoService>(CryptoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should authenticate user and return tokens', async () => {
      const loginReqDTO = {
        email: 'admin@test.com',
        password: 'encrypted',
      };

      const user = {
        id: '1',
        email: 'admin@test.com',
        userRole: 'ADMIN',
        password: 'hashed-password',
      };

      mockUserService.findByEmailOrThrow.mockResolvedValue({ data: user });
      mockCryptoService.asymmetricDecrypt.mockResolvedValue('plain-password');
      mockCryptoService.compareHash.mockResolvedValue(true);
      mockJwtService.signAccessToken.mockResolvedValue('access-token');
      mockJwtService.signRefreshToken.mockResolvedValue('refresh-token');
      mockRefreshTokenService.saveRefreshToken.mockResolvedValue(undefined);

      const result = await service.login(loginReqDTO);

      expect(userService.findByEmailOrThrow).toHaveBeenCalledWith(loginReqDTO.email);
      expect(cryptoService.asymmetricDecrypt).toHaveBeenCalledWith(loginReqDTO.password);
      expect(cryptoService.compareHash).toHaveBeenCalledWith(
        user.password,
        'plain-password'
      );
      expect(jwtService.signAccessToken).toHaveBeenCalledWith({
        userId: user.id,
        email: user.email,
        userRole: user.userRole,
      });
      expect(jwtService.signRefreshToken).toHaveBeenCalledWith({
        userId: user.id,
        email: user.email,
        userRole: user.userRole,
      });
      expect(refreshTokenService.saveRefreshToken).toHaveBeenCalledWith(
        'refresh-token',
        user.id
      );
      expect(result).toEqual({
        success: true,
        expired: false,
        data: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        },
        message: 'Login Successful',
        statusCode: 200,
      });
    });

    it('should throw invalid credentials when password does not match', async () => {
      const loginReqDTO = {
        email: 'admin@test.com',
        password: 'encrypted',
      };

      const user = {
        id: '1',
        email: 'admin@test.com',
        userRole: 'ADMIN',
        password: 'hashed-password',
      };

      mockUserService.findByEmailOrThrow.mockResolvedValue({ data: user });
      mockCryptoService.asymmetricDecrypt.mockResolvedValue('wrong-password');
      mockCryptoService.compareHash.mockResolvedValue(false);

      await expect(service.login(loginReqDTO)).rejects.toBeInstanceOf(CustomException);
      await expect(service.login(loginReqDTO)).rejects.toMatchObject({
        code: ErrorCode.INVALID_CREDENTIALS,
      });

      expect(jwtService.signAccessToken).not.toHaveBeenCalled();
      expect(jwtService.signRefreshToken).not.toHaveBeenCalled();
      expect(refreshTokenService.saveRefreshToken).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should return success message when token is deleted', async () => {
      mockRefreshTokenService.deleteToken.mockResolvedValue({ affected: 1 });

      const result = await service.logout('1', 'refresh-token');

      expect(refreshTokenService.deleteToken).toHaveBeenCalledWith(
        '1',
        'refresh-token'
      );
      expect(result).toBe('Logout successful.');
    });

    it('should return failure message when token is not deleted', async () => {
      mockRefreshTokenService.deleteToken.mockResolvedValue({ affected: 0 });

      const result = await service.logout('1', 'refresh-token');

      expect(refreshTokenService.deleteToken).toHaveBeenCalledWith(
        '1',
        'refresh-token'
      );
      expect(result).toBe('Failed to logout! Try again...');
    });

    it('should return failure message when deleteToken returns null affected', async () => {
      mockRefreshTokenService.deleteToken.mockResolvedValue({ affected: null });

      const result = await service.logout('1', 'refresh-token');

      expect(refreshTokenService.deleteToken).toHaveBeenCalledWith(
        '1',
        'refresh-token'
      );
      expect(result).toBe('Failed to logout! Try again...');
    });

    it('should return failure message when deleteToken returns undefined affected', async () => {
      mockRefreshTokenService.deleteToken.mockResolvedValue({ affected: undefined });

      const result = await service.logout('1', 'refresh-token');

      expect(refreshTokenService.deleteToken).toHaveBeenCalledWith(
        '1',
        'refresh-token'
      );
      expect(result).toBe('Failed to logout! Try again...');
    });
  });

  describe('validateUser', () => {
    it('should call userService.findByIdOrThrow and return response', async () => {
      const mockResponse = {
        success: true,
        expired: false,
        message: 'User found.',
        statusCode: 200,
        data: { id: '1' },
      };

      mockUserService.findByIdOrThrow.mockResolvedValue(mockResponse);

      const result = await service.validateUser('1');

      expect(userService.findByIdOrThrow).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockResponse);
    });
  });
});
