export const getCompositeId = (
  id: string,
  branch: string | undefined | null = ''
) => `${id}-${branch}`
