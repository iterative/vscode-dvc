import sys
import os
import pickle
import numpy as np
import yaml
from sklearn.ensemble import RandomForestClassifier

params = yaml.safe_load(open('params.yaml'))['train']

if len(sys.argv) != 3:
    sys.stderr.write('Arguments error. Usage:\n')
    sys.stderr.write('\tpython train.py features model\n')
    sys.exit(1)

input = sys.argv[1]
output = sys.argv[2]
seed = params['seed']
n_est = params['n_est']
min_split = params['min_split']

with open(os.path.join(input, 'train.pkl'), 'rb') as fd:
    matrix = pickle.load(fd)

labels = np.squeeze(matrix[:, 1].toarray())
x = matrix[:, 2:]

sys.stderr.write('Input matrix size {}\n'.format(matrix.shape))
sys.stderr.write('X matrix size {}\n'.format(x.shape))
sys.stderr.write('Y matrix size {}\n'.format(labels.shape))

clf = RandomForestClassifier(
    n_estimators=n_est,
    min_samples_split=min_split,
    n_jobs=2,
    random_state=seed
)

clf.fit(x, labels)

with open(output, 'wb') as fd:
    pickle.dump(clf, fd)
