from dvclive import Live

with Live(save_dvc_exp=True) as live:
    live.log_param("epochs", NUM_EPOCHS)

    for epoch in range(NUM_EPOCHS):
        train_model(...)
        metrics = evaluate_model(...)
        for metric_name, value in metrics.items():
            live.log_metric(metric_name, value)
        live.next_step()