import React, {
  DetailedHTMLProps,
  HTMLAttributes,
  useState,
  useLayoutEffect,
  useCallback
} from 'react'
import { alphaToHex, getThemeValue, ThemeProperty } from '../../../util/styles'

type CSSVariables = DetailedHTMLProps<
  HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
>

export const Theme: React.FC = ({ children }) => {
  const [variables, setVariables] = useState<CSSVariables>({})

  const createCSSVariables = useCallback(() => {
    const ColorsWithOpacity = {
      'editor-background': getThemeValue(ThemeProperty.BACKGROUND_COLOR),
      'editor-foreground': getThemeValue(ThemeProperty.FOREGROUND_COLOR)
    }

    type ColorsWithOpacityKey = keyof typeof ColorsWithOpacity

    const variables: { [key: string]: string } = {}
    for (const key in ColorsWithOpacity) {
      for (let i = 1; i < 9; i++) {
        variables[`--${key}-transparency-${i}`] = alphaToHex(
          ColorsWithOpacity[key as ColorsWithOpacityKey],
          i / 10
        )
      }
    }

    setVariables(variables)
  }, [])

  const createOberver = useCallback(() => {
    const targetNode = document.documentElement
    const config = { attributes: true, childList: false, subtree: false }

    const callback = (mutationsList: MutationRecord[]) => {
      mutationsList.forEach((mutation: MutationRecord) => {
        if (mutation.type === 'attributes') {
          createCSSVariables()
        }
      })
    }
    const observer = new MutationObserver(callback)
    observer.observe(targetNode, config)

    return observer
  }, [createCSSVariables])

  useLayoutEffect(() => {
    createCSSVariables()
    const observer = createOberver()
    return observer.disconnect
  }, [createCSSVariables, createOberver])

  return <div style={variables}>{children}</div>
}
