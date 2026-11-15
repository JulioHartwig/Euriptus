import type { MetadataRoute } from "next";

/**
 * Aplicação privada: não deve ser indexada por buscadores.
 * O link de acesso é compartilhado pela escola/professor.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
