declare global {
  interface Window {
    webviewData: Record<string, string>
  }
}
window.webviewData = {}
export const vsCodeApi = {
  getState: () => {},
  postMessage: () => {},
  setState: () => {}
}
