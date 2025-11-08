import { CreateUserDto } from "@/users/dto/create-user.dto";
import { UsersRepository } from "@/users/users.repository";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { hash, verify } from "argon2";
import { Request } from "express";
import { UserRole } from "generated/prisma";
import { SesstionUserInfo } from "./decorators/authorized.decorator";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly usersRepository: UsersRepository) {}

  async login(req: Request, loginDto: LoginDto) {
    try {
      const localUser = await this.usersRepository.findUserByLogin(
        loginDto.login
      );

      if (!localUser) {
        throw new BadRequestException("Ошибка логина или пароля");
      }

      if (!localUser.password) {
        throw new BadRequestException("Ошибка логина или пароля");
      }

      if (!(await verify(localUser.password, loginDto.password))) {
        throw new BadRequestException("Ошибка логина или пароля");
      }

      const { password, fullname, ...userData } = localUser;
      return await this.saveSession(req, {
        ...userData,
        fullname: fullname ?? "",
      });
    } catch (error) {
      this.logger.error("Ошибка при входе", error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException("Не удалось выполнить вход");
    }
  }

  private async saveSession(req: Request, user: SesstionUserInfo) {
    return new Promise((resolve, reject) => {
      // Store as string to match Prisma User.id (String) and repo contract
      req.session.fullname = user.fullname;
      req.session.userId = user.id;
      req.session.person = user.person;
      req.session.jwt = user.jwt;
      req.session.save((err) => {
        if (err) {
          // log original error for diagnostics
          this.logger.error(err);
          return reject(
            new InternalServerErrorException(
              "Не удалось сохранить сессию. Проверьте, правильно ли настроены параметры сессии."
            )
          );
        }

        const { jwt, ...userData } = user;

        resolve({
          ...userData,
        });
      });
    });
  }

  async register(req: Request, registerDto: CreateUserDto) {
    try {
      // Проверяем, существует ли пользователь с таким логином
      const existingUser = await this.usersRepository.findUserByLogin(
        registerDto.login
      );

      if (existingUser) {
        throw new ConflictException(
          "Пользователь с таким логином уже существует"
        );
      }

      // Хешируем пароль
      const hashedPassword = await hash(registerDto.password.trim());

      // Создаем нового пользователя
      const newUser = await this.usersRepository.create({
        login: registerDto.login,
        password: hashedPassword,
        fullname: registerDto.fullName,
        role: UserRole.USER,
      });

      // Автоматически логиним пользователя после регистрации
      const { password, fullname, created_at, updated_at, ...userData } =
        newUser;
      return await this.saveSession(req, {
        ...userData,
        fullname: fullname ?? "",
      });
    } catch (error) {
      this.logger.error("Ошибка при регистрации", error);
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        "Не удалось зарегистрировать пользователя"
      );
    }
  }

  async logout(req: Request) {
    return new Promise((resolve, reject) => {
      if (!req.session) {
        return resolve({ ok: true });
      }

      req.session.destroy((err) => {
        if (err) {
          this.logger.error("Ошибка при удалении сессии", err);
          return reject(
            new InternalServerErrorException(
              "Не удалось завершить сессию. Попробуйте позже."
            )
          );
        }

        resolve({ ok: true });
      });
    });
  }
}
