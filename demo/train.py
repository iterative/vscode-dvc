"""Model training and evaluation."""
import json
from ruamel.yaml import YAML
import os
import torch
import torch.nn.functional as F
import torchvision
from dvclive import Live
import matplotlib.pyplot as plt
import numpy as np

live = Live()

EPOCHS = 9

class ConvNet(torch.nn.Module):
    """Toy convolutional neural net."""
    def __init__(self):
        super().__init__()
        self.conv1 = torch.nn.Conv2d(1, 8, 3, padding=1)
        self.maxpool1 = torch.nn.MaxPool2d(2)
        self.conv2 = torch.nn.Conv2d(8, 16, 3, padding=1)
        self.dense1 = torch.nn.Linear(16*14*14, 32)
        self.dense2 = torch.nn.Linear(32, 10)

    def forward(self, x):
        x = F.relu(self.conv1(x))
        x = self.maxpool1(x)
        x = F.relu(self.conv2(x))
        x = x.view(-1, 16*14*14)
        x = F.relu(self.dense1(x))
        x = self.dense2(x)
        return x


def transform(dataset):
    """Get inputs and targets from dataset."""
    x = dataset.data.reshape(len(dataset.data), 1, 28, 28)/255
    y = dataset.targets
    return x, y


def train(model, x, y, lr, weight_decay):
    """Train a single epoch."""
    model.train()
    criterion = torch.nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=lr,
                                 weight_decay=weight_decay)
    y_pred = model(x)
    loss = criterion(y_pred, y)
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()


def predict(model, x):
    """Get model prediction scores."""
    model.eval()
    with torch.no_grad():
        y_pred = model(x)
    return y_pred


def write_heatmap(actual,predicted):
    d = 'plots'
    os.makedirs(d,exist_ok=True)
    heatmap, xedges, yedges = np.histogram2d(
      actual, 
      predicted, 
      density=True,
      bins=20
    )
    extent = [xedges[0], xedges[-1], yedges[0], yedges[-1]]

    plt.clf()
    plt.imshow(heatmap.T, extent=extent, origin='lower')
    plt.xlabel('actual')
    plt.ylabel('predicted')
    plt.savefig(os.path.join(d, 'heatmap.png'))


def get_metrics(y, y_pred, y_pred_label):
    """Get loss and accuracy metrics."""
    metrics = {}
    criterion = torch.nn.CrossEntropyLoss()
    metrics["loss"] = criterion(y_pred, y).item()
    metrics["acc"] = (y_pred_label == y).sum().item()/len(y)
    return metrics


def evaluate(model, x, y):
    """Evaluate model and save metrics."""
    scores = predict(model, x)
    _, labels = torch.max(scores, 1)
    actual = [int(v) for v in y]
    predicted = [int(v) for v in labels]
    predictions = [{
                    "actual": int(actual),
                    "predicted": int(predicted)
                   } for actual, predicted in zip(actual, predicted)]
    with open("predictions.json", "w") as f:
        json.dump(predictions, f)

    write_heatmap(actual,predicted)
    metrics = get_metrics(y, scores, labels)

    return metrics


def main():
    """Train model and evaluate on test data."""
    model = ConvNet()
    # Load model.
    if os.path.exists("model.pt"):
        model.load_state_dict(torch.load("model.pt"))
    # Load params.
    yaml = YAML(typ="safe")
    with open("params.yaml") as f:
        params = yaml.load(f)
    torch.manual_seed(params["seed"])
    # Load train and test data.
    mnist_train = torchvision.datasets.MNIST("data", download=True)
    x_train, y_train = transform(mnist_train)
    mnist_test = torchvision.datasets.MNIST("data", download=True, train=False)
    x_test, y_test = transform(mnist_test)
    # Iterate over training epochs.
    for i in range(1, EPOCHS+1):
        train(model, x_train, y_train, params["lr"], params["weight_decay"])
        torch.save(model.state_dict(), "model.pt")
        # Evaluate and checkpoint.
        metrics = evaluate(model, x_test, y_test)
        for k, v in metrics.items():
            live.log(k, v)
        live.next_step()


if __name__ == "__main__":
    main()
