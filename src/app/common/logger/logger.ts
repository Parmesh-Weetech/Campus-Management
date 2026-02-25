import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

// File transport: daily rotating file
const fileTransport = new winston.transports.DailyRotateFile({
    filename: 'logs/%DATE%.log',
    datePattern: 'DD-MM-YYYY',
    zippedArchive: true,
    maxFiles: '90d',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
            // Prefix timestamp + level, then stringify JSON
            return `${timestamp} [${level}]: ${JSON.stringify({ ...meta, message })}`;
        }),
    ),
});

// Console transport: colorized, same format
const consoleTransport = new winston.transports.Console({
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
            return `${timestamp} [${level}]: ${JSON.stringify({ ...meta, message })}`;
        }),
    ),
});

export const logger = WinstonModule.createLogger({
    transports: [fileTransport, consoleTransport],
    level: 'debug',
});