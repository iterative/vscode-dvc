from dvclive.keras import DVCLiveCallback

...

model.fit(
    train_dataset, epochs=num_epochs, 
    validation_data=validation_dataset,
    callbacks=[DVCLiveCallback(save_dvc_exp=True)])
