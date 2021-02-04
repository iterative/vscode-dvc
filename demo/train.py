import tensorflow as tf
import datetime
import yaml
import json
import time
#import neptune
#from neptunecontrib.monitoring.keras import NeptuneMonitor
#import wandb
#from wandb.keras import WandbCallback
from mymodel import create_model
import os
#from elog.keras import ElogCallback
from tensorflow import keras
from tensorflow.keras.callbacks import ModelCheckpoint, Callback
from dvc.api import make_checkpoint

#wandb.init(project="mnist")

weights_file = "model.h5"
summary = "summary.json"

params = yaml.safe_load(open('params.yaml'))
epochs = params['epochs']
log_file = params['log_file']
dropout = params['dropout']
dvc_logs_dir = params['dvc_logs_dir']
lr = params['learning_rate']

logs_subdir = 'logs'

class MyCallback(Callback):
    def __init__(self, file):
        self.file = file
    def on_epoch_end(self, epoch, logs={}):
        self.model.save(self.file)
        json.dump(logs, open(summary, 'w'))
        make_checkpoint()

#neptune.init('dmpetrov/sandbox')
#neptune.create_experiment(name='exp1', params=params)

mnist = tf.keras.datasets.mnist

(x_train, y_train),(x_test, y_test) = mnist.load_data()
x_train, x_test = x_train / 255.0, x_test / 255.0

model = create_model(dropout)
opt = keras.optimizers.Adam(learning_rate=lr)
model.compile(optimizer=opt,
              loss='sparse_categorical_crossentropy',
              metrics=['accuracy'])

if os.path.exists(weights_file):
    model.load_weights(weights_file)

log_dir = "logs/" + datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
tensorboard_callback = tf.keras.callbacks.TensorBoard(log_dir=log_dir, histogram_freq=1)

csv_logger = tf.keras.callbacks.CSVLogger(log_file)

start_real = time.time()
start_process = time.process_time()
history = model.fit(x=x_train,
                    y=y_train,
                    epochs=epochs,
                    validation_data=(x_test, y_test),
                    callbacks=[
                        csv_logger,
                        tensorboard_callback
                        #, NeptuneMonitor()
                        #, WandbCallback()
                        #, ElogCallback()
                        #, ModelCheckpoint(weights_file, monitor='loss',
                        #                    mode='auto', period=1)
                        , MyCallback(weights_file)
                    ])
end_real = time.time()
end_process = time.process_time()

model.save(weights_file)

