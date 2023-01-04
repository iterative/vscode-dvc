import { window } from 'vscode'
import { Title } from './title'
import { isValidStringInteger } from '../util/number'

export const getInput = (title: Title, value?: string) =>
  window.showInputBox({
    title,
    value
  })

export const getValidInput = (
  title: Title,
  validateInput: (text?: string) => null | string,
  options?: { prompt?: string; value?: string }
) =>
  window.showInputBox({
    prompt: options?.prompt,
    title,
    validateInput,
    value: options?.value
  })

const isValid = (
  input: string | undefined,
  includeZero: boolean | undefined
) => {
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
) => {
  const input = await getValidInput(
    title,
    val => {
      if (isValid(val, includeZero)) {
        return ''
      }

      return `Input needs to be a positive integer${includeZero ? ' or 0' : ''}`
    },
    options
  )

  if (!input) {
    return
  }
  return Number.parseInt(input).toString()
}
