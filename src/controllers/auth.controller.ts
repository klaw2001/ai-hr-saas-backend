import { Request, RequestHandler, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sendResponse } from '../helpers/ResponseService';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret';

export const register: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { email, password, role, fullName } = req.body;

    if (!email || !password || !role) {
      sendResponse(res, false, null, 'Email, password, and role are required.', 400);
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { user_email: email } });
    if (existingUser) {
      sendResponse(res, false, null, 'User already exists.', 409);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        user_email: email,
        user_password: hashedPassword,
        user_role: role as Role,
        is_active: true,
      },
    });

    if(!user) {
      sendResponse(res, false, null, 'User not created.', 400);
      return;
    }

    // Create associated record
    if (role === 'JOBSEEKER') {
      await prisma.jobseeker.create({ data: { jobseeker_user_id: user.user_id} });
    } else if (role === 'EMPLOYER') {
      await prisma.employer.create({ data: { employer_user_id: user.user_id, employer_company_name: fullName } });
    }

    const token = jwt.sign({ id: user.user_id, role: user.user_role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    sendResponse(res, true, { token, role: user.user_role }, 'User registered successfully.', 201);
  } catch (err) {
    console.error('Register error:', err);
    sendResponse(res, false, null, 'Internal server error.', 500);
  }
};

export const login: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { user_email: email } });
    if (!user || !user.is_active) {
      sendResponse(res, false, null, 'Invalid credentials.', 401);
      return;
    }

    const isMatch = await bcrypt.compare(password, user.user_password);
    if (!isMatch) {
      sendResponse(res, false, null, 'Invalid credentials.', 401);
      return;
    }

    const token = jwt.sign(
      { user_id: user.user_id, user_role: user.user_role }, // minimal payload
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    sendResponse(res, true, { token, role: user.user_role }, 'Login successful.');
  } catch (err) {
    console.error('Login error:', err);
    sendResponse(res, false, null, 'Internal server error.', 500);
  }
};

export const refreshToken: RequestHandler = (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return sendResponse(res, false, null, 'Refresh token is required.', 400);
  }
  try {
    // Use a different secret or the same, but with a longer expiry for refresh tokens
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as any;
    // Optionally, check token type or other claims
    const accessToken = jwt.sign(
      { user_id: decoded.user_id, user_role: decoded.user_role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    return sendResponse(res, true, { token: accessToken }, 'Access token refreshed successfully.');
  } catch (err) {
    return sendResponse(res, false, null, 'Invalid or expired refresh token.', 401);
  }
};
