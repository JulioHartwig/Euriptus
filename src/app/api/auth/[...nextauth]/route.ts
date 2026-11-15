import NextAuth from "next-auth";

import { authOptions } from "@/server/auth/options";

/**
 * Handler do NextAuth (App Router).
 * Mantém CSRF, cookies e rotas de callback sob responsabilidade da biblioteca.
 */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
