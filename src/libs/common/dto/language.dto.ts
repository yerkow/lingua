import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LanguageNameDto {
  @ApiProperty({
    example: "Название на русском",
    description: "Название на русском языке",
  })
  @IsString()
  ru: string;
  @ApiProperty({
    example: "Название на казахском",
    description: "Название на казахском языке",
  })
  @IsString()
  kk: string;
}
