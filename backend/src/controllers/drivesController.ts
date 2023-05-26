import axios from 'axios';
import Queue from 'bull';
import { Request, Response } from 'express';
import * as url from 'url';
import { getAccessToken, getRefreshTokenFromProvider, getDropboxAccessToken } from '../services/auth';
import { Transfers } from "../models/Transfers";
import { Drive } from "../models/Drive";

export async function startNewTransfer(req: Request, res: Response) {
    try {
        debugger;
        const { userId, totalSize, from, to } = req.body;
        const { isWeb } = req.query;
        const transfersQueue = new Queue(process.env.QUEUE_NAME as string, {
            redis: { port: process.env.REDIS_PORT as unknown as number, host: process.env.REDIS_HOST as string },
        });

        const job = await transfersQueue.add({ ...req.body, isWeb, });

        await Transfers.create({
            userId,
            jobId: job.id,
            fromProvider: from[0].driveId.includes('dbid') ? 'dropbox' : 'google',
            toProvider: to.driveId.includes('dbid') ? 'dropbox' : 'google',
            fromDriveId: from[0].driveId,
            toDriveId: to.driveId,
            filesAttempted: job.data.from.length,
            filesCompleted: 0,
            sizeAttempted: totalSize,
            sizeCompleted: 0,
            progress: 0,
            status: 'pending',
        });

        return res.json({
            success: true,
            message: 'Transfer started',
            data: job,
        });
    } catch (error) {
        console.error('Error:', error);
        console.error('Error stack trace:', (error as Error)?.stack);
        
        return res.json({
            success: false,
            message: 'Failed to start transfers',
            error: (error as Error)?.toString(),
        });
    }
}

export async function getFolderFiles(req: Request, res: Response) {
    try {
        const { userId, folderId, driveId, isWeb, cloudProvider } = req.query;
        const refreshToken = await getRefreshTokenFromProvider(driveId, userId);

        let files = null;

        if (cloudProvider === 'dropbox') {
            const { access_token } = await getDropboxAccessToken(refreshToken);

            let config = {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                    Accept: 'application/json',
                },
            };

            const result = await axios.post(
                `https://api.dropboxapi.com/2/files/list_folder`,
                {
                    path: folderId,
                    recursive: false,
                    include_media_info: false,
                    include_deleted: false,
                    include_has_explicit_shared_members: false,
                    include_mounted_folders: true,
                    limit: 1000,
                },
                config
            );

            files = { files: result.data.entries };

        } else {
            const { access_token } = await getAccessToken(refreshToken, isWeb);

            let config = {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                    Accept: 'application/json',
                },
            };

            const result = await axios.get(
                `https://www.googleapis.com/drive/v3/files?fields=files(id, name, mimeType, thumbnailLink, size)&q='${folderId}'+in+parents+and+trashed=false&key=${process.env.API_KEY}`,
                config
            );

            files = result.data;
        }

        return res.json({
            success: true,
            message: 'Folder files listed successfully',
            data: files,
        });
    } catch (error) {
        return res.json({
            success: false,
            message: 'Failed to list folder files',
            error: error,
        });
    }
}

export async function getDriveFiles(req: Request, res: Response) {
    try {
        const { userId, driveId, isWeb, cloudProvider } = req.query;
        const refreshToken = await getRefreshTokenFromProvider(driveId, userId);

        let files = [];

        if (cloudProvider === 'dropbox') {
            const { access_token } = await getDropboxAccessToken(refreshToken);
            let config = {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                    Accept: 'application/json',
                },
            };

            const result = await axios.post(
                `https://api.dropboxapi.com/2/files/list_folder`,
                {
                    path: '',
                    recursive: false,
                    include_media_info: false,
                    include_deleted: false,
                    include_has_explicit_shared_members: false,
                    include_mounted_folders: true,
                    limit: 1000,
                },
                config
            );

            files = result.data.entries;
        } else {
            const { access_token } = await getAccessToken(refreshToken, isWeb);

            let config = {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                    Accept: 'application/json',
                },
            };

            const queryParams = {
                q: "trashed=false and 'root' in parents",
                fields: "files(id, name, mimeType, thumbnailLink, size)",
                key: process.env.API_KEY as string,
            }
            const params = new url.URLSearchParams(queryParams);

            const result = await axios.get(
                `https://www.googleapis.com/drive/v3/files?pageSize=1000&${params}`,
                config
            );

            files = result.data.files;
        }

        return res.json({
            success: true,
            message: 'Drive files listed successfully',
            data: files,
        });
    } catch (error) {
        return res.json({
            success: false,
            message: 'Failed to list drive files',
            error: error,
        });
    }
}

