import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express'
import { User } from './entities/user.entity';
import { UserService } from './user.service';
import { UserReaderService } from './user-reader.service';
import { UserController } from '../rest/controllers/user.controller';
import { UserWriterService } from './user-writer.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        MulterModule.register({
            limits: { fileSize: 10 * 1024 * 1024 }
        })
    ],
    providers: [UserService, UserReaderService, UserWriterService],
    exports: [UserService],
    controllers: [UserController]
})
export class UserModule { }
