import { isObject } from "lodash";
import SocketWorker from "./SocketWorker"

export function socketConnection(params) {
  if (!isObject(params)) return null;
  const companyId = Number(params?.user?.companyId);
  const userId = Number(params?.user?.id);
  if (!Number.isInteger(companyId) || companyId <= 0) return null;
  if (!Number.isInteger(userId) || userId <= 0) return null;
  return SocketWorker(companyId, userId);
}
