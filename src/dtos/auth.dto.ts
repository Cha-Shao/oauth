export class AuthRequestDto {
  public token: string;
  public app_id: string;
}

export class AuthApplyDto {
  public token: string;
  public app_id: string;
  public secret: string;
}
