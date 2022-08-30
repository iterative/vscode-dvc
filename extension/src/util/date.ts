export const getIsoDate = () => new Date().toISOString().slice(0, 10)

export const validateTextIsDate = (text?: string): null | string =>
  text?.match(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/)
    ? null
    : 'please enter a valid date of the form yyyy-mm-dd'

export const getMidnightOnDateEpoch = (dateString: string): number => {
  const date = new Date(dateString)
  date.setUTCHours(0, 0, 0, 0)
  return date.getTime()
}
