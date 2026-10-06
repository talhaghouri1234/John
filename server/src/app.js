import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import ApiError from './utils/ApiError.js';
import { env } from './config/env.js';
import routes from './routes/index.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/error.js';

const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '32kb' }));
app.use(cookieParser());
app.use(mongoSanitize());
// Cookies authenticate requests, so reject browser writes from other origins.
app.use((req, _res, next) => {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) &&
      ((req.headers.origin && req.headers.origin !== env.CLIENT_URL) || req.headers['sec-fetch-site'] === 'cross-site')) {
    return next(new ApiError(403, 'Origin not allowed'));
  }
  next();
});
if (env.NODE_ENV !== 'test') app.use(morgan('tiny'));
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

export default app;
