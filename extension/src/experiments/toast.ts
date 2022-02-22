import { getConfigValue, setUserConfigValue } from '../vscode/config'
import { ToastLevel, report } from '../vscode/toast'
import { Response } from '../vscode/response'

export const askToDisableAutoApplyFilters = async (
  title: string,
  option: Response
): Promise<Response | undefined> => {
  const DO_NOT_SHOW_UNABLE_TO_FILTER = 'dvc.doNotShowUnableToFilter'

  if (getConfigValue<boolean>(DO_NOT_SHOW_UNABLE_TO_FILTER)) {
    return
  }

  const response = await report(
    ToastLevel.WARNING,
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
