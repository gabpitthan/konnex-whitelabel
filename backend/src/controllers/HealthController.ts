import { Request, Response } from "express";
import GetReadinessService from "../services/HealthServices/GetReadinessService";

export const live = async (
  _req: Request,
  res: Response
): Promise<Response> => res.status(200).json({ status: "ok" });

export const ready = async (
  _req: Request,
  res: Response
): Promise<Response> => {
  const result = await GetReadinessService();
  return res.status(result.ready ? 200 : 503).json(result);
};
