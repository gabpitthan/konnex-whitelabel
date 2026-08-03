interface ScheduleRecurrence {
  sendAt: Date | string;
  intervalo?: number | null;
  valorIntervalo?: number | null;
  enviarQuantasVezes?: number | null;
  tipoDias?: number | null;
  contadorEnvio?: number | null;
}

export type ScheduleDispatchOutcome =
  | { status: "ENVIADA"; sentAt: Date }
  | { status: "PENDENTE"; sendAt: Date; contadorEnvio: number };

const isBusinessDay = (date: Date): boolean => {
  const day = date.getDay();
  return day >= 1 && day <= 5;
};

const moveToBusinessDay = (date: Date, direction: -1 | 1): Date => {
  const result = new Date(date);
  do result.setDate(result.getDate() + direction);
  while (!isBusinessDay(result));
  return result;
};

const ResolveScheduleDispatchOutcome = (
  schedule: ScheduleRecurrence,
  completedAt = new Date()
): ScheduleDispatchOutcome => {
  const intervalValue = Number(schedule.valorIntervalo || 0);
  const sentCount = Number(schedule.contadorEnvio || 0);
  const targetCount = Number(schedule.enviarQuantasVezes || 0);

  if (intervalValue <= 0 || sentCount >= targetCount) {
    return { status: "ENVIADA", sentAt: completedAt };
  }

  const next = new Date(schedule.sendAt);
  if (Number.isNaN(next.getTime())) throw new Error("INVALID_SCHEDULE_SEND_AT");

  switch (Number(schedule.intervalo)) {
    case 1:
      next.setDate(next.getDate() + intervalValue);
      break;
    case 2:
      next.setDate(next.getDate() + intervalValue * 7);
      break;
    case 3:
      // Preserve the legacy contract: "months" were represented as 30-day windows.
      next.setDate(next.getDate() + intervalValue * 30);
      break;
    case 4:
      next.setMinutes(next.getMinutes() + intervalValue);
      break;
    default:
      throw new Error("INVALID_SCHEDULE_INTERVAL");
  }

  const adjusted = !isBusinessDay(next) && schedule.tipoDias === 5
    ? moveToBusinessDay(next, -1)
    : !isBusinessDay(next) && schedule.tipoDias === 6
      ? moveToBusinessDay(next, 1)
      : next;

  return {
    status: "PENDENTE",
    sendAt: adjusted,
    contadorEnvio: sentCount + 1
  };
};

export default ResolveScheduleDispatchOutcome;
