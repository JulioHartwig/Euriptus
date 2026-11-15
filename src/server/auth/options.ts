import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { loginSchema } from "@/lib/validations/auth";
import { authenticateUser } from "@/server/services/auth-service";

/**
 * Configuração central do NextAuth.
 *
 * Estratégia: JWT (sem tabela de sessão), adequada ao deploy serverless.
 * O token carrega id, role e empresaId para o middleware conseguir proteger
 * rotas sem consultar o banco a cada requisição.
 *
 * Troca futura para Google OAuth:
 * 1. Adicione GoogleProvider em `providers` (as variáveis GOOGLE_CLIENT_ID e
 *    GOOGLE_CLIENT_SECRET já podem ser preparadas no .env).
 * 2. Mantenha o callback `signIn` para localizar o usuário pelo e-mail e
 *    recusar contas que não existam no banco (o cadastro é feito pelo professor).
 * 3. Não é necessário mudar as páginas: a sessão continua em JWT e os campos
 *    id/role/empresaId continuam sendo populados no callback `jwt`.
 * 4. Se contas OAuth forem criadas automaticamente no futuro, será preciso
 *    adicionar um PrismaAdapter e uma tabela Account.
 * 5. Remova o CredentialsProvider apenas quando a migração estiver concluída.
 */
export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8, // 8 horas: cobre um dia de aula sem sessões eternas
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "E-mail e senha",
      credentials: {
        email: { label: "E-mail", type: "email", placeholder: "voce@escola.com" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const user = await authenticateUser(parsed.data.email, parsed.data.password);

        if (!user) {
          return null;
        }

        return {
          id: user.id,
          name: user.nome,
          email: user.email,
          role: user.role,
          empresaId: user.empresaId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // `user` só existe no primeiro login (ou quando a sessão é atualizada).
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.empresaId = user.empresaId;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.empresaId = token.empresaId;
      }

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
