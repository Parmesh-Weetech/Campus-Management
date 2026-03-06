import { Seeder } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { User } from '../../src/app/user/entities/user.entity';
import { UserStatus } from '../../src/app/user/types/user-status';
import { generateHashPassword } from '../../src/app/auth/helper/utils';

declare global {
    interface EnvVar {
        HASHING_SALT: string;
        ADMIN_NAME: string;
        ADMIN_EMAIL: string;
        ADMIN_PHONE: string;
        ADMIN_PASSWORD: string;
        ADMIN_STATUS: string;
    }
}

export class UserSeeder implements Seeder {
    async run(dataSource: DataSource): Promise<User> {
        const userRepo = dataSource.getRepository(User);

        const adminName = process.env.ADMIN_NAME || 'Admin';
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@demo.com';
        const adminPhoneNumber = process.env.ADMIN_PHONE || '1234567890';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin@demo';
        const adminStatus = (process.env.ADMIN_STATUS as UserStatus) || UserStatus.ACTIVE;

        // Check if admin user exists
        const existingAdmin = await userRepo.findOne({ where: { email: adminEmail } });

        if (existingAdmin) {
            console.log('Admin user already exists');
            return existingAdmin;
        }

        const hashPassword = await generateHashPassword(adminPassword);

        const adminUser = userRepo.create({
            name: adminName,
            email: adminEmail,
            phoneNumber: adminPhoneNumber,
            password: hashPassword,
            status: adminStatus
        });

        await userRepo.save(adminUser);
        console.log('Admin user created:', adminEmail);

        return adminUser;
    }
}