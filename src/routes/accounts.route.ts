import { Router } from 'express';
import AccountsController from '@controllers/accounts.controller';
import { Routes } from '@interfaces/routes.interface';
import validationMiddleware from '@middlewares/validation.middleware';
import { LoginAccountDto, RegisterAccountDto } from '@/dtos/accounts.dto';

class AuthRoute implements Routes {
  public path = '/';
  public router = Router();
  public accountsController = new AccountsController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // 注册
    this.router.post(`${this.path}register`, validationMiddleware(RegisterAccountDto, 'body'), this.accountsController.register);
    // 验证邮箱
    this.router.post(`${this.path}confirm`, this.accountsController.confirm);
    // 登录
    this.router.post(`${this.path}login`, validationMiddleware(LoginAccountDto, 'body'), this.accountsController.login);
    // 获取信息
    this.router.get(`${this.path}info`, this.accountsController.info);
    // 自动续token
    this.router.post(`${this.path}refresh`, this.accountsController.refresh);

    // 获得应用信息
    this.router.get(`${this.path}auth/app`, this.accountsController.authApp);
    // 授权登录请求
    this.router.get(`${this.path}auth/request`, this.accountsController.authRequest);
    // 应用授权登录
    this.router.post(`${this.path}auth/apply`, this.accountsController.authApply);
    this.router.get(`${this.path}auth/info`, this.accountsController.authInfo);
    // 自动续授权登录token
    this.router.get(`${this.path}auth/refresh`, this.accountsController.authRefresh);
  }
}

export default AuthRoute;
