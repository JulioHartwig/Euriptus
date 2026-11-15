import { compare } from "bcryptjs";

import { findUserForAuthentication } from "@/server/repositories/user-repository";

/**
 * Hash descartável usado quando o e-mail não existe.
 * Mantém o tempo de resposta parecido e evita revelar quais e-mails
 * estão cadastrados (user enumeration por timing).
 */
const DUMMY_HASH = "$2b$12$PnTt50BIexrCqRIvqIKs7.ekSimQmaSdMl/WNxkHolM0OAjv9LsrK";

export async function authenticateUser(email: string, password: string) {
  const user = await findUserForAuthentication(email);
  const hash = user?.passwordHash ?? DUMMY_HASH;

  const passwordMatches = await compare(password, hash);

  if (!user || !passwordMatches) {
    return null;
  }

  return user;
}
