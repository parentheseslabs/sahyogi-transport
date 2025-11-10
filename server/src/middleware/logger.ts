import { Request, Response, NextFunction } from 'express';

interface LogData {
  timestamp: string;
  method: string;
  url: string;
  path: string;
  query: any;
  body?: any;
  statusCode?: number;
  duration?: number;
  userAgent?: string;
  ip?: string;
  userId?: number;
  error?: string;
}

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

const getStatusColor = (status: number): string => {
  if (status >= 500) return colors.red;
  if (status >= 400) return colors.yellow;
  if (status >= 300) return colors.cyan;
  if (status >= 200) return colors.green;
  return colors.gray;
};

const getMethodColor = (method: string): string => {
  switch (method) {
    case 'GET': return colors.green;
    case 'POST': return colors.blue;
    case 'PUT': return colors.yellow;
    case 'DELETE': return colors.red;
    case 'PATCH': return colors.magenta;
    default: return colors.gray;
  }
};

const sanitizeBody = (body: any): any => {
  if (!body) return undefined;
  
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization'];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '***';
    }
  });
  
  return sanitized;
};

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Store original send function
  const originalSend = res.send;
  let responseBody: any;
  
  // Override send function to capture response
  res.send = function(data: any) {
    responseBody = data;
    return originalSend.call(this, data);
  };
  
  // Capture request data
  const logData: LogData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl || req.url,
    path: req.path,
    query: req.query,
    body: sanitizeBody(req.body),
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.socket.remoteAddress,
    userId: (req as any).user?.userId,
  };
  
  // Log when response finishes
  res.on('finish', () => {
    logData.statusCode = res.statusCode;
    logData.duration = Date.now() - startTime;
    
    // Format log message
    const methodColor = getMethodColor(req.method);
    const statusColor = getStatusColor(res.statusCode);
    
    console.log(
      `${colors.gray}[${logData.timestamp}]${colors.reset} ` +
      `${methodColor}${req.method}${colors.reset} ` +
      `${req.path} ` +
      `${statusColor}${res.statusCode}${colors.reset} ` +
      `${colors.gray}${logData.duration}ms${colors.reset}` +
      (logData.userId ? ` ${colors.cyan}[User: ${logData.userId}]${colors.reset}` : '')
    );
    
    // Log additional details for non-GET requests or errors
    if (req.method !== 'GET' || res.statusCode >= 400) {
      console.log(`${colors.gray}├─ Query:${colors.reset}`, JSON.stringify(logData.query));
      
      if (logData.body && Object.keys(logData.body).length > 0) {
        console.log(`${colors.gray}├─ Body:${colors.reset}`, JSON.stringify(logData.body));
      }
      
      if (res.statusCode >= 400 && responseBody) {
        try {
          const errorBody = typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;
          if (errorBody.error) {
            console.log(`${colors.gray}└─ Error:${colors.reset} ${colors.red}${errorBody.error}${colors.reset}`);
          }
        } catch (e) {
          // If response is not JSON, just log it as is
          console.log(`${colors.gray}└─ Response:${colors.reset}`, responseBody);
        }
      }
    }
    
    // Log slow requests (> 1000ms)
    if (logData.duration && logData.duration > 1000) {
      console.warn(
        `${colors.yellow}⚠️  Slow request detected:${colors.reset} ${req.method} ${req.path} took ${logData.duration}ms`
      );
    }
  });
  
  // Handle errors
  res.on('error', (error: Error) => {
    logData.error = error.message;
    console.error(
      `${colors.red}❌ Request error:${colors.reset} ${req.method} ${req.path}`,
      error
    );
  });
  
  next();
};

// Optional: Create a file logger that writes to a log file
import * as fs from 'fs';
import * as path from 'path';

export const fileLogger = (logDir: string = 'logs') => {
  // Create logs directory if it doesn't exist
  const logsPath = path.join(process.cwd(), logDir);
  if (!fs.existsSync(logsPath)) {
    fs.mkdirSync(logsPath, { recursive: true });
  }
  
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const date = new Date().toISOString().split('T')[0];
    const logFile = path.join(logsPath, `api-${date}.log`);
    
    res.on('finish', () => {
      const logEntry = {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode: res.statusCode,
        duration: Date.now() - startTime,
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
        userId: (req as any).user?.userId,
      };
      
      fs.appendFile(logFile, JSON.stringify(logEntry) + '\n', (err) => {
        if (err) {
          console.error('Failed to write to log file:', err);
        }
      });
    });
    
    next();
  };
};