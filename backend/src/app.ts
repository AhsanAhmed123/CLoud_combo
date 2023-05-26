import cors from 'cors';
import * as dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import driverRoutes from './routes/driverRoutes';
import userRoutes from './routes/userRoutes';
import transferRoutes from './routes/transfersRoutes';
import { startSocketServer } from "./sockets";
import { ExpressAdapter, createBullBoard, BullAdapter } from '@bull-board/express';
import Queue from "bull";
import { setupBull } from "./services/bull";
import fs from 'fs';
import https from 'https';
import http from 'http';
// import express from 'express';

if (process.env.NODE_ENV !== 'production') {
    dotenv.config({ path: __dirname + '/../.env' });
}

const app = express();

app.use(
  cors({
    optionsSuccessStatus: 200,
    origin: true,
    methods: 'GET,PUT,POST,DELETE,PATCH,OPTIONS',

  })
);

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());

app.use('/api/v1/drive', driverRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/transfers', transferRoutes);

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

const transfersQueue = new Queue(process.env.QUEUE_NAME as string, {
    redis: { port: process.env.REDIS_PORT as unknown as number, host: process.env.REDIS_HOST as string },
});

createBullBoard({
    queues: [new BullAdapter(transfersQueue)],
    serverAdapter: serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());

void setupBull();

let server: any;

if (process.env.NODE_ENV === 'production') {
    const options = {
        key: fs.readFileSync(__dirname + '/../ssl/184_174_36_243.key'),
        cert: fs.readFileSync(__dirname + '/../ssl/184_174_36_243.crt'),
        ca: fs.readFileSync(__dirname + '/../ssl/184_174_36_243.ca-bundle'),
    };

    server = https.createServer(options, app);
} else {
    server = http.createServer(app);
}

startSocketServer(server);

export default server;
