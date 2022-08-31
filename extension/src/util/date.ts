export const getIsoDate = () => {
  const dateOperator = new Date()

  const dateWithTZOffset = new Date(dateOperator)
  dateWithTZOffset.setMinutes(
    dateOperator.getMinutes() - dateOperator.getTimezoneOffset()
  )

  return dateWithTZOffset.toISOString().slice(0, 10)
}

export const isFreeTextDate = (maybeDate?: string): boolean =>
  !!maybeDate?.match(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/)

export const standardizeDate = (dateString: string): number => {
  const [yyyy, mm, dd] = dateString
    .slice(0, 10)
    .split('-')
    .map(str => Number.parseInt(str))
  const date = new Date(Date.UTC(yyyy, mm, dd))

  return date.getTime()
}
