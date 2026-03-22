from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib


def main() -> None:
    parser = argparse.ArgumentParser(description="Predict comment moderation label")
    parser.add_argument("--text", required=True, help="Comment text")
    parser.add_argument("--model", default="models/comment_moderation.joblib")
    args = parser.parse_args()

    bundle = joblib.load(Path(args.model))
    model = bundle["model"]

    text = args.text.strip()
    pred = model.predict([text])[0]

    result = {"text": text, "label": pred}

    if hasattr(model, "predict_proba"):
        probs = model.predict_proba([text])[0]
        classes = model.classes_
        result["scores"] = {
            label: float(score) for label, score in sorted(zip(classes, probs), key=lambda x: x[1], reverse=True)
        }

    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
