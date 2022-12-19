from dvclive.lightning import DVCLiveLogger

...

trainer = Trainer(logger=DVCLiveLogger(save_dvc_exp=True))
trainer.fit(model)