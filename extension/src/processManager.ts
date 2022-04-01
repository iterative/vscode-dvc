import { EventEmitter } from 'vscode'
import { getCurrentEpoch } from './util/time'
import { Disposable } from './class/dispose'

export const DEFAULT_DEBOUNCE_WINDOW_MS = 200

export class ProcessManager extends Disposable {
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
    super()

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
    this.checkCanRun(name)
    const { process, lastStarted } = this.processes[name]

    if (this.shouldDebounce(lastStarted)) {
      return
    }

    if (this.anyOngoing() || this.paused) {
      return this.queue(name)
    }

    this.lock(name)
    await Promise.all([process(), this.setLastStarted(name)])
    this.unlock(name)

    return this.runQueued()
  }

  public async forceRunQueued(): Promise<void> {
    const next = this.getNextFromQueue()
    if (!next) {
      return
    }

    const { process } = this.processes[next]
    await Promise.all([process(), this.setLastStarted(next)])
    return this.forceRunQueued()
  }

  public isOngoingOrQueued(name: string) {
    return this.isOngoing(name) || this.isQueued(name)
  }

  private queue(name: string): Promise<void> {
    this.queued.add(name)
    return Promise.resolve()
  }

  private shouldDebounce(lastStarted: number | undefined) {
    return (
      lastStarted &&
      getCurrentEpoch() - lastStarted < DEFAULT_DEBOUNCE_WINDOW_MS
    )
  }

  private setLastStarted(name: string) {
    this.processes[name].lastStarted = getCurrentEpoch()
  }

  private anyOngoing(): boolean {
    return this.locked.size > 0
  }

  private runQueued(): Promise<void> {
    const next = this.getNextFromQueue()
    if (!next) {
      return Promise.resolve()
    }

    return this.run(next)
  }

  private getNextFromQueue(): string | undefined {
    const next = this.queued.values().next().value
    if (!next) {
      return
    }
    this.queued.delete(next)
    return next
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

  private checkCanRun(name: string) {
    if (!this.processes[name]) {
      throw new Error('looking for an item to retry that does not exist')
    }
  }
}
