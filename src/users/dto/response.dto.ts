import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsISO8601, IsOptional, IsString } from "class-validator";
import { UserRole } from "generated/prisma";

export class UserResponseDto {
  @ApiProperty({
    description: "Полное ФИО пользователя",
    example: "Иван Иванов Иванович",
    type: "string",
  })
  @IsString()
  @IsOptional()
  fullname?: string;

  @ApiProperty({
    description: "ID пользователя",
    example: "1234",
    type: "string",
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: "Роль пользователя",
    type: UserRole,
    enum: UserRole,
    enumName: "UserRole",
    example: UserRole.USER,
  })
  role: UserRole;

  @ApiProperty({
    description: "Дата создания",
    example: "2024-01-01T00:00:00.000Z",
    type: "string",
  })
  @IsISO8601()
  created_at: Date;

  @ApiProperty({
    description: "Дата последнего обновления",
    example: "2024-01-01T00:00:00.000Z",
    type: "string",
  })
  @IsISO8601()
  updated_at: Date;
}

export class UserAisResponseDto {
  @ApiProperty({
    description: "Активный пользователь",
    example: true,
    type: "boolean",
  })
  @IsBoolean()
  success: boolean;

  @ApiProperty({
    description: "Страница начала",
    example: "https://smart.semuniver.kz/index.php?person=&personid=&jwt=",
    type: "string",
  })
  @IsString()
  startpage: string;
}
