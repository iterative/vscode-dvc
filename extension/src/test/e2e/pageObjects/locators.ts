export const webview = {
  innerFrame: '#active-frame',
  outerFrame: '.webview.ready'
}

export const experiments = {
  ...webview,
  expandRowButton: 'button[title="Expand Row"]',
  row: '[role=row]',
  table: '[role=table]'
}

export const plots = {
  ...webview,
  vegaVisualization: 'div[aria-label="Vega visualization"]'
}
