import React from 'react'
import ReactDOM from 'react-dom/client'
import '../shared/styles.scss'
import { App } from './components/App'

const root = ReactDOM.createRoot(document.querySelector('#root') as HTMLElement)
root.render(<App />)
