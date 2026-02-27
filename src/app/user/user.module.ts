import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express'
import { User } from './entities/user.entity';
import { UserService } from './user.service';
import { UserReaderService } from './user-reader.service';
import { UserController } from '../rest/controllers/user.controller';
import { UserWriterService } from './user-writer.service';
import { diskStorage } from 'multer';
import * as path from 'path';

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        MulterModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                storage: diskStorage({
                    destination: path.resolve(configService.getOrThrow<string>('PROFILE_PHOTO_FILE_PATH')),
                    filename: (req, file, cb) => {
                        const loggedInUser = (req as { user?: User }).user;
                        const normalizedName = (loggedInUser?.name ?? 'user')
                            .trim()
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/^-+|-+$/g, '');
                        const fileExtension = path.extname(file.originalname).toLowerCase();
                        cb(null, `${normalizedName || 'user'}-${Date.now()}${fileExtension}`);
                    }
                }),
                limits: { fileSize: 10 * 1024 * 1024 }
            })
        })
    ],
    providers: [UserService, UserReaderService, UserWriterService],
    exports: [UserService],
    controllers: [UserController]
})
export class UserModule { }
