import { NextFunction, Request, Response } from 'express';
import AuthService from '../services/auth';

export function authMiddleware(
  req: Partial<Request>,
  res: Partial<Response>,
  next: NextFunction
): void {
  try {
    const token = req.headers?.['x-access-token'];
    const claims = AuthService.decodedToken(token as string);
    req.context = { userId: claims.sub };
    next();
  } catch (error) {
    if (error instanceof Error) {
      res.status?.(401).send({ code: 401, error: error.message });
    } else {
      res.status?.(401).send({ code: 401, error: 'Unknown auth error' });
    }
  }
}
