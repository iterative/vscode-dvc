import { IPageDecorator, PageDecorator } from 'wdio-vscode-service'
import { BaseWebview } from './baseWebview'
import { plots } from './locators'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PlotsWebview extends IPageDecorator<typeof plots> {}

@PageDecorator(plots)
export class PlotsWebview extends BaseWebview {}
