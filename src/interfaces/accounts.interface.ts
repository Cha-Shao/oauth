interface DocumentResult<T> {
  _doc: T;
}

export interface Account extends DocumentResult<Account> {
  session: string;
  username: string;
  email: string;
  password: string;
  authorize: {
    id: string;
    session: string;
  }[];
  valid: boolean;
}
