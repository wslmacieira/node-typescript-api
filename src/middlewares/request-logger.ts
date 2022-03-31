import { NextFunction, Request, Response, Send } from 'express';

export function requestLoggerMiddleware(
  _: Request,
  res: Response,
  next: NextFunction
) {
  res.send = resSendInterceptor(res, res.send) as Send;
  res.on('finish', () => res.contentBody);
  next();
}

const resSendInterceptor = (res: Response, send: Send) => (content: any) => {
  res.contentBody = content;
  res.send = send;
  res.send(content);
};
