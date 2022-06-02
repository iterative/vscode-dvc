import React from 'react'
import ReactDOM from 'react-dom'
import '../shared/style.scss'
import { App } from './components/App'
import '../util/wdyr'
import { store } from './store'
import { Provider } from 'react-redux'

const elem = document.createElement('div')
elem.className = 'react-root'
document.body.append(elem)
ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  elem
)
