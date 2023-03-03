import { LoginAccountDto, RegisterAccountDto } from '@/dtos/accounts.dto';
import { AuthApplyDto, AuthRequestDto } from '@/dtos/auth.dto';
import { HttpException } from '@/exceptions/HttpException';
import { Account } from '@/interfaces/accounts.interface';
import { App } from '@/interfaces/apps.interface';
import { TokenPayload } from '@/interfaces/token.interface';
import accountModel from '@/models/accounts.model';
import appModel from '@/models/apps.model';
import { logger } from '@/utils/logger';
import UseEmail from '@/utils/useEmail';
import useToken from '@/utils/useToken';
import { compare, hash } from 'bcrypt';
import { isEmpty } from 'class-validator';
import { readFileSync } from 'fs';
import { nanoid } from 'nanoid';
import { join } from 'path';

const registerHtml = readFileSync(join(__dirname, '../assets/register.html')).toString();

class AccountService {
  private accounts = accountModel;
  private apps = appModel;
  private token = new useToken();
  private email = new UseEmail();

  public async register(accountData: RegisterAccountDto): Promise<Account> {
    if (isEmpty(accountData)) throw new HttpException(400, 'empty');

    // 用户名是否占用
    const findWithUsername: Account = await this.accounts.findOne({
      username: accountData.username,
      valid: true,
    });
    if (findWithUsername) throw new HttpException(409, 'username');

    // 邮箱是否占用
    const findWithEmail: Account = await this.accounts.findOne({
      email: accountData.email,
      valid: true,
    });
    if (findWithEmail) throw new HttpException(409, 'email');

    // 加密密码
    const encryptionPassword = await hash(accountData.password, 7);
    // 生成识别码
    const session = nanoid();
    // 创建用户
    const createAccount: Account = await this.accounts.create({
      ...accountData,
      session: session,
      password: encryptionPassword,
      valid: false,
    });

    logger.info(`User created:`);
    logger.info(`- Username: ${accountData.username}`);
    logger.info(`- Email   : ${accountData.email}`);

    // 生成token
    const token = this.token.generate(
      {
        type: 'confirm',
        session: session,
      },
      undefined,
      15 * 60,
    );

    // 发邮箱
    const mailContent = registerHtml
      .replace(/{{ username }}/g, accountData.username)
      .replace(/{{ token }}/g, token)
      .replace(/{{ nowyear }}/g, String(new Date().getFullYear()));
    this.email.send({
      to: accountData.username,
      email: accountData.email,
      title: '验证你的电子邮箱',
      text: '这是什么，邮箱？发一下。',
      html: mailContent,
      type: 'Confirm account',
    });

    return createAccount;
  }

  public async confirm(requestToken: string): Promise<{
    username: string;
    token: string;
  }> {
    if (isEmpty(requestToken)) throw new HttpException(400, 'empty');

    // 解析token
    const parsedToken: TokenPayload = this.token.parse(requestToken);
    // token是启用账号类型
    if (parsedToken.type !== 'confirm') throw new HttpException(400, 'invalid');

    // 是否已经激活过
    const findAccount = await this.accounts.findOne({
      session: parsedToken.session,
    });
    if (!findAccount) throw new HttpException(400, 'invalid');

    // 启用账户，设置加入时间
    const updateStatus = await this.accounts.updateOne(
      {
        session: parsedToken.session,
      },
      { $set: { jointime: new Date(), valid: true } },
    );
    if (!updateStatus) throw new HttpException(500, 'server');

    // 更新识别码
    const token = await this.refresh(requestToken);

    return { username: findAccount.username, token };
  }

  public async login(accountData: LoginAccountDto): Promise<string> {
    if (isEmpty(accountData)) throw new HttpException(400, 'empty');

    // 通过account（用户名/邮箱）寻找用户
    const findAccount: Account =
      (await this.accounts.findOne({
        username: accountData.account,
        valid: true,
      })) ||
      (await this.accounts.findOne({
        email: accountData.account,
        valid: true,
      }));
    if (!findAccount) throw new HttpException(400, 'invalid');

    // 密码是否正确
    const checkPassword: boolean = await compare(accountData.password, findAccount.password);
    if (!checkPassword) throw new HttpException(400, 'invalid');

    // 生成识别码并应用
    const session = nanoid();
    const updateSession = await this.accounts.updateOne(
      {
        session: findAccount.session,
      },
      {
        $set: {
          session: session,
        },
      },
    );
    if (!updateSession) throw new HttpException(500, 'server');

    // 生成token
    const token = this.token.generate({
      type: 'origin',
      session: session,
    });

    return token;
  }

  public async info(token: string): Promise<Account> {
    if (isEmpty(token)) throw new HttpException(400, 'empty');

    // 解析token
    const parsedToken: TokenPayload = this.token.parse(token);
    // token是源登录类型
    if (parsedToken.type !== 'origin') throw new HttpException(400, 'invalid');

    const accountData: Account = await this.accounts.findOne(
      {
        session: parsedToken.session,
      },
      { _id: 0, session: 0, password: 0 },
    );
    if (!accountData) throw new HttpException(400, 'invalid');

    return accountData;
  }

