import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length } from "class-validator";

export class CreateUserDto {
  @ApiProperty({ description: "Логин пользователя", example: "1234" })
  @IsString()
  @Length(2, 16, { message: "Логин должен быть от 2 до 16 символов" })
  login: string;
  @ApiProperty({
    description: "Полное имя пользователя",
    example: "Иван Иванов",
  })
  @IsString()
  fullName: string;
  @ApiProperty({ description: "Пароль пользователя", example: "secret" })
  @IsString()
  password: string;
}
