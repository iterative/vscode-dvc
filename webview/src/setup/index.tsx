import React from 'react'
import { Provider } from 'react-redux'
import ReactDOM from 'react-dom/client'
import '../shared/styles.scss'
import { App } from './components/App'
import { setupStore } from './store'

const root = ReactDOM.createRoot(document.querySelector('#root') as HTMLElement)
root.render(
  <Provider store={setupStore}>
    <App />
  </Provider>
)
