export interface Employee {
  id: string;
  name: string;
  nameKh: string;
  hired: string;
  gender: string;
  campus: string;
  position: string;
}

export interface Criteria {
  id: number;
  kh: string;
  khDesc: string;
  en: string;
  desc: string;
}

export interface EvaluationScore {
  id: number;
  self?: number;
  super?: number;
}

export interface Evaluation {
  id?: string;
  employeeId: string;
  employeeName: string;
  position: string;
  hiredDate: string;
  campus: string;
  gender: string;
  appraiser: string;
  reviewDate: string;
  criteria: Array<{ id: number; self: number }>;
  superScores: Array<{ id: number; super: number }>;
  totalSelf: number;
  totalSuper: number;
  overallScore: number;
  timestamp: string;
  evaluatorId?: string;
}

export interface SystemUser {
  id: string;
  name: string;
  password: string;
  role: "admin" | "superadmin";
}
