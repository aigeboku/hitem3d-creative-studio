import { NextRequest, NextResponse } from "next/server";

const HITEM3D_BASE_URL = "http://api.hitem3d.com";

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("X-Hitem3D-Token");
    if (!token) {
      return NextResponse.json(
        { error: "Missing authentication token" },
        { status: 401 }
      );
    }

    const formData = await request.formData();

    const res = await fetch(`${HITEM3D_BASE_URL}/open-api/v1/submit-task`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Hitem3D submit-task error:", error);
    return NextResponse.json(
      { error: "Failed to submit task" },
      { status: 500 }
    );
  }
}
