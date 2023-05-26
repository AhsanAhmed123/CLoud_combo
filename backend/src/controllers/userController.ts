import axios from 'axios';
import * as bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { Drive } from '../models/Drive';
import { User } from '../models/User';
import { getAccessToken, getDropboxAccessToken, getRefreshTokenFromProvider } from "../services/auth";
import * as url from "url";

export async function userSignup(req: Request, res: Response): Promise<Response> {
  try {
    const { email, password } = req.body;
    const { isWeb } = req.query;

    let passwordHash = bcrypt.hashSync(password, 10);

    const newUser = await User.create({
      email,
      password: passwordHash,
      platform: JSON.parse(<string>isWeb) ? 'android' : 'ios',
      isLtdUser: false,
    });

    newUser.password = undefined;

    const contact = {
      email,
    };

    await axios.post('https://api.sendinblue.com/v3/contacts', {
        email: contact.email,
        listIds: [5],
        updateEnabled: true,
    }, {
        headers: {
            'api-key': process.env.SENDINBLUE_API_KEY || '',
            'Content-Type': 'application/json',
        }
    });

    return res.status(200).json({
      success: true,
      message: 'Successfully registered',
      data: newUser,
    });
  } catch (e: any) {

    if (e.code === 11000) {
      return res.json({
        success: false,
        message: 'This email is already registered',
        error: e,
      });
    }

    return res.json({
      success: false,
      message: 'Failed to register user',
      error: e,
    });
  }
}

export async function getAppVersion(req: Request, res: Response): Promise<Response> {
  try {
      const { isWeb } = req.query;

      return res.status(200).json({
      success: true,
      message: 'Successfully registered',
      data: JSON.parse(<string>isWeb) ? '1.0.2' : '1.0.4',
    });
  } catch (e: any) {
    return res.json({
      success: false,
      message: 'Failed to get app version',
      error: e,
    });
  }
}

export async function userLogin(req: Request, res: Response): Promise<Response> {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user?.password || ''))) {
      // authentication failed
      return res.status(401).json({
        success: false,
        message: 'Email or password is incorrect',
        data: null,
      });
    }

    user.password = undefined;

    // authentication successful
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: user,
    });
  } catch (e) {
    return res.json({
      success: false,
      message: 'Failed to login user',
      error: e,
    });
  }
}

export async function checkUserLtd(req: Request, res: Response): Promise<Response> {
  try {
    const { userId } = req.body;

    const user = await User.findOne({ _id: userId });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        isLtdUser: user?.isLtdUser,
      },
    });
  } catch (e) {
    return res.json({
      success: false,
      message: 'Failed to check user',
      error: e,
    });
  }
}

export async function removeDriveFromAccount(req: Request, res: Response) {
    try {
        const { driveId, userId } = req.body;

        const drive = await Drive.findOne({ user_id: userId, provider_user_id: driveId });
        await Drive.findByIdAndDelete(drive?.id);

        let revokeAccess = null;
        if (drive?.cloud_provider === 'google') {
            revokeAccess = await axios.post(`https://oauth2.googleapis.com/revoke?token=${drive?.provider_access_token}`);
        } else {
            let config = {
                headers: {
                    Authorization: `Bearer ${drive?.provider_access_token}`,
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
            };

            revokeAccess = await axios.post(`https://api.dropboxapi.com/2/auth/token/revoke`, null, config);
        }

        if (drive && revokeAccess!.status === 200) {
            return res.json({
                success: true,
                message: 'Successfully removed drive',
            });
        }

        return res.json({
            success: false,
            message: 'Failed to remove drive',
            data: drive,
        });
    } catch (e: any) {
        return res.json({
            success: false,
            message: 'Failed to remove drive',
            error: e,
        });
    }
}

export async function isAuthedUser(req: Request, res: Response) {
    try {
        const { userId } = req.body;
        const { isWeb } = req.query;

        const drives = await Drive.find({ user_id: userId });

        //get quotas for each drive
        const formattedDrives = await Promise.all(
            drives.map(async (drive) => {
                const refreshToken = await getRefreshTokenFromProvider(drive.provider_user_id, userId);

                    if (drive.cloud_provider === 'google') {
                        const response = await getAccessToken(refreshToken, isWeb);

                        if (response === 'invalid_grant') {
                            await Drive.findByIdAndDelete(drive.id);
                            return {
                                needsAuth: true,
                            }
                        }

                        const { access_token } = response;

                        let config = {
                            headers: {
                                Authorization: `Bearer ${access_token}`,
                                Accept: 'application/json',
                            },
                        };
                        const queryParams = {
                            fields: 'storageQuota',
                            key: process.env.API_KEY || '',
                        };
                        const params = new url.URLSearchParams(queryParams);
                        const result = await axios.get(
                            `https://www.googleapis.com/drive/v3/about?${params}`,
                            config
                        );
                        return {
                            ...drive.toObject(),
                            storageQuota: result.data.storageQuota,
                        };
                    } else {
                        const response = await getDropboxAccessToken(refreshToken);

                        if (response === 'invalid_grant') {
                            await Drive.findByIdAndDelete(drive.id);
                            return {
                                needsAuth: true,
                            }
                        }

                        const { access_token } = response;

                        let config = {
                            headers: {
                                Authorization: `Bearer ${access_token}`,
                                Accept: 'application/json',
                                'Content-Type': 'application/json',
                            },
                        };

                        const result = await axios.post('https://api.dropboxapi.com/2/users/get_space_usage', null, config);

                        return {
                            ...drive.toObject(),
                            storageQuota: {
                                limit: result.data.allocation.allocated,
                                usage: result.data.used,
                            },
                        };
                    }
                }
            ));

        if (formattedDrives) {
            return res.json({
                success: true,
                message: 'User already authenticated',
                data: formattedDrives,
            });
        }

        return res.json({
            success: false,
            message: 'User not authenticated',
            data: drives,
        });
    } catch (e: any) {
        return res.json({
            success: false,
            message: 'Failed to verify user',
            error: e,
        });
    }
}

export async function googleAuthentication(req: Request, res: Response) {
  try {
    const { googleUser, userId } = req.body;
    const { authentication, serverAuthCode, id: googleUserId } = googleUser;
    const { refreshToken, accessToken } = authentication;

    let refresh_token, access_token;

    if (refreshToken === "" || !refreshToken) {
        const tokens = await axios.post(
            `https://www.googleapis.com/oauth2/v4/token?client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&code=${serverAuthCode}&grant_type=authorization_code&redirect_uri=${process.env.REDIRECT_URI}`
        );

        refresh_token = tokens.data.refresh_token;
        access_token = tokens.data.access_token;
    } else {
        refresh_token = refreshToken;
        access_token = accessToken;
    }

    const drive = await Drive.findOne({ provider_user_id: googleUserId, user_id: userId });

    if (drive) {
      let googleUserId = drive.provider_user_id;
      // update access_token & refresh_token
      await Drive.updateOne(
        { provider_user_id: googleUserId },
        { provider_refresh_token: refresh_token, provider_access_token: access_token }
      );

      return res.json({
        success: true,
        message: 'User already authenticated',
      });
    }

    await Drive.create({
      user_id: userId,
      cloud_provider: 'google',
      provider_user_id: googleUserId,
      provider_refresh_token: refresh_token,
      provider_access_token: access_token,
      provider_email: googleUser.email,
      provider_name: googleUser.name,
    });

    return res.json({
      success: true,
      message: 'User authenticated',
    });
  } catch (error) {
    return res.json({
      success: false,
      message: 'Failed to login user',
      error: error,
    });
  }
}
