import { getConfigValue, setUserConfigValue } from '../vscode/config'
import { ReportLevel, reportWithOptions } from '../vscode/reporting'
import { Response } from '../vscode/response'

export const askToDisableAutoApplyFilters = async (
  title: string,
  option: Response
): Promise<Response | undefined> => {
  const DO_NOT_SHOW_UNABLE_TO_FILTER = 'dvc.doNotShowUnableToFilter'

  if (getConfigValue<boolean>(DO_NOT_SHOW_UNABLE_TO_FILTER)) {
    return
  }

  const response = await reportWithOptions(
    ReportLevel.WARNING,
    title,
    Response.CANCEL,
    option,
    Response.NEVER
  )

  if (!response || response === Response.CANCEL) {
    return Response.CANCEL
  }

  if (response === Response.NEVER) {
    setUserConfigValue(DO_NOT_SHOW_UNABLE_TO_FILTER, true)
  }

  return response
}
