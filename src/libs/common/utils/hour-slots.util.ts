/**
 * @param startTime - время начала в формате "HH:mm"
 * @param endTime - время конца в формате "HH:mm"
 */
export function getHoursFromToHourEnd(
  startTime: string,
  endTime: string,
): string[] {
  const toMinutes = (time: string): number => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const toTimeStr = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const result: string[] = [];
  let current = toMinutes(startTime);
  const end = toMinutes(endTime);

  const lunchStart = toMinutes('13:00');
  const lunchEnd = toMinutes('14:30');

  while (current <= end) {
    if (current < lunchStart || current > lunchEnd) {
      result.push(toTimeStr(current));
    }
    current += 30;
  }

  return result;
}
