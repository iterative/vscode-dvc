import cx from 'classnames'
import React, { useState } from 'react'
import styles from './styles.module.scss'
import { CodeBlock, CodeBlockProps } from '../codeBlock/CodeBlock'

interface CodeBlockWithTitle extends CodeBlockProps {
  title: string
}

interface CodeSliderProps {
  codeBlocks: CodeBlockWithTitle[]
}

export const CodeSlider: React.FC<CodeSliderProps> = ({ codeBlocks }) => {
  const [active, setActive] = useState(0)

  return (
    <div className={styles.codeSlider}>
      <div>
        {codeBlocks.map((codeBlock, i) => (
          <button
            key={codeBlock.title}
            onClick={() => setActive(i)}
            className={cx(styles.codeBlockButton, {
              [styles.codeBlockButtonActive]: active === i
            })}
          >
            {codeBlock.title}
          </button>
        ))}
      </div>
      <div>
        {codeBlocks.map((codeBlock, i) => (
          <div
            className={cx(styles.codeBlock, {
              [styles.codeBlockActive]: active === i
            })}
            key={codeBlock.title}
          >
            <CodeBlock language={codeBlock.language}>
              {codeBlock.children}
            </CodeBlock>
          </div>
        ))}
      </div>
    </div>
  )
}
