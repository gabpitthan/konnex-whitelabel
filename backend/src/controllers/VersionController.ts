import { Request, Response } from "express";
const packageVersion = require("../../package.json").version;

export const index = async (req: Request, res: Response): Promise<Response> => {
    return res.status(200).json({
        version: packageVersion
    });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
    return res.status(200).json({
        version: packageVersion
    });
};
