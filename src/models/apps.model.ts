import { App } from '@/interfaces/apps.interface';
import { Document, model, Schema } from 'mongoose';

const appSchema: Schema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  secret: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  silent: {
    type: Boolean,
    required: true,
  },
  redirect_uri: {
    type: String,
    required: true,
  },
  logo: {
    type: String,
    required: true,
  },
  link: {
    type: String,
    required: true,
  },
  protocol: {
    type: String,
    required: true,
  },
  privacy: {
    type: String,
    required: true,
  },
});

const appModel = model<App & Document>('App', appSchema);

export default appModel;
