export const getDisplayNameFromPath = (path: string) =>
  path.split(':').reverse()[0]

export const getDisplayNameFromImagePath = (path: string) =>
  path.split('/').reverse()[0].split('.')[0]
