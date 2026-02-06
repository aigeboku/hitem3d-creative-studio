"use client";

import { useCallback, useRef } from "react";
import { useAppStore } from "@/stores/app-store";
import { HITEM3D_POLLING_INTERVAL } from "@/lib/constants";

export function useHitem3d() {
  const {
    hitem3dUsername,
    hitem3dPassword,
    setTaskId,
    setTaskStatus,
    setTaskProgress,
    setGlbUrl,
  } = useAppStore();

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const tokenRef = useRef<string | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const authenticate = useCallback(async (): Promise<string> => {
    const res = await fetch("/api/hitem3d/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: hitem3dUsername,
        password: hitem3dPassword,
      }),
    });

    const data = await res.json();
    if (!res.ok || data.code !== 0) {
      throw new Error(data.message || "Authentication failed");
    }

    tokenRef.current = data.data.token;
    return data.data.token;
  }, [hitem3dUsername, hitem3dPassword]);

  const submitTask = useCallback(
    async (file: File): Promise<string> => {
      const token = tokenRef.current || (await authenticate());

      const formData = new FormData();
      formData.append("file", file);
      formData.append("generate_type", "glb");

      const res = await fetch("/api/hitem3d/submit-task", {
        method: "POST",
        headers: { "X-Hitem3D-Token": token },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.code !== 0) {
        throw new Error(data.message || "Failed to submit task");
      }

      const taskId = data.data.task_id;
      setTaskId(taskId);
      setTaskStatus("waiting");
      setTaskProgress(0);
      return taskId;
    },
    [authenticate, setTaskId, setTaskStatus, setTaskProgress]
  );

  const pollTask = useCallback(
    (taskId: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        const poll = async () => {
          try {
            const token = tokenRef.current;
            if (!token) {
              reject(new Error("No auth token"));
              return;
            }

            const res = await fetch(
              `/api/hitem3d/query-task?task_id=${encodeURIComponent(taskId)}`,
              { headers: { "X-Hitem3D-Token": token } }
            );

            const data = await res.json();
            if (!res.ok || data.code !== 0) {
              throw new Error(data.message || "Failed to query task");
            }

            const { status, progress, output_url, error_message } = data.data;
            setTaskStatus(status);
            setTaskProgress(progress || 0);

            if (status === "success" && output_url) {
              setGlbUrl(output_url);
              stopPolling();
              resolve(output_url);
            } else if (status === "failed") {
              stopPolling();
              reject(new Error(error_message || "Task failed"));
            } else {
              pollingRef.current = setTimeout(poll, HITEM3D_POLLING_INTERVAL);
            }
          } catch (error) {
            stopPolling();
            reject(error);
          }
        };

        poll();
      });
    },
    [setTaskStatus, setTaskProgress, setGlbUrl, stopPolling]
  );

  const generate3DModel = useCallback(
    async (file: File): Promise<string> => {
      await authenticate();
      const taskId = await submitTask(file);
      const outputUrl = await pollTask(taskId);
      return outputUrl;
    },
    [authenticate, submitTask, pollTask]
  );

  return {
    generate3DModel,
    stopPolling,
  };
}
