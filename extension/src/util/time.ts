export const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms))

export const getCurrentEpoch = (): number => Date.now()

export class StopWatch {
  private started = getCurrentEpoch()

  public getElapsedTime() {
    return getCurrentEpoch() - this.started
  }

  public reset() {
    this.started = getCurrentEpoch()
  }
}
