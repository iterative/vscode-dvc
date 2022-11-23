import { IPageDecorator, PageDecorator } from 'wdio-vscode-service'
import { BaseWebview } from './baseWebview'
import { plots } from './locators'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PlotsWebview extends IPageDecorator<typeof plots> {}

@PageDecorator(plots)
export class PlotsWebview extends BaseWebview {
  public async plotNotEmpty(plot: WebdriverIO.Element) {
    return (
      (await this.plotHasBars(plot)) ||
      (await this.plotHasLines(plot)) ||
      (await this.plotHasPoints(plot)) ||
      (await this.plotHasRects(plot))
    )
  }

  public async getTitle(plot: WebdriverIO.Element) {
    const element = await plot.$('[aria-roledescription="title"]')
    return element.getAttribute('aria-label')
  }

  private async plotHasBars(plot: WebdriverIO.Element) {
    return (await plot.$$('[aria-roledescription="bar"]').length) > 0
  }

  private async plotHasLines(plot: WebdriverIO.Element) {
    return (await plot.$$('[aria-roledescription="line mark"]').length) > 0
  }

  private async plotHasPoints(plot: WebdriverIO.Element) {
    return (await plot.$$('[aria-roledescription="point"]').length) > 0
  }

  private async plotHasRects(plot: WebdriverIO.Element) {
    return (await plot.$$('[aria-roledescription="rect mark"]').length) > 0
  }
}
