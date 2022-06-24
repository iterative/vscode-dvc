import { Meta, Story } from '@storybook/react/types-6-0'
import React from 'react'
import '../shared/style.scss'
import './test-vscode-styles.scss'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { WebviewWrapper } from '../shared/components/webviewWrapper/WebviewWrapper'
import {
  ContextMenu,
  ContextMenuProps
} from '../shared/components/contextMenu/ContextMenu'
import { Icon } from '../shared/components/Icon'
import { MessagesMenu } from '../shared/components/messagesMenu/MessagesMenu'
import { Lines } from '../shared/components/icons'

export default {
  args: {},
  component: ContextMenu,
  title: 'Context Menu'
} as Meta

const Template: Story<ContextMenuProps> = () => {
  return (
    <WebviewWrapper>
      <ContextMenu
        content={
          <MessagesMenu
            options={[
              {
                id: 'apply-to-workspace',
                label: 'Apply to Workspace',
                message: {
                  payload: 'column-id',
                  type: MessageFromWebviewType.APPLY_EXPERIMENT_TO_WORKSPACE
                }
              }
            ]}
          />
        }
      >
        <div>
          <Icon width={15} icon={Lines} />
        </div>
      </ContextMenu>
    </WebviewWrapper>
  )
}

export const WithOptions = Template.bind({})
