import React from 'react'
import { Button } from '../../shared/components/button/Button'
import { EmptyState } from '../../shared/components/emptyState/EmptyState'

// Needs to be aware of
// 1. Current Python path
// 2. If global state "DVC & DVCLive can be auto-installed as user Python packages"
// 2. If Python extension is available / used (remove Select Python Interpreter button)
// 3. "(Auto)" needs some kind of explanation => maybe a tooltip

export const CliUnavailable: React.FC = () => {
  return (
    <EmptyState>
      <div>
        <h1>DVC is currently unavailable</h1>
        <p>DVC & DVCLive can be auto-installed at .env (Auto)</p>
        <Button onClick={() => undefined} text="Install" />
        <p>To update the install location or locate DVC</p>
        <Button onClick={() => undefined} text="Setup The Workspace" />
        <Button
          isNested={true}
          appearance="secondary"
          onClick={() => undefined}
          text="Select Python Interpreter"
        />
      </div>
    </EmptyState>
  )
}
