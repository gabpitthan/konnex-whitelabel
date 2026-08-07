import { Request, Response, NextFunction } from "express";

import AppError from "../errors/AppError";
import Company from "../models/Company";
import Plan from "../models/Plan";

/**
 * Impõe as flags de funcionalidade do plano da empresa.
 *
 * Antes desta verificação, as flags do plano eram decorativas: existiam na
 * tabela `Plans`, apareciam na tela de planos, e **nenhuma rota as consultava**.
 * Comprovado em 2026-08-07 — uma empresa num plano com `useCampaigns: false`
 * criou uma campanha com HTTP 200.
 *
 * O efeito prático é que quem revende este CRM não consegue vender planos
 * diferenciados: o cliente do plano barato alcança tudo pela API, mesmo quando
 * a interface esconde o menu. Esconder no frontend não é limitar — é sugerir.
 */

export type RecursoDoPlano =
  | "useWhatsapp"
  | "useFacebook"
  | "useInstagram"
  | "useCampaigns"
  | "useSchedules"
  | "useInternalChat"
  | "useExternalApi"
  | "useKanban"
  | "useOpenAi"
  | "useIntegrations";

const NOME_AMIGAVEL: Record<RecursoDoPlano, string> = {
  useWhatsapp: "WhatsApp",
  useFacebook: "Facebook",
  useInstagram: "Instagram",
  useCampaigns: "Campanhas",
  useSchedules: "Agendamentos",
  useInternalChat: "Chat interno",
  useExternalApi: "API externa",
  useKanban: "Kanban",
  useOpenAi: "OpenAI",
  useIntegrations: "Integrações"
};

const requirePlanFeature = (recurso: RecursoDoPlano) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    // O tenant vem sempre da sessão autenticada, nunca do cliente.
    const companyId = req.user?.companyId ?? req.apiConnection?.companyId;

    if (!companyId) {
      throw new AppError("ERR_SESSION_EXPIRED", 401);
    }

    const company = await Company.findByPk(companyId, {
      attributes: ["id", "planId"],
      include: [{ model: Plan, as: "plan", attributes: ["id", recurso] }]
    });

    // Falha fechado: empresa sem plano resolvível não ganha a funcionalidade
    // por omissão.
    if (!company?.plan) {
      throw new AppError("ERR_PLAN_NOT_FOUND", 403);
    }

    if (company.plan[recurso] !== true) {
      throw new AppError(
        `Esta funcionalidade (${NOME_AMIGAVEL[recurso]}) não está incluída no plano contratado.`,
        403
      );
    }

    return next();
  };
};

export default requirePlanFeature;
