import { delay } from './time'
import { Logger } from '../common/logger'

export const retryUntilResolved = async <T>(
  getNewPromise: () => Promise<T>,
  type: string,
  waitBeforeRetry = 500
): Promise<T> => {
  try {
    return await getNewPromise()
  } catch (e: unknown) {
    Logger.error(`${type} failed with ${(e as Error).message} retrying...`)

    await delay(waitBeforeRetry)
    return retryUntilResolved(getNewPromise, type, waitBeforeRetry * 2)
  }
}
