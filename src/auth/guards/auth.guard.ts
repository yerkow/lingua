import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import { UsersRepository } from "@/users/users.repository";

@Injectable()
export class AuthGuard implements CanActivate {
  public constructor(private readonly usersRepository: UsersRepository) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    if (typeof request.session.userId === "undefined") {
      throw new UnauthorizedException(
        "Пользователь не авторизован. Пожалуйста, войдите в систему, чтобы получить доступ."
      );
    }

    const user = await this.usersRepository.findUserById(
      request.session.userId
    );
    if (!user) {
      throw new UnauthorizedException(
        "Пользователь не найден. Пожалуйста, войдите в систему, чтобы получить доступ."
      );
    }
    request.user = {
      ...user,
      jwt: request.session.jwt,
      person: request.session.person,
    };

    return true;
  }
}
