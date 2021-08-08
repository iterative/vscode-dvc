export const isStringInEnum = (s: string, E: Record<string, string>) =>
  Object.values(E).includes(s)

export const padNumber = (n: number, size: number) => {
  let str = `${n}`

  while (str.length < size) {
    str = `0${n}`
  }

  return str
}
