import { applyDecorators } from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from "@nestjs/swagger";
import { UserFilesByMapIndicatorResponseDto } from "./dto/response.dto";

export function ApiFilesTags() {
  return applyDecorators(ApiTags("Файлы"), ApiCookieAuth("session"));
}

export function ApiUsersFindAllFilesByUserByMapIndicators() {
  return applyDecorators(
    ApiOperation({
      summary: "Получение всех файлов пользователя",
    }),
    ApiParam({
      name: "user_id",
      type: String,
      description: "Идентификатор пользователя",
      example: "1",
      required: true,
    }),
    ApiExtraModels(UserFilesByMapIndicatorResponseDto),
    ApiResponse({
      status: 200,
      description: "Успешно. Возвращает все файлы пользователя",
      schema: {
        type: "array",
        items: {
          $ref: getSchemaPath(UserFilesByMapIndicatorResponseDto),
        },
      },
    })
  );
}
