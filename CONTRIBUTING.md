# Feedback

See something that should be changed? Want to request a new feature? Open
[a GitHub Issue!](https://github.com/iterative/vscode-dvc/issues)

# Development Setup

- All development types require nodejs and yarn, but not all need VS Code.

## Extension Development with VS Code

- Clone this repo with `git clone https://github.com/iterative/vscode-dvc.git`

### Using VS Code as an Editor

- Open the monorepo root as a project in VS Code

- Run `Tasks: Run Build Task` (Ctrl+Shift+b) to start the extension and webview
  development servers (alternatively run `yarn dev-server` from the terminal).

- Open the test instance of VS Code with `Start Debugging` (f5). Note: selecting
  the `Run Extension (Hot Reload + Dev UI for dev-server)` option when running
  the debugger will prevent all other extensions from being loaded into the VS
  code instance. This will improve the performance of VS code but cause certain
  DVC commands to fail.

- To enable formatting on save install the `esbenp.prettier-vscode` extension

### Editor-agnostic Extension Development

- run the `dev-server` script to start the extension and webview dev servers
  (alternatively, use `extension-dev-server` and `webview-dev-server` to launch
  them individually).

- run the `dev-ui` script to launch VS code in with this plugin in dev mode.

### The demo project

- The demo project was initially forked from
  [dvc-checkpoints-mnist](https://github.com/iterative/dvc-checkpoints-mnist/tree/make_checkpoint)

- It is recommended that you create the project's virtual environment with
  Python 3.8 as some dependencies are not yet available for Python 3.9

- Run `yarn setup:venv` from the monorepo root to automatically setup the Python
  virtual environment in the demo project

- Once the environment has been setup you should navigate into the demo folder
  activate the virtual environment and run `dvc pull`.

- In order to run experiments in our demo project we require the Python virtual
  environment to be loaded.

- This will happen automatically IF the `ms-python.python` extension is
  installed within the VS code instance that you are developing against.

## React Component Development with Storybook

Start Storybook with `yarn storybook` in either the monorepo root or the
`webview` project, and you can develop the React components this plugin uses
without requiring VS Code as a dev environment.

# Resources

Check out the
[Resources page](https://github.com/iterative/vscode-dvc/wiki/Resources) of our
GitHub wiki for a list of relevant docs and related projects.
