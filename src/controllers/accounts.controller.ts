import { NextFunction, Request, Response } from 'express';
import { LoginAccountDto, RegisterAccountDto } from '@/dtos/accounts.dto';
import { AuthInfoDto } from '@/dtos/auth.dto';
import accountService from '@/services/accounts.service';
import { Account } from '@/interfaces/accounts.interface';
import { App } from '@/interfaces/apps.interface';

class AuthController {
  private accountService = new accountService();

  public register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountData: RegisterAccountDto = req.body;

      await this.accountService.register(accountData);
      // const registerAccountData: Account = await this.accountService.register(accountData);

      res.status(201).json({
        message: 'OK',
      });
    } catch (error) {
      next(error);
    }
  };

  public confirm = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const requestToken: string = (req.headers?.authorization ?? 'Bearer ').split(' ')[1];

      const { username, token } = await this.accountService.confirm(requestToken);

      res.status(200).json({
        message: 'OK',
        token,
        username,
      });
    } catch (error) {
      next(error);
    }
  };

  public login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountData: LoginAccountDto = req.body;

      const token: string = await this.accountService.login(accountData);

      res.status(200).json({
        message: 'OK',
        token: token,
      });
    } catch (error) {
      next(error);
    }
  };

  public info = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const requestToken: string = (req.headers?.authorization ?? 'Bearer ').split(' ')[1];

      const accountData: Account = await this.accountService.info(requestToken);

      res.status(200).json({
        message: 'OK',
        ...accountData._doc,
      });
    } catch (error) {
      next(error);
    }
  };

  public refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const requestToken: string = (req.headers?.authorization ?? 'Bearer ').split(' ')[1];

      const token: string = await this.accountService.refresh(requestToken);

      res.status(200).json({
        message: 'OK',
        token: token,
      });
    } catch (error) {
      next(error);
    }
  };

  public authApp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const appId: string = req.query?.id.toString();

      const appData: App = await this.accountService.authApp(appId);

      res.status(200).json({
        message: 'OK',
        ...appData._doc,
      });
    } catch (error) {
      next(error);
    }
  };

  public authRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const requestToken: string = (req.headers.authorization ?? 'Bearer ').toString().split(' ')[1];
      const appId: string = req.query?.id.toString();

      const { redirect_uri, token } = await this.accountService.authRequest(requestToken, appId);

      // res.status(200).json({
      //   message: 'OK',
      //   token: newToken,
      // });

      // 跳转
      res.redirect(redirect_uri + token);
    } catch (error) {
      next(error);
    }
  };

  public authApply = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const requestForm: AuthInfoDto = req.body;

      const token: string = await this.accountService.authApply(requestForm);

      res.status(200).json({
        message: 'OK',
        token,
      });
    } catch (error) {
      next(error);
    }
  };

  public authInfo = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const requestToken: string = req.query.token?.toString();
      const requestSecret: string = req.query.secret?.toString();
      const requestForm: AuthInfoDto = {
        token: requestToken,
        secret: requestSecret,
      };

      const accountData: Account = await this.accountService.authInfo(requestForm);

      res.status(200).json({
        message: 'OK',
        ...accountData._doc,
      });
    } catch (error) {
      next(error);
    }
  };

  public authRefresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const requestForm: AuthInfoDto = req.body;

      const token: string = await this.accountService.authRefresh(requestForm);

      res.status(200).json({
        message: 'OK',
        token,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default AuthController;
