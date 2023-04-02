import { LoginAccountDto, RegisterAccountDto } from '@/dtos/accounts.dto';
import { AuthInfoDto } from '@/dtos/auth.dto';
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

const rejectUsername = ['admin', 'administrator', 'root', 'sso', 'mmixel'];

class AccountService {
  private accounts = accountModel;
  private apps = appModel;
  private token = new useToken();
  private email = new UseEmail();

  public async register(accountData: RegisterAccountDto, requestIp: string): Promise<string> {
    // 用户名是否只包含英文数字
    if (!accountData.username.match(/^[a-zA-Z0-9_-]+$/)) throw new HttpException(400, 'invalid');
    // 用户名是否关键词
    if (rejectUsername.includes(accountData.username)) throw new HttpException(409, 'username');
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
      session: session,
      username: accountData.username,
      email: accountData.email,
      password: encryptionPassword,
      authorizes: [],
      valid: false,
    });
    if (!createAccount) throw new HttpException(500, 'server');
    // 生成token
    const token = this.token.generate(
      {
        type: 'confirm',
        session: session,
      },
      undefined,
      30 * 60,
    );
    // 发邮箱
    const mailContent = registerHtml
      .replace(/{{ username }}/g, accountData.username)
      .replace(/{{ token }}/g, token)
      .replace(/{{ nowyear }}/g, String(new Date().getFullYear()));
    await this.email.send({
      to: accountData.username,
      email: accountData.email,
      title: '验证你的电子邮箱',
      // text: '这是什么，邮箱？发一下。',
      html: mailContent,
      type: 'Confirm account',
    });
    // 记录日志
    logger.info(`Account created:`);
    logger.info(`- Username : ${accountData.username}`);
    logger.info(`- Email    : ${accountData.email}`);
    logger.info(`- Ip       : ${requestIp}`);

    return 'OK';
  }

  public async confirm(
    requestToken: string,
    requestIp: string,
  ): Promise<{
    username: string;
    token: string;
  }> {
    if (isEmpty(requestToken)) throw new HttpException(400, 'empty');
    // 解析token
    const parsedToken: TokenPayload = this.token.parse(requestToken);
    // token是启用账号类型
    if (parsedToken.type !== 'confirm') throw new HttpException(400, 'invalid');
    // 是否已经激活过
    const accountData: Account = await this.accounts.findOne({
      session: parsedToken.session,
    });
    if (!accountData) throw new HttpException(400, 'invalid');
    // 启用账户，设置加入时间
    await this.accounts.updateOne(
      {
        session: parsedToken.session,
      },
      { $set: { jointime: new Date(), valid: true } },
    );
    // 更新识别码
    const token = await this.refresh(requestToken, `local(forward ${requestIp})`);
    // 日志
    logger.info(`Account confirmed:`);
    logger.info(`- Username : ${accountData.username}`);
    logger.info(`- Ip       : ${requestIp}`);

    return { username: accountData.username, token };
  }

  public async login(requestAccount: LoginAccountDto, requestIp: string): Promise<string> {
    // 通过account（用户名/邮箱）寻找用户是否存在
    const accountData: Account =
      (await this.accounts.findOne({
        username: requestAccount.account,
        valid: true,
      })) ||
      (await this.accounts.findOne({
        email: requestAccount.account,
        valid: true,
      }));
    if (!accountData) throw new HttpException(401, 'login');
    // 密码是否正确
    const checkPassword: boolean = await compare(requestAccount.password, accountData.password);
    if (!checkPassword) throw new HttpException(401, 'login');
    // 更换识别码
    const session = nanoid();
    await this.accounts.updateOne(
      {
        session: accountData.session,
      },
      {
        $set: {
          session: session,
        },
      },
    );
    // 生成token
    const token = this.token.generate({
      type: 'origin',
      session: session,
    });
    // 日志
    logger.info(`Account logged in`);
    logger.info(`- Username : ${accountData.username}`);
    logger.info(`- Ip       : ${requestIp}`);

    return token;
  }

  public async info(requestToken: string, requestIp: string): Promise<Account> {
    if (isEmpty(requestToken)) throw new HttpException(400, 'empty');
    // 解析token
    const parsedToken: TokenPayload = this.token.parse(requestToken);
    // token是源登录类型
    if (parsedToken.type !== 'origin') throw new HttpException(401, 'login');
    const accountData: Account = await this.accounts.findOne(
      {
        session: parsedToken.session,
      },
      { _id: 0, session: 0, password: 0 },
    );
    if (!accountData) throw new HttpException(401, 'login');
    // 日志
    logger.info('Account found');
    logger.info(`- Username:  ${accountData.username}`);
    logger.info(`- Ip      :  ${requestIp}`);

    return accountData;
  }

  private async refresh(requestToken: string, requestIp: string): Promise<string> {
    if (isEmpty(requestToken)) throw new HttpException(400, 'empty');

    // 解析token
    const parsedToken: TokenPayload = this.token.parse(requestToken);
    // token是源登录或首次验证类型
    if (parsedToken.type !== 'origin' && parsedToken.type !== 'confirm') throw new HttpException(401, 'login');

    // 识别码是否有用
    const accountData: Account = await this.accounts.findOne({
      session: parsedToken.session,
    });
    if (!accountData) throw new HttpException(401, 'login');

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

    logger.info(`Account refreshed`);
    logger.info(`- Username:  ${accountData.username}`);
    logger.info(`- Ip      :  ${requestIp}`);

    return token;
  }

  public async authApp(appId: string, requestIp: string): Promise<App> {
    if (isEmpty(appId)) throw new HttpException(400, 'empty');
    // 寻找app信息
    const appData: App = await this.apps.findOne(
      {
        id: appId,
      },
      { _id: 0, silent: 0, secret: 0 },
    );
    if (!appData) throw new HttpException(404, 'not found');
    // 日志
    logger.info(`App found`);
    logger.info(`- Ip:  ${requestIp}`);

    return appData;
  }

  public async authRequest(
    requestToken: string,
    appId: string,
    requestIp: string,
  ): Promise<{
    redirect_uri: string;
    token: string;
  }> {
    if (isEmpty(requestToken) || isEmpty(appId)) throw new HttpException(400, 'empty');
    // 解析token
    const parsedToken: TokenPayload = this.token.parse(requestToken);
    // token是源登录类型
    if (parsedToken.type !== 'origin') throw new HttpException(401, 'login');
    // 寻找app信息
    const appData: App = await this.apps.findOne({
      id: appId,
    });
    if (!appData) throw new HttpException(404, 'not found');

    // 寻找账号
    const accountData: Account = await this.accounts.findOne({
      session: parsedToken.session,
    });
    if (!accountData) throw new HttpException(401, 'login');

    // 生成新token
    const token = this.token.generate(
      {
        type: 'request',
        id: appId,
        session: accountData.session,
      },
      undefined,
      5 * 60,
    );

    logger.info('Account authorize request:');
    logger.info(`- Username : ${accountData.username}`);
    logger.info(`- Ip       : ${requestIp}`);

    return { redirect_uri: appData.redirect_uri, token };
  }

  public async authApply(requestForm: AuthInfoDto): Promise<string> {
    // 解析token
    const parsedToken: TokenPayload = this.token.parse(requestForm.token);
    // token是请求授权类型
    if (parsedToken.type !== 'request') throw new HttpException(400, 'type error');
    // 获取app数据
    const appData = await this.apps.findOne({
      id: parsedToken.id,
    });
    // app id 必能找到，所以不用(!appData)
    if (appData.secret !== requestForm.secret) throw new HttpException(400, 'secret error');

    const accountData: Account = await this.accounts.findOne({
      session: parsedToken.session,
      authorizes: {
        $elemMatch: { id: parsedToken.id },
      },
    });
    const session: string = accountData?._doc.authorizes.find(data => data.id === parsedToken.id).session;
    // 未授权过
    if (!session) {
      // 应用session到数据库
      const session = nanoid();
      const applyAuth: Account = await this.accounts.findOneAndUpdate(
        {
          session: parsedToken.session,
        },
        {
          $push: {
            authorizes: {
              id: appData.id,
              session: session,
            },
          },
        },
        { new: true },
      );
      if (!applyAuth) throw new HttpException(401, 'login');
      // 生成token
      const token = this.token.generate(
        {
          type: 'authorize',
          id: appData.id,
          session: session,
        },
        appData.secret,
      );
      // 日志
      logger.info('Account authorized:');
      logger.info(`- Username:  ${accountData.username}`);
      logger.info(`- App id  :  ${appData.id}`);

      return token;
    } else {
      // 授权过了
      const requestToken = this.token.generate(
        {
          type: 'authorize',
          id: parsedToken.id,
          session: session,
        },
        requestForm.secret,
      );
      // 刷新token
      const token = this.authRefresh({
        token: requestToken,
        secret: requestForm.secret,
      });

      logger.info('Account authorize refreshed:');
      logger.info(`- Username:  ${accountData.username}`);
      logger.info(`- App id  :  ${appData.id}`);

      return token;
    }
  }

  public async authInfo(requestForm: AuthInfoDto): Promise<Account> {
    // 解析token
    const parsedToken = this.token.parse(requestForm.token, requestForm.secret);
    // token是否授权登录类型
    if (parsedToken.type !== 'authorize') throw new HttpException(400, 'type error');

    const appData = await this.apps.findOne({
      id: parsedToken.id,
    });
    if (appData.secret !== requestForm.secret) throw new HttpException(400, 'secret error');

    const accountData = await this.accounts.findOne(
      {
        authorizes: {
          $elemMatch: {
            session: parsedToken.session,
          },
        },
      },
      {
        _id: 0,
        username: 1,
        email: 1,
      },
    );
    if (!accountData) throw new HttpException(404, 'not found');

    logger.info('Account authorize info found:');
    logger.info(`- Username:  ${accountData.username}`);
    logger.info(`- App     :  ${appData.id}`);

    return accountData;
  }

  private async authRefresh(requestForm: AuthInfoDto): Promise<string> {
    // 解析token
    const parsedToken: TokenPayload = this.token.parse(requestForm.token, requestForm.secret);
    // token是否是授权登录类型
    if (parsedToken.type !== 'authorize') throw new HttpException(401, 'invalid');
    // 刷新识别码
    const session = nanoid();
    const updateSession: Account = await this.accounts.findOneAndUpdate(
      {
        authorizes: {
          $elemMatch: {
            id: parsedToken.id,
            session: parsedToken.session,
          },
        },
      },
      {
        $set: {
          'authorizes.$.session': session,
        },
      },
    );
    if (!updateSession) throw new HttpException(401, 'invalid');

    const token = this.token.generate(
      {
        type: 'authorize',
        id: parsedToken.id,
        session: session,
      },
      requestForm.secret,
    );

    return token;
  }
}

export default AccountService;