  public async refresh(requestToken: string): Promise<string> {
    if (isEmpty(requestToken)) throw new HttpException(400, 'empty');

    // 解析token
    const parsedToken: TokenPayload = this.token.parse(requestToken);
    // token是源登录或首次验证类型
    if (parsedToken.type !== 'origin' && parsedToken.type !== 'confirm') throw new HttpException(400, 'invalid');

    // 识别码是否有用
    const findAccount = await this.accounts.findOne({
      session: parsedToken.session,
    });
    if (!findAccount) throw new HttpException(400, 'invalid');

    // 新的识别码
    const session = nanoid();
    const updateSession = await this.accounts.updateOne(
      {
        session: parsedToken.session,
      },
      { $set: { session: session } },
    );
    if (!updateSession) throw new HttpException(500, 'server');

    // 生成token
    const token = this.token.generate({
      type: 'origin',
      session: session,
    });

    return token;
  }

  public async authApp(appId: string): Promise<App> {
    if (isEmpty(appId)) throw new HttpException(400, 'empty');

    // 寻找app信息
    const appData: App = await this.apps.findOne(
      {
        id: appId,
      },
      { _id: 0, silent: 0, secret: 0 },
    );
    if (!appData) throw new HttpException(404, 'not found');

    return appData;
  }

  public async authRequest(requestForm: AuthRequestDto): Promise<{
    redirect_uri: string;
    token: string;
  }> {
    if (isEmpty(requestForm)) throw new HttpException(400, 'empty');

    // 解析token
    const parsedToken: TokenPayload = this.token.parse(requestForm.token);
    // token是源登录类型
    if (parsedToken.type !== 'origin') throw new HttpException(400, 'invalid');

    // 寻找app信息
    const appData: App = await this.apps.findOne({
      id: requestForm.app_id,
    });
    if (!appData) throw new HttpException(404, 'not found');

    // 寻找账号
    const accountData: Account = await this.accounts.findOne({
      session: parsedToken.session,
    });
    if (!accountData) throw new HttpException(404, 'not found');

    // 生成新token
    const token = this.token.generate(
      {
        type: 'request',
        session: accountData.session,
      },
      undefined,
      5 * 60,
    );

    return { redirect_uri: appData.redirect_uri, token };
  }

  public async authApply(requestForm: AuthApplyDto): Promise<string> {
    if (isEmpty(requestForm)) throw new HttpException(400, 'empty');

    // 解析token
    const parsedToken: TokenPayload = this.token.parse(requestForm.token);
    // token是请求授权类型
    if (parsedToken.type !== 'request') throw new HttpException(400, 'invalid');

    // 获取app数据
    const appData = await this.apps.findOne({
      id: requestForm.app_id,
      secret: requestForm.secret,
    });
    if (!appData) throw new HttpException(400, 'invalid');

    const accountData: Account = await this.accounts.findOne({
      session: parsedToken.session,
      authorize: {
        $elemMatch: { id: appData.id },
      },
    });
    // 未授权过
    if (!accountData) {
      // 应用session到数据库
      const session = nanoid();
      const applyAuth: Account = await this.accounts.findOneAndUpdate(
        {
          session: parsedToken.session,
        },
        {
          $push: {
            authorize: {
              id: appData.id,
              session: session,
            },
          },
        },
        { new: true },
      );
      if (!applyAuth) throw new HttpException(400, 'invalid');

      // 生成token
      const token = this.token.generate({
        type: 'authorize',
        app_id: appData.id,
        session: session,
      });

      return token;
    } else {
      // 授权过了
      const session = accountData.authorize.find(data => data.id === appData.id).session;
      const requestToken = this.token.generate({
        type: 'authorize',
        app_id: appData.id,
        session: session,
      });
      // 刷新token
      const token = this.authRefresh(requestToken);

      return token;
    }
  }

  public async authInfo(requestToken: string): Promise<Account> {
    if (isEmpty(requestToken)) throw new HttpException(400, 'empty');

    // 解析token
    const parsedToken = this.token.parse(requestToken);
    // token是否授权登录类型
    if (parsedToken.type !== 'authorize') throw new HttpException(400, 'invalid');

    const accountData = await this.accounts.findOne(
      {
        authorize: {
          $elemMatch: {
            session: parsedToken.session,
          },
        },
      },
      {
        username: 1,
        email: 1,
      },
    );
    if (!accountData) throw new HttpException(404, 'not found');

    return accountData;
  }

  public async authRefresh(requestToken: string): Promise<string> {
    if (isEmpty(requestToken)) throw new HttpException(400, 'empty');

    // 解析token
    const parsedToken: TokenPayload = this.token.parse(requestToken);
    // token是否是授权登录类型
    if (parsedToken.type !== 'authorize') throw new HttpException(400, 'invalid');

    const session = nanoid();
    const updateSession: Account = await this.accounts.findOneAndUpdate(
      {
        authorize: {
          $elemMatch: {
            id: parsedToken.app_id,
            session: parsedToken.session,
          },
        },
      },
      {
        $set: {
          'authorize.$.session': session,
        },
      },
    );
    if (!updateSession) throw new HttpException(400, 'invalid');

    const token = this.token.generate({
      type: 'authorize',
      app_id: parsedToken.app_id,
      session: session,
    });

    return token;
  }
}

export default AccountService;
