import { BasePseudoTerminal } from './base'

export class MultiUsePseudoTerminal extends BasePseudoTerminal {
  public async openCurrentInstance() {
    if (!this.instance) {
      await this.createInstance()
    }
    this.instance?.show(true)
    return this.instance
  }
}
