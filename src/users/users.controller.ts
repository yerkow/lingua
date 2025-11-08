import { Authorization } from "@/auth/decorators/auth.decorator";
import { Authorized } from "@/auth/decorators/authorized.decorator";
import { Body, Controller, Get, Post } from "@nestjs/common";
import { UserRole } from "generated/prisma";
import { CreateUserDto } from "./dto/create-user.dto";
import { UsersService } from "./users.service";
import {
  ApiCreateUser,
  ApiUsersFindAll,
  ApiUsersMe,
  ApiUsersTags,
} from "./users.swagger";

@ApiUsersTags()
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiCreateUser()
  @Authorization(UserRole.ADMIN)
  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @ApiUsersFindAll()
  @Authorization()
  @Get()
  async findAll(@Authorized("id") id: string) {
    return this.usersService.findAll(id);
  }

  @Authorization()
  @ApiUsersMe()
  @Get("me")
  async getMe(
    @Authorized("id") personId: string,
    @Authorized("jwt") jwt: string,
    @Authorized("person") person: string
  ) {
    return this.usersService.getPersonData(personId, jwt, person);
  }
}
