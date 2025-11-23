import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { promises as fs } from "fs";
import path from "path";
import { checkRateLimit, getClientIP, RATE_LIMITS } from "@/lib/security/rate-limit";
import { validatePassword } from "@/lib/security/password";
import { sanitizeEmail, sanitizeName, validateFileUpload } from "@/lib/security/sanitize";

const uploadDir = path.join(process.cwd(), "public", "uploads", "profiles");

// Enhanced validation schema with stricter rules
const registerSchema = z.object({
  name: z.string().min(2).max(100).refine((val) => /^[a-zA-Z0-9\s\-']+$/.test(val), {
    message: "Name can only contain letters, numbers, spaces, hyphens, and apostrophes",
  }),
  email: z.string().email().max(255).toLowerCase(),
  password: z.string().min(8).max(128),
  age: z.number().min(13).max(120).optional(),
  gender: z.enum(["male", "female", "other", "prefer-not-to-say"]).optional(),
  location: z.string().max(255).optional(),
  country: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
});

async function saveProfileImage(file: File): Promise<string> {
  await fs.mkdir(uploadDir, { recursive: true });
  
  // Generate secure filename to prevent path traversal
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const ext = path.extname(file.name).toLowerCase() || ".jpg";
  
  // Validate extension
  const allowedExts = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
  if (!allowedExts.includes(ext)) {
    throw new Error("Invalid file extension");
  }
  
  const filename = `profile-${timestamp}-${random}${ext}`;
  const filepath = path.join(uploadDir, filename);
  
  // Additional security: ensure path is within upload directory
  const resolvedPath = path.resolve(filepath);
  const resolvedDir = path.resolve(uploadDir);
  if (!resolvedPath.startsWith(resolvedDir)) {
    throw new Error("Invalid file path");
  }
  
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filepath, buffer);
  return `/uploads/profiles/${filename}`;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(clientIP, RATE_LIMITS.REGISTER);
    
    if (rateLimit.limited) {
      return NextResponse.json(
        {
          success: false,
          message: `Too many registration attempts. Please try again after ${Math.ceil((rateLimit.resetTime - Date.now()) / 60000)} minutes.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)),
            "X-RateLimit-Limit": String(RATE_LIMITS.REGISTER.maxRequests),
            "X-RateLimit-Remaining": String(rateLimit.remaining),
            "X-RateLimit-Reset": String(rateLimit.resetTime),
          },
        }
      );
    }

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

    // Sanitize and validate inputs
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedName = sanitizeName(String(name));
    const sanitizedEmail = sanitizeEmail(String(email));
    const passwordStr = String(password);

    // Validate password strength
    const passwordValidation = validatePassword(passwordStr);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { success: false, message: passwordValidation.message },
        { status: 400 }
      );
    }

    // Helper to clean string values
    const cleanString = (value: FormDataEntryValue | null): string | undefined => {
      if (!value) return undefined;
      const str = String(value).trim();
      return str && str !== "," && str !== "Unknown" && str.length > 0 ? str.substring(0, 255) : undefined;
    };

    const fields = {
      name: sanitizedName,
      email: sanitizedEmail,
      password: passwordStr,
      age: age ? Number(age) : undefined,
      gender: cleanString(gender) as "male" | "female" | "other" | "prefer-not-to-say" | undefined,
      location: cleanString(location),
      country: cleanString(country),
      city: cleanString(city),
    };

    // Validate file upload if provided
    if (profilePhoto instanceof File && profilePhoto.size > 0) {
      const maxSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
      
      const fileValidation = validateFileUpload(profilePhoto, {
        maxSize,
        allowedTypes,
      });

      if (!fileValidation.valid) {
        return NextResponse.json(
          { success: false, message: fileValidation.error },
          { status: 400 }
        );
      }
    }

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

    // Hash password with higher cost factor for better security
    const passwordHash = await hash(parsed.data.password, 12);

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

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully!",
        userId: user.id,
      },
      {
        status: 201,
        headers: {
          "X-RateLimit-Limit": String(RATE_LIMITS.REGISTER.maxRequests),
          "X-RateLimit-Remaining": String(rateLimit.remaining - 1),
        },
      }
    );
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

