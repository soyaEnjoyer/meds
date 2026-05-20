import express, { Express, NextFunction, Request, Response } from 'express';
import * as schema from './schema';
import ApiFunctions from './apiFunctions';
import path from 'path';
import { createNamedLogger } from './logger';

const logger = createNamedLogger('apiRouter');

const DB_PATH: string = path.join(process.env.DB_DIR ?? '../.local', process.env.DB_NAME ?? 'data.db');
const NO_LOG_IPS: string[] = process.env.NO_LOG_IPS?.split(',') ?? [];
logger.info(`serving db from ${DB_PATH}`);

const apiFunctions = ApiFunctions(DB_PATH);
apiFunctions.doMigrations();
apiFunctions.createViews();
apiFunctions.preload();

const apiRouter = express.Router();
//respond to status ping before logging/json hooks are installed
apiRouter.all('/status', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

//parse json body
apiRouter.use(express.json());

//log requests
apiRouter.use((req: Request, res: Response, next: NextFunction) => {
  const cleanedIp = req.ip
    ? req.ip.replace(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/, '$1')
    : '';
  if (!NO_LOG_IPS.includes(cleanedIp)) {
    logger.http(
      [
        cleanedIp,
        req.method,
        req.originalUrl,
        Object.keys(req.query).length
          ? `query=${JSON.stringify(req.query)}`
          : '',
        Object.keys(req.params).length
          ? `params=${JSON.stringify(req.params)}`
          : '',
        Object.keys(req.body).length ? `body=${JSON.stringify(req.body)}` : '',
      ]
        .filter((item) => item)
        .join(' ')
    );
  }
  next();
});

//mount table and view generated methods. these probably need looking at
type HttpMethod =
  | 'get'
  | 'post'
  | 'put'
  | 'delete'
  | 'patch'
  | 'options'
  | 'head';
Object.entries(schema.tables).forEach(([tableName, table]) => {
  Object.entries(apiFunctions.tableFunctions(table, tableName)).forEach(
    ([httpMethod, func]) => {
      apiRouter[httpMethod as HttpMethod](`/data/${tableName}`, func);
      apiRouter[httpMethod as HttpMethod](`/data/${tableName}/:id`, func);
    }
  );
});
Object.entries(schema.views).forEach(([viewName, view]) => {
  Object.entries(apiFunctions.viewFunctions(view, viewName)).forEach(
    ([httpMethod, func]) => {
      apiRouter[httpMethod as HttpMethod](`/data/${viewName}`, func);
      apiRouter[httpMethod as HttpMethod](`/data/${viewName}/:id`, func);
    }
  );
});

//mount specific methods
apiRouter.post('/method/schedule', (req: Request, res: Response) => {
  apiFunctions.scheduleHandler(req, res);
});
apiRouter.all('/method/history', (req: Request, res: Response) => {
  apiFunctions.historyHandler(req, res);
});
apiRouter.all('/method/history/:id', (req: Request, res: Response) => {
  apiFunctions.historyHandler(req, res);
});
apiRouter.all('/method/water', (req: Request, res: Response) => {
  apiFunctions.waterHandler(req, res);
});
apiRouter.get('/method/notify', (req: Request, res: Response) => {
  apiFunctions.notifyHandler(req, res);
});

export default apiRouter;
