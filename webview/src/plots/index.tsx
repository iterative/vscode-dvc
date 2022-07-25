import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import '../shared/style.scss'
import { App } from './components/App'
import '../util/wdyr'
import { plotsStore } from './store'

const root = ReactDOM.createRoot(document.querySelector('#root') as HTMLElement)
root.render(
  <Provider store={plotsStore}>
    <App />
  </Provider>
)
