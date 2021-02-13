import { Disposable } from '@hediet/std/disposable'

export function addMessageHandler<TMessageToWebview>(
  handler: (message: TMessageToWebview) => void
): Disposable {
  const listener = (event: MessageEvent) => {
    if (event.source === window) {
      return
    }
    handler(event.data)
  }
  window.addEventListener('message', listener)
  return {
    dispose: () => {
      window.removeEventListener('message', listener)
    }
  }
}
