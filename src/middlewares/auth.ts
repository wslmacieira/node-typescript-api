import { NextFunction, Request, Response } from 'express';
import AuthService from '../services/auth';

export function authMiddleware(
  req: Partial<Request>,
  _: Partial<Response>,
  next: NextFunction
): void {
  const token = req.headers?.['x-access-token'];
  const decoded = AuthService.decodedToken(token as string);
  req.decoded = decoded;
  next();
}
