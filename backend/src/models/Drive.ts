import { model, Schema } from 'mongoose';

interface IDrive {
  user_id: String;
  cloud_provider: String;
  provider_user_id: String;
  provider_refresh_token: String;
  provider_access_token: String;
  provider_email: String;
  provider_name: String;
}

const driveSchema = new Schema<IDrive>(
  {
    user_id: {
      type: String,
    },
    cloud_provider: {
        type: String,
    },
    provider_user_id: {
      type: String,
    },
    provider_refresh_token: {
      type: String,
    },
    provider_access_token: {
      type: String,
    },
    provider_email: {
      type: String,
    },
    provider_name: {
      type: String,
    },
  },
  {
    strict: false,
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export const Drive = model<IDrive>('Drive', driveSchema);
