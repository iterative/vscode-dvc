import lightning.pytorch as pl
from dvclive.lightning import DVCLiveLogger

...

class LitModule(pl.LightningModule):
    def __init__(self, layer_1_dim=128, learning_rate=1e-2):
        super().__init__()
        # layer_1_dim and learning_rate will be logged by DVCLive
        self.save_hyperparameters()

    def training_step(self, batch, batch_idx):
        metric = ...
        # See Output Format bellow
        self.log("train_metric", metric, on_step=False, on_epoch=True)

dvclive_logger = DVCLiveLogger(save_dvc_exp=True)

model = LitModule()
trainer = pl.Trainer(logger=dvclive_logger)
trainer.fit(model)
