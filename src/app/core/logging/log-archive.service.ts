import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { createReadStream, createWriteStream, Dirent } from 'fs';
import { access, mkdir, readdir, rename, rm } from 'fs/promises';
import * as path from 'path';
import { pipeline } from 'stream/promises';
import { createGzip } from 'zlib';
import { loggingConfig } from './logging.config';

interface LogFileInfo {
    name: string;
    fullPath: string;
    fileDate: Date;
    isCompressed: boolean;
}

@Injectable()
export class LogArchiverService {
    private readonly logger = new Logger(LogArchiverService.name);

    constructor(
        @Inject(loggingConfig.KEY)
        private readonly config: ConfigType<typeof loggingConfig>,
    ) { }

    async archiveOldLogFiles(): Promise<number> {
        const retentionDays = this.config.archiveLogsFileAfterDays;

        if (!Number.isFinite(retentionDays) || retentionDays < 1) {
            this.logger.warn(
                `Skipping log archival because archiveLogsFileAfterDays is invalid: ${retentionDays}`,
            );
            return 0;
        }

        const logsDirPath = path.resolve('logs');
        const archiveDirPath = path.resolve(this.config.logsArchiveDirPath);

        await mkdir(archiveDirPath, { recursive: true });

        const cutoffDate = this.getCutoffDate(retentionDays);
        const logFiles = await this.findEligibleLogFiles(logsDirPath, cutoffDate);

        if (logFiles.length === 0) {
            this.logger.debug(
                `No log files found for archival in ${logsDirPath} before ${cutoffDate.toISOString()}.`,
            );
            return 0;
        }

        let archivedCount = 0;

        for (const file of logFiles) {
            const targetName = file.isCompressed
                ? file.name
                : `${file.name}.gz`;
            const targetPath = await this.resolveUniqueArchivePath(
                archiveDirPath,
                targetName,
            );

            if (file.isCompressed) {
                await rename(file.fullPath, targetPath);
            } else {
                await pipeline(
                    createReadStream(file.fullPath),
                    createGzip(),
                    createWriteStream(targetPath),
                );
                await rm(file.fullPath);
            }

            archivedCount += 1;
        }

        this.logger.log(
            `Archived ${archivedCount} log file(s) older than ${retentionDays} day(s) into ${archiveDirPath}.`,
        );

        return archivedCount;
    }

    private async findEligibleLogFiles(
        logsDirPath: string,
        cutoffDate: Date,
    ): Promise<LogFileInfo[]> {
        const entries: Dirent[] = await readdir(logsDirPath, {
            withFileTypes: true,
        }).catch(() => []);

        return entries
            .filter((entry) => entry.isFile())
            .map((entry) => this.parseLogFileEntry(logsDirPath, entry.name))
            .filter((entry): entry is LogFileInfo => entry !== null)
            .filter((entry) => entry.fileDate.getTime() <= cutoffDate.getTime())
            .sort((left, right) => left.fileDate.getTime() - right.fileDate.getTime());
    }

    private parseLogFileEntry(
        logsDirPath: string,
        fileName: string,
    ): LogFileInfo | null {
        const match = fileName.match(
            /^(\d{2})-(\d{2})-(\d{4})\.log(?:\.gz)?$/,
        );

        if (!match) {
            return null;
        }

        const [, day, month, year] = match;
        const fileDate = new Date(
            Number(year),
            Number(month) - 1,
            Number(day),
        );

        if (Number.isNaN(fileDate.getTime())) {
            return null;
        }

        return {
            name: fileName,
            fullPath: path.resolve(logsDirPath, fileName),
            fileDate,
            isCompressed: fileName.endsWith('.gz'),
        };
    }

    private getCutoffDate(retentionDays: number): Date {
        const cutoffDate = new Date();
        cutoffDate.setHours(0, 0, 0, 0);
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        return cutoffDate;
    }

    private async resolveUniqueArchivePath(
        archiveDirPath: string,
        fileName: string,
    ): Promise<string> {
        const candidatePath = path.resolve(archiveDirPath, fileName);

        if (!(await this.pathExists(candidatePath))) {
            return candidatePath;
        }

        const parsed = path.parse(fileName);
        const suffix = Date.now();

        return path.resolve(
            archiveDirPath,
            `${parsed.name}-${suffix}${parsed.ext}`,
        );
    }

    private async pathExists(candidatePath: string): Promise<boolean> {
        try {
            await access(candidatePath);
            return true;
        } catch {
            return false;
        }
    }
}
