import App from '@/app';
import AccountsRoute from '@routes/accounts.route';
import IndexRoute from '@routes/index.route';
import validateEnv from '@utils/validateEnv';

validateEnv();

const app = new App([new IndexRoute(), new AccountsRoute()]);

app.listen();
