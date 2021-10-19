import { delay } from '../util/time'
import { Logger } from '../common/logger'

export const retry = async <T>(
  getNewPromise: () => Promise<T>,
  args: string,
  waitBeforeRetry = 500
): Promise<T> => {
  try {
    return await getNewPromise()
  } catch (e: unknown) {
    const errorMessage = (e as Error).message
    Logger.error(`${args} failed with ${errorMessage} retrying...`)

    await delay(waitBeforeRetry)
    return retry(getNewPromise, args, waitBeforeRetry * 2)
  }
}
