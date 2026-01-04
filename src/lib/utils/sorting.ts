// Reusable sorting function for items with order property
interface Orderable {
  order?: number;
  order_index?: number;
}

export const sortByOrder = <T extends Orderable>(items: T[]): T[] => {
  return [...items].sort((a, b) => {
    const orderA = a.order ?? a.order_index ?? 0;
    const orderB = b.order ?? b.order_index ?? 0;
    return orderA - orderB;
  });
};

// Legacy alias for backward compatibility
export const sortProjectsByOrder = sortByOrder;
