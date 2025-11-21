import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'mySecretKeyForJWTTokenGenerationThatShouldBeAtLeast256BitsLong';

export interface JWTPayload {
  sub: string; // userId
  email: string;
  nome: string;
  iat?: number;
  exp?: number;
}

export function validateToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function getUserIdFromToken(token: string): string | null {
  const payload = validateToken(token);
  return payload?.sub || null;
}




