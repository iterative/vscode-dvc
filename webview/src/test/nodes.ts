export const idToNodeNode = (id: string) =>
  // eslint-disable-next-line unicorn/prefer-query-selector
  (id && document.getElementById(id)) || null
