import { Request, Response } from "express";

import FindAllContactService from "../../services/ContactServices/FindAllContactsServices";

/**
 * O tenant vem da credencial de API autenticada (`req.apiConnection`), que é
 * por empresa e revogável.
 *
 * Antes vinha de `req.body.companyId`, sob o middleware `isAuthCompany` — um
 * único `COMPANY_TOKEN` global do ambiente. Na prática era uma chave-mestra:
 * quem tivesse esse segredo lia a agenda de contatos de qualquer empresa
 * apenas trocando um número no corpo da requisição. Num produto whitelabel
 * vendido para vários clientes, um vazamento desse token exporia a base de
 * todos eles de uma vez.
 */
export const show = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.apiConnection;

  const contacts = await FindAllContactService({ companyId });

  return res.json({ count: contacts.length, contacts });
};

export const count = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.apiConnection;

  const contacts = await FindAllContactService({ companyId });

  return res.json({ count: contacts.length });
};
