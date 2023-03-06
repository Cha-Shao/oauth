// import { SECRET_KEY } from '@/config';
import { TokenPayload } from '@/interfaces/token.interface';
import { readFileSync } from 'fs';
import { sign, verify } from 'jsonwebtoken';
import { join } from 'path';

class UseToken {
  // secretKey: string;
  expiresIn: number;
  secretKey: string;

  constructor() {
    // this.secretKey = SECRET_KEY;
    this.secretKey = readFileSync(join(__dirname, '../assets/rsa.pem')).toString();
    this.expiresIn = 60 * 60 * 24 * 7;
  }

  generate(payload: TokenPayload, secretKey: string = this.secretKey, expiresIn: number = this.expiresIn): string {
    return sign(payload, secretKey, { expiresIn, issuer: 'mmixel' });
  }

  parse(token: string, secretKey: string = this.secretKey): TokenPayload {
    let result: TokenPayload;

    verify(token, secretKey, (err, decoded): void => {
      if (err) result = { type: 'error' };
      else result = decoded as TokenPayload;
    });

    return result;
  }
}

export default UseToken;
