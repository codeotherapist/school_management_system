"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function StudentScanPage() {
  const router = useRouter();

  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flashOn, setFlashOn] = useState(false);

  // 🔊 Small beep sound using Web Audio API
  const playBeep = () => {
    try {
      const AudioCtx =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // 880Hz
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15);

      oscillator.onended = () => {
        audioCtx.close();
      };
    } catch {
      // ignore
    }
  };

  // 📳 Haptic vibration on supported devices
  const vibrate = () => {
    try {
      if ("vibrate" in navigator) {
        (navigator as any).vibrate(200);
      }
    } catch {
      // ignore
    }
  };

  // 🔦 Torch Controller — TypeScript-safe
  const setTorch = async (desired: boolean) => {
    try {
      const video = document.querySelector("video") as HTMLVideoElement | null;
      if (!video) return;

      const stream = video.srcObject as MediaStream | null;
      if (!stream) return;

      const track = stream.getVideoTracks()[0];
      if (!track) return;

      const caps: any = track.getCapabilities();
      if (!("torch" in caps)) {
        console.warn("Torch not supported on this device.");
        return;
      }

      await (track as any).applyConstraints({
        advanced: [{ torch: desired }] as any,
      });

      setFlashOn(desired);
    } catch (err) {
      console.error(err);
      setError("Flashlight toggle failed.");
    }
  };

  useEffect(() => {
    let qr: any;
    let handled = false; // prevent multiple scans

    async function startScanner() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setError("Camera access is not supported in this browser/device.");
          return;
        }

        const { Html5Qrcode } = await import("html5-qrcode");

        qr = new Html5Qrcode("student-qr-reader");

        const onScanSuccess = async (decodedText: string) => {
          if (handled) return;
          handled = true;

          console.log("QR decoded:", decodedText);
          setError(null);
          setResult(null);

          // 🔦 Torch ON immediately, haptic + beep
          void setTorch(true);
          vibrate();
          playBeep();

          try {
            const res = await fetch("/api/attendance/scan", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ qrString: decodedText }),
            });

            const data = await res.json();

            // ❌ Network / HTTP error
            if (!res.ok) {
              setError(data.message || data.error || "Failed to record attendance");
              setResult(null);
              handled = false;
              return;
            }

            // ❌ API-level error (e.g. wrong class)
            if (data.ok === false) {
              setError(data.message || data.error || "Failed to record attendance");
              setResult(null);
              handled = false;
              return;
            }

            // ✅ Already recorded
            if (data.alreadyRecorded) {
              setResult("Attendance already recorded for this lesson.");
            } else {
              setResult("✅ Attendance recorded successfully!");
            }

            // After 1 second: turn OFF torch and go to /student dashboard
            setTimeout(() => {
              void setTorch(false);
              router.push("/student");
            }, 1000);
          } catch (err) {
            console.error(err);
            setError("");
            handled = false;
          }
        };

        const onScanFailure = (_scanError: string) => {
          // ignore frequent failures when no QR in frame
        };

        await qr.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          onScanSuccess,
          onScanFailure
        );
      } catch (e: any) {
        console.error(e);
        setError(
          e?.name === "NotAllowedError"
            ? "Camera permission was denied. Please allow camera access in settings and reload."
            : e?.message ||
              "Failed to start camera. Use HTTPS (ngrok/vercel) or localhost."
        );
      }
    }

    startScanner();

    return () => {
      if (qr) {
        qr
          .stop()
          .then(() => qr.clear?.())
          .catch(() => {});
      }
    };
  }, [router]);

  return (
    <div className="fixed inset-0 bg-black text-white flex items-center justify-center overflow-hidden">
      {/* Styles for fullscreen camera + scanning box + laser */}
      <style>{`
        #student-qr-reader {
          position: absolute !important;
          inset: 0 !important;
          width: 100% !important;
          height: 100% !important;
        }

        #student-qr-reader video,
        #student-qr-reader canvas {
          position: absolute !important;
          inset: 0 !important;
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }

        .scan-line-inside {
          position: absolute;
          left: 0;
          width: 100%;
          height: 3px;
          background: rgba(0,255,0,0.8);
          animation: scanAnimInside 2s linear infinite;
        }

        @keyframes scanAnimInside {
          0% { top: 0; }
          100% { top: 100%; }
        }

        @media (min-width: 768px) {
          #scan-box {
            width: 250px !important;
            height: 250px !important;
          }
        }
      `}</style>

      <div id="student-qr-reader"></div>

      {/* Scanning box — centered, with laser inside */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          id="scan-box"
          className="relative rounded-xl"
          style={{
            width: "250px",
            height: "250px",
          }}
        >
          <div className="scan-line-inside"></div>
        </div>
      </div>

      {/* Title */}
      <div className="absolute top-6 text-lg font-semibold text-center px-4">
        Scan Lesson QR (Student)
      </div>

    
      {/* Status messages */}
      {result && (
        <div className="absolute bottom-12 text-green-400 font-semibold text-center px-4">
          {result}
        </div>
      )}
      {error && (
        <div className="absolute bottom-4 text-red-400 text-sm text-center px-4">
          {error}
        </div>
      )}
    </div>
  );
}
