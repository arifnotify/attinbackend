export const getFreshTime = (createdAt: Date): string => {
  const now = new Date();

  const diff = now.getTime() - new Date(createdAt).getTime();

  const minutes = Math.floor(diff / 1000 / 60);

  const days = Math.floor(minutes / 1440);

  const hours = Math.floor((minutes % 1440) / 60);

  const mins = minutes % 60;

  if (days > 0) {
    return `Fresh ${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `Fresh ${hours}h ${mins}m`;
  }

  return `Fresh ${mins}m`;
};
