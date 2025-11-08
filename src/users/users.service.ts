import { Injectable, NotFoundException } from "@nestjs/common";
import { hash } from "argon2";
import { UserRole } from "generated/prisma";
import { CreateUserDto } from "./dto/create-user.dto";
import { UsersRepository } from "./users.repository";

@Injectable()
export class UsersService {
  public constructor(private readonly usersRepository: UsersRepository) {}

  async findUserByLogin(login: string) {
    const user = await this.usersRepository.findUserByLogin(login);
    if (!user) throw new NotFoundException("Пользователь не найден");
    return user;
  }

  async findUserById(id: string) {
    const user = await this.usersRepository.findUserById(id);
    if (!user) throw new NotFoundException("Пользователь не найден");
    return user;
  }

  async createUser(user: CreateUserDto) {
    const hashPassword = await hash(user.password.trim());
    return await this.usersRepository.create({
      login: user.login,
      password: hashPassword,
      role: UserRole.USER,
    });
  }

  async getPersonData(id: string, jwt: string, person: string) {
    const user = await this.usersRepository.findUserById(id);
    return {
      ...user,
    };
  }

  async findAll(id: string) {
    return await this.usersRepository.getAll(id);
  }
}
