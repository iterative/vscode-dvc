# Integrating with the CLI

This extension can support DVC being installed either globally or within some
type of virtual environment.

You will need a DVC project opened within the workspace to see all of the
extension's available features. If you currently do not have a DVC project then
see the `Explore more resources` step for details on how to get started.

Use the workspace setup wizard to set the config options required by your setup.
This can be done via the welcome view underneath the `DVC Tracked` view in the
side bar's explorer view container or `DVC: Setup The Workspace` from the
command palette.

In some situations, like when using [VSCodium](https://vscodium.com/), the
Python extension integration will fail. If this happens and you need to use DVC
from inside a virtual environment, try using the "Yes, and I want to select the
Python interpreter" option to specify a Python interpreter for DVC outside of
the Python extension.

Once you have setup your workspace the rest of the walkthrough will appear.
