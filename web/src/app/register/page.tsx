"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    age: "",
    gender: "",
    profilePhoto: null as File | null,
  });
  const [location, setLocation] = useState({
    country: "",
    city: "",
    location: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  // Get location on mount
  useEffect(() => {
    fetch("/api/geolocation")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setLocation(data.location);
        }
      })
      .catch(() => {
        // Silently fail - location is optional
      });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, profilePhoto: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Enhanced password validation
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!/[a-zA-Z]/.test(formData.password)) {
      setError("Password must contain at least one letter");
      return;
    }

    if (!/[0-9]/.test(formData.password)) {
      setError("Password must contain at least one number");
      return;
    }

    setIsLoading(true);

    const data = new FormData();
    data.append("name", formData.name);
    data.append("email", formData.email);
    data.append("password", formData.password);
    if (formData.age) data.append("age", formData.age);
    if (formData.gender) data.append("gender", formData.gender);
    if (location.location) data.append("location", location.location);
    if (location.country) data.append("country", location.country);
    if (location.city) data.append("city", location.city);
    if (formData.profilePhoto) {
      data.append("profilePhoto", formData.profilePhoto);
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        body: data,
      });

      const result = await response.json();

      if (result.success) {
        router.push("/login?registered=true");
      } else {
        setError(result.message || "Registration failed");
      }
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/5 bg-white/5 p-8 text-white shadow-2xl">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">
            Bstream
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Create Account</h1>
          <p className="text-sm text-white/60">
            Join Bstream to watch and share videos
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Profile Photo */}
          <div>
            <label className="text-sm text-white/70">Profile Photo (optional)</label>
            <div className="mt-2 flex items-center gap-4">
              {preview ? (
                <div className="relative size-20 overflow-hidden rounded-full border border-white/10">
                  <Image
                    src={preview}
                    alt="Preview"
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex size-20 items-center justify-center rounded-full border border-white/10 bg-white/5">
                  <span className="text-2xl">👤</span>
                </div>
              )}
              <label className="cursor-pointer rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20">
                Choose Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-sm text-white/70">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              className="mt-1 w-full rounded-2xl border border-white/10 bg-transparent px-4 py-2 text-sm focus:border-cyan-400 focus:outline-none"
              placeholder="John Doe"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-sm text-white/70">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              className="mt-1 w-full rounded-2xl border border-white/10 bg-transparent px-4 py-2 text-sm focus:border-cyan-400 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-sm text-white/70">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              minLength={8}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-transparent px-4 py-2 text-sm focus:border-cyan-400 focus:outline-none"
              placeholder="At least 8 characters with letters and numbers"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-sm text-white/70">Confirm Password</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              required
              className="mt-1 w-full rounded-2xl border border-white/10 bg-transparent px-4 py-2 text-sm focus:border-cyan-400 focus:outline-none"
              placeholder="Re-enter password"
            />
          </div>

          {/* Age and Gender */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm text-white/70">Age (optional)</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) =>
                  setFormData({ ...formData, age: e.target.value })
                }
                min={13}
                max={120}
                className="mt-1 w-full rounded-2xl border border-white/10 bg-transparent px-4 py-2 text-sm focus:border-cyan-400 focus:outline-none"
                placeholder="Age"
              />
            </div>
            <div>
              <label className="text-sm text-white/70">Gender (optional)</label>
              <select
                value={formData.gender}
                onChange={(e) =>
                  setFormData({ ...formData, gender: e.target.value })
                }
                className="mt-1 w-full rounded-2xl border border-white/10 bg-transparent px-4 py-2 text-sm focus:border-cyan-400 focus:outline-none"
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>
          </div>

          {/* Location (auto-filled) */}
          {location.location && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
              <span className="text-white/50">Detected location: </span>
              {location.location}
            </div>
          )}

          {error && <p className="text-sm text-rose-300">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="channel-button-ripple w-full rounded-full bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>

          <p className="text-center text-sm text-white/60">
            Already have an account?{" "}
            <Link href="/login" className="text-cyan-300 hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

