import { delay } from './time'
import { Logger } from '../common/logger'

const promiseOrPromiseAll = (
  promiseOrPromises: Promise<unknown> | Promise<unknown>[]
): Promise<unknown> | Promise<unknown[]> => {
  if (!Array.isArray(promiseOrPromises)) {
    return promiseOrPromises
  }
  return Promise.all(promiseOrPromises)
}

export const retryUntilAllResolved = async <T>(
  getNewPromiseOrPromises: () => Promise<unknown> | Promise<unknown>[],
  type: string,
  waitBeforeRetry = 500
): Promise<T> => {
  try {
    const promiseOrPromises = getNewPromiseOrPromises()
    const data = await promiseOrPromiseAll(promiseOrPromises)
    return (data as unknown) as T
  } catch (e) {
    Logger.error(`${type} failed with ${e} retrying...`)
    await delay(waitBeforeRetry)
    return retryUntilAllResolved(
      getNewPromiseOrPromises,
      type,
      waitBeforeRetry * 2
    )
  }
}
