export const formatExpiryDate = (expiryDate: Date): string => {
  if (!expiryDate) {
    return '';
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(expiryDate));
};
