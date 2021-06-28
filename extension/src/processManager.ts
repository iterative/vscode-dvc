import { Disposable } from '@hediet/std/disposable'

export class ProcessManager {
  public dispose = Disposable.fn()

  private processes: Record<string, () => Promise<unknown>> = {}
  private queued = new Set<string>()
  private locked = new Set<string>()

  constructor(...processes: { name: string; func: () => Promise<unknown> }[]) {
    processes.map(process => {
      this.processes[process.name] = process.func
    })
  }

  public async run(name: string) {
    this.can(name)
    const process = this.processes[name]

    if (this.isLocked(name)) {
      return this.queue(name)
    }

    this.lock(name)
    await process()
    this.unlock(name)

    return this.processQueued(name)
  }

  private processQueued(name: string): void {
    if (!this.isQueued(name)) {
      return
    }
    this.deQueue(name)
    this.run(name)
  }

  private isLocked(name: string) {
    return this.locked.has(name)
  }

  private lock(name: string) {
    return this.locked.add(name)
  }

  private unlock(name: string) {
    return this.locked.delete(name)
  }

  private queue(name: string) {
    return this.queued.add(name)
  }

  private isQueued(name: string): boolean {
    return this.queued.has(name)
  }

  private deQueue(name: string): boolean {
    return this.queued.delete(name)
  }

  private can(name: string) {
    if (!this.processes[name]) {
      throw new Error('looking for an item to retry that does not exist')
    }
  }
}
