import ContactList from "../../models/ContactList";
import AppError from "../../errors/AppError";

/**
 * Consulta escopada pelo tenant. Sem `companyId` no `where`, qualquer usuario
 * autenticado alcancava o registro de outra empresa por ID — comprovado em
 * 2026-08-07 com duas empresas reais (leitura, alteracao e exclusao).
 */
const ShowService = async (id: string | number,
  companyId: number): Promise<ContactList> => {
  const record = await ContactList.findOne({ where: { id, companyId } });

  if (!record) {
    throw new AppError("ERR_NO_CONTACTLIST_FOUND", 404);
  }

  return record;
};

export default ShowService;
