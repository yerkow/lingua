import { CreateUserDto } from "@/users/dto/create-user.dto";
import { PickType } from "@nestjs/swagger";

export class LoginDto extends PickType(CreateUserDto, ["login", "password"]) {}
