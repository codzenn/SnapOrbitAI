export const logger = {
  info: (msg: string, meta?: any) => {
    console.log(JSON.stringify({ level: 'INFO', timestamp: new Date().toISOString(), msg, ...meta }));
  },
  error: (msg: string, err?: any, meta?: any) => {
    console.error(JSON.stringify({ 
      level: 'ERROR', 
      timestamp: new Date().toISOString(), 
      msg, 
      error: err?.message || err, 
      stack: err?.stack, 
      ...meta 
    }));
  },
  warn: (msg: string, meta?: any) => {
    console.warn(JSON.stringify({ level: 'WARN', timestamp: new Date().toISOString(), msg, ...meta }));
  },
};