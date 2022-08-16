import { delay } from '../util/time'
import { Logger } from '../common/logger'

const isNonRetryError = (
  errorMessage: string,
  nonRetryErrors: string[]
): boolean => {
  for (const partialErrorMessage of nonRetryErrors) {
    if (errorMessage.includes(partialErrorMessage)) {
      return true
    }
  }
  return false
}

export const retry = async (
  getNewPromise: () => Promise<string>,
  args: string,
  nonRetryErrors: string[],
  waitBeforeRetry = 500
): Promise<string> => {
  try {
    return await getNewPromise()
  } catch (error: unknown) {
    const errorMessage = (error as Error).message
    Logger.error(`${args} failed with ${errorMessage} retrying...`)

    if (isNonRetryError(errorMessage, nonRetryErrors)) {
      return ''
    }

    await delay(waitBeforeRetry)
    return retry(getNewPromise, args, nonRetryErrors, waitBeforeRetry * 2)
  }
}
