import { SECRET_KEY } from '@/config';
import { TokenPayload } from '@/interfaces/token.interface';
import { sign, verify, VerifyErrors } from 'jsonwebtoken';

class UseToken {
  secretKey: string;
  expiresIn: number;

  constructor() {
    this.secretKey = SECRET_KEY;
    this.expiresIn = 60 * 60 * 24 * 28;
  }

  generate(payload: TokenPayload, secretKey: string = this.secretKey, expiresIn: number = this.expiresIn): string {
    return sign(payload, secretKey, {
      expiresIn,
      issuer: 'mmixel',
    });
  }

  parse(token: string, secretKey: string = this.secretKey): TokenPayload {
    let result: TokenPayload;

    verify(token, secretKey, (err: VerifyErrors, decoded: TokenPayload): void => {
      if (err) {
        console.log(err);

        result = { type: 'error' };
      } else result = decoded;
    });

    return result;
  }
}

export default UseToken;
