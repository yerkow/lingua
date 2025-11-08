import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class DeleteFileDto {
  @ApiProperty({
    description: "Полный путь к файлу для удаления",
    example: "/files/2025/01/01/document.pdf",
  })
  @IsString()
  @IsNotEmpty()
  filePath: string;
}
