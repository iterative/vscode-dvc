# Feedback

See something that should be changed? Want to request a new feature? Open
[a GitHub Issue!](https://github.com/iterative/vscode-dvc/issues)

# Development Setup

- All development types require nodejs and yarn, but not all need VS Code.

## Extension Development with VS Code

- Clone this repo with
  `git clone --recurse-submodules https://github.com/iterative/vscode-dvc.git`
  to clone the demo DVC repo with the base project code in one command.
- If you've already cloned the repo, use
  `git submodule update --init --recursive`

### Using VS Code as an Editor

- Open the monorepo root as a project in VS Code

- Run `Tasks: Run Build Task` (Ctrl+Shift+b) to start the extension and webview
  development servers

- Open the test instance of VS Code with `Start Debugging` (f5)

### Editor-agnostic Extension Development

- run the `dev-server` script to start the extension and webview dev servers
  (alternatively, use `extension-dev-server` and `webview-dev-server` to launch
  them individually).
- run the `dev-ui` script to launch VS code in with this plugin in dev mode.

## React Component Development with Storybook

Start Storybook with `yarn storybook` in either the monorepo root or the
`webview` project, and you can develop the React components this plugin uses
without requiring VS Code as a dev environment.

# Resources

Check out the
[Resources page](https://github.com/iterative/vscode-dvc/wiki/Resources) of our
GitHub wiki for a list of relevant docs and related projects.
