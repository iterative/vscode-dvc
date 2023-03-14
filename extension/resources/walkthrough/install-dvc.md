# Install DVC

There are a few [options](https://dvc.org/doc/install) for installing `DVC`.
This extension supports all installation types.

To verify the installation run `dvc -h` in a
[Terminal](command:workbench.action.terminal.new).

If DVC is installed as a global binary or in a Python virtual environment, the
extension would attempt to detect it automatically. If successful, you'll see a
DVC icon like this in the status bar:

<p align="center">
  <img src="images/install-dvc-status-bar-detected.png"
       alt="DVC icon in the status bar" />
</p>

If you see instead the crossed circle icon, click on the icon or follow the
[Setup](command:dvc.showExperimentsSetup) wizard.

> **Note**: The correct Python interpreter must be set for the current workspace
> when relying on the Python extension for auto environment activation.
