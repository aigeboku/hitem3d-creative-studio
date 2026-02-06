export type Hitem3DTaskStatus =
  | "waiting"
  | "processing"
  | "success"
  | "failed";

export interface Hitem3DSubmitTaskApiResponse {
  taskId: string;
}

export interface Hitem3DQueryTaskApiResponse {
  status: Hitem3DTaskStatus;
  progress: number;
  outputUrl: string | null;
  errorMessage: string | null;
}
