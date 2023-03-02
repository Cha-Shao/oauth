import { SECRET_KEY } from '@/config';
import { TokenPayload } from '@/interfaces/token.interface';
import { sign, verify } from 'jsonwebtoken';

class UseToken {
  secretKey: string;
  expiresIn: number;

  constructor() {
    this.secretKey = SECRET_KEY;
    this.expiresIn = 60 * 60 * 24 * 7;
  }

  generate(payload: TokenPayload, secretKey: string = this.secretKey, expiresIn: number = this.expiresIn): string {
    return sign(payload, secretKey, { expiresIn, issuer: 'mmixel' });
  }

  parse(token: string, secretKey: string = this.secretKey): TokenPayload {
    let result: TokenPayload;

    verify(token, secretKey, (err, decoded): void => {
      if (err) {
        if (err.name === 'TokenExpiredError') result = { type: 'error' };
        else if (err.name === 'JsonWebTokenError') result = { type: 'error' };
        else result = { type: 'error' };
      } else {
        result = decoded as TokenPayload;
      }
    });

    return result;
  }
}

export default UseToken;
