import { LanguageNameDto } from "@/libs/common/dto/language.dto";
import { ApiProperty } from "@nestjs/swagger";
import { Prisma } from "generated/prisma";

export class FileResponseDto {
  @ApiProperty({
    description: "Уникальный идентификатор файла",
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: "Название файла",
    example: "document.pdf",
    type: String,
  })
  name: string;

  @ApiProperty({
    description: "Путь к файлу",
    example: "/uploads/files/document.pdf",
    type: String,
  })
  file_path: string;

  @ApiProperty({
    description: "Дата создания",
    example: "2024-01-01T00:00:00.000Z",
    type: String,
  })
  created_at: Date;
}
export class UserFilesByMapIndicatorResponseDto {
  @ApiProperty({
    description: "Информация о карте показателя",
    type: LanguageNameDto,
  })
  map_indicator: Prisma.JsonValue;

  @ApiProperty({
    description: "Название файла",
    type: [FileResponseDto],
  })
  files: FileResponseDto[];
}
