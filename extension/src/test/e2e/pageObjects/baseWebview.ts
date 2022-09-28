import { BasePage, IPageDecorator, PageDecorator } from 'wdio-vscode-service'
import { webview as webviewLocators } from './locators'
import * as locators from './locators'

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
    const webviewContainer = await this.outerFrame$

    await this.outerFrame$.waitForDisplayed()

    await browser.switchToFrame(webviewContainer)
    await this.innerFrame$.waitForDisplayed()
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
