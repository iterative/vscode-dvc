import React, { PropsWithChildren } from 'react'
import { CloudVersioningLink } from './CloudVersioningLink'
import { InfoText } from './InfoText'
import { CodeBlock } from '../../../shared/components/codeBlock/CodeBlock'

export const CloudVersioning: React.FC<PropsWithChildren> = ({ children }) => (
  <>
    <InfoText>
      <CloudVersioningLink /> requires {children}
      {'\n'} To enable run:
    </InfoText>
    <CodeBlock language="bash">
      dvc remote modify myremote version_aware true
    </CodeBlock>
  </>
)
