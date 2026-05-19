import { useState } from "react";
import "./App.css";

export default function App() {
  const [speed, setSpeed] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Ready to test ⚡");
  const [progress, setProgress] = useState(0);

  const testSpeed = async () => {
    setLoading(true);
    setSpeed(null);
    setProgress(0);

    try {
      setStatus("Connecting to internet 🌍");

      const fileUrl =
        "https://speed.cloudflare.com/__down?bytes=10000000";

      const start = performance.now();

      setStatus("Downloading data 📥");

      const response = await fetch(fileUrl, { cache: "no-store" });

      if (!response.ok) throw new Error("Network error");

      const reader = response.body.getReader();
      const contentLength = +response.headers.get("Content-Length");

      let receivedLength = 0;
      let chunks = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        receivedLength += value.length;

        // 📊 progress update
        if (contentLength) {
          setProgress(Math.round((receivedLength / contentLength) * 100));
        }
      }

      const blob = new Blob(chunks);

      const end = performance.now();

      const duration = (end - start) / 1000;
      const sizeInMb = blob.size / (1024 * 1024);

      const speedMbps = ((sizeInMb * 8) / duration).toFixed(2);

      setSpeed(speedMbps);
      setStatus("Test complete 🎉 (your WiFi survived)");
      setProgress(100);
    } catch (error) {
      console.log(error);
      setStatus("WiFi ran away 🏃‍♂️💨");
    }

    setLoading(false);
  };

  return (
    <div className="container">
      <h1>⚡ WiFi Speed Test</h1>

      <p className="status">{status}</p>

      <div className="card">
        <p className="result">
          {speed ? `${speed} Mbps` : "-- Mbps"}
        </p>

        <div className="progress-bar">
          <div
            className="progress"
            style={{ width: `${progress}%` }}
          />
        </div>

        <button onClick={testSpeed} disabled={loading}>
          {loading ? "Testing..." : "Start Test 🚀"}
        </button>
      </div>

      <p className="footer">
        Warning: results may hurt your feelings 😭
      </p>
    </div>
  );
}