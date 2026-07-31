declare namespace Express {
  export interface Request {
    user: { id: string; profile: string; companyId: number };
    apiConnection: {
      whatsappId: number;
      companyId: number;
      channel: string;
      credentialKind: "legacy" | "digest";
    };
  }
}
