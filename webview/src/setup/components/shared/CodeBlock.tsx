import cx from 'classnames'
import React from 'react'
import Highlight, { defaultProps, Language } from 'prism-react-renderer'
import styles from './styles.module.scss'

export interface CodeBlockProps {
  language: Language
  children: string
  inline?: boolean
}

const editorBackground = 'var(--vscode-textCodeBlock-background)'
const editorForeground = 'var(--vscode-editor-foreground)'
const tokenHighlight = 'var(--vscode-editorInfo-foreground)'

const approximateTheme = {
  plain: {
    backgroundColor: editorBackground,
    color: editorForeground
  },
  styles: [
    {
      style: {
        color: tokenHighlight
      },
      types: [
        'char',
        'function',
        'keyword',
        'operator',
        'punctuation',
        'string',
        'variable'
      ]
    }
  ]
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  language,
  children,
  inline
}) => {
  return (
    <Highlight
      {...defaultProps}
      code={children}
      language={language}
      theme={approximateTheme}
    >
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre
          className={cx(className, styles.codeBlock, {
            [styles.codeInline]: inline
          })}
          style={style}
        >
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ key: i, line })}>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ key, token })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  )
}
