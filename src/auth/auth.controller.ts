import { CreateUserDto } from "@/users/dto/create-user.dto";
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { AuthService } from "./auth.service";
import {
  ApiAuthLogin,
  ApiAuthLogout,
  ApiAuthRegister,
  ApiAuthTags,
} from "./auth.swagger";
import { LoginDto } from "./dto/login.dto";

@ApiAuthTags()
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiAuthRegister()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  @Post("register")
  async register(@Req() req: any, @Body() registerDto: CreateUserDto) {
    return await this.authService.register(req, registerDto);
  }

  @ApiAuthLogin()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post("login")
  async login(@Req() req: any, @Body() loginDto: LoginDto) {
    return await this.authService.login(req, loginDto);
  }

  @ApiAuthLogout()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post("logout")
  async logout(@Req() req: any) {
    return await this.authService.logout(req);
  }
}
