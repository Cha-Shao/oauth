interface DocumentResult<T> {
  _doc: T;
}

export interface App extends DocumentResult<App> {
  id: string;
  secret: string;
  name: string;
  silent: boolean;
  redirect_uri: string;
  logo: string;
  link: string;
  protocol: string;
  privacy: string;
}
