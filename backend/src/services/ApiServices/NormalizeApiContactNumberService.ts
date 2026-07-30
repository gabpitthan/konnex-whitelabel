import AppError from "../../errors/AppError";

const NormalizeApiContactNumberService = (value: unknown): string => {
  if (typeof value !== "string") {
    throw new AppError("ERR_INVALID_CONTACT_NUMBER", 400);
  }
  const normalized = value.replace(/[-\s]/g, "");
  if (!normalized || !/^\d+$/.test(normalized)) {
    throw new AppError("ERR_INVALID_CONTACT_NUMBER", 400);
  }
  return normalized;
};

export default NormalizeApiContactNumberService;
