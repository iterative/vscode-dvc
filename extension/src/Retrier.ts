import { Disposable } from '@hediet/std/disposable'

export class Retrier {
  public dispose = Disposable.fn()

  private processNames = new Set<string>()
  private queued = new Set<string>()
  private locked = new Set<string>()

  constructor(...processes: string[]) {
    processes.map(queue => {
      this.processNames.add(queue)
    })
  }

  public isLocked(name: string): boolean {
    this.can(name)

    return !!this.locked.has(name)
  }

  public lock(name: string): boolean {
    this.can(name)

    return !!this.locked.add(name)
  }

  public unlock(name: string): boolean {
    this.can(name)

    return !!this.locked.delete(name)
  }

  public queue(name: string): boolean {
    this.can(name)

    return !!this.queued.add(name)
  }

  public isQueued(name: string): boolean {
    return this.queued.has(name)
  }

  public deQueue(name: string): boolean {
    return this.queued.delete(name)
  }

  private can(name: string) {
    if (!this.processNames.has(name)) {
      throw new Error('looking for a locked item that does not exist')
    }
  }
}
