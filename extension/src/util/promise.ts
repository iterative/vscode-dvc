import { delay } from './time'
import { joinTruthyItems } from './array'
import { Logger } from '../common/logger'

const getPromises = (
  promiseOrPromises: Promise<unknown> | Promise<unknown>[]
): Promise<unknown>[] => {
  if (!Array.isArray(promiseOrPromises)) {
    return [promiseOrPromises]
  }
  return promiseOrPromises
}

export const retryUntilAllResolved = async <T>(
  getNewPromiseOrPromises: () => Promise<unknown> | Promise<unknown>[],
  type: string,
  waitBeforeRetry = 500
): Promise<T> => {
  const promiseOrPromises = getNewPromiseOrPromises()
  const input = getPromises(promiseOrPromises)
  const allSettled = await Promise.allSettled(input)
  const rejections = joinTruthyItems(
    allSettled
      .filter(settled => settled.status === 'rejected')
      .map(settled => (settled as PromiseRejectedResult).reason),
    ' & '
  )
  if (rejections) {
    Logger.error(`${type} failed with ${rejections} retrying...`)
    await delay(waitBeforeRetry)
    return retryUntilAllResolved(
      getNewPromiseOrPromises,
      type,
      waitBeforeRetry * 2
    )
  }

  const allFulfilled = (allSettled as PromiseFulfilledResult<T>[]).map(
    settled => settled.value
  )

  if (allFulfilled.length === 1) {
    return allFulfilled[0]
  }

  return allFulfilled as unknown as T
}
