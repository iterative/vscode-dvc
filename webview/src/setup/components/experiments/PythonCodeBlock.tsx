import React from 'react'
import { CodeBlock } from '../shared/CodeBlock'

export const PythonCodeBlock = ({ children }: { children: string }) => (
  <CodeBlock language="python">{children}</CodeBlock>
)
