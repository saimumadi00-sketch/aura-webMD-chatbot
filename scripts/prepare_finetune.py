"""
Prepare the HeliosBrahma mental health chatbot dataset for OpenAI chat fine-tuning.

Usage:
  python scripts/prepare_finetune.py \
    --output fine_tune_data.jsonl \
    --split train \
    --limit 0

Flags:
  --output   Path to write the JSONL file (default: fine_tune_data.jsonl)
  --split    Dataset split to load (default: train)
  --limit    Optional cap on number of examples (0 means no cap)
  --min-chars Minimum characters required in user/assistant text (default: 4)
  --system   System prompt to prepend to every example

After this script runs, start a fine-tune (example):
  openai api fine_tunes.create -t fine_tune_data.jsonl -m gpt-4o-mini
"""

import argparse
import json
from typing import Any, Iterable, Optional

from datasets import load_dataset  # type: ignore


DATASET_ID = "heliosbrahma/mental_health_chatbot_dataset"
DEFAULT_SYSTEM_PROMPT = (
    "You are a supportive, non-clinical mental health companion. "
    "Be warm, concise, avoid clinical diagnosis, and always suggest seeking professional help if needed."
)


def coerce_text(value: Any) -> Optional[str]:
    """Return a cleaned string or None."""
    if value is None:
        return None
    if isinstance(value, str):
        text = value.strip()
        return text or None
    if isinstance(value, (list, tuple)):
        joined = " ".join(str(x) for x in value if x)
        return joined.strip() or None
    return str(value).strip() or None


def first_nonempty(row: dict, keys: Iterable[str]) -> Optional[str]:
    # Dataset variants use different column names; prefer the first usable text field.
    for key in keys:
        if key in row:
            text = coerce_text(row[key])
            if text:
                return text
    return None


def build_messages(user: str, assistant: str, system_prompt: str) -> dict:
    # One training example contains a system instruction and one user/assistant exchange.
    return {
        "messages": [
          {"role": "system", "content": system_prompt},
          {"role": "user", "content": user},
          {"role": "assistant", "content": assistant},
        ]
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Prepare dataset for OpenAI chat fine-tuning.")
    parser.add_argument("--output", default="fine_tune_data.jsonl", help="Output JSONL path.")
    parser.add_argument("--split", default="train", help="Dataset split to load.")
    parser.add_argument("--limit", type=int, default=0, help="Optional cap on examples (0 = no cap).")
    parser.add_argument("--min-chars", type=int, default=4, help="Minimum characters for user/assistant texts.")
    parser.add_argument(
        "--system",
        default=DEFAULT_SYSTEM_PROMPT,
        help="System prompt to include with every example.",
    )
    args = parser.parse_args()

    ds = load_dataset(DATASET_ID, split=args.split)
    rows = []
    skipped = 0

    # Only accepted examples count toward the limit; empty/short records are skipped.
    for idx, row in enumerate(ds):
        user = first_nonempty(row, ("user", "input", "prompt"))
        assistant = first_nonempty(row, ("bot", "response", "output"))
        if not user or not assistant:
            skipped += 1
            continue
        if len(user) < args.min_chars or len(assistant) < args.min_chars:
            skipped += 1
            continue

        rows.append(build_messages(user, assistant, args.system))

        if args.limit and len(rows) >= args.limit:
            break

    # JSONL stores one independent example per line; retain Unicode rather than ASCII escapes.
    with open(args.output, "w", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")

    print(f"Wrote {len(rows)} examples to {args.output}")
    print(f"Skipped {skipped} rows that were empty or too short")
    if args.limit and len(rows) >= args.limit:
        print("Note: limit reached; increase --limit or set to 0 for full dataset.")


if __name__ == "__main__":
    main()
