import * as dotenv from 'dotenv';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { entities } from '../src/app/config/pg.config';

if (process.env.READ_LOCAL_ENV === 'true') {
    dotenv.config({ path: path.resolve('.env') });
}

export default new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: entities,
    migrations: ['./db/migrations/*.ts'],
    migrationsTableName: process.env.DB_MIGRATION_TABLE_NAME,
    migrationsTransactionMode: 'each',
    synchronize: false,
});
