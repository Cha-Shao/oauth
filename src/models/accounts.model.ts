import { Account } from '@/interfaces/accounts.interface';
import { model, Schema, Document } from 'mongoose';

const accountSchema: Schema = new Schema({
  session: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    index: true,
  },
  password: {
    type: String,
    required: true,
  },
  authorizes: {
    type: [
      {
        id: {
          type: String,
          index: true,
        },
        session: {
          type: String,
          unique: true,
        },
      },
    ],
    default: [],
  },
  valid: {
    type: Boolean,
  },
  jointime: {
    type: Number,
  },
});

const accountModel = model<Account & Document>('Account', accountSchema);

export default accountModel;
