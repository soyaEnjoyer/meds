import express, {Express,NextFunction,Request,Response} from 'express';
import path from 'path';
import apiRouter from './apiRouter';
import {createNamedLogger} from './logger';
import {exit} from 'process';

const logger=createNamedLogger('index');
const HTTP_PORT:number=parseInt(process.env.HTTP_PORT ?? '3001');
const FRONTEND_DIR:string=process.env.FRONTEND_DIR && process.env.FRONTEND_DIR.startsWith('/') ?
  process.env.FRONTEND_DIR :
  path.join(__dirname,process.env.FRONTEND_DIR ?? '../../frontend/build');

logger.debug({HTTP_PORT,FRONTEND_DIR});

// logger.silly('logger test silly');
// logger.debug('logger test debug');
// logger.verbose('logger test verbose');
// logger.http('logger test http');
// logger.info('logger test info');
// logger.warn('logger test warn');
// logger.error('logger test error');

// exit();

const app:Express=express();
// serve the frontend (anything which doesn't exist just falls through to the handlers below)
app.use('/',express.static(FRONTEND_DIR))

//mount the api under /api
app.use('/api',apiRouter);

// return frontend index.html for any unmatched urls (frontend will display NotFound page for routes which don't exist in it)
app.get('*',(req:Request,res:Response)=>{
  res.sendFile(path.join(FRONTEND_DIR,'index.html'));
})

app.listen(HTTP_PORT,()=>{
  logger.info(`running on ${HTTP_PORT} serving frontend from ${FRONTEND_DIR}`);
})