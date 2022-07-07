import { IPageDecorator, PageDecorator } from 'wdio-vscode-service'
import { BaseWebview } from './baseWebview'
import { plots } from './locators'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PlotsWebview extends IPageDecorator<typeof plots> {}

@PageDecorator(plots)
export class PlotsWebview extends BaseWebview {
  public async plotNotEmpty(plot: WebdriverIO.Element) {
    return (await this.plotHasRects(plot)) || (await this.plotHasLines(plot))
  }

  private async plotHasRects(plot: WebdriverIO.Element) {
    return (await plot.$$('[aria-roledescription="rect mark"]').length) > 0
  }

  private async plotHasLines(plot: WebdriverIO.Element) {
    return (await plot.$$('[aria-roledescription="line mark"]').length) > 0
  }
}
