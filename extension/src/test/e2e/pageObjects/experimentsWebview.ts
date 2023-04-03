import { IPageDecorator, PageDecorator } from 'wdio-vscode-service'
import { BaseWebview } from './baseWebview.js'
import { experiments } from './locators.js'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ExperimentsWebview
  extends IPageDecorator<typeof experiments> {}

@PageDecorator(experiments)
export class ExperimentsWebview extends BaseWebview {
  public async expandAllRows() {
    const expandRowButtons = await this.expandRowButton$$
    for (const button of expandRowButtons) {
      await button.click()
    }
    return expandRowButtons.length === 0
  }

  public async getExperimentName(row: WebdriverIO.Element) {
    const cells = await row.$$('td')
    for (const cell of cells) {
      const text = await cell.getText()
      const name = text.match(/\[(\w+-\w+)]/)?.[1]

      if (name) {
        return name
      }
    }
  }

  public async getExperimentStep(row: WebdriverIO.Element, name: string) {
    const stepCell = await row.$(
      `td[data-testid="metrics:training/metrics.json:step___${name}"]`
    )
    const text = await stepCell.getText()
    return text ? Number(text) : 0
  }
}
