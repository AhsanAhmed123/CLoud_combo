import axios from 'axios';
import { Drive } from '../models/Drive';
import url from "url";

export async function getDropboxAccessToken(refresh_token: any) {
  const queryParams = {
    refresh_token,
    grant_type: 'refresh_token',
    client_id: process.env.DROPBOX_CLIENT_ID as string,
    client_secret: process.env.DROPBOX_CLIENT_SECRET as string,
  }
  const params = new url.URLSearchParams(queryParams);

  try {
    const result = await axios.post(
        `https://api.dropboxapi.com/oauth2/token?${params}`
    );
    return result.data;
  }
  catch (error: any) {
    return error.response.data.error;
  }
}

export async function getAccessToken(refresh_token: any, isWeb: any) {
  const queryParams = {
    client_id: JSON.parse(isWeb) === true ? process.env.CLIENT_ID as string : process.env.IOS_GOOGLE_CLIENT_ID as string,
    ...(JSON.parse(isWeb) === true &&  { client_secret: process.env.CLIENT_SECRET as string }),
    refresh_token: refresh_token,
    grant_type: 'refresh_token',
  };
  const params = new url.URLSearchParams(queryParams);

  try {
    const result = await axios.post(
        `https://www.googleapis.com/oauth2/v4/token?${params}`
    );

    return result.data;
  } catch (error: any) {
    return error.response.data.error;
  }
}

export async function getRefreshTokenFromProvider(driveId: any, userId: any) {
  const drive = await Drive.findOne({ provider_user_id: driveId, user_id: userId});

  return drive?.provider_refresh_token;
}
