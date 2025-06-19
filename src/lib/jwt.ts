import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h'; // Token expires in 24 hours

export interface JWTPayload {
  userId: string;
  name: string;
  role: string;
  email: string;
  [key: string]: any; // Allow additional properties for jose compatibility
}

export const jwtUtils = {
  // Generate JWT token
  generateToken: async (payload: JWTPayload): Promise<string> => {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const token = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(JWT_EXPIRES_IN)
      .sign(secret);
    return token;
  },

  // Verify JWT token
  verifyToken: async (token: string): Promise<JWTPayload | null> => {
    try {
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jose.jwtVerify(token, secret);
      return payload as unknown as JWTPayload;
    } catch (error) {
      console.error('JWT verification failed:', error);
      return null;
    }
  },

  // Decode token without verification (for debugging)
  decodeToken: (token: string): any => {
    try {
      return jose.decodeJwt(token);
    } catch (error) {
      console.error('JWT decode failed:', error);
      return null;
    }
  }
}; 