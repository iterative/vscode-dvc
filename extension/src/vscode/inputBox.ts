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

export const getPositiveIntegerInput = async (
  title: Title,
  options: { prompt: string; value: string }
) => {
  const input = await getValidInput(
    title,
    val => {
      if (isValidStringInteger(val) && Number(val) > 0) {
        return ''
      }

      return 'Input needs to be a positive integer'
    },
    options
  )

  if (!input) {
    return
  }
  return Number.parseInt(input).toString()
}
