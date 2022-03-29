import { NextFunction, Request, Response } from 'express';
import AuthService from '../services/auth';

export function authMiddleware(
  req: Partial<Request>,
  res: Partial<Response>,
  next: NextFunction
): void {
  const token = req.headers?.['x-access-token'];
  try {
    const decoded = AuthService.decodedToken(token as string);
    req.decoded = decoded;
  } catch (error) {
    res.status?.(401).send({ code: 401, error: error.message });
  }
  next();
}
