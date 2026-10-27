import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import { env } from './config/env.js';
import { browserSecurity } from './middleware/browserSecurity.js';
import { uploadsDir } from './middleware/uploadImage.js';
import routes from './routes/index.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/error.js';

const app = express();
const { corsOptions, protectWrites } = browserSecurity(env);
app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors(corsOptions));
app.use(protectWrites);
app.use('/uploads', express.static(uploadsDir));
app.use(express.json({ limit: '32kb' }));
app.use(cookieParser());
app.use(mongoSanitize());
if (env.NODE_ENV !== 'test') app.use(morgan('tiny'));
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

export default app;
