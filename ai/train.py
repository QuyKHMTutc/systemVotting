from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

ALLOWED_LABELS = {"normal", "spam", "toxic", "off_topic"}


def validate_dataset(df: pd.DataFrame) -> None:
    required = {"text", "label"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Dataset missing columns: {sorted(missing)}")

    bad_labels = sorted(set(df["label"].astype(str)) - ALLOWED_LABELS)
    if bad_labels:
        raise ValueError(f"Unsupported labels found: {bad_labels}")

    if df.empty:
        raise ValueError("Dataset is empty")

    if df["label"].nunique() < 2:
        raise ValueError("Need at least 2 labels to train")


def build_pipeline() -> Pipeline:
    return Pipeline([
        (
            "tfidf",
            TfidfVectorizer(
                lowercase=True,
                ngram_range=(1, 2),
                min_df=1,
                max_features=20000,
                sublinear_tf=True,
            ),
        ),
        (
            "clf",
            LogisticRegression(
                max_iter=2000,
                class_weight="balanced",
                solver="lbfgs"
            ),
        ),
    ])


def main() -> None:
    parser = argparse.ArgumentParser(description="Train comment moderation model")
    parser.add_argument("--data", required=True, help="Path to CSV dataset")
    parser.add_argument("--model-out", default="models/comment_moderation.joblib")
    parser.add_argument("--metrics-out", default="models/metrics.json")
    parser.add_argument("--test-size", type=float, default=0.25)
    parser.add_argument("--random-state", type=int, default=42)
    args = parser.parse_args()

    data_path = Path(args.data)
    model_out = Path(args.model_out)
    metrics_out = Path(args.metrics_out)
    model_out.parent.mkdir(parents=True, exist_ok=True)
    metrics_out.parent.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(data_path)
    df = df.dropna(subset=["text", "label"])
    df["text"] = df["text"].astype(str).str.strip()
    df["label"] = df["label"].astype(str).str.strip()
    df = df[df["text"] != ""]

    validate_dataset(df)

    label_counts = df["label"].value_counts()
    min_label_count = int(label_counts.min())

    pipeline = build_pipeline()

    if len(df) < 20 or min_label_count < 2:
        # Tiny bootstrap dataset: train on all rows and skip holdout evaluation.
        pipeline.fit(df["text"], df["label"])
        accuracy = None
        report = None
        train_samples = int(len(df))
        test_samples = 0
    else:
        X_train, X_test, y_train, y_test = train_test_split(
            df["text"],
            df["label"],
            test_size=args.test_size,
            random_state=args.random_state,
            stratify=df["label"],
        )

        pipeline.fit(X_train, y_train)

        preds = pipeline.predict(X_test)
        accuracy = accuracy_score(y_test, preds)
        report = classification_report(y_test, preds, output_dict=True, zero_division=0)
        train_samples = int(len(X_train))
        test_samples = int(len(X_test))

    joblib.dump({"model": pipeline, "labels": sorted(ALLOWED_LABELS)}, model_out)

    metrics = {
        "accuracy": accuracy,
        "train_samples": train_samples,
        "test_samples": test_samples,
        "labels": sorted(df["label"].unique().tolist()),
        "classification_report": report,
        "note": "holdout evaluation skipped because dataset is too small" if test_samples == 0 else None,
    }
    metrics_out.write_text(json.dumps(metrics, ensure_ascii=False, indent=2), encoding="utf-8")

    print("Training complete")
    print(f"Model saved to: {model_out}")
    print(f"Metrics saved to: {metrics_out}")
    if accuracy is None:
        print("Accuracy: skipped (dataset too small for a proper holdout split)")
    else:
        print(f"Accuracy: {accuracy:.4f}")


if __name__ == "__main__":
    main()
