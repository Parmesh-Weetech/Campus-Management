import { Seeder } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { User } from '../../src/app/user/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { UserStatus } from '../../src/app/user/types/user-status';
import { getEnvVal } from 'src/app/common/helper';

declare global {
    interface EnvVar {
        HASHING_SALT: string;
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

        const genSalt = getEnvVal("HASHING_SALT", '20');
        const hashedPassword = await bcrypt.hash(adminPassword, Number(genSalt));

        const adminUser = userRepo.create({
            name: adminName,
            email: adminEmail,
            phoneNumber: adminPhoneNumber,
            password: hashedPassword,
            status: adminStatus
        });

        await userRepo.save(adminUser);
        console.log('Admin user created:', adminEmail);

        return adminUser;
    }
}