export const shouldUseVirtualizedGrid = (
  nbItems: number,
  nbItemsPerRow: number
) => nbItems / nbItemsPerRow > 8 - (nbItemsPerRow - 1)
