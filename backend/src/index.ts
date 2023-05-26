import mongoose from 'mongoose';
import app from './app';

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);

  process.exit(1);
});

const DB = process.env.DB_CONNECTION_STRING?.replace('<password>', process.env.DB_PASSWORD || '');

mongoose.connect(DB || '', {}).then(() => console.log('DB connection successful!'));

const port = process.env.PORT || 3000;

const server = app.listen(port, () => console.log(`App running on port ${port}...`));

process.on('unhandledRejection', (err: any) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);

  server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');

  server.close(() => console.log('💥 Process terminated!'));
});
