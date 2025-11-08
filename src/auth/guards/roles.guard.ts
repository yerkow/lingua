import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "@/auth/decorators/roles.decorator";
import { UserRole } from "generated/prisma";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest();

    if (!roles) return true;

    if (request?.user?.role && roles.includes(request?.user?.role)) {
      return true;
    }

    throw new ForbiddenException(
      "Недостаточно прав. У вас нет доступа к этому ресурсу."
    );
  }
}
