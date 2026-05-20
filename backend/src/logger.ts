import {createLogger,format,transports,Logger} from 'winston';

const {combine,printf,label}=format;

const logFormat=printf(({level,message,label})=>{
  const formattedMessage=
    message instanceof Error ? 
      JSON.stringify({'name':message.name,'message':message.message,'stack':message.stack}) : 
    typeof message==='object' ? 
      JSON.stringify(message) : 
    String(message).replaceAll('\n',' ').replace(/\s{2,}/g,' ')
  ;
  return `${level.toUpperCase()} ${label} ${formattedMessage}`;
});

/*
log levels are:
  silly
  debug
  verbose
  http
  info
  warn
  error
*/

export function createNamedLogger(source:string):Logger{
  return createLogger({
    level:(process.env.LOG_LEVEL ?? 'debug').toLowerCase(),
    format:combine(
      label({label:source}),
      logFormat
    ),
    transports:[
      new transports.Console({
        stderrLevels:['error','warn'], // Errors and warnings go to stderr
      })
    ]
  });
};
