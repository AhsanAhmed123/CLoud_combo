import { model, Schema } from 'mongoose';

interface ITransfer {
    userId: String;
    jobId: String;
    status: String;
    fromProvider: String;
    toProvider: String;
    fromDriveId: String;
    toDriveId: String;
    filesAttempted: Number;
    filesCompleted: Number;
    sizeAttempted: Number;
    sizeCompleted: Number;
    progress: Number;
    processedOn: Date;
    finishedOn: Date;
}

const transfersSchema = new Schema<ITransfer>(
    {
        userId: {
            type: String,
        },
        jobId: {
            type: String,
        },
        fromProvider: {
            type: String,
        },
        toProvider: {
            type: String,
        },
        fromDriveId: {
            type: String,
        },
        toDriveId: {
            type: String,
        },
        status: {
            type: String,
        },
        filesAttempted: {
            type: Number,
        },
        filesCompleted: {
            type: Number,
        },
        sizeAttempted: {
            type: Number,
        },
        sizeCompleted: {
            type: Number,
        },
        progress: {
            type: Number,
        },
        processedOn: {
            type: Date,
        },
        finishedOn: {
            type: Date,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

export const Transfers = model<ITransfer>('Transfers', transfersSchema);
