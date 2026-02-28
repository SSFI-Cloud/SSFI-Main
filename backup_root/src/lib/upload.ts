
import { writeFile } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export async function uploadFile(file: File, folder: string = "uploads"): Promise<string | null> {
    if (!file) return null;

    try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Validate file type (basic check)
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
        if (!allowedTypes.includes(file.type)) {
            throw new Error(`Invalid file type: ${file.type}`);
        }

        // Validate size (e.g., 5MB)
        if (file.size > 5 * 1024 * 1024) {
            throw new Error("File size exceeds 5MB limit");
        }

        const originalName = file.name.replace(/[^a-zA-Z0-9.]/g, "_"); // Sanitize
        const filename = `${Date.now()}-${uuidv4()}-${originalName}`;
        const uploadDir = path.join(process.cwd(), "public", folder);
        // Ensure directory exists
        const fs = await import("fs/promises");
        await fs.mkdir(uploadDir, { recursive: true });

        const filepath = path.join(uploadDir, filename);

        await writeFile(filepath, buffer);

        return `/${folder}/${filename}`;
    } catch (error) {
        console.error("File upload error:", error);
        throw error;
    }
}
