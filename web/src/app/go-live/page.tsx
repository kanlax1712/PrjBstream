"use client";

import { useState, useRef, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Radio, Video, Mic, Settings } from "lucide-react";

export default function GoLivePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(true);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [selectedMic, setSelectedMic] = useState<string>("");
  const [devices, setDevices] = useState<{
    cameras: MediaDeviceInfo[];
    mics: MediaDeviceInfo[];
  }>({ cameras: [], mics: [] });

  useEffect(() => {
    // Get available devices
    navigator.mediaDevices
      .enumerateDevices()
      .then((deviceList) => {
        const cameras = deviceList.filter(
          (device) => device.kind === "videoinput"
        );
        const mics = deviceList.filter(
          (device) => device.kind === "audioinput"
        );
        setDevices({ cameras, mics });
        if (cameras.length > 0) setSelectedCamera(cameras[0].deviceId);
        if (mics.length > 0) setSelectedMic(mics[0].deviceId);
      })
      .catch((err) => {
        console.error("Error enumerating devices:", err);
      });

    return () => {
      // Cleanup on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      setError("");
      setIsLoading(true);

      const constraints: MediaStreamConstraints = {
        video: selectedCamera
          ? { deviceId: { exact: selectedCamera } }
          : true,
        audio: selectedMic
          ? { deviceId: { exact: selectedMic } }
          : true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError(
        "Failed to access camera. Please check permissions and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setIsLive(false);
  };

  const toggleMic = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !micActive;
      });
      setMicActive(!micActive);
    }
  };

  const startLive = () => {
    if (!cameraActive) {
      setError("Please start camera first");
      return;
    }
    setIsLive(true);
    // In a real implementation, you would:
    // 1. Connect to a streaming server (RTMP, WebRTC, etc.)
    // 2. Start encoding and streaming the video
    // 3. Create a live video record in the database
    // For now, we'll just show the UI state
  };

  const stopLive = () => {
    setIsLive(false);
    // Stop streaming to server
  };

  return (
    <AppShell secure>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Radio className="size-6 text-red-500" />
            Go Live
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Start a live stream and share with your audience
          </p>
        </div>

        {error && (
          <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Video Preview */}
          <div className="space-y-4">
            <div className="relative aspect-video overflow-hidden rounded-3xl border border-white/5 bg-black">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="size-full object-cover"
              />
              {!cameraActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                  <div className="text-center">
                    <Video className="mx-auto size-12 text-white/20 mb-4" />
                    <p className="text-white/60">Camera preview</p>
                    <p className="text-sm text-white/40">
                      Click &quot;Start Camera&quot; to begin
                    </p>
                  </div>
                </div>
              )}
              {isLive && (
                <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-red-500 px-4 py-2">
                  <div className="size-2 rounded-full bg-white animate-pulse" />
                  <span className="text-sm font-semibold text-white">LIVE</span>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-3">
              {!cameraActive ? (
                <button
                  onClick={startCamera}
                  disabled={isLoading}
                  className="flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Video className="size-4" />
                  {isLoading ? "Starting..." : "Start Camera"}
                </button>
              ) : (
                <>
                  <button
                    onClick={stopCamera}
                    className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                  >
                    Stop Camera
                  </button>
                  <button
                    onClick={toggleMic}
                    className={`flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-semibold transition ${
                      micActive
                        ? "bg-white/10 text-white hover:bg-white/20"
                        : "bg-red-500/20 text-red-300 hover:bg-red-500/30"
                    }`}
                  >
                    <Mic className="size-4" />
                    {micActive ? "Mic On" : "Mic Off"}
                  </button>
                  {!isLive ? (
                    <button
                      onClick={startLive}
                      className="flex items-center gap-2 rounded-full bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-600"
                    >
                      <Radio className="size-4" />
                      Go Live
                    </button>
                  ) : (
                    <button
                      onClick={stopLive}
                      className="flex items-center gap-2 rounded-full bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-600"
                    >
                      End Stream
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <Settings className="size-5" />
                Settings
              </h3>

              <div className="space-y-4">
                {/* Camera Selection */}
                {devices.cameras.length > 0 && (
                  <div>
                    <label className="text-sm text-white/70">Camera</label>
                    <select
                      value={selectedCamera}
                      onChange={(e) => setSelectedCamera(e.target.value)}
                      disabled={cameraActive}
                      className="mt-1 w-full rounded-2xl border border-white/10 bg-transparent px-4 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none disabled:opacity-50"
                    >
                      {devices.cameras.map((camera) => (
                        <option key={camera.deviceId} value={camera.deviceId}>
                          {camera.label || `Camera ${camera.deviceId.slice(0, 8)}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Microphone Selection */}
                {devices.mics.length > 0 && (
                  <div>
                    <label className="text-sm text-white/70">Microphone</label>
                    <select
                      value={selectedMic}
                      onChange={(e) => setSelectedMic(e.target.value)}
                      disabled={cameraActive}
                      className="mt-1 w-full rounded-2xl border border-white/10 bg-transparent px-4 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none disabled:opacity-50"
                    >
                      {devices.mics.map((mic) => (
                        <option key={mic.deviceId} value={mic.deviceId}>
                          {mic.label || `Mic ${mic.deviceId.slice(0, 8)}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                  <p className="font-semibold text-white mb-2">Stream Info</p>
                  <p>In production, this would connect to:</p>
                  <ul className="mt-2 list-disc list-inside space-y-1 text-xs">
                    <li>RTMP streaming server</li>
                    <li>WebRTC for low latency</li>
                    <li>Live video database record</li>
                    <li>Chat moderation system</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

