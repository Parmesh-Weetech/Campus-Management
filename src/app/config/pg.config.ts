import { DataSourceOptions } from "typeorm";
import { User } from "../user/entities/user.entity";
import { getEnvVal, getNumericEnvVal } from "../common/helper/env";

declare global {
    interface EnvVar {
        DB_HOST: string;
        DB_PORT?: string;
        DB_USERNAME: string;
        DB_PASSWORD: string;
        DB_NAME: string;
    }
}

export const entities = {
    User
}

export const postgresConfig = () => {
    return {
        postgresConfig: {
            type: 'postgres',
            host: getEnvVal('DB_HOST'),
            port: getNumericEnvVal('DB_PORT', 5434),
            username: getEnvVal('DB_USERNAME'),
            password: getEnvVal('DB_PASSWORD'),
            database: getEnvVal('DB_NAME'),
            entities: entities,
            synchronize: false,
            logging: false,
        } as DataSourceOptions,
    };
};
