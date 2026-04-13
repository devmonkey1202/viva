import "server-only";

import type {
  AnalysisReport,
  AnalyzeSubmissionRequest,
  GenerateQuestionSetRequest,
  TeacherDecisionInput,
  StudentAccessState,
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
  setStudentAccessForVerificationFromFile,
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
  setStudentAccessForVerificationFromNeon,
  saveTeacherDecisionForVerificationFromNeon,
} from "@/lib/verification-store-neon";
import { getRuntimeConfig } from "@/lib/runtime-config";

const hasDatabaseUrl = () => getRuntimeConfig().managedDatabase;

const createVerificationRecordImpl = (
  input: GenerateQuestionSetRequest,
  questionSet: VerificationRecord["questionSet"],
) =>
  hasDatabaseUrl()
    ? createVerificationRecordFromNeon(input, questionSet)
    : createVerificationRecordFromFile(input, questionSet);

const saveAnalysisForVerificationImpl = (
  input: AnalyzeSubmissionRequest,
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

const setStudentAccessForVerificationImpl = (
  verificationId: string,
  state: StudentAccessState,
) =>
  hasDatabaseUrl()
    ? setStudentAccessForVerificationFromNeon(verificationId, state)
    : setStudentAccessForVerificationFromFile(verificationId, state);

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

const exportVerificationsAsJsonImpl = (verificationId?: string) =>
  hasDatabaseUrl()
    ? exportVerificationsAsJsonFromNeon(verificationId)
    : exportVerificationsAsJsonFromFile(verificationId);

const exportVerificationsAsCsvImpl = (verificationId?: string) =>
  hasDatabaseUrl()
    ? exportVerificationsAsCsvFromNeon(verificationId)
    : exportVerificationsAsCsvFromFile(verificationId);

export const createVerificationRecord = createVerificationRecordImpl;
export const saveAnalysisForVerification = saveAnalysisForVerificationImpl;
export const saveTeacherDecisionForVerification =
  saveTeacherDecisionForVerificationImpl;
export const setStudentAccessForVerification =
  setStudentAccessForVerificationImpl;
export const getVerificationRecord = getVerificationRecordImpl;
export const listVerificationRecords = listVerificationRecordsImpl;
export const getOperatorSummary = getOperatorSummaryImpl;
export const exportVerificationsAsJson = exportVerificationsAsJsonImpl;
export const exportVerificationsAsCsv = exportVerificationsAsCsvImpl;
export const usingManagedDatabase = hasDatabaseUrl;
