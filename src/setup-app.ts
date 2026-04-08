import { INestApplication, ValidationPipe, VersioningType } from "@nestjs/common";
import { isProd } from "./app/common/helper";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { DataSource } from "typeorm";
import { MainSeeder } from "../db/seeders/seeder";
import { CustomExceptionFilter } from "./app/common/exception/custom-exception.filter";
import { LoggingInterceptor } from "./app/core/logging/logger.interceptor";
import 'multer'

export const setupApp = async (app: INestApplication) => {
    const configService = app.get(ConfigService);

    const globalPrefix = 'api';
    app.setGlobalPrefix(globalPrefix, { exclude: ['u/:shortUrl'] });

    /* ------------------- API VERSIONING ----------------- */
    app.enableVersioning({
        type: VersioningType.URI,
        defaultVersion: ['1', '2'],
        prefix: 'v'
    });

    /* -------------------- DB SEEDING -------------------- */
    if (configService.get("AUTO_SEED")) {
        const dataSource = app.get(DataSource);
        if (!dataSource.isInitialized) {
            await dataSource.initialize();
        }

        console.log('🌱 Running database seeders...');
        await new MainSeeder().run(dataSource);
        console.log('✅ Database seeding completed');
    }

    /* -------------------- GLOBAL SETUP -------------------- */
    app.useGlobalPipes(
        new ValidationPipe({
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );
    app.useGlobalInterceptors(new LoggingInterceptor());
    app.useGlobalFilters(new CustomExceptionFilter());

    app.enableCors({
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        preflightContinue: false,
        optionsSuccessStatus: 204,
    });

    /* -------------------- SWAGGER -------------------- */
    if (!isProd()) {
        const swaggerConfigV1 = new DocumentBuilder()
            .setTitle('CampusAccess API - V1')
            .setDescription('Version 1 API documentation')
            .addBearerAuth()
            .setVersion('1.0')
            .build();

        const documentV1 = SwaggerModule.createDocument(app, swaggerConfigV1, {
            deepScanRoutes: true,
        });

        documentV1.paths = Object.keys(documentV1.paths)
            .filter(
                (path) =>
                    path.includes('/v1/') ||
                    (!path.includes('/v2/') && !path.includes('/v1/')),
            )
            .reduce((acc, path) => {
                acc[path] = documentV1.paths[path];
                return acc;
            }, {});

        SwaggerModule.setup('api/docs/v1', app, documentV1, {
            swaggerOptions: {
                persistAuthorization: true,
                docExpansion: 'list',
                tagsSorter: 'alpha',
                operationsSorter: 'alpha',
                filter: true,
                displayRequestDuration: true,
            },
            jsonDocumentUrl: 'api/docs/v1-json',
            customSiteTitle: 'CampusAccess API - V1',
        });

        const swaggerConfigV2 = new DocumentBuilder()
            .setTitle('CampusAccess API - V2')
            .setDescription('Version 2 API documentation')
            .addBearerAuth()
            .setVersion('2.0')
            .build();

        const documentV2 = SwaggerModule.createDocument(app, swaggerConfigV2, {
            deepScanRoutes: true,
        });

        documentV2.paths = Object.keys(documentV2.paths)
            .filter(
                (path) =>
                    path.includes('/v2/') ||
                    (!path.includes('/v2/') && !path.includes('/v1/')),
            )
            .reduce((acc, path) => {
                acc[path] = documentV2.paths[path];
                return acc;
            }, {});

        SwaggerModule.setup('api/docs/v2', app, documentV2, {
            swaggerOptions: {
                persistAuthorization: true,
                docExpansion: 'list',
                tagsSorter: 'alpha',
                operationsSorter: 'alpha',
                filter: true,
                displayRequestDuration: true,
            },
            jsonDocumentUrl: 'api/docs/v2-json',
            customSiteTitle: 'CampusAccess API - V2',
        });
    }


}
