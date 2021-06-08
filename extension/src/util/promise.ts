import { delay } from './time'
import { Logger } from '../common/logger'

const resolve = (promiseOrPromises: Promise<unknown>[] | Promise<unknown>) => {
  if (Array.isArray(promiseOrPromises)) {
    return Promise.all(promiseOrPromises)
  }
  return promiseOrPromises
}

export const retryUntilAllResolved = async <T>(
  getNewPromiseOrPromises: () => Promise<unknown>[] | Promise<unknown>,
  type: string,
  waitBeforeRetry = 500
): Promise<T> => {
  try {
    const promiseOrPromises = getNewPromiseOrPromises()
    const data = await resolve(promiseOrPromises)
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
