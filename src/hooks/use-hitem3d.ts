"use client";

import { type MutableRefObject, useCallback, useRef } from "react";
import { useAppStore } from "@/stores/app-store";
import { HITEM3D_POLLING_INTERVAL } from "@/lib/constants";
import { useShallow } from "zustand/react/shallow";
import type {
  Hitem3DQueryTaskApiResponse,
  Hitem3DSubmitTaskApiResponse,
} from "@/types/hitem3d";

const SUBMIT_REQUEST_TIMEOUT_MS = 75_000;
const POLL_REQUEST_TIMEOUT_MS = 30_000;
const POLLING_MAX_ATTEMPTS = 120;
const POLLING_MAX_DURATION_MS = 10 * 60_000;

export function useHitem3d() {
  const { setTaskId, setTaskStatus, setTaskProgress, setGlbUrl } = useAppStore(
    useShallow((state) => ({
      setTaskId: state.setTaskId,
      setTaskStatus: state.setTaskStatus,
      setTaskProgress: state.setTaskProgress,
      setGlbUrl: state.setGlbUrl,
    }))
  );

  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeRequestRef = useRef<AbortController | null>(null);
  const cancelledRef = useRef(false);

  const stopPolling = useCallback(() => {
    cancelledRef.current = true;

    if (pollingTimerRef.current) {
      clearTimeout(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }

    if (activeRequestRef.current) {
      activeRequestRef.current.abort();
      activeRequestRef.current = null;
    }
  }, []);

  const submitTask = useCallback(
    async (file: File): Promise<string> => {
      const formData = new FormData();
      formData.append("file", file);

      const data = await fetchJsonWithTimeout<Hitem3DSubmitTaskApiResponse>(
        "/api/hitem3d/submit-task",
        {
          method: "POST",
          body: formData,
        },
        SUBMIT_REQUEST_TIMEOUT_MS,
        activeRequestRef
      );

      if (!data || typeof data.taskId !== "string") {
        throw new Error("Failed to submit task.");
      }

      setTaskId(data.taskId);
      setTaskStatus("waiting");
      setTaskProgress(0);
      return data.taskId;
    },
    [setTaskId, setTaskStatus, setTaskProgress]
  );

  const pollTask = useCallback(
    (taskId: string): Promise<string> => {
      cancelledRef.current = false;

      return new Promise((resolve, reject) => {
        const startedAt = Date.now();
        let attempts = 0;

        const poll = async () => {
          if (cancelledRef.current) {
            reject(new Error("Generation was cancelled."));
            return;
          }

          attempts += 1;
          if (attempts > POLLING_MAX_ATTEMPTS) {
            reject(new Error("Timed out while waiting for 3D generation."));
            return;
          }

          if (Date.now() - startedAt > POLLING_MAX_DURATION_MS) {
            reject(new Error("Timed out while waiting for 3D generation."));
            return;
          }

          try {
            const data = await fetchJsonWithTimeout<Hitem3DQueryTaskApiResponse>(
              `/api/hitem3d/query-task?task_id=${encodeURIComponent(taskId)}`,
              { method: "GET" },
              POLL_REQUEST_TIMEOUT_MS,
              activeRequestRef
            );

            if (!data || typeof data.status !== "string") {
              throw new Error("Invalid task status response.");
            }

            setTaskStatus(data.status);
            setTaskProgress(typeof data.progress === "number" ? data.progress : 0);

            if (data.status === "success" && data.outputUrl) {
              setGlbUrl(data.outputUrl);
              stopPolling();
              resolve(data.outputUrl);
              return;
            }

            if (data.status === "failed") {
              stopPolling();
              reject(new Error(data.errorMessage || "3D generation failed."));
              return;
            }

            const nextDelay = Math.min(
              HITEM3D_POLLING_INTERVAL + attempts * 250,
              8_000
            );
            pollingTimerRef.current = setTimeout(() => {
              void poll();
            }, nextDelay);
          } catch (error) {
            if (cancelledRef.current) {
              reject(new Error("Generation was cancelled."));
              return;
            }

            const message = error instanceof Error ? error.message : "";
            if (message.includes("Timed out") && attempts < POLLING_MAX_ATTEMPTS) {
              pollingTimerRef.current = setTimeout(() => {
                void poll();
              }, HITEM3D_POLLING_INTERVAL);
              return;
            }

            stopPolling();
            reject(error);
          }
        };

        void poll();
      });
    },
    [setTaskStatus, setTaskProgress, setGlbUrl, stopPolling]
  );

  const generate3DModel = useCallback(
    async (file: File): Promise<string> => {
      cancelledRef.current = false;
      const taskId = await submitTask(file);
      return pollTask(taskId);
    },
    [submitTask, pollTask]
  );

  return {
    generate3DModel,
    stopPolling,
  };
}

async function fetchJsonWithTimeout<T>(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  activeRequestRef: MutableRefObject<AbortController | null>
): Promise<T> {
  const controller = new AbortController();
  activeRequestRef.current = controller;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    const payload = (await response.json().catch(() => null)) as
      | T
      | { error?: string }
      | null;

    if (!response.ok) {
      const messageRaw =
        payload && typeof payload === "object" && "error" in payload
          ? payload.error
          : undefined;
      const message = typeof messageRaw === "string" ? messageRaw : undefined;
      throw new Error(message || "Request failed.");
    }

    if (!payload) {
      throw new Error("Empty response.");
    }

    return payload as T;
  } catch (error) {
    if (
      (error instanceof DOMException && error.name === "AbortError") ||
      (error instanceof Error && error.name === "AbortError")
    ) {
      throw new Error("Timed out while contacting the server.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    if (activeRequestRef.current === controller) {
      activeRequestRef.current = null;
    }
  }
}