export async function getDriveRootFolders(req: Request, res: Response) {
    try {
        const { userId, driveId, isWeb, cloudProvider } = req.query;
        const refreshToken = await getRefreshTokenFromProvider(driveId, userId);
        const { access_token } = await getAccessToken(refreshToken, isWeb);

        let folders = null;

        if (cloudProvider === 'dropbox') {
            const { access_token } = await getDropboxAccessToken(refreshToken);

            let config = {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                    Accept: 'application/json',
                },
            };

            const result = await axios.post(
                `https://api.dropboxapi.com/2/files/list_folder`,
                {
                    path: '',
                    recursive: false,
                    include_media_info: false,
                    include_deleted: false,
                    include_has_explicit_shared_members: false,
                    include_mounted_folders: true,
                    limit: 1000,
                },
                config
            );

            folders = result.data.entries.filter((folder: any) => folder[".tag"] === "folder");
        } else {
            let config = {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                    Accept: 'application/json',
                },
            };

            const queryParams = {
                q: "mimeType = 'application/vnd.google-apps.folder' and trashed = false and 'root' in parents",
                fields: 'files(id, name, mimeType, parents)',
                key: process.env.API_KEY as string,
            }
            const params = new url.URLSearchParams(queryParams);

            const result = await axios.get(
                `https://www.googleapis.com/drive/v3/files?pageSize=1000&${params}`,
                config
            );

            folders = result.data.files;
        }

        return res.json({
            success: true,
            message: 'Drive folders listed successfully',
            data: folders,
        });
    } catch (error) {
        return res.json({
            success: false,
            message: 'Failed to list drive folders',
            error: error,
        });
    }
}

export async function getChildrenOfFolder(req: Request, res: Response) {
    try {
        const { userId, driveId, folderId, isWeb, cloudProvider } = req.query;
        const refreshToken = await getRefreshTokenFromProvider(driveId, userId);

        let files = [];

        if (cloudProvider === 'dropbox') {
            const { access_token } = await getDropboxAccessToken(refreshToken);

            let config = {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                    Accept: 'application/json',
                },
            };

            const result = await axios.post(
                `https://api.dropboxapi.com/2/files/list_folder`,
                {
                    path: folderId,
                    recursive: false,
                    include_media_info: false,
                    include_deleted: false,
                    include_has_explicit_shared_members: false,
                    include_mounted_folders: true,
                    limit: 1000,
                },
                config
            );

            files = result.data.entries.filter((folder: any) => folder[".tag"] === "folder");
        } else {
            const { access_token } = await getAccessToken(refreshToken, isWeb);

            let config = {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                    Accept: 'application/json',
                },
            };

            const queryParams = {
                q: `mimeType = 'application/vnd.google-apps.folder' and trashed = false and '${folderId}' in parents`,
                fields: 'files(id, name, mimeType, parents)',
                key: process.env.API_KEY as string,
            }
            const params = new url.URLSearchParams(queryParams);

            const result = await axios.get(
                `https://www.googleapis.com/drive/v3/files?pageSize=1000&${params}`,
                config
            );

            files = result.data.files;
        }

        return res.json({
            success: true,
            message: 'Folder children listed successfully',
            data: files,
        });
    } catch (error) {
        return res.json({
            success: false,
            message: 'Failed to list folder children',
            error: error,
        });
    }
}

// export async function getDriveFolderTree(req: Request, res: Response): Promise<Response> {
//     try {
//         const { userId, driveId, isWeb } = req.query;
//         const refreshToken = await getRefreshToken(driveId, userId);
//
//         const { access_token } = await getAccessToken(refreshToken, isWeb);
//
//         let config = {
//             headers: {
//                 Authorization: `Bearer ${access_token}`,
//                 Accept: 'application/json',
//             },
//         };
//         const queryParamsForAll = {
//             q: "mimeType = 'application/vnd.google-apps.folder' and trashed=false",
//             fields: 'files(id, name, parents)',
//             key: process.env.API_KEY as string,
//         };
//         const allParams = new url.URLSearchParams(queryParamsForAll);
//
//         const queryParamsForRoot = {
//             q: "mimeType = 'application/vnd.google-apps.folder' and trashed = false and 'root' in parents",
//             fields: 'files(id, name, parents)',
//             key: process.env.API_KEY as string,
//         };
//         const rootParams = new url.URLSearchParams(queryParamsForRoot);
//
//         const allFolders = await axios.get(
//             `https://www.googleapis.com/drive/v3/files?pageSize=1000&${allParams}`,
//             config
//         );
//         const rootFolders = await axios.get(
//             `https://www.googleapis.com/drive/v3/files?pageSize=1000&${rootParams}`,
//             config
//         );
//         return res.json({
//             success: true,
//             message: 'Folder files listed successfully',
//             data: {
//                 allFolders: allFolders.data,
//                 rootFolders: rootFolders.data,
//             },
//         });
//     } catch (error) {
//         return res.json({
//             success: false,
//             message: 'Failed to get folder tree',
//             error,
//         });
//     }
// }
//
// export async function getDriveFileTree(req: Request, res: Response): Promise<Response> {
//     try {
//         const { userId, driveId, isWeb } = req.query;
//         const refreshToken = await getRefreshToken(driveId, userId);
//         let { access_token } = await getAccessToken(refreshToken, isWeb);
//         let config = {
//             headers: {
//                 Authorization: `Bearer ${access_token}`,
//                 Accept: 'application/json',
//             },
//         };
//         const queryParamsForAll = {
//             q: 'trashed=false',
//             fields: 'files(id, name, parents, mimeType, size)',
//             key: process.env.API_KEY as string,
//         };
//         const allParams = new url.URLSearchParams(queryParamsForAll);
//
//         const queryParamsForRoot = {
//             q: "trashed = false and 'root' in parents",
//             fields: 'files(id, name, parents, size)',
//             key: process.env.API_KEY as string,
//         };
//         const rootParams = new url.URLSearchParams(queryParamsForRoot);
//
//         const allFiles = await axios.get(
//             `https://www.googleapis.com/drive/v3/files?pageSize=1000&${allParams}`,
//             config
//         );
//         const rootFiles = await axios.get(
//             `https://www.googleapis.com/drive/v3/files?pageSize=1000&${rootParams}`,
//             config
//         );
//         return res.json({
//             success: true,
//             message: 'Folder files listed successfully',
//             data: {
//                 allFiles: allFiles.data,
//                 rootFiles: rootFiles.data,
//             },
//         });
//     } catch (error) {
//         return res.json({
//             success: false,
//             message: 'Failed to get file ree',
//             error,
//         });
//     }
// }

