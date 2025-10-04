import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet'; // Add this import

import userRouter from './functions/user-service/index.js';
import contentRouter from './functions/content-service/index.js';
import announcementRouter from './functions/announcement-service/index.js';
import registeredEmailRouter from './functions/regisetered-email-service/index.js';
import authRouter from './functions/login-service/index.js';

import { setupSwagger } from './swagger.js';

export const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet()); // Use helmet for security headers

// Setup Swagger documentation
setupSwagger(app);

// Mount routers under /v1
app.use('/v1/users', userRouter);
app.use('/v1/content', contentRouter);
app.use('/v1/announcements', announcementRouter);
app.use('/v1/registered-emails', registeredEmailRouter);
app.use('/v1/auth', authRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Express server running on port ${PORT}`);
});