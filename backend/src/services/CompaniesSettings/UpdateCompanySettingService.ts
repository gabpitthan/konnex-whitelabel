/** 
 * @TercioSantos-0 |
 * serviço/atualizar 1 configuração da empresa |
 * @params:companyId/column(name)/data
 */
import AppError from "../../errors/AppError";
import CompaniesSettings from "../../models/CompaniesSettings";

type Params = {
  companyId: number,
  column:string,
  data:string
};

const UpdateCompanySettingsService = async ({companyId, column, data}:Params): Promise<any> => {

  if (!Object.prototype.hasOwnProperty.call(CompaniesSettings.rawAttributes, column)) {
    throw new AppError("ERR_INVALID_COMPANY_SETTING", 400);
  }

  const [affectedRows] = await CompaniesSettings.update(
    { [column]: data },
    { where: { companyId } }
  );

  return affectedRows;
};

export default UpdateCompanySettingsService;
