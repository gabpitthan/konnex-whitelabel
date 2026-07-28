/** 
 * @TercioSantos-0 |
 * serviço/todas as configurações de 1 empresa |
 * @param:companyId
 */
import AppError from "../../errors/AppError";
import CompaniesSettings from "../../models/CompaniesSettings";

type Params = {
  companyId: any;
  column:string
};

const FindCompanySettingOneService = async ({companyId, column}:Params): Promise<any> => {
    if (!Object.prototype.hasOwnProperty.call(CompaniesSettings.rawAttributes, column)) {
      throw new AppError("ERR_INVALID_COMPANY_SETTING", 400);
    }

    return CompaniesSettings.findAll({
      attributes: [column],
      where: { companyId },
      raw: true
    });
};

export default FindCompanySettingOneService;
