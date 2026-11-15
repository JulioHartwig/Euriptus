import { cache } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/server/auth/options";
import { findUserById } from "@/server/repositories/user-repository";

/**
 * Sempre busca o usuário atual no banco. A sessão guarda apenas ids e papel;
 * dados exibidos (nome da empresa, saldo) precisam estar atualizados.
 * `cache` evita consultas repetidas dentro da mesma requisição.
 */
export const getSessionUser = cache(async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  return findUserById(session.user.id);
});

/** Exige autenticação em Server Components (defesa em profundidade). */
export async function requireUser() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

/** Exige papel TEACHER. Estudantes são devolvidos ao painel com aviso. */
export async function requireTeacher() {
  const user = await requireUser();

  if (user.role !== "TEACHER") {
    redirect("/painel?aviso=acesso-negado");
  }

  return user;
}
