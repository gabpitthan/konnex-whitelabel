import ResolveScheduleDispatchOutcome from "../ResolveScheduleDispatchOutcome";

describe("ResolveScheduleDispatchOutcome", () => {
  const completedAt = new Date("2026-08-03T20:00:00Z");

  it("finishes a one-off dispatch", () => {
    expect(ResolveScheduleDispatchOutcome({ sendAt: completedAt }, completedAt))
      .toEqual({ status: "ENVIADA", sentAt: completedAt });
  });

  it("advances a recurring dispatch and safely initializes a null counter", () => {
    expect(ResolveScheduleDispatchOutcome({
      sendAt: "2026-08-03T10:00:00Z",
      intervalo: 1,
      valorIntervalo: 2,
      enviarQuantasVezes: 3,
      contadorEnvio: null
    }, completedAt)).toEqual({
      status: "PENDENTE",
      sendAt: new Date("2026-08-05T10:00:00Z"),
      contadorEnvio: 1
    });
  });

  it("moves weekend occurrences according to the configured business-day rule", () => {
    const base = {
      sendAt: "2026-08-07T10:00:00Z",
      intervalo: 1,
      valorIntervalo: 1,
      enviarQuantasVezes: 2,
      contadorEnvio: 0
    };
    expect(ResolveScheduleDispatchOutcome({ ...base, tipoDias: 5 }, completedAt))
      .toMatchObject({ sendAt: new Date("2026-08-07T10:00:00Z") });
    expect(ResolveScheduleDispatchOutcome({ ...base, tipoDias: 6 }, completedAt))
      .toMatchObject({ sendAt: new Date("2026-08-10T10:00:00Z") });
  });

  it("rejects unknown interval units instead of silently corrupting the date", () => {
    expect(() => ResolveScheduleDispatchOutcome({
      sendAt: completedAt,
      intervalo: 99,
      valorIntervalo: 1,
      enviarQuantasVezes: 2,
      contadorEnvio: 0
    }, completedAt)).toThrow("INVALID_SCHEDULE_INTERVAL");
  });
});
