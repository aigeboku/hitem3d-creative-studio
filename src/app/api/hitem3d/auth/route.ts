import { NextRequest, NextResponse } from "next/server";

const HITEM3D_BASE_URL = "http://api.hitem3d.com";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const res = await fetch(`${HITEM3D_BASE_URL}/open-api/v1/auth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Hitem3D auth error:", error);
    return NextResponse.json(
      { error: "Failed to authenticate with Hitem3D" },
      { status: 500 }
    );
  }
}
