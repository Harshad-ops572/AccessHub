import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getCurrentUser } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: Please log in to upload files" },
        { status: 401 }
      );
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: "Storage is not configured (BLOB_READ_WRITE_TOKEN is missing). Please paste a URL directly as a fallback." },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Limit to under 5 MB
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File exceeds 5 MB size limit" },
        { status: 400 }
      );
    }

    // Accept only images (png, jpg, webp) and PDFs
    const allowedMimeTypes = [
      "image/png",
      "image/jpeg",
      "image/webp",
      "application/pdf",
    ];
    const extension = file.name.split(".").pop()?.toLowerCase();
    const allowedExtensions = ["png", "jpg", "jpeg", "webp", "pdf"];

    const isMimeAllowed = allowedMimeTypes.includes(file.type);
    const isExtAllowed = extension ? allowedExtensions.includes(extension) : false;

    if (!isMimeAllowed && !isExtAllowed) {
      return NextResponse.json(
        { error: "Invalid file type. Only PNG, JPG, WEBP images and PDF documents are allowed." },
        { status: 400 }
      );
    }

    const blob = await put(file.name, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload file to storage" },
      { status: 500 }
    );
  }
}

