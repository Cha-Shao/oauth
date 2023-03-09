// import { SECRET_KEY } from '@/config';
import { PRIVATE_KEY, PUBLIC_KEY } from '@/config';
import { TokenPayload } from '@/interfaces/token.interface';
import { sign, verify } from 'jsonwebtoken';

class UseToken {
  expiresIn: number;
  privateKey: string;
  publicKey: string;

  constructor() {
    // this.secretKey = SECRET_KEY;
    this.privateKey = PRIVATE_KEY;
    this.publicKey = PUBLIC_KEY;
    this.expiresIn = 60 * 60 * 24 * 7;
  }

  generate(payload: TokenPayload, secretKey: string = this.privateKey, expiresIn: number = this.expiresIn): string {
    return sign(payload, secretKey, {
      expiresIn,
      issuer: 'mmixel',
      algorithm: 'RS512',
    });
  }

  parse(token: string, secretKey: string = this.publicKey): TokenPayload {
    let result: TokenPayload;

    verify(token, secretKey, { algorithms: 'RS512' }, (err, decoded): void => {
      if (err) result = { type: 'error' };
      else result = decoded as TokenPayload;
    });

    return result;
  }
}

export default UseToken;
