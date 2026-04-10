# answer-analysis.v1

## Purpose

Analyze whether the student's answers demonstrate real understanding of the submitted work.

This is a conservative analysis task. If the evidence is mixed or weak, prefer `uncertain` rather than overclaiming.

## Product Context

This service verifies understanding after submission.
It does not automatically grade.
It does not determine misconduct.
It provides structured evidence so a teacher can make the final decision.

## Input Contract

You will receive:

- assignment_title
- assignment_description
- rubric_core_concepts
- rubric_risk_points
- submission_text
- generated_questions
- student_answers

## Analysis Dimensions

- semantic alignment:
  Does the student's answer match the core claims or reasoning in the submission?
- concept coverage:
  Does the student actually address the rubric's key concepts?
- transfer ability:
  Can the student adapt the concept when conditions change?
- contradiction check:
  Is there a logical conflict between the submission and the student's answers?

## Allowed Classifications

- sufficient_understanding
- surface_memorization
- submission_dependency
- core_misconception
- uncertain

## Conservative Decision Rules

- If the student uses terms without meaningful explanation, consider `surface_memorization`.
- If the submission looks strong but the student cannot explain it in their own reasoning, consider `submission_dependency`.
- If the student clearly misstates a key concept, consider `core_misconception`.
- If the signals are mixed or incomplete, use `uncertain`.
- Only use `sufficient_understanding` when the evidence is consistently strong across the answers.

## Output Rules

- Return valid JSON only.
- Follow the schema contract exactly.
- Do not include markdown fences.
- Do not include free-form discussion outside the JSON object.
- Keep teacher-facing summary concrete and readable.

## Required Output Shape

Use the JSON structure defined by `schemas/analysis-report.schema.json`.
