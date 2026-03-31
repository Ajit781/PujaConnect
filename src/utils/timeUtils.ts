export const formatTo12Hr = (time24: string | undefined | null): string => {
  if (!time24) return '';

  // If already formatted as 12-hour (contains AM or PM), return as-is
  if (
    time24.toUpperCase().includes('AM') ||
    time24.toUpperCase().includes('PM')
  ) {
    return time24;
  }

  try {
    // Split by ':' and take first two parts (HH and mm)
    const [hoursStr, minutesStr] = time24.split(':');
    let hours = parseInt(hoursStr, 10);
    // Take only first 2 digits of minutes in case of HH:mm:ss
    const minutes = minutesStr ? minutesStr.substring(0, 2) : '00';

    if (isNaN(hours)) return time24;

    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'

    const strTime = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
    return strTime;
  } catch (error) {
    console.error('Error formatting time:', error);
    return time24;
  }
};

/**
 * Converts a 12-hour time string (e.g., "07:30 PM") or 24-hour (e.g., "19:30")
 * to a standard API 24-hour format (HH:mm).
 */
export const formatTo24Hr = (time: string | undefined | null): string => {
  if (!time) return '12:00';

  // If it doesn't contain AM/PM, it might already be 24-hour
  if (
    !time.toUpperCase().includes('AM') &&
    !time.toUpperCase().includes('PM')
  ) {
    // Just ensure it's HH:mm
    return time.substring(0, 5);
  }

  try {
    const [timePart, ampm] = time.trim().split(' ');
    let [hours, minutes] = timePart.split(':');
    let h = parseInt(hours, 10);

    if (ampm.toUpperCase() === 'PM' && h < 12) h += 12;
    if (ampm.toUpperCase() === 'AM' && h === 12) h = 0;

    return `${String(h).padStart(2, '0')}:${minutes}`;
  } catch (error) {
    console.error('Error converting to 24hr:', error);
    return time.substring(0, 5);
  }
};
