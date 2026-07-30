import moment from "moment";
import { QueryTypes } from "sequelize";

import sequelize from "../../database";

export interface ApiUsageIncrements {
  usedText?: number;
  usedPDF?: number;
  usedImage?: number;
  usedVideo?: number;
  usedOther?: number;
  usedCheckNumber?: number;
}

const usageFields: Array<keyof ApiUsageIncrements> = [
  "usedText",
  "usedPDF",
  "usedImage",
  "usedVideo",
  "usedOther",
  "usedCheckNumber"
];

const RecordApiUsageService = async (
  companyId: number,
  dateUsed: string,
  increments: ApiUsageIncrements
): Promise<void> => {
  const normalized = usageFields.reduce<Record<string, number>>(
    (result, field) => {
      const value = increments[field] || 0;
      if (!Number.isInteger(value) || value < 0 || value > 1000) {
        throw new Error("ERR_API_USAGE_INVALID_INCREMENT");
      }
      result[field] = value;
      return result;
    },
    {}
  );
  const usedOnDay = Object.values(normalized).reduce(
    (total, value) => total + value,
    0
  );

  if (
    !Number.isInteger(companyId) ||
    companyId <= 0 ||
    !moment(dateUsed, "DD/MM/YYYY", true).isValid() ||
    usedOnDay <= 0
  ) {
    throw new Error("ERR_API_USAGE_INVALID_OWNER");
  }

  await sequelize.query(
    `
      INSERT INTO "ApiUsages" (
        "companyId", "dateUsed", "UsedOnDay",
        "usedText", "usedPDF", "usedImage", "usedVideo", "usedOther",
        "usedCheckNumber", "createdAt", "updatedAt"
      )
      VALUES (
        :companyId, :dateUsed, :usedOnDay,
        :usedText, :usedPDF, :usedImage, :usedVideo, :usedOther,
        :usedCheckNumber, NOW(), NOW()
      )
      ON CONFLICT ("companyId", "dateUsed")
        WHERE "dateUsed" IS NOT NULL
      DO UPDATE SET
        "UsedOnDay" = "ApiUsages"."UsedOnDay" + EXCLUDED."UsedOnDay",
        "usedText" = "ApiUsages"."usedText" + EXCLUDED."usedText",
        "usedPDF" = "ApiUsages"."usedPDF" + EXCLUDED."usedPDF",
        "usedImage" = "ApiUsages"."usedImage" + EXCLUDED."usedImage",
        "usedVideo" = "ApiUsages"."usedVideo" + EXCLUDED."usedVideo",
        "usedOther" = "ApiUsages"."usedOther" + EXCLUDED."usedOther",
        "usedCheckNumber" =
          "ApiUsages"."usedCheckNumber" + EXCLUDED."usedCheckNumber",
        "updatedAt" = NOW()
    `,
    {
      replacements: {
        companyId,
        dateUsed,
        usedOnDay,
        ...normalized
      },
      type: QueryTypes.INSERT
    }
  );
};

export default RecordApiUsageService;
