import Chat from "../../models/Chat";
import ChatUser from "../../models/ChatUser";
import User from "../../models/User";

interface ChatData {
  id: number;
  companyId: number;
  title?: string;
  users?: any[];
}

export default async function UpdateService(data: ChatData) {
  const { users, companyId } = data;
  // Escopado pelo tenant: `findByPk` alcancava o chat interno de outra empresa.
  const record = await Chat.findOne({
    where: { id: data.id, companyId },
    include: [{ model: ChatUser, as: "users" }]
  });
  const { ownerId } = record;

  await record.update({ title: data.title });

  if (Array.isArray(users)) {
    await ChatUser.destroy({ where: { chatId: record.id } });
    await ChatUser.create({ chatId: record.id, userId: ownerId });
    for (let user of users) {
      if (user.id !== ownerId) {
        await ChatUser.create({ chatId: record.id, userId: user.id });
      }
    }
  }

  await record.reload({
    include: [
      { model: ChatUser, as: "users", include: [{ model: User, as: "user" }] },
      { model: User, as: "owner" }
    ]
  });

  return record;
}
