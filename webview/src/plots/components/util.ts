export const shouldUseVirtualizedGrid = (
  nbItems: number,
  nbItemsPerRow: number
) => nbItems > nbItemsPerRow * 10 - (nbItemsPerRow - 1) * 5
