import { EventEmitter } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { getCurrentEpoch } from './util/time'

export class ProcessManager {
  public readonly dispose = Disposable.fn()

  private processes: Record<
    string,
    { process: () => Promise<unknown>; lastStarted?: number }
  > = {}

  private paused = false
  private queued = new Set<string>()
  private locked = new Set<string>()

  constructor(
    processesPaused: EventEmitter<boolean>,
    ...processes: { name: string; process: () => Promise<unknown> }[]
  ) {
    processes.map(({ name, process }) => {
      this.processes[name] = { process }
    })

    const onDidPauseProcesses = processesPaused.event

    this.dispose.track(
      onDidPauseProcesses(paused => {
        this.paused = paused
        if (!this.paused) {
          return this.runQueued()
        }
      })
    )
  }

  public async run(name: string): Promise<void> {
    if (this.paused) {
      return this.queue(name)
    }

    this.checkCanRun(name)
    const { process, lastStarted } = this.processes[name]

    if (this.shouldDebounce(lastStarted)) {
      return
    }

    if (this.anyOngoing()) {
      return this.queue(name)
    }

    this.lock(name)
    await Promise.all([process(), this.setLastStarted(name)])
    this.unlock(name)

    return this.runQueued()
  }

  public isOngoingOrQueued(name: string) {
    return this.isOngoing(name) || this.isQueued(name)
  }

  private queue(name: string): Promise<void> {
    this.queued.add(name)
    return Promise.resolve()
  }

  private shouldDebounce(lastStarted: number | undefined) {
    return lastStarted && getCurrentEpoch() - lastStarted <= 200
  }

  private setLastStarted(name: string) {
    this.processes[name].lastStarted = getCurrentEpoch()
  }

  private anyOngoing(): boolean {
    return !!this.locked.size
  }

  private runQueued(): Promise<void> {
    const next = this.nextInQueue()
    if (!next) {
      return Promise.resolve()
    }
    this.dequeue(next)
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

  private dequeue(name: string): boolean {
    return this.queued.delete(name)
  }

  private checkCanRun(name: string) {
    if (!this.processes[name]) {
      throw new Error('looking for an item to retry that does not exist')
    }
  }
}
