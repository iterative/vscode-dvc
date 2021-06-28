import { Disposable } from '@hediet/std/disposable'

export class ProcessManager {
  public dispose = Disposable.fn()

  private processes: Record<string, () => Promise<unknown>> = {}
  private queued = new Set<string>()
  private locked = new Set<string>()

  constructor(
    ...processes: { name: string; process: () => Promise<unknown> }[]
  ) {
    processes.map(process => {
      this.processes[process.name] = process.process
    })
  }

  public async run(name: string): Promise<void> {
    this.checkCanRun(name)
    const process = this.processes[name]

    if (this.anyOngoing()) {
      return this.queue(name)
    }

    this.lock(name)
    await process()
    this.unlock(name)

    return this.runQueued()
  }

  public hasProcess(name: string) {
    return this.isOngoing(name) || this.isQueued(name)
  }

  public queue(name: string): Promise<void> {
    this.queued.add(name)
    return Promise.resolve()
  }

  private anyOngoing(): boolean {
    return !!this.locked.size
  }

  private runQueued(): Promise<void> {
    const next = this.nextInQueue()
    if (!next) {
      return Promise.resolve()
    }
    this.deQueue(next)
    return this.run(next)
  }

  private nextInQueue(): string | undefined {
    return this.queued.values().next().value
  }

  private isOngoing(name: string) {
    return this.locked.has(name)
  }

  private isQueued(name: string): boolean {
    return this.queued.has(name)
  }

  private lock(name: string) {
    return this.locked.add(name)
  }

  private unlock(name: string) {
    return this.locked.delete(name)
  }

  private deQueue(name: string): boolean {
    return this.queued.delete(name)
  }

  private checkCanRun(name: string) {
    if (!this.processes[name]) {
      throw new Error('looking for an item to retry that does not exist')
    }
  }
}
