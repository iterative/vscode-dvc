import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import '../shared/style.scss'
import { App } from './components/App'
import '../util/wdyr'
import { store } from './store'

const elem = document.createElement('div')
elem.className = 'react-root'
document.body.append(elem)
ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  elem
)
