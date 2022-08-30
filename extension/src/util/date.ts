export const getIsoDate = () => new Date().toISOString().slice(0, 10)

export const isFreeTextDate = (maybeDate?: string): boolean =>
  !!maybeDate?.match(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/)

export const getMidnightOnDateEpoch = (dateString: string): number => {
  const date = new Date(dateString)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}
