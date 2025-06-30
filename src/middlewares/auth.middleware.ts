import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { sendResponse } from '../helpers/ResponseService';
import { Role } from '@prisma/client';
const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret';

interface JwtPayload {
  user_id: number;
  user_role: string; // make sure Role is imported
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        user_id: number;
        user_role: string; // or user_role: Role if you use the enum
      };
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
       sendResponse(res, false, null, 'Authorization header missing or malformed.', 401);
       return
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    req.user = decoded;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
     sendResponse(res, false, null, 'Unauthorized access.', 401);
     return;
  }
};

// Optional: Role-based middleware
export const authorize =
  (roles: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.user_role)) {
       sendResponse(res, false, null, 'Forbidden: Access denied.', 403);
       return
    }
    next();
  };
