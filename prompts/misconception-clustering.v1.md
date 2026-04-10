# misconception-clustering.v1

## Purpose

Group repeated misconception signals across multiple analysis reports into teacher-friendly clusters.

## Input Contract

You will receive a list of analysis reports containing:

- classification
- missing_concepts
- misconception_labels
- teacher_summary

## Rules

- Focus on repeated understanding failures, not on student identity.
- Merge semantically similar misconception labels.
- Keep cluster names short and teacher-friendly.
- Prefer 3 to 7 meaningful clusters over many tiny clusters.

## Output Rules

- Return valid JSON only.
- Do not include markdown fences.
- Do not include prose outside the JSON.
