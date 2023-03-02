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
  authorize: {
    type: [
      {
        id: {
          type: String,
          required: true,
          index: true,
        },
        session: {
          type: String,
          required: true,
          unique: true,
        },
      },
    ],
    required: true,
  },
  valid: {
    type: Boolean,
    required: true,
  },
  jointime: {
    type: Number,
    require: true,
  },
});

const accountModel = model<Account & Document>('Account', accountSchema);

export default accountModel;
