import Tag from "../../models/Tag";
import AppError from "../../errors/AppError";

/**
 * Consulta escopada pelo tenant. Sem `companyId` no `where`, qualquer usuario
 * autenticado alcancava o registro de outra empresa por ID — comprovado em
 * 2026-08-07 com duas empresas reais (leitura, alteracao e exclusao).
 */
const TagService = async (id: string | number,
  companyId: number): Promise<Tag> => {
  const tag = await Tag.findByPk(id, { include: [ "contacts"] });

  if (!tag) {
    throw new AppError("ERR_NO_TAG_FOUND", 404);
  }

  return tag;
};

export default TagService;
