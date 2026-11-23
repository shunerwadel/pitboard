import { NextResponse } from "next/server";
import { getDriveStatus, syncDriveFolder } from "@/lib/drive";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(await getDriveStatus());
}

export async function POST() {
  const status = await syncDriveFolder();
  return NextResponse.json(status);
}
