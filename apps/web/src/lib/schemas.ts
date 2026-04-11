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

export const TeacherDecisionStatusSchema = z.enum([
  "approved_understanding",
  "needs_followup",
  "manual_review_required",
]);

export const TeacherDecisionSchema = z.object({
  decision: TeacherDecisionStatusSchema,
  notes: z.string(),
  decidedAt: z.string().datetime(),
});
export type TeacherDecision = z.infer<typeof TeacherDecisionSchema>;

export const TeacherDecisionInputSchema = z.object({
  decision: TeacherDecisionStatusSchema,
  notes: z.string().trim().min(1).max(4000),
});
export type TeacherDecisionInput = z.infer<typeof TeacherDecisionInputSchema>;

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

export const AnalyzeUnderstandingStoredRequestSchema =
  AnalyzeUnderstandingRequestSchema.extend({
    verificationId: z.string().min(1),
  });

export type AnalyzeUnderstandingStoredRequest = z.infer<
  typeof AnalyzeUnderstandingStoredRequestSchema
>;

export const GenerateQuestionSetResponseSchema = z.object({
  verificationId: z.string().min(1),
  questionSet: QuestionSetSchema,
});

export type GenerateQuestionSetResponse = z.infer<
  typeof GenerateQuestionSetResponseSchema
>;

export const AnalyzeUnderstandingResponseSchema = z.object({
  verificationId: z.string().min(1),
  analysisReport: AnalysisReportSchema,
});

export type AnalyzeUnderstandingResponse = z.infer<
  typeof AnalyzeUnderstandingResponseSchema
>;

export const SaveTeacherDecisionRequestSchema = z.object({
  verificationId: z.string().min(1),
  decision: TeacherDecisionInputSchema,
});

export type SaveTeacherDecisionRequest = z.infer<
  typeof SaveTeacherDecisionRequestSchema
>;

export const SaveTeacherDecisionResponseSchema = z.object({
  verificationId: z.string().min(1),
  teacherDecision: TeacherDecisionSchema,
});

export type SaveTeacherDecisionResponse = z.infer<
  typeof SaveTeacherDecisionResponseSchema
>;

export const VerificationActivitySchema = z.object({
  type: z.enum([
    "question_generated",
    "analysis_saved",
    "teacher_decision_saved",
  ]),
  recordedAt: z.string().datetime(),
  message: z.string().min(1),
});

export type VerificationActivity = z.infer<typeof VerificationActivitySchema>;

export const VerificationRecordSchema = VerificationInputSchema.extend({
  verificationId: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  questionSet: QuestionSetSchema,
  studentAnswers: z.array(StudentAnswerSchema).length(3).optional(),
  analysisReport: AnalysisReportSchema.optional(),
  teacherDecision: TeacherDecisionSchema.optional(),
  activity: z.array(VerificationActivitySchema),
});

export type VerificationRecord = z.infer<typeof VerificationRecordSchema>;

export const GetVerificationResponseSchema = z.object({
  verification: VerificationRecordSchema,
});

export type GetVerificationResponse = z.infer<
  typeof GetVerificationResponseSchema
>;

export const OperatorSummaryBucketSchema = z.object({
  label: z.string().min(1),
  count: z.number().int().nonnegative(),
});

export type OperatorSummaryBucket = z.infer<typeof OperatorSummaryBucketSchema>;

export const OperatorRecentVerificationSchema = z.object({
  verificationId: z.string().min(1),
  assignmentTitle: z.string().min(1),
  updatedAt: z.string().datetime(),
  classification: AnalysisClassificationSchema.optional(),
  teacherDecision: TeacherDecisionStatusSchema.optional(),
});

export type OperatorRecentVerification = z.infer<
  typeof OperatorRecentVerificationSchema
>;

export const OperatorSummarySchema = z.object({
  generatedAt: z.string().datetime(),
  totalVerifications: z.number().int().nonnegative(),
  analyzedVerifications: z.number().int().nonnegative(),
  teacherDecisions: z.number().int().nonnegative(),
  classificationCounts: z.array(OperatorSummaryBucketSchema),
  teacherDecisionCounts: z.array(OperatorSummaryBucketSchema),
  topMissingConcepts: z.array(OperatorSummaryBucketSchema),
  topMisconceptions: z.array(OperatorSummaryBucketSchema),
  recentVerifications: z.array(OperatorRecentVerificationSchema),
});

export type OperatorSummary = z.infer<typeof OperatorSummarySchema>;
