export const formatName = (name: string, isLastName: boolean = false): string => {
  if (!name) return '';

  const trimmed = name.trim();

  if (isLastName) {
    return trimmed.toUpperCase();
  }

  // Proper case for first names
  return trimmed
    .split('-')
    .map(part =>
      part
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
    )
    .join('-');
};

export const generateMeterId = async (lastId: string | null): Promise<string> => {
  if (!lastId) {
    return '000000001';
  }

  const numericId = parseInt(lastId, 10) + 1;
  return numericId.toString().padStart(9, '0');
};

export const truncateAddress = (address: string, maxLength: number = 50): string => {
  if (address.length <= maxLength) return address;
  return address.substring(0, maxLength) + '...';
};
