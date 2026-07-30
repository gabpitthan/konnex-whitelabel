import SerializeApiWhatsappService from "../SerializeApiWhatsappService";

describe("SerializeApiWhatsappService", () => {
  it("removes the API credential from HTTP and socket payloads", () => {
    const whatsapp = {
      toJSON: () => ({
        id: 7,
        companyId: 11,
        name: "Primary",
        token: "must-not-leave-the-backend"
      })
    };
    expect(SerializeApiWhatsappService(whatsapp as any)).toEqual({
      id: 7,
      companyId: 11,
      name: "Primary"
    });
  });
});
