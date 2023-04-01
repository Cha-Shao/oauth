import { MAIL_HOST, MAIL_PORT, MAIL_SENDER, MAIL_PWD } from '@/config';
import { MailType } from '@/interfaces/email.interface';
import nodemailer, { Transporter } from 'nodemailer';
import { logger } from './logger';
// import Mail from 'nodemailer/lib/mailer'

class UseEmail {
  private transporter: Transporter = nodemailer.createTransport({
    host: MAIL_HOST,
    port: Number(MAIL_PORT),
    secure: true,
    requireTLS: true,
    auth: {
      user: MAIL_SENDER,
      pass: MAIL_PWD,
    },
  });

  public async send(mailArgs: MailType) {
    await this.transporter.sendMail({
      from: '"MMIXEL 支持团队" <no-reply@elfmc.com>',
      to: `${mailArgs.email}`,
      subject: mailArgs.title,
      // text: mailArgs.text,
      html: mailArgs.html,
      // headers: { 'x-myheader': 'test header' },
    });

    logger.info(`Email sent:`);
    logger.info(`- To   : ${mailArgs.email}`);
    logger.info(`- Type : ${mailArgs.type}`);
  }
}

export default UseEmail;
