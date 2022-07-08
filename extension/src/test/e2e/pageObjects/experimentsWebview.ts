import { IPageDecorator, PageDecorator } from 'wdio-vscode-service'
import { BaseWebview } from './baseWebview'
import { experiments } from './locators'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ExperimentsWebview
  extends IPageDecorator<typeof experiments> {}

@PageDecorator(experiments)
export class ExperimentsWebview extends BaseWebview {
  public async expandAllRows() {
    const expandRowButtons = await this.expandRowButton$$
    // eslint-disable-next-line no-console
    console.error('expand buttons', JSON.stringify(expandRowButtons.length))
    // eslint-disable-next-line no-console
    console.error(
      'contract buttons',
      // eslint-disable-next-line unicorn/no-await-expression-member
      JSON.stringify((await this.contractRowButton$$).length)
    )
    for (const button of expandRowButtons) {
      await button.click()
    }
    return expandRowButtons.length === 0
  }
}
