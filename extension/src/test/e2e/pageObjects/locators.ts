export const webview = {
  innerFrame: '#active-frame',
  outerFrame: '.webview.ready'
}

export const experiments = {
  ...webview,
  contractRowButton: 'button[title="Contract Row"]',
  expandRowButton: 'button[title="Expand Row"]',
  row: '[role=row]',
  table: '[role=tree]'
}

export const plots = {
  ...webview,
  vegaVisualization: 'div[aria-label="Vega visualization"]'
}
