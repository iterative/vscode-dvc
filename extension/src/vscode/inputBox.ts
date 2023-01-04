import { window } from 'vscode'
import { Title } from './title'

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
      const number = Number(val)

      if (!Number.isInteger(number) || number <= 0) {
        return 'Input needs to be a positive integer'
      }

      return ''
    },
    options
  )

  if (!input) {
    return
  }
  return Number.parseInt(input).toString()
}
