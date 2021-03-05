"""Download training and test data."""
import torchvision


def download():
    torchvision.datasets.MNIST("data", download=True)


if __name__ == "__main__":
    download()
