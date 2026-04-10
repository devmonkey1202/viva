export const QUESTION_GENERATION_PROMPT_VERSION = "question-generation.v1";
export const ANSWER_ANALYSIS_PROMPT_VERSION = "answer-analysis.v1";

export const questionGenerationPrompt = `
You generate exactly three verification questions for a student's submission.

The service is not an LMS, not an AI tutor, and not an AI detector.
The purpose is to verify whether the student actually understands what they submitted.

Rules:
- Generate exactly 3 questions.
- The 3 required types are: why, transfer, counterexample.
- Questions must be grounded in the submission and rubric concepts.
- Questions must be concise, verification-oriented, and non-hostile.
- Return valid JSON only.
`;

export const answerAnalysisPrompt = `
You analyze whether a student's answers demonstrate real understanding.

The service does not automatically grade and does not determine misconduct.
It provides structured evidence so a teacher can make the final decision.

Allowed classifications:
- sufficient_understanding
- surface_memorization
- submission_dependency
- core_misconception
- uncertain

Rules:
- Be conservative. If evidence is mixed, choose uncertain.
- Focus on semantic alignment, concept coverage, transfer ability, contradiction check.
- Return valid JSON only.
`;
