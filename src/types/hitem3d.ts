export interface Hitem3DAuthRequest {
  username: string;
  password: string;
}

export interface Hitem3DAuthResponse {
  code: number;
  message: string;
  data: {
    token: string;
    expire_time: string;
  };
}

export interface Hitem3DSubmitTaskRequest {
  file: File;
  model_version?: string;
  generate_type?: "glb" | "fbx" | "obj";
}

export interface Hitem3DSubmitTaskResponse {
  code: number;
  message: string;
  data: {
    task_id: string;
  };
}

export type Hitem3DTaskStatus =
  | "waiting"
  | "processing"
  | "success"
  | "failed";

export interface Hitem3DQueryTaskResponse {
  code: number;
  message: string;
  data: {
    task_id: string;
    status: Hitem3DTaskStatus;
    progress: number;
    output_url?: string;
    preview_url?: string;
    error_message?: string;
  };
}

export interface Hitem3DBalanceResponse {
  code: number;
  message: string;
  data: {
    balance: number;
    used: number;
  };
}
