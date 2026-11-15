import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const authenticatedUserSelect = {
  id: true,
  nome: true,
  email: true,
  role: true,
  empresaId: true,
} satisfies Prisma.UserSelect;

const sessionUserSelect = {
  ...authenticatedUserSelect,
  empresa: {
    select: {
      id: true,
      nome: true,
      tipo: true,
      saldo: true,
    },
  },
} satisfies Prisma.UserSelect;

export type AuthenticatedUser = Prisma.UserGetPayload<{
  select: typeof authenticatedUserSelect;
}>;

export type SessionUser = Prisma.UserGetPayload<{
  select: typeof sessionUserSelect;
}>;

/** Usado apenas pela autenticação; inclui o hash da senha. */
export function findUserForAuthentication(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: {
      ...authenticatedUserSelect,
      passwordHash: true,
    },
  });
}

/** Usuário "seguro" (sem hash) com a empresa, usado na sessão e no layout. */
export function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: sessionUserSelect,
  });
}
