import { IsEmail, IsString, MaxLength } from 'class-validator';

export class RegisterAccountDto {
  @IsString()
  @MaxLength(16, {
    message: 'max length 16',
  })
  public username: string;

  @IsEmail()
  public email: string;

  @IsString()
  public password: string;
}

export class LoginAccountDto {
  @IsString()
  public account: string;

  @IsString()
  public password: string;
}
