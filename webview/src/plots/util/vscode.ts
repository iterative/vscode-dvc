import { InternalVsCodeApi } from '../../shared/api'

declare global {
  function acquireVsCodeApi(): InternalVsCodeApi
}

export const vsCodeApi = acquireVsCodeApi()
