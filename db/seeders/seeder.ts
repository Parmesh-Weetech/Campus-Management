import { Seeder } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { UserSeeder } from './user.seeder';

export class MainSeeder implements Seeder {
    async run(dataSource: DataSource): Promise<void> {
        // Seed default admin user
        await new UserSeeder().run(dataSource);
    }
}