import { UNEXPECTED_ERROR_CODE } from './constants'
import { MaybeConsoleError } from '../error'
import { delay } from '../../util/time'
import { Logger } from '../../common/logger'

const isUnexpectedError = (error: unknown): boolean => {
  return (error as MaybeConsoleError)?.exitCode === UNEXPECTED_ERROR_CODE
}

export const retry = async (
  getNewPromise: () => Promise<string>,
  args: string,
  waitBeforeRetry = 500
): Promise<string> => {
  try {
    return await getNewPromise()
  } catch (error: unknown) {
    const errorMessage = (error as Error).message
    Logger.error(`${args} failed with ${errorMessage} retrying...`)

    if (isUnexpectedError(error)) {
      return ''
    }

    await delay(waitBeforeRetry)
    return retry(getNewPromise, args, waitBeforeRetry * 2)
  }
}
