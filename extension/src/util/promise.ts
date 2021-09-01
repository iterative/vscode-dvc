import { delay } from './time'
import { joinTruthyItems } from './array'
import { Logger } from '../common/logger'

const ensurePromiseArray = <T>(
  promiseOrPromises: Promise<unknown> | Promise<unknown>[]
): Promise<T>[] => {
  if (!Array.isArray(promiseOrPromises)) {
    return [promiseOrPromises] as Promise<T>[]
  }
  return promiseOrPromises as Promise<T>[]
}

const getRejections = <T>(allSettled: PromiseSettledResult<T>[]) =>
  joinTruthyItems(
    allSettled
      .filter(settled => settled.status === 'rejected')
      .map(settled => (settled as PromiseRejectedResult).reason),
    ' & '
  )

const processAllFulfilled = <T>(allSettled: PromiseSettledResult<T>[]): T => {
  const allFulfilled = (allSettled as PromiseFulfilledResult<T>[]).map(
    settled => settled.value
  )

  if (allFulfilled.length === 1) {
    return allFulfilled[0]
  }

  return allFulfilled as unknown as T
}

export const retryUntilAllResolved = async <T>(
  getNewPromiseOrPromises: () => Promise<unknown> | Promise<unknown>[],
  type: string,
  waitBeforeRetry = 500
): Promise<T> => {
  const promiseOrPromises = getNewPromiseOrPromises()
  const promiseArray = ensurePromiseArray<T>(promiseOrPromises)
  const allSettled = await Promise.allSettled<Promise<T>>(promiseArray)

  const rejections = getRejections<T>(allSettled)
  if (rejections) {
    Logger.error(`${type} failed with ${rejections} retrying...`)
    await delay(waitBeforeRetry)
    return retryUntilAllResolved(
      getNewPromiseOrPromises,
      type,
      waitBeforeRetry * 2
    )
  }

  return processAllFulfilled<T>(allSettled)
}
