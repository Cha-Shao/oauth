import { IsString, IsNotEmpty } from 'class-validator';

export class AuthApplyDto {
  @IsString()
  @IsNotEmpty()
  public id: string;

  @IsString()
  @IsNotEmpty()
  public token: string;

  @IsString()
  @IsNotEmpty()
  public secret: string;
}

export class AuthInfoDto {
  @IsString()
  @IsNotEmpty()
  public secret: string;

  @IsString()
  @IsNotEmpty()
  public token: string;
}
