import { z } from "zod";

export const QuestionTypeSchema = z.enum(["why", "transfer", "counterexample"]);
export type QuestionType = z.infer<typeof QuestionTypeSchema>;

export const QuestionItemSchema = z.object({
  type: QuestionTypeSchema,
  question: z.string().min(1),
  intent: z.string().min(1),
  targetConcepts: z.array(z.string().min(1)).min(1),
  riskSignals: z.array(z.string().min(1)).default([]),
});

export const QuestionSetSchema = z
  .object({
    questionSetId: z.string().min(1),
    generatedAt: z.string().datetime(),
    promptVersion: z.string().min(1),
    modelVersion: z.string().min(1),
    overallStrategy: z.string().min(1),
    cautionNotes: z.array(z.string()).default([]),
    questions: z.array(QuestionItemSchema).length(3),
  })
  .superRefine((value, ctx) => {
    const types = new Set(value.questions.map((question) => question.type));

    for (const expected of QuestionTypeSchema.options) {
      if (!types.has(expected)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["questions"],
          message: `${expected} 질문이 없습니다.`,
        });
      }
    }
  });

export type QuestionSet = z.infer<typeof QuestionSetSchema>;

export const SemanticAlignmentSchema = z.object({
  status: z.enum(["aligned", "partially_aligned", "misaligned"]),
  evidence: z.array(z.string()),
});

export const ConceptCoverageSchema = z.object({
  coveredConcepts: z.array(z.string()),
  missingConcepts: z.array(z.string()),
});

export const TransferAbilitySchema = z.object({
  status: z.enum(["strong", "partial", "weak", "unclear"]),
  evidence: z.array(z.string()),
});

export const ContradictionItemSchema = z.object({
  submissionClaim: z.string(),
  answerClaim: z.string(),
  explanation: z.string(),
});

export const ContradictionCheckSchema = z.object({
  status: z.enum(["none", "minor", "major"]),
  contradictions: z.array(ContradictionItemSchema),
});

export const AnalysisClassificationSchema = z.enum([
  "sufficient_understanding",
  "surface_memorization",
  "submission_dependency",
  "core_misconception",
  "uncertain",
]);

export const AnalysisReportSchema = z.object({
  analysisId: z.string().min(1),
  generatedAt: z.string().datetime(),
  promptVersion: z.string().min(1),
  modelVersion: z.string().min(1),
  classification: AnalysisClassificationSchema,
  confidenceBand: z.enum(["low", "medium", "high"]),
  semanticAlignment: SemanticAlignmentSchema,
  conceptCoverage: ConceptCoverageSchema,
  transferAbility: TransferAbilitySchema,
  contradictionCheck: ContradictionCheckSchema,
  misconceptionLabels: z.array(z.string()),
  teacherSummary: z.string().min(1),
  reteachingPoints: z.array(z.string()),
  riskFlags: z.array(z.string()),
});

export type AnalysisReport = z.infer<typeof AnalysisReportSchema>;

export const TeacherDecisionSchema = z.object({
  decision: z.enum([
    "approved_understanding",
    "needs_followup",
    "manual_review_required",
  ]),
  notes: z.string(),
  decidedAt: z.string().datetime(),
});

export const VerificationInputSchema = z.object({
  assignmentTitle: z.string().min(1),
  assignmentDescription: z.string().min(1),
  rubricCoreConcepts: z.array(z.string().min(1)).min(1),
  rubricRiskPoints: z.array(z.string().min(1)).default([]),
  submissionText: z.string().min(1),
});

export type VerificationInput = z.infer<typeof VerificationInputSchema>;

export const GenerateQuestionSetRequestSchema = VerificationInputSchema;
export type GenerateQuestionSetRequest = z.infer<
  typeof GenerateQuestionSetRequestSchema
>;

export const StudentAnswerSchema = z.object({
  type: QuestionTypeSchema,
  answer: z.string().min(1),
});

export const AnalyzeUnderstandingRequestSchema = VerificationInputSchema.extend({
  questionSet: QuestionSetSchema,
  studentAnswers: z.array(StudentAnswerSchema).length(3),
});

export type AnalyzeUnderstandingRequest = z.infer<
  typeof AnalyzeUnderstandingRequestSchema
>;
