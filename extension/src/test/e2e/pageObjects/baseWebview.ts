import { BasePage, IPageDecorator, PageDecorator } from 'wdio-vscode-service'
import { browser } from '@wdio/globals'
import { webview as webviewLocators } from './locators.js'
import * as locators from './locators.js'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface BaseWebview extends IPageDecorator<typeof webviewLocators> {}

@PageDecorator(webviewLocators)
export class BaseWebview extends BasePage<
  typeof webviewLocators,
  typeof locators
> {
  public locatorKey: 'webview' | 'experiments' | 'plots'

  constructor(locatorKey: keyof typeof locators) {
    super(locators)
    this.locatorKey = locatorKey
  }

  public async focus() {
    await this.outerFrame$.waitForExist()

    await browser.switchToFrame(await this.outerFrame$)

    await this.innerFrame$.waitForExist()

    const webviewInner = await browser.findElement(
      'css selector',
      this.locators.innerFrame
    )

    return browser.switchToFrame(webviewInner)
  }

  public async unfocus() {
    await browser.switchToFrame(null)
    await browser.switchToFrame(null)
  }
}