export async function getDropboxUrl(req: Request, res: Response): Promise<Response> {
    try {
        const queryParams = {
            response_type: 'code',
            client_id: process.env.DROPBOX_CLIENT_ID as string,
            scope: 'account_info.read files.metadata.read files.content.read files.content.write',
            token_access_type: 'offline',
        };
        const params = new url.URLSearchParams(queryParams);
        const authUrl = `https://www.dropbox.com/oauth2/authorize?${params}`;

        return res.json({ authUrl });
    } catch (error) {
        return res.json({
            success: false,
            message: 'Failed to connect dropbox account',
            error,
        });
    }
}

export async function dropboxAuthentication(req: Request, res: Response): Promise<Response> {
    try {
        const { code, userId } = req.body;

        const queryParams = {
            code: code as string,
            grant_type: 'authorization_code',
            client_id: process.env.DROPBOX_CLIENT_ID as string,
            client_secret: process.env.DROPBOX_CLIENT_SECRET as string,
        }
        const params = new url.URLSearchParams(queryParams);

        const tokenResponse = await axios.post(`https://api.dropboxapi.com/oauth2/token?${params}`);

        const { data } = tokenResponse;

        let config = {
            headers: {
                Authorization: `Bearer ${data.access_token}`,
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        };

        const accountInfo = await axios.post('https://api.dropboxapi.com/2/users/get_current_account', null, config);

        const { data: userData } = accountInfo;

        const { account_id, name, email } = userData;

        const drive = await Drive.findOne({ provider_user_id: account_id, user_id: userId });

        if (drive) {
            // update access_token & refresh_token
            await Drive.updateOne(
                { provider_user_id: account_id },
                { provider_refresh_token: data.refresh_token, provider_access_token: data.access_token }
            );

            return res.json({
                success: true,
                message: 'User already authenticated',
            });
        }

        await Drive.create({
            user_id: userId,
            cloud_provider: 'dropbox',
            provider_user_id: account_id,
            provider_refresh_token: data.refresh_token,
            provider_access_token: data.access_token,
            provider_email: email,
            provider_name: name.display_name,
        });

        return res.json({
            success: true,
            message: 'Dropbox account connected successfully',
            data: tokenResponse.data,
        });
    } catch (error) {
        console.log(error);
        return res.json({
            success: false,
            message: 'Failed to connect dropbox account',
            error,
        });
    }
}

export async function getDropboxFileThumbnails(req: Request, res: Response): Promise<Response> {
    try {
        const { userId, driveId, files } = req.body;
        const refreshToken = await getRefreshTokenFromProvider(driveId, userId);

        let { access_token } = await getDropboxAccessToken(refreshToken);

        let config = {
            headers: {
                Authorization: `Bearer ${access_token}`,
                'Content-Type': 'application/json',
            }
        }

        const formattedFiles = {
            entries: files.map((file: any) => {
                return {
                    "format": "jpeg",
                    "mode": "strict",
                    "path": file.id,
                    "size": "w64h64"
                };
            })
        };

        const thumbnails = await axios.post(`https://content.dropboxapi.com/2/files/get_thumbnail_batch`, formattedFiles, config);

        return res.json({
            success: true,
            message: 'Dropbox thumbnails listed successfully',
            data: thumbnails.data.entries,
        });
    } catch (error) {
        return res.json({
            success: false,
            message: 'Failed to get dropbox thumbnails',
            error,
        });
    }
}
