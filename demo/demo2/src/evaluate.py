import sys
import os
import pickle
import json

import sklearn.metrics as metrics

if len(sys.argv) != 6:
    sys.stderr.write('Arguments error. Usage:\n')
    sys.stderr.write('\tpython evaluate.py model features scores prc roc\n')
    sys.exit(1)

model_file = sys.argv[1]
matrix_file = os.path.join(sys.argv[2], 'test.pkl')
scores_file = sys.argv[3]
prc_file = sys.argv[4]
roc_file = sys.argv[5]

with open(model_file, 'rb') as fd:
    model = pickle.load(fd)

with open(matrix_file, 'rb') as fd:
    matrix = pickle.load(fd)

labels = matrix[:, 1].toarray()
x = matrix[:, 2:]

predictions_by_class = model.predict_proba(x)
predictions = predictions_by_class[:, 1]

precision, recall, prc_thresholds = metrics.precision_recall_curve(labels, predictions)
fpr, tpr, roc_thresholds = metrics.roc_curve(labels, predictions)

avg_prec = metrics.average_precision_score(labels, predictions)
roc_auc = metrics.roc_auc_score(labels, predictions)

with open(scores_file, 'w') as fd:
    json.dump({'avg_prec': avg_prec, 'roc_auc': roc_auc}, fd, indent=4)

with open(prc_file, 'w') as fd:
    json.dump({'prc': [{
            'precision': p,
            'recall': r,
            'threshold': t
        } for p, r, t in zip(precision, recall, prc_thresholds)
    ]}, fd, indent=4)

with open(roc_file, 'w') as fd:
    json.dump({'roc': [{
            'fpr': fp,
            'tpr': tp,
            'threshold': t
        } for fp, tp, t in zip(fpr, tpr, roc_thresholds)
    ]}, fd, indent=4)
