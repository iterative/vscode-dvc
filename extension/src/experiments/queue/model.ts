export class QueueModel {
  private activeWorkers = 0
  private idleWorkers = 0

  private activeRegexp = /Worker status:\s(\d+)\sactive/
  private idleRegexp = /Worker status:\s\d+\sactive,\s(\d+)\sidle/

  public transformAndSet(status: string) {
    this.activeWorkers = Number(status.match(this.activeRegexp)?.[0] ?? 0)
    this.idleWorkers = Number(status.match(this.idleRegexp)?.[0] ?? 0)
  }

  public getWorkerStatus() {
    return { active: this.activeWorkers, idle: this.idleWorkers }
  }
}
