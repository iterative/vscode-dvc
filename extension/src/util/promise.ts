import { delay } from './time'
import { Logger } from '../common/logger'

export const retryUntilAllResolved = async <T>(
  getNewPromises: () => Promise<unknown>[],
  message: string,
  waitBeforeRetry = 500
): Promise<T> => {
  try {
    const promises = getNewPromises()
    const data = await Promise.all(promises)
    return (data as unknown) as T
  } catch (e) {
    Logger.error(`${message} failed with ${e} retrying...`)
    await delay(waitBeforeRetry)
    return retryUntilAllResolved(getNewPromises, message, waitBeforeRetry * 2)
  }
}
