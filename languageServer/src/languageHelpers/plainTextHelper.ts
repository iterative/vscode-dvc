import { BaseLanguageHelper } from './baseLanguageHelper'

export class PlainTextHelper extends BaseLanguageHelper<string> {
  protected parse(source: string): string | undefined {
    return source
  }

  protected findEnclosingSymbols() {
    return []
  }

  protected getPropertyLocation() {
    return null
  }

  protected toJSON(): unknown {
    return this.rootNode
  }
}
