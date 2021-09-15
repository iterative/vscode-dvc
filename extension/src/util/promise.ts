import { delay } from './time'
import { Logger } from '../common/logger'

export const retryUntilResolved = async <T>(
  getNewPromise: () => Promise<T>,
  type: string,
  waitBeforeRetry = 500
): Promise<T> => {
  const [settled] = await Promise.allSettled([getNewPromise()])

  if (settled.status === 'rejected') {
    Logger.error(`${type} failed with ${settled.reason} retrying...`)
    await delay(waitBeforeRetry)
    return retryUntilResolved(getNewPromise, type, waitBeforeRetry * 2)
  }

  return settled.value
}
