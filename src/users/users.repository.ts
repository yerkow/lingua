import { PrismaService } from "@/prisma/prisma.service";
import { Injectable } from "@nestjs/common";
import { UserRole } from "generated/prisma";

@Injectable()
export class UsersRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async upsert(userData: {
    id: string;
    fullname: string;
    role: UserRole;
    password: string;
    login: string;
  }) {
    return this.prismaService.user.upsert({
      where: { id: userData.id },
      update: {
        fullname: userData.fullname,
        role: userData.role,
        password: userData.password,
        login: userData.login,
      },
      create: {
        id: userData.id,
        role: userData.role,
        password: userData.password,
        login: userData.login,
      },
    });
  }

  async findUserById(id: string) {
    return await this.prismaService.user.findUnique({
      where: { id },
      select: {
        id: true,
        login: true,
        password: true,
        role: true,
      },
    });
  }

  async findUserByLogin(login: string) {
    return await this.prismaService.user.findUnique({
      where: { login },
      select: {
        id: true,
        login: true,
        password: true,
        role: true,
        fullname: true,
      },
    });
  }

  async create(user: any) {
    return await this.prismaService.user.create({
      data: user,
    });
  }

  async getAll(id: string) {
    return await this.prismaService.user.findMany({
      where: {
        role: UserRole.USER,
        id: {
          not: id,
        },
      },
    });
  }
}
