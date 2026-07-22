export interface SupabaseUser {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
    picture?: string;
  };
  app_metadata: {
    provider?: string;
    providers?: string[];
  };
}

export interface SupabaseJwtPayload {
  sub: string;
  email: string;
  user_metadata: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
    picture?: string;
  };
  app_metadata: {
    provider?: string;
    providers?: string[];
  };
  aud: string;
  exp: number;
  iat: number;
}
