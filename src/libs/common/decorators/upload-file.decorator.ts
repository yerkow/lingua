import { applyDecorators, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { existsSync, mkdirSync } from "fs";
import moment from "moment";
import { diskStorage } from "multer";
import { basename, extname, join } from "path";

export function UploadFile(fieldName: string = "file") {
  return applyDecorators(
    UseInterceptors(
      FileInterceptor(fieldName, {
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
          // Разрешаем только изображения
          if (
            file.mimetype.match(
              /\/(jpg|jpeg|png|gif|webp|pdf|doc|docx|xls|xlsx|ppt|pptx)$/
            )
          ) {
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
