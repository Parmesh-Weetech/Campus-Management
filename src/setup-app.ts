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
    const apiVersion = configService.get("API_VERSION") || "v1";
    app.enableVersioning({
        type: VersioningType.URI,
        defaultVersion: apiVersion,
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
            .setDescription('API documentation')
            .addBearerAuth()
            .setVersion('1.0')
            .build();

        const documentV1 = SwaggerModule.createDocument(app, swaggerConfigV1, {
            deepScanRoutes: true,
        });

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
    }


}
