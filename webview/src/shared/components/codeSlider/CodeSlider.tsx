import {
  VSCodePanels,
  VSCodePanelTab,
  VSCodePanelView
} from '@vscode/webview-ui-toolkit/react'
import React from 'react'
import styles from './styles.module.scss'
import { CodeBlock, CodeBlockProps } from '../codeBlock/CodeBlock'

interface CodeBlockWithTitle extends CodeBlockProps {
  title: string
}

interface CodeSliderProps {
  codeBlocks: CodeBlockWithTitle[]
}

export const CodeSlider: React.FC<CodeSliderProps> = ({ codeBlocks }) => {
  return (
    <div className={styles.codeSlider}>
      <VSCodePanels>
        {codeBlocks.map(codeBlock => (
          <VSCodePanelTab key={`tab-${codeBlock.title}`}>
            {codeBlock.title}
          </VSCodePanelTab>
        ))}
        {codeBlocks.map(codeBlock => (
          <VSCodePanelView key={`view-${codeBlock.title}`}>
            <CodeBlock language={codeBlock.language}>
              {codeBlock.children}
            </CodeBlock>
          </VSCodePanelView>
        ))}
      </VSCodePanels>
    </div>
  )
}
