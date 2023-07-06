from dvclive.huggingface import DVCLiveCallback

...

 trainer = Trainer(
    model, args,
    train_dataset=train_data,
    eval_dataset=eval_data,
    tokenizer=tokenizer,
    compute_metrics=compute_metrics,
)
trainer.add_callback(DVCLiveCallback(save_dvc_exp=True))
trainer.train()
