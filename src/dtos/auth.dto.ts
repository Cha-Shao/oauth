export class AuthRequestDto {
  public token: string;
  public id: string;
}

export class AuthApplyDto {
  public token: string;
  public id: string;
  public secret: string;
}
