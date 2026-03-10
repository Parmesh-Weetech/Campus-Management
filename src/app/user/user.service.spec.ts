import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { UserReaderService } from './user-reader.service';
import { UserWriterService } from './user-writer.service';
import { CryptoService } from '../crypto/crypto.service';
import { ErrorCode } from '../common/exception/error-code';
import { CustomException } from '../common/exception/custom-exception';
import { UserRole } from './types/user-role';
import { ProfileImageType } from './enum/profile-image-type.enum';
import { canViewTargetProfile } from './helper/utils';

jest.mock('./helper/utils', () => ({
  canViewTargetProfile: jest.fn(),
}));

describe('UserService', () => {
  let service: UserService;
  let userReaderService: UserReaderService;
  let userWriterService: UserWriterService;
  let cryptoService: CryptoService;

  const mockUserReaderService = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findByPhone: jest.fn(),
  };

  const mockUserWriterService = {
    createUser: jest.fn(),
    updateProfilePhotoOrThumbnail: jest.fn(),
  };

  const mockCryptoService = {
    asymmetricDecrypt: jest.fn(),
    hash: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: UserReaderService, useValue: mockUserReaderService },
        { provide: UserWriterService, useValue: mockUserWriterService },
        { provide: CryptoService, useValue: mockCryptoService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userReaderService = module.get<UserReaderService>(UserReaderService);
    userWriterService = module.get<UserWriterService>(UserWriterService);
    cryptoService = module.get<CryptoService>(CryptoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByEmailOrThrow', () => {
    it('should return user when found', async () => {
      const user = { id: '1', email: 'a@test.com' };
      mockUserReaderService.findByEmail.mockResolvedValue(user);

      const result = await service.findByEmailOrThrow('a@test.com');

      expect(userReaderService.findByEmail).toHaveBeenCalledWith('a@test.com');
      expect(result).toMatchObject({ data: user, statusCode: 200 });
    });

    it('should throw when user not found', async () => {
      mockUserReaderService.findByEmail.mockResolvedValue(null);

      await expect(service.findByEmailOrThrow('a@test.com')).rejects.toMatchObject({
        code: ErrorCode.USER_NOT_FOUND,
      });
    });
  });

  describe('findByIdOrThrow', () => {
    it('should return user when found', async () => {
      const user = { id: '1' };
      mockUserReaderService.findById.mockResolvedValue(user);

      const result = await service.findByIdOrThrow('1');

      expect(userReaderService.findById).toHaveBeenCalledWith('1');
      expect(result).toMatchObject({ data: user, statusCode: 200 });
    });

    it('should throw when user not found', async () => {
      mockUserReaderService.findById.mockResolvedValue(null);

      await expect(service.findByIdOrThrow('1')).rejects.toMatchObject({
        code: ErrorCode.USER_NOT_FOUND,
      });
    });
  });

  describe('findUserProfileDetails', () => {
    it('should return target profile when allowed', async () => {
      const target = { id: '2', userRole: UserRole.STUDENT };
      mockUserReaderService.findById.mockResolvedValue(target);
      (canViewTargetProfile as jest.Mock).mockReturnValue(true);

      const result = await service.findUserProfileDetails('2', {
        id: '1',
        userRole: UserRole.ADMIN,
      } as never);

      expect(canViewTargetProfile).toHaveBeenCalled();
      expect(result).toMatchObject({ data: target });
    });

    it('should throw when profile view is not allowed', async () => {
      const target = { id: '2', userRole: UserRole.STUDENT };
      mockUserReaderService.findById.mockResolvedValue(target);
      (canViewTargetProfile as jest.Mock).mockReturnValue(false);

      await expect(
        service.findUserProfileDetails('2', {
          id: '1',
          userRole: UserRole.STUDENT,
        } as never)
      ).rejects.toBeInstanceOf(CustomException);

      await expect(
        service.findUserProfileDetails('2', {
          id: '1',
          userRole: UserRole.STUDENT,
        } as never)
      ).rejects.toMatchObject({ code: ErrorCode.ROLE_PERMISSION_DENIED });
    });
  });

  describe('createUser', () => {
    it('should create user and return response', async () => {
      const req = {
        name: 'Student',
        email: 'student@test.com',
        phoneNumber: '1234567890',
        password: 'encrypted',
      };

      const createdUser = {
        id: '1',
        email: req.email,
        phoneNumber: req.phoneNumber,
        userRole: UserRole.STUDENT,
      };

      mockUserReaderService.findByEmail.mockResolvedValue(null);
      mockUserReaderService.findByPhone.mockResolvedValue(null);
      mockCryptoService.asymmetricDecrypt.mockReturnValue('plain');
      mockCryptoService.hash.mockResolvedValue('hashed');
      mockUserWriterService.createUser.mockResolvedValue(createdUser);

      const result = await service.createUser(req, UserRole.STUDENT);

      expect(cryptoService.asymmetricDecrypt).toHaveBeenCalledWith(req.password);
      expect(cryptoService.hash).toHaveBeenCalledWith('plain');
      expect(userWriterService.createUser).toHaveBeenCalledWith(
        req,
        'hashed',
        UserRole.STUDENT
      );
      expect(result).toMatchObject({
        success: true,
        statusCode: 201,
        data: createdUser,
      });
    });

    it('should throw when email already exists', async () => {
      mockUserReaderService.findByEmail.mockResolvedValue({ id: '1' });

      await expect(
        service.createUser({} as never, UserRole.STUDENT)
      ).rejects.toMatchObject({ code: ErrorCode.USER_ALREADY_EXISTS_WITH_EMAIL });
    });

    it('should throw when phone already exists', async () => {
      mockUserReaderService.findByEmail.mockResolvedValue(null);
      mockUserReaderService.findByPhone.mockResolvedValue({ id: '1' });

      await expect(
        service.createUser({} as never, UserRole.STUDENT)
      ).rejects.toMatchObject({ code: ErrorCode.USER_ALREADY_EXISTS_WITH_PHONE });
    });

    it('should throw when user creation fails', async () => {
      mockUserReaderService.findByEmail.mockResolvedValue(null);
      mockUserReaderService.findByPhone.mockResolvedValue(null);
      mockCryptoService.asymmetricDecrypt.mockReturnValue('plain');
      mockCryptoService.hash.mockResolvedValue('hashed');
      mockUserWriterService.createUser.mockResolvedValue(null);

      await expect(
        service.createUser({} as never, UserRole.STUDENT)
      ).rejects.toMatchObject({ code: ErrorCode.INTERNAL_SERVER_ERROR });
    });
  });

  describe('uploadProfilePhoto', () => {
    it('should update profile photo and return filename', async () => {
      const file = { filename: 'photo.png' } as Express.Multer.File;
      mockUserWriterService.updateProfilePhotoOrThumbnail.mockResolvedValue({ id: '1' });

      const result = await service.uploadProfilePhoto(file, { id: '1' } as never);

      expect(userWriterService.updateProfilePhotoOrThumbnail).toHaveBeenCalledWith(
        '1',
        'photo.png',
        ProfileImageType.PROFILE_PHOTO
      );
      expect(result).toBe('photo.png');
    });

    it('should throw when file is missing', async () => {
      await expect(
        service.uploadProfilePhoto(undefined as never, { id: '1' } as never)
      ).rejects.toMatchObject({ code: ErrorCode.BAD_REQUEST });
    });

    it('should throw when user is missing', async () => {
      const file = { filename: 'photo.png' } as Express.Multer.File;

      await expect(
        service.uploadProfilePhoto(file, {} as never)
      ).rejects.toMatchObject({ code: ErrorCode.USER_NOT_IN_REQUEST });
    });

    it('should throw when update fails', async () => {
      const file = { filename: 'photo.png' } as Express.Multer.File;
      mockUserWriterService.updateProfilePhotoOrThumbnail.mockResolvedValue(null);

      await expect(
        service.uploadProfilePhoto(file, { id: '1' } as never)
      ).rejects.toMatchObject({ code: ErrorCode.USER_NOT_FOUND });
    });
  });

  describe('uploadProfileThumbnail', () => {
    it('should update profile thumbnail and return filename', async () => {
      const file = { filename: 'thumb.png' } as Express.Multer.File;
      mockUserWriterService.updateProfilePhotoOrThumbnail.mockResolvedValue({ id: '1' });

      const result = await service.uploadProfileThumbnail(file, { id: '1' } as never);

      expect(userWriterService.updateProfilePhotoOrThumbnail).toHaveBeenCalledWith(
        '1',
        'thumb.png',
        ProfileImageType.THUMBNAIL
      );
      expect(result).toBe('thumb.png');
    });

    it('should throw when user is missing', async () => {
      const file = { filename: 'thumb.png' } as Express.Multer.File;

      await expect(
        service.uploadProfileThumbnail(file, {} as never)
      ).rejects.toMatchObject({ code: ErrorCode.USER_NOT_IN_REQUEST });
    });

    it('should throw when file is missing', async () => {
      await expect(
        service.uploadProfileThumbnail(undefined as never, { id: '1' } as never)
      ).rejects.toMatchObject({ code: ErrorCode.BAD_REQUEST });
    });

    it('should throw when update fails', async () => {
      const file = { filename: 'thumb.png' } as Express.Multer.File;
      mockUserWriterService.updateProfilePhotoOrThumbnail.mockResolvedValue(null);

      await expect(
        service.uploadProfileThumbnail(file, { id: '1' } as never)
      ).rejects.toMatchObject({ code: ErrorCode.USER_NOT_FOUND });
    });
  });
});
