export const normalizeDateTime = (dateTime?: string): string => {
  if (!dateTime) return "";
  const date = new Date(dateTime);

  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  };

  const formattedDateTime = date.toLocaleString(undefined, options);

  return formattedDateTime;
};
