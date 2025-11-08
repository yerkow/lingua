import { PrismaService } from "@/prisma/prisma.service";
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { promises as fs } from "fs";
import { join } from "path";
import { DeleteFileDto } from "./dto/delete-file.dto";
import { UploadFileResponseDto } from "./dto/upload-file-response.dto";

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly uploadsPath = join(process.cwd(), "uploads", "files");

  constructor(private readonly prismaService: PrismaService) {
    this.ensureUploadsDirectory();
  }

  /**
   * Создает директорию uploads/files если она не существует
   */
  private async ensureUploadsDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadsPath);
    } catch {
      await fs.mkdir(this.uploadsPath, { recursive: true });
      this.logger.log(`Создана директория: ${this.uploadsPath}`);
    }
  }

  /**
   * Сохраняет файл в директорию uploads/files
   * @param file - Загруженный файл
   * @param customPath - Опциональный кастомный путь (относительно uploads/files)
   * @returns Информация о сохраненном файле
   */
  async saveFile(
    file: Express.Multer.File,
    customPath?: string
  ): Promise<UploadFileResponseDto> {
    try {
      if (!file) {
        throw new BadRequestException("Файл не был загружен");
      }

      // Генерируем уникальное имя файла
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.originalname.split(".").pop();
      const fileName = `${timestamp}_${randomString}.${fileExtension}`;

      // Определяем путь для сохранения
      const relativePath = customPath ? join(customPath, fileName) : fileName;
      const fullPath = join(this.uploadsPath, relativePath);

      // Создаем директории если нужно
      const dirPath = join(this.uploadsPath, customPath || "");
      await fs.mkdir(dirPath, { recursive: true });

      // Сохраняем файл
      await fs.writeFile(fullPath, file.buffer);

      const result: UploadFileResponseDto = {
        filePath: `uploads/files/${relativePath}`,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      };

      this.logger.log(`Файл сохранен: ${result.filePath}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Ошибка при сохранении файла: ${error.message}`,
        error.stack
      );
      throw new BadRequestException(
        `Не удалось сохранить файл: ${error.message}`
      );
    }
  }

  /**
   * Удаляет файл по указанному пути
   * @param deleteFileDto - DTO с путем к файлу
   */
  async deleteFile(deleteFileDto: DeleteFileDto): Promise<void> {
    try {
      const { filePath } = deleteFileDto;

      // Получаем полный путь к файлу
      const fullPath = join(process.cwd(), "uploads", filePath);

      // Проверяем существование файла
      try {
        await fs.access(fullPath);
      } catch {
        throw new NotFoundException(`Файл не найден: ${filePath}`);
      }

      // Удаляем файл
      await fs.unlink(fullPath);

      this.logger.log(`Файл удален: ${filePath}`);

      // Проверяем, можно ли удалить пустую директорию
      const dirPath = join(
        process.cwd(),
        "uploads",
        filePath.split("/").slice(0, -1).join("/")
      );
      try {
        const files = await fs.readdir(dirPath);
        if (files.length === 0) {
          await fs.rmdir(dirPath);
          this.logger.log(`Удалена пустая директория: ${dirPath}`);
        }
      } catch {
        // Игнорируем ошибки при удалении директории
      }
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error(
        `Ошибка при удалении файла: ${error.message}`,
        error.stack
      );
      throw new BadRequestException(
        `Не удалось удалить файл: ${error.message}`
      );
    }
  }

  /**
   * Проверяет существование файла
   * @param filePath - Путь к файлу
   * @returns true если файл существует
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      const fullPath = join(process.cwd(), filePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Получает информацию о файле
   * @param filePath - Путь к файлу
   * @returns Информация о файле
   */
  async getFileInfo(
    filePath: string
  ): Promise<{ size: number; mimetype?: string }> {
    try {
      const fullPath = join(process.cwd(), filePath);
      const stats = await fs.stat(fullPath);

      return {
        size: stats.size,
        mimetype: undefined, // MIME тип можно определить по расширению файла
      };
    } catch (error) {
      throw new NotFoundException(`Файл не найден: ${filePath}`);
    }
  }
}
