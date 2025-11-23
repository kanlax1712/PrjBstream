"use client";

import { useState, useRef, useEffect } from "react";
import { Radio, Video, Mic, Settings } from "lucide-react";

export function GoLiveClient() {
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

  // Get available devices after camera is started
  useEffect(() => {
    if (cameraActive && streamRef.current) {
      const enumerateDevices = async () => {
        try {
          const deviceList = await navigator.mediaDevices.enumerateDevices();
          const cameras = deviceList.filter(
            (device) => device.kind === "videoinput"
          );
          const mics = deviceList.filter(
            (device) => device.kind === "audioinput"
          );
          setDevices({ cameras, mics });
          if (cameras.length > 0 && !selectedCamera) {
            setSelectedCamera(cameras[0].deviceId);
          }
          if (mics.length > 0 && !selectedMic) {
            setSelectedMic(mics[0].deviceId);
          }
        } catch (err) {
          console.error("Error enumerating devices:", err);
        }
      };
      enumerateDevices();
    }
  }, [cameraActive, selectedCamera, selectedMic]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      setError("");
      setIsLoading(true);

      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          "Camera and microphone access is not supported in this browser."
        );
      }

      // Check permissions internally
      let cameraPermission = "prompt";
      let microphonePermission = "prompt";
      
      try {
        if (navigator.permissions) {
          const cameraPerm = await navigator.permissions.query({ name: "camera" as PermissionName });
          cameraPermission = cameraPerm.state;
          const micPerm = await navigator.permissions.query({ name: "microphone" as PermissionName });
          microphonePermission = micPerm.state;
          console.log("Permission status - Camera:", cameraPermission, "Microphone:", microphonePermission);
        }
      } catch (permError) {
        console.log("Permissions API not available, proceeding with getUserMedia");
      }

      // Request camera and microphone access
      const constraints: MediaStreamConstraints = {
        video: selectedCamera
          ? { deviceId: { exact: selectedCamera } }
          : {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user",
            },
        audio: selectedMic
          ? { deviceId: { exact: selectedMic } }
          : {
              echoCancellation: true,
              noiseSuppression: true,
            },
      };

      console.log("Requesting media with constraints:", constraints);
      
      // Get user media - this will work if permissions are already granted
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log("Stream obtained:", {
        id: stream.id,
        active: stream.active,
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length,
      });

      // Verify stream has video track
      if (stream.getVideoTracks().length === 0) {
        throw new Error("No video track available. Camera may not be working.");
      }

      // Verify video track is active
      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack.enabled || videoTrack.readyState !== "live") {
        console.warn("Video track not active, enabling...");
        videoTrack.enabled = true;
      }

      // Store stream reference
      streamRef.current = stream;

      // Attach stream to video element
      if (!videoRef.current) {
        throw new Error("Video element not found");
      }

      const videoElement = videoRef.current;
      
      // Stop any existing stream first
      if (videoElement.srcObject) {
        const oldStream = videoElement.srcObject as MediaStream;
        oldStream.getTracks().forEach(track => track.stop());
      }

      // Set the new stream
      videoElement.srcObject = stream;
      
      // Ensure video is ready to play
      const playVideo = async () => {
        try {
          // Wait for video to be ready
          if (videoElement.readyState < 2) {
            await new Promise((resolve) => {
              videoElement.addEventListener('loadedmetadata', resolve, { once: true });
              // Timeout after 2 seconds
              setTimeout(resolve, 2000);
            });
          }
          
          // Play the video
          await videoElement.play();
          console.log("Video playing successfully");
          setCameraActive(true);
        } catch (playError: any) {
          console.error("Error playing video:", playError);
          // If autoplay is blocked, try with user interaction
          if (playError.name === "NotAllowedError") {
            // Video stream is attached, just needs user interaction to play
            console.log("Autoplay blocked, but stream is attached");
            setCameraActive(true);
          } else {
            // Try unmuting and playing again
            videoElement.muted = false;
            try {
              await videoElement.play();
              console.log("Video playing after unmute");
              setCameraActive(true);
            } catch (e) {
              console.error("Failed to play after unmute:", e);
              // Stream is attached, mark as active anyway
              setCameraActive(true);
            }
          }
        }
      };

      await playVideo();
      
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      
      let errorMessage = "Failed to access camera and microphone.";
      
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMessage = "Camera and microphone access was denied. Please check browser permissions for localhost:3000.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errorMessage = "No camera or microphone found. Please connect a device.";
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        errorMessage = "Camera or microphone is already in use by another application.";
      } else if (err.name === "OverconstrainedError") {
        errorMessage = "The selected device doesn't support the required settings.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setCameraActive(false);
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
    // In production: Connect to streaming server (RTMP, WebRTC, etc.)
  };

  const stopLive = () => {
    setIsLive(false);
    // In production: Stop streaming to server
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl font-semibold flex items-center gap-2 sm:text-2xl">
          <Radio className="size-5 text-red-500 sm:size-6" />
          Go Live
        </h1>
        <p className="mt-1 text-xs text-white/60 sm:mt-2 sm:text-sm">
          Start a live stream and share with your audience
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300 sm:rounded-3xl sm:p-4 sm:text-sm">
          <p className="font-semibold">⚠️ {error}</p>
          <button
            onClick={() => setError("")}
            className="mt-2 rounded-lg bg-rose-500/20 border border-rose-400/30 px-3 py-1.5 text-xs font-medium text-rose-200 hover:bg-rose-500/30 transition"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:gap-6">
        {/* Video Preview */}
        <div className="space-y-4">
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/5 bg-black sm:rounded-3xl">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="size-full object-cover"
              onLoadedMetadata={() => {
                console.log("Video metadata loaded");
                if (videoRef.current && streamRef.current) {
                  videoRef.current.play().catch(err => {
                    console.log("Autoplay prevented, but stream is ready:", err);
                  });
                }
              }}
              onPlay={() => {
                console.log("Video is playing");
                setIsLoading(false);
              }}
              onCanPlay={() => {
                console.log("Video can play");
                if (videoRef.current && !cameraActive) {
                  setCameraActive(true);
                }
              }}
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
  );
}
