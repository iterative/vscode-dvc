export const isStringInEnum = (s: string, E: Record<string, string>) =>
  Object.values(E).includes(s)
