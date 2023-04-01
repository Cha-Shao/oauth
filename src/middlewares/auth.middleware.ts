import { NextFunction, Response } from 'express';
import { HttpException } from '@exceptions/HttpException';
import { RequestWithAccountData } from '@interfaces/auth.interface';
import { Account } from '@/interfaces/accounts.interface';
import accountsModel from '@/models/accounts.model';
import { TokenPayload } from '@/interfaces/token.interface';
import useToken from '@/utils/useToken';

const accounts = accountsModel;
const token = new useToken();

const authMiddleware = async (req: RequestWithAccountData, res: Response, next: NextFunction) => {
  try {
    const requestToken = req.headers.authorization?.split('Bearer ')[1];

    if (requestToken) {
      const parsedToken: TokenPayload = token.parse(requestToken);

      const accountData: Account = await accounts.findOne({
        session: parsedToken.session,
      });
      if (accountData) {
        // 用户存在
        req.account = accountData;
        next();
      } else {
        // 用户不存在
        next(new HttpException(401, 'login'));
      }
    } else {
      // token没传入
      next(new HttpException(401, 'login'));
    }
  } catch (error) {
    // 爆炸了
    next(new HttpException(401, 'login'));
  }
};

export default authMiddleware;
