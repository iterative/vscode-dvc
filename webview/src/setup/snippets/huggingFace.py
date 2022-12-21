from dvclive.huggingface import DVCLiveCallback

...

trainer.add_callback(DVCLiveCallback(save_dvc_exp=True))
trainer.train()