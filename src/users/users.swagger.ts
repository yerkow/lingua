import { applyDecorators } from "@nestjs/common";
import {
  ApiBody,
  ApiCookieAuth,
  ApiExtraModels,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from "@nestjs/swagger";
import { CreateUserDto } from "./dto/create-user.dto";
import { UserResponseDto } from "./dto/response.dto";

export function ApiUsersTags() {
  return applyDecorators(ApiTags("Пользователи"), ApiCookieAuth("session"));
}

export function ApiCreateUser() {
  return applyDecorators(
    ApiOperation({ summary: "Создание пользователя" }),
    ApiBody({
      type: CreateUserDto,
      examples: {
        example1: { value: { login: "1234", password: "secret" } },
      },
      required: true,
    }),
    ApiResponse({
      status: 200,
      description: "Пользватель успешно создан",
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

export function ApiUsersMe() {
  return applyDecorators(
    ApiOperation({ summary: "Текущий пользователь" }),
    ApiExtraModels(
      UserResponseDto
      // UserAisResponseDto
    ),
    ApiResponse({
      status: 200,
      description: "Успешно. Возвращает профиль пользователя",
      schema: {
        allOf: [{ $ref: getSchemaPath(UserResponseDto) }],
      },
    }),
    ApiResponse({ status: 401, description: "Неавторизован" }),
    ApiResponse({ status: 404, description: "Пользователь не найден" })
  );
}

export function ApiUsersFindAll() {
  return applyDecorators(
    ApiOperation({ summary: "Получение всех пользователей" }),
    ApiExtraModels(UserResponseDto),
    ApiResponse({
      status: 200,
      description: "Успешно. Возвращает всех пользователей",
      schema: {
        type: "array",
        items: {
          $ref: getSchemaPath(UserResponseDto),
        },
      },
    })
  );
}

export function ApiUsersFindAllByWork() {
  return applyDecorators(
    ApiOperation({
      summary:
        "Получение всех пользователей у которых есть работа в направлении",
    }),
    ApiExtraModels(UserResponseDto),
    ApiQuery({
      name: "direction_id",
      type: "number",
      description: "Идентификатор направления",
      example: 1,
      required: true,
    }),
    ApiResponse({
      status: 200,
      description:
        "Успешно. Возвращает всех пользователей у которых есть работа в направлении",
      schema: {
        type: "array",
        items: {
          $ref: getSchemaPath(UserResponseDto),
        },
      },
    })
  );
}
