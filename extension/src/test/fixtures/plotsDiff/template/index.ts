import {
  getManyTemplatePlotsWebviewMessage,
  getTemplateWebviewMessage
} from '..'

const data = getTemplateWebviewMessage()

export const manyTemplatePlots = (length: number) =>
  getManyTemplatePlotsWebviewMessage(length)

export default data
