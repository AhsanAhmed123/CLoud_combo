import Queue from "bull";
import { google } from "googleapis";
import { Dropbox } from "dropbox";
import { Readable } from "stream";
import { Transfers } from "../models/Transfers";
import { getSocketByUserId } from "../sockets";
import { getAccessToken, getDropboxAccessToken, getRefreshTokenFromProvider } from "./auth";
import * as stream from "stream";

export async function setupBull() {
    const transfersQueue = new Queue(process.env.QUEUE_NAME as string, {
        redis: { port: process.env.REDIS_PORT as unknown as number, host: process.env.REDIS_HOST as string },
    });

    transfersQueue.process(1, async function (job: any, done: any) { // first parameter is the concurrency
        const { from, to, userId, isWeb } = job.data;

        const totalItems = from.length;
        let processedItems = 0;

        for (const file of from) {
            await transfer(file, to, userId, job.id, isWeb);
            processedItems++;
            job.progress(Math.round((processedItems / totalItems) * 100));
            await job.update({
                progress: Math.round(processedItems / totalItems * 100),
                userId,
            })
        }

        done();
    });

    transfersQueue.on('progress', async function (job, progress) {
        if (progress !== 100) { //the 100% progress is sent by the completed event
            await Transfers.updateOne(
                { jobId: job.id, userId: job.data.userId },
                {
                    progress: progress,
                },
            );
        }

        const socket = getSocketByUserId(job.data.userId);
        if (socket) { // if the user is connected to the socket
            sendProgressToClient(job, progress, socket);
        }
    });

    transfersQueue.on('completed', async function (job: any) {
        transfersQueue.removeListener('progress', sendProgressToClient);
        const res = await transfersQueue.getJob(job.id);
        await Transfers.updateOne(
            { jobId: job.id },
            {
                status: 'completed',
                processedOn: res!.processedOn,
                finishedOn: res!.finishedOn,
                progress: res!.data.progress,
            },
        );
    });

}

export async function sendProgressToClient(job: any, progress: any, socket: any) {
    const transfer = await Transfers.findOne({jobId: job.id});
    socket.emit('progress', { id: job.id, progress, sizeCompleted: transfer?.sizeCompleted});
}

export async function transfer(file: any, to: any, userId: string, jobId: string, isWeb: any,) {
    try {
        const { driveId: originDriveId, fileId } = file;
        const { driveId: destinationDriveId, folderId } = to;

        let fileStream: Readable | null = null;
        let response: any;

        const isDropboxOrigin = originDriveId.includes('dbid');

        const originDriveRefreshToken = await getRefreshTokenFromProvider(originDriveId, userId);

        if (isDropboxOrigin) { // Dropbox origin
            const { access_token } = await getDropboxAccessToken(originDriveRefreshToken);

            const dbx = new Dropbox({ accessToken: access_token });
            response = await dbx.filesDownload({ path: fileId });

            if (response.status !== 200) {
                return;
            }

            fileStream = response.result.fileBinary;
        }
        else { // Google Drive origin
            const { access_token } = await getAccessToken(originDriveRefreshToken, isWeb);

            const googleAuth2Client = new google.auth.OAuth2(
                process.env.CLIENT_ID,
                process.env.CLIENT_SECRET,
                process.env.REDIRECT_URI
            );

            googleAuth2Client.setCredentials({ access_token });

            const drive = google.drive({
                version: 'v3',
                auth: googleAuth2Client,
            });

            response = await drive.files.get(
                {
                    fileId: fileId,
                    alt: 'media',
                    fields: '*',
                },
                {
                    responseType: 'stream',
                }
            );

            if (response.status !== 200) {
                return;
            }

            fileStream = response!.data as Readable | null;
        }

        response = null; // set response to null after processing the fileStream

        // DESTINATION
        const destinationDriveRefreshToken = await getRefreshTokenFromProvider(destinationDriveId, userId);

        if (destinationDriveId.includes('dbid')) { // Dropbox destination
            const { access_token: destination_access_token } = await getDropboxAccessToken(destinationDriveRefreshToken);

            const destinationDbx = new Dropbox({ accessToken: destination_access_token });
            await destinationDbx.filesUpload({ path: `${folderId}/${file.fileName}`, contents: fileStream! });
        } else { // Google Drive destination
            const { access_token: destination_access_token } = await getAccessToken(destinationDriveRefreshToken, isWeb);

            const destinationGoogleAuth2Client = new google.auth.OAuth2(
                process.env.CLIENT_ID,
                process.env.CLIENT_SECRET,
                process.env.REDIRECT_URI
            );

            destinationGoogleAuth2Client.setCredentials({ access_token: destination_access_token });

            const destinationDrive = google.drive({
                version: 'v3',
                auth: destinationGoogleAuth2Client,
            });

            await destinationDrive.files.create({
                requestBody: {
                    name: file.fileName,
                    parents: [folderId],
                },
                media: {
                    body: isDropboxOrigin ? Readable.from(fileStream!) : fileStream, // if the origin is Dropbox, we need to convert the fileStream to a Readable stream
                    ...(!isDropboxOrigin && { mimeType: file.mimeType }),
                },
            });
        }

        if (!isDropboxOrigin) { // on Dropbox destination, the fileStream var is not a Readable stream, so we need to check if it has the destroy method
            fileStream!.destroy();
        }
        fileStream = null; // set fileStream to null after processing the fileStream

        // If we made it till here
        await Transfers.updateOne(
            { jobId },
            {
                $inc: { filesCompleted: 1, sizeCompleted: file.size },
            }
        );
    } catch (error) {
        console.log(error);
    }
};
