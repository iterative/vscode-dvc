import React from 'react'
import ReactDOM from 'react-dom'
import './style.scss'
import App from './components/App'

const elem = document.createElement('div')
elem.className = 'react-root'
document.body.append(elem)
ReactDOM.render(<App />, elem)
