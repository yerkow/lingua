import { applyDecorators } from "@nestjs/common";
import { ApiResponse } from "@nestjs/swagger";

export enum ApiStatusEnum {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_SERVER_ERROR = 500,
}

type ResponseConstructorOptions =
  | {
      status: ApiStatusEnum;
      description: string;
      schema: any;
    }
  | ApiStatusEnum
  | {
      status: ApiStatusEnum.CONFLICT | ApiStatusEnum.NOT_FOUND;
      description: string;
    };

export function apiResponseConstructor(
  ...options: ResponseConstructorOptions[]
) {
  return applyDecorators(
    ...options.map((option) => {
      if (typeof option === "number") {
        return responseDecorator(option);
      }
      if ("schema" in option) {
        return ApiResponse({
          status: option.status,
          description: option.description,
          schema: option.schema,
        });
      }
      return ApiResponse({
        status: option.status,
        description: option.description,
      });
    })
  );
}

function responseDecorator(status: ApiStatusEnum) {
  switch (status) {
    case ApiStatusEnum.BAD_REQUEST:
      return ApiResponse({
        status: 400,
        description: "Некорректные данные",
        schema: { example: { message: "Некорректные данные" } },
      });
    case ApiStatusEnum.UNAUTHORIZED:
      return ApiResponse({
        status: 401,
        description: "Неавторизованный пользователь",
        schema: { example: { message: "Неавторизованный пользователь" } },
      });
    case ApiStatusEnum.FORBIDDEN:
      return ApiResponse({
        status: 403,
        description: "Нет доступа",
        schema: { example: { message: "Нет доступа" } },
      });
    case ApiStatusEnum.INTERNAL_SERVER_ERROR:
      return ApiResponse({
        status: 500,
        description: "Ошибка сервера",
        schema: { example: { message: "Ошибка сервера" } },
      });
    default:
      return ApiResponse({
        status: status as number,
        description: "",
      });
  }
}
