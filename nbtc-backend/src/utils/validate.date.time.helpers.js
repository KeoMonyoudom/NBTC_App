// utils/validateDateTime.js

// Compare dates: YYYY-MM-DD
export function isDateRangeValid(dateFrom, dateTo) {
  if (!dateFrom || !dateTo) return true; // skip on update with missing fields
  return new Date(dateFrom) <= new Date(dateTo);
}

// Compare time: HH:mm
export function isTimeRangeValid(timeFrom, timeTo) {
  if (!timeFrom || !timeTo) return true;
  return timeFrom <= timeTo;
}
