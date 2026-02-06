import { NextRequest, NextResponse } from "next/server";

const HITEM3D_BASE_URL = "http://api.hitem3d.com";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("X-Hitem3D-Token");
    if (!token) {
      return NextResponse.json(
        { error: "Missing authentication token" },
        { status: 401 }
      );
    }

    const taskId = request.nextUrl.searchParams.get("task_id");
    if (!taskId) {
      return NextResponse.json(
        { error: "Missing task_id parameter" },
        { status: 400 }
      );
    }

    const res = await fetch(
      `${HITEM3D_BASE_URL}/open-api/v1/query-task?task_id=${encodeURIComponent(taskId)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Hitem3D query-task error:", error);
    return NextResponse.json(
      { error: "Failed to query task" },
      { status: 500 }
    );
  }
}
