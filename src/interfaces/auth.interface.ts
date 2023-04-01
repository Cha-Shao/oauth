import { Request } from 'express';
import { Account } from './accounts.interface';

export interface RequestWithAccountData extends Request {
  account: Account;
}
