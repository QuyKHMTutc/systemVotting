# Comment Moderation AI (Local Training)

Baseline local training pipeline for comment moderation.

## Goal
Train a local model to classify comments into one of these labels:
- `normal`
- `spam`
- `toxic`
- `off_topic`

This is a baseline, not the final production model. It is designed to:
- train quickly on CPU
- run locally without external APIs
- provide a foundation for later upgrades (PhoBERT/transformers, multi-label moderation, fraud scoring)

## Structure
- `data/comments.csv` — training dataset
- `train.py` — training script
- `predict.py` — inference script
- `requirements.txt` — Python dependencies
- `models/` — saved model artifacts

## Dataset format
CSV columns:
- `text` — comment text
- `label` — one of `normal`, `spam`, `toxic`, `off_topic`

Example:

```csv
text,label
Tôi chọn phương án 2 vì tiết kiệm chi phí hơn,normal
Click link nhận quà miễn phí ngay!!!,spam
Mày ngu thế,toxic
Hôm nay trời đẹp quá,off_topic
```

## Setup
If pip is missing on Ubuntu:

```bash
sudo apt-get update
sudo apt-get install -y python3-pip python3-venv
```

Create a virtual environment and install dependencies:

```bash
cd /home/guyguyclaw/systemVotting/ai
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Train

```bash
cd /home/guyguyclaw/systemVotting/ai
source .venv/bin/activate
python train.py --data data/comments.csv
```

Saved artifacts:
- `models/comment_moderation.joblib`
- `models/metrics.json`

## Predict

```bash
cd /home/guyguyclaw/systemVotting/ai
source .venv/bin/activate
python predict.py --text "Click link nhận quà miễn phí ngay!!!"
```

## Notes
- This baseline uses TF-IDF + Logistic Regression.
- It works best as a first version with small/medium datasets.
- For production, you should add more labeled data and likely move toward:
  - Vietnamese transformer fine-tuning
  - multi-label moderation
  - human review queue for uncertain predictions
