import { applyDecorators } from "@nestjs/common";
import {
  ApiBody,
  ApiCookieAuth,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from "@nestjs/swagger";
import { CreateUserDto } from "@/users/dto/create-user.dto";
import { LoginDto } from "./dto/login.dto";
import { UserResponseDto } from "@/users/dto/response.dto";

export function ApiAuthTags() {
  return applyDecorators(ApiTags("Аутентификация"), ApiCookieAuth("session"));
}

export function ApiAuthLogin() {
  return applyDecorators(
    ApiOperation({ summary: "Логин через внешний сервис" }),
    ApiExtraModels(UserResponseDto),
    ApiBody({
      type: LoginDto,
      examples: {
        example1: { value: { login: "1234", password: "secret" } },
      },
      required: true,
    }),
    ApiResponse({
      status: 200,
      schema: {
        $ref: getSchemaPath(UserResponseDto),
      },
      description: "Успешная аутентификация или создание пользователя",
    }),
    ApiResponse({
      status: 400,
      description: "Некорректные данные для входа",
    }),
    ApiResponse({
      status: 500,
      description: "Ошибка сервера",
    })
  );
}

export function ApiAuthRegister() {
  return applyDecorators(
    ApiOperation({ summary: "Регистрация нового пользователя" }),
    ApiExtraModels(UserResponseDto),
    ApiBody({
      type: CreateUserDto,
      examples: {
        example1: {
          value: { login: "1234", fullName: "Иван Иванов", password: "secret" },
        },
      },
      required: true,
    }),
    ApiResponse({
      status: 201,
      schema: {
        $ref: getSchemaPath(UserResponseDto),
      },
      description: "Пользователь успешно зарегистрирован и авторизован",
    }),
    ApiResponse({
      status: 400,
      description: "Некорректные данные для регистрации",
    }),
    ApiResponse({
      status: 409,
      description: "Пользователь с таким логином уже существует",
    }),
    ApiResponse({
      status: 500,
      description: "Ошибка сервера",
    })
  );
}

export function ApiAuthLogout() {
  return applyDecorators(
    ApiOperation({ summary: "Выход из системы" }),
    ApiResponse({ status: 200, description: "Сессия завершена" }),
    ApiResponse({ status: 500, description: "Ошибка сервера" })
  );
}
