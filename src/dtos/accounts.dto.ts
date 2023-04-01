import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RegisterAccountDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(16)
  public username: string;

  @IsNotEmpty()
  @IsEmail()
  public email: string;

  @IsNotEmpty()
  @IsString()
  public password: string;
}

export class LoginAccountDto {
  @IsNotEmpty()
  @IsString()
  public account: string;

  @IsNotEmpty()
  @IsString()
  public password: string;
}
