import { ApiProperty } from "@nestjs/swagger";

export class UploadFileResponseDto {
  @ApiProperty({
    description: "Полный путь к загруженному файлу",
    example: "uploads/files/document.pdf",
  })
  filePath: string;

  @ApiProperty({
    description: "Оригинальное имя файла",
    example: "document.pdf",
  })
  originalName: string;

  @ApiProperty({
    description: "Размер файла в байтах",
    example: 1024000,
  })
  size: number;

  @ApiProperty({
    description: "MIME тип файла",
    example: "application/pdf",
  })
  mimetype: string;
}
