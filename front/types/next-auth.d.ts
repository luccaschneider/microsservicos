import 'next-auth';
import type { Usuario } from './index';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    user: {
      id: string;
      email: string;
      name?: string | null;
    } & Usuario;
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    token?: string;
    usuario?: Usuario;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    user?: Usuario;
  }
}

