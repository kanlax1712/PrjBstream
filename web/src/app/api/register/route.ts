import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { promises as fs } from "fs";
import path from "path";

const uploadDir = path.join(process.cwd(), "public", "uploads", "profiles");

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6),
  age: z.number().min(13).max(120).optional(),
  gender: z.string().optional(),
  location: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
});

async function saveProfileImage(file: File): Promise<string> {
  await fs.mkdir(uploadDir, { recursive: true });
  const ext = path.extname(file.name) || ".jpg";
  const filename = `profile-${Date.now()}${ext}`;
  const filepath = path.join(uploadDir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filepath, buffer);
  return `/uploads/profiles/${filename}`;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");
    const age = formData.get("age");
    const gender = formData.get("gender");
    const location = formData.get("location");
    const country = formData.get("country");
    const city = formData.get("city");
    const profilePhoto = formData.get("profilePhoto");

    // Helper to clean string values
    const cleanString = (value: FormDataEntryValue | null): string | undefined => {
      if (!value) return undefined;
      const str = String(value).trim();
      return str && str !== "," && str !== "Unknown" ? str : undefined;
    };

    const fields = {
      name: String(name),
      email: String(email),
      password: String(password),
      age: age ? Number(age) : undefined,
      gender: cleanString(gender),
      location: cleanString(location),
      country: cleanString(country),
      city: cleanString(city),
    };

    const parsed = registerSchema.safeParse(fields);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message ?? "Invalid data",
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "Email already registered" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hash(parsed.data.password, 10);

    // Handle profile photo
    let imageUrl: string | undefined;
    if (profilePhoto instanceof File && profilePhoto.size > 0) {
      try {
        imageUrl = await saveProfileImage(profilePhoto);
      } catch (err) {
        console.error("Profile photo upload failed:", err);
      }
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        image: imageUrl,
        age: parsed.data.age,
        gender: parsed.data.gender,
        location: parsed.data.location,
        country: parsed.data.country,
        city: parsed.data.city,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Account created successfully!",
      userId: user.id,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Registration failed",
      },
      { status: 500 }
    );
  }
}

