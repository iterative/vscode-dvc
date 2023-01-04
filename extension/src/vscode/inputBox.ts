import { window } from 'vscode'
import { Title } from './title'
import { isValidStringInteger } from '../util/number'
import { getIsoDate, isFreeTextDate } from '../util/date'

export const getInput = (
  title: Title,
  value?: string
): Thenable<string | undefined> =>
  window.showInputBox({
    title,
    value
  })

const getValidInput = (
  title: Title,
  validateInput: (text?: string) => null | string,
  options?: { prompt?: string; value?: string }
): Thenable<string | undefined> =>
  window.showInputBox({
    prompt: options?.prompt,
    title,
    validateInput,
    value: options?.value
  })

const isPositiveInteger = (
  input: string | undefined,
  includeZero: boolean | undefined
): boolean => {
  if (!isValidStringInteger(input)) {
    return false
  }

  const number = Number(input)

  if (!includeZero) {
    return number > 0
  }
  return number >= 0
}

export const getPositiveIntegerInput = async (
  title: Title,
  options: { prompt: string; value: string },
  includeZero?: boolean
): Promise<string | undefined> => {
  const input = await getValidInput(
    title,
    input => {
      if (isPositiveInteger(input, includeZero)) {
        return ''
      }

      return `please enter a positive integer${includeZero ? ' or 0' : ''}`
    },
    options
  )

  if (!input) {
    return
  }
  return Number.parseInt(input).toString()
}

export const getValidDateInput = (title: Title): Thenable<string | undefined> =>
  getValidInput(
    title,
    (text?: string): null | string =>
      isFreeTextDate(text)
        ? null
        : 'please enter a valid date of the form yyyy-mm-dd',
    { value: getIsoDate() }
  )
