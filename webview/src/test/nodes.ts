export const idToNodeNode = (id: string) =>
  // CSS.escape is needed for weird ids (ex.: :loss, plot/1...)
  (id && document.querySelector(`#${CSS.escape(id)}`)) || null
