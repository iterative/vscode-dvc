from dvclive.keras import DVCLiveCallback

...

model.fit(
  train_dataset, validation_data=validation_dataset,
  callbacks=[DVCLiveCallback(save_dvc_exp=True)])