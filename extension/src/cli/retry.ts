import { delay } from '../util/time'
import { Logger } from '../common/logger'

export const retryUntilResolved = async <T>(
  getNewPromise: () => Promise<T>,
  args: string,
  waitBeforeRetry = 500
): Promise<T> => {
  try {
    return await getNewPromise()
  } catch (e: unknown) {
    Logger.error(`${args} failed with ${(e as Error).message} retrying...`)

    await delay(waitBeforeRetry)
    return retryUntilResolved(getNewPromise, args, waitBeforeRetry * 2)
  }
}
