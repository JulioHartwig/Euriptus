import type { EmpresaTipo, Role } from "@prisma/client";

export const EMPRESA_TIPOS: EmpresaTipo[] = [
  "PRODUTOR",
  "LOGISTICA",
  "BENEFICIAMENTO",
  "VENDA",
];

export const EMPRESA_TIPO_LABEL: Record<EmpresaTipo, string> = {
  PRODUTOR: "Produtor",
  LOGISTICA: "Logística",
  BENEFICIAMENTO: "Beneficiamento",
  VENDA: "Venda",
};

export const EMPRESA_TIPO_DESCRICAO: Record<EmpresaTipo, string> = {
  PRODUTOR: "Cultiva e colhe o café.",
  LOGISTICA: "Transporta a produção entre as etapas.",
  BENEFICIAMENTO: "Processa e prepara os grãos.",
  VENDA: "Comercializa o café com o consumidor final.",
};

export const ROLE_LABEL: Record<Role, string> = {
  STUDENT: "Estudante",
  TEACHER: "Professor(a)",
};

/**
 * Capacidade-base de produção/prestação por mês. Melhorias compradas no mercado
 * somam-se a esse valor (`Empresa.capacidadeProducao`).
 */
export const CAPACIDADE_BASE_POR_TIPO: Record<EmpresaTipo, number> = {
  PRODUTOR: 100,
  LOGISTICA: 60,
  BENEFICIAMENTO: 80,
  VENDA: 70,
};

/** Item de catálogo gerado quando a empresa registra produção no mês. */
export const PRODUTO_POR_TIPO: Record<EmpresaTipo, string> = {
  PRODUTOR: "Café em grãos",
  LOGISTICA: "Serviço de transporte",
  BENEFICIAMENTO: "Café beneficiado",
  VENDA: "Café pronto para venda",
};

export function getEmpresaTipoLabel(tipo: EmpresaTipo) {
  return EMPRESA_TIPO_LABEL[tipo];
}
