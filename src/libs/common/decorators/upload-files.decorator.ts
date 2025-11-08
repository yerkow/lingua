import { applyDecorators, UseInterceptors } from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { existsSync, mkdirSync } from "fs";
import moment from "moment";
import { diskStorage } from "multer";
import { basename, extname, join } from "path";

export function UploadFiles(fieldName: string = "file", maxCount: number = 20) {
  return applyDecorators(
    UseInterceptors(
      FilesInterceptor(fieldName, maxCount, {
        storage: diskStorage({
          destination: (req, file, cb) => {
            const now = moment();
            const dd = now.format("DD");
            const mm = now.format("MM");
            const yyyy = now.format("YYYY");
            const dir = join(process.cwd(), "uploads", "files", yyyy, mm, dd);
            if (!existsSync(dir)) {
              mkdirSync(dir, { recursive: true });
            }
            cb(null, dir);
          },
          filename: (req, file, cb) => {
            const now = moment();
            const suffix = now.format("YYYYMMDDHHmmss");

            const ext = extname(file.originalname);
            const name = basename(file.originalname, ext);
            cb(null, `${name}-${suffix}${ext}`);
          },
        }),
        fileFilter: (req, file, cb) => {
          // Разрешаем только изображения и документы
          const allowedMimeTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp",
            "application/pdf",
            "application/msword", // .doc
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
            "application/vnd.ms-excel", // .xls
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
            "application/vnd.ms-powerpoint", // .ppt
            "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
          ];

          if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
          } else {
            cb(
              new Error(
                "Разрешены только файлы (jpg, jpeg, png, gif, webp, pdf, doc, docx, xls, xlsx, ppt, pptx)"
              ),
              false
            );
          }
        },
        limits: {
          fileSize: 5 * 1024 * 1024, // 5MB максимум
        },
      })
    )
  );
}
