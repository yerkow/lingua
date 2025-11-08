import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { User } from "generated/prisma";

/**
 * Декоратор для получения авторизованного пользователя из контекста запроса.
 *
 * Этот декоратор позволяет извлекать данные пользователя из объекта запроса.
 * Если указан параметр, возвращает конкретное свойство пользователя,
 * иначе возвращает весь объект пользователя.
 *
 */

export type SesstionUserInfo = Omit<
  User,
  "password" | "role_id" | "created_at" | "updated_at"
> & {
  fullname?: string;
  jwt?: string;
  person?: string;
};

export const Authorized = createParamDecorator(
  (data: keyof SesstionUserInfo, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as SesstionUserInfo;

    return data ? user[data] : user;
  }
);
