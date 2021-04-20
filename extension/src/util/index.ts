import { promisify } from 'util'
import { exec } from 'child_process'

export const execPromise = promisify(exec)

export const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms))

export const isStringInEnum = (s: string, E: Record<string, string>) =>
  Object.values(E).includes(s)

export const definedAndNonEmpty = (
  maybeArray: unknown[] | undefined
): maybeArray is unknown[] => {
  return !!maybeArray?.length
}
