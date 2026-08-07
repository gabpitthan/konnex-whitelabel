import AppError from "../../errors/AppError";
import ContactList from "../../models/ContactList";

interface Data {
  id: number | string;
  name: string;
  companyId: number;
}

/**
 * Consulta escopada pelo tenant. Sem `companyId` no `where`, qualquer usuario
 * autenticado alcancava o registro de outra empresa por ID — comprovado em
 * 2026-08-07 com duas empresas reais (leitura, alteracao e exclusao).
 */
const UpdateService = async (data: Data): Promise<ContactList> => {
  const { id, name, companyId } = data;

  const record = await ContactList.findOne({ where: { id, companyId } });

  if (!record) {
    throw new AppError("ERR_NO_CONTACTLIST_FOUND", 404);
  }

  await record.update({
    name
  });

  return record;
};

export default UpdateService;
