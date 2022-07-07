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
    for (const button of expandRowButtons) {
      button.click()
    }
    return expandRowButtons.length === 0
  }
}
