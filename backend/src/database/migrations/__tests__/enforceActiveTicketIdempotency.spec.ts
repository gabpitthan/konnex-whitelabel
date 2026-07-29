import { QueryTypes } from "sequelize";

const migration = require("../20260729170000-enforce-active-ticket-idempotency");

describe("active WhatsApp ticket idempotency migration", () => {
  it("aborts before DDL when duplicate active tickets exist", async () => {
    const query = jest.fn().mockResolvedValueOnce([{ duplicate: true }]);
    const queryInterface = { sequelize: { query } } as any;

    await expect(migration.up(queryInterface)).rejects.toThrow(
      "ACTIVE_TICKET_DUPLICATES_REQUIRE_MANUAL_RECONCILIATION"
    );
    expect(query).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('GROUP BY "companyId", "contactId", "whatsappId"'),
      { type: QueryTypes.SELECT }
    );
  });

  it("creates the tenant-scoped partial unique index after clean checks", async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(undefined);
    const queryInterface = { sequelize: { query } } as any;

    await migration.up(queryInterface);

    expect(query.mock.calls[2][0]).toContain("CREATE UNIQUE INDEX");
    expect(query.mock.calls[2][0]).toContain(
      '("companyId", "contactId", "whatsappId")'
    );
    expect(query.mock.calls[2][0]).toContain("channel = 'whatsapp'");
  });

  it("drops only its own index on rollback", async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    await migration.down({ sequelize: { query } } as any);
    expect(query).toHaveBeenCalledWith(
      'DROP INDEX IF EXISTS "tickets_active_contact_company_whatsapp_unique"'
    );
  });
});
