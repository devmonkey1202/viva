import "server-only";

import type {
  AnalysisReport,
  AnalyzeUnderstandingStoredRequest,
  GenerateQuestionSetRequest,
  TeacherDecisionInput,
  VerificationRecord,
} from "@/lib/schemas";
import {
  createVerificationRecordFromFile,
  exportVerificationsAsCsvFromFile,
  exportVerificationsAsJsonFromFile,
  getVerificationRecordFromFile,
  getOperatorSummaryFromFile,
  listVerificationRecordsFromFile,
  saveAnalysisForVerificationFromFile,
  saveTeacherDecisionForVerificationFromFile,
} from "@/lib/verification-store-file";
import {
  createVerificationRecordFromNeon,
  exportVerificationsAsCsvFromNeon,
  exportVerificationsAsJsonFromNeon,
  getVerificationRecordFromNeon,
  getOperatorSummaryFromNeon,
  listVerificationRecordsFromNeon,
  saveAnalysisForVerificationFromNeon,
  saveTeacherDecisionForVerificationFromNeon,
} from "@/lib/verification-store-neon";

const hasDatabaseUrl = () => Boolean(process.env.DATABASE_URL?.trim());

const createVerificationRecordImpl = (
  input: GenerateQuestionSetRequest,
  questionSet: VerificationRecord["questionSet"],
) =>
  hasDatabaseUrl()
    ? createVerificationRecordFromNeon(input, questionSet)
    : createVerificationRecordFromFile(input, questionSet);

const saveAnalysisForVerificationImpl = (
  input: AnalyzeUnderstandingStoredRequest,
  analysisReport: AnalysisReport,
) =>
  hasDatabaseUrl()
    ? saveAnalysisForVerificationFromNeon(input, analysisReport)
    : saveAnalysisForVerificationFromFile(input, analysisReport);

const saveTeacherDecisionForVerificationImpl = (
  verificationId: string,
  decisionInput: TeacherDecisionInput,
) =>
  hasDatabaseUrl()
    ? saveTeacherDecisionForVerificationFromNeon(verificationId, decisionInput)
    : saveTeacherDecisionForVerificationFromFile(verificationId, decisionInput);

const getVerificationRecordImpl = (verificationId: string) =>
  hasDatabaseUrl()
    ? getVerificationRecordFromNeon(verificationId)
    : getVerificationRecordFromFile(verificationId);

const listVerificationRecordsImpl = () =>
  hasDatabaseUrl()
    ? listVerificationRecordsFromNeon()
    : listVerificationRecordsFromFile();

const getOperatorSummaryImpl = () =>
  hasDatabaseUrl() ? getOperatorSummaryFromNeon() : getOperatorSummaryFromFile();

const exportVerificationsAsJsonImpl = () =>
  hasDatabaseUrl()
    ? exportVerificationsAsJsonFromNeon()
    : exportVerificationsAsJsonFromFile();

const exportVerificationsAsCsvImpl = () =>
  hasDatabaseUrl()
    ? exportVerificationsAsCsvFromNeon()
    : exportVerificationsAsCsvFromFile();

export const createVerificationRecord = createVerificationRecordImpl;
export const saveAnalysisForVerification = saveAnalysisForVerificationImpl;
export const saveTeacherDecisionForVerification =
  saveTeacherDecisionForVerificationImpl;
export const getVerificationRecord = getVerificationRecordImpl;
export const listVerificationRecords = listVerificationRecordsImpl;
export const getOperatorSummary = getOperatorSummaryImpl;
export const exportVerificationsAsJson = exportVerificationsAsJsonImpl;
export const exportVerificationsAsCsv = exportVerificationsAsCsvImpl;
export const usingManagedDatabase = hasDatabaseUrl;
