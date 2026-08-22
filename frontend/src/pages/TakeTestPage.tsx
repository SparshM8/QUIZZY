import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { AttemptDto, AttemptAnswer } from "../api/types";
import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";

interface TestQuestion {
  questionId: string;
  order: number;
  points: number;
  question: Record<string, unknown>;
}

export default function TakeTestPage() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const answersRef = useRef<Record<string, unknown>>({});
  const [remainingMs, setRemainingMs] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const syncQueue = useRef<{ type: string; data: any }[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [violations, setViolations] = useState(0);
  const heartbeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const autosaveTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const modelRef = useRef<cocoSsd.ObjectDetection | null>(null);
  const detectionInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(async () => {
    if (!testId) return;
    try {
      const started = await api.post<{
        success: boolean;
        data: { id: string };
      }>(`/api/tests/${testId}/attempts`);
      setAttemptId(started.data.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to start attempt");
      navigate("/tests");
    }
  }, [testId, navigate]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    if (!attemptId) return;
    const load = async () => {
      // Try loading from local storage first (offline resilience)
      const localData = localStorage.getItem(`quizzy_attempt_${attemptId}`);
      if (localData) {
        const parsed = JSON.parse(localData);
        setAnswers(parsed.answers);
        setRemainingMs(parsed.remainingMs);
      }

      try {
        const res = await api.get<{
          success: boolean;
          data: { attempt: AttemptDto; remainingMs: number; questions: TestQuestion[] };
        }>(`/api/tests/attempts/${attemptId}/state`);
        setQuestions(res.data.questions);
        setRemainingMs(res.data.remainingMs);
        setViolations(res.data.attempt.violations?.length || 0);
        
        // Merge server state with local if needed, or prefer server as source of truth
        const map: Record<string, unknown> = {};
        for (const a of res.data.attempt.answers) {
          map[a.questionId] = a.answer;
        }
        setAnswers(prev => ({ ...map, ...prev }));
      } catch (err) {
        console.error("Failed to fetch state from server, using local buffer", err);
      }
    };
    load();

    heartbeatTimer.current = setInterval(async () => {
      if (!attemptId) return;
      try {
        const res = await api.get<{ success: boolean; data: { remainingMs: number; autoSubmitted?: boolean } }>(
          `/api/tests/attempts/${attemptId}/heartbeat`
        );
        setRemainingMs(res.data.remainingMs);
        if (res.data.autoSubmitted) {
          if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
          navigate(`/tests/${testId}/attempts/${attemptId}/result`);
        }
      } catch {
        // offline: keep ticking locally and retry
      }
    }, 15000);

    autosaveTimer.current = setInterval(async () => {
      if (!attemptId) return;
      
      // 1. Buffer to Local Storage
      localStorage.setItem(`quizzy_attempt_${attemptId}`, JSON.stringify({
        answers: answersRef.current,
        remainingMs,
        timestamp: new Date().toISOString()
      }));

      // 2. Sync with Server (if online)
      if (navigator.onLine) {
        try {
          // Process any queued items first
          while (syncQueue.current.length > 0) {
            const item = syncQueue.current[0];
            if (item.type === "violation") {
              await api.post(`/api/tests/attempts/${attemptId}/violations`, item.data);
            }
            syncQueue.current.shift();
          }

          await api.patch(`/api/tests/attempts/${attemptId}/answers`, {
            answers: Object.entries(answersRef.current).map(([questionId, answer]) => ({ questionId, answer })),
          });
        } catch (err) {
          console.error("Autosave sync failed, will retry", err);
        }
      }
    }, 10000); // More frequent autosave for resilience

    return () => {
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
      if (autosaveTimer.current) clearInterval(autosaveTimer.current);
      if (detectionInterval.current) clearInterval(detectionInterval.current);
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [attemptId, navigate, testId, stream]);

  // Proctoring: Tab switch detection
  useEffect(() => {
    if (!attemptId) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        api.post<{ success: boolean; data: { violationCount: number; autoSubmitted?: boolean } }>(
          `/api/tests/attempts/${attemptId}/violations`, 
          {
            type: "tab_switch",
            details: "User switched away from the test tab",
          }
        ).then((res) => {
          setViolations(res.data.violationCount);
          if (res.data.autoSubmitted) {
            alert("Test auto-submitted due to excessive proctoring violations.");
            navigate(`/tests/${testId}/attempts/${attemptId}/result`);
          }
        }).catch(console.error);
      }
    };

    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      api.post<{ success: boolean; data: { violationCount: number; autoSubmitted?: boolean } }>(
        `/api/tests/attempts/${attemptId}/violations`, 
        {
          type: "copy_paste",
          details: `User attempted to ${e.type}`,
        }
      ).then((res) => {
        setViolations(res.data.violationCount);
        if (res.data.autoSubmitted) {
          alert("Test auto-submitted due to excessive proctoring violations.");
          navigate(`/tests/${testId}/attempts/${attemptId}/result`);
        }
      }).catch(console.error);
      alert(`Warning: ${e.type === 'copy' ? 'Copying' : 'Pasting'} is disabled during the test. This event has been logged.`);
    };

    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      if (!isFull) {
        api.post<{ success: boolean; data: { violationCount: number; autoSubmitted?: boolean } }>(
          `/api/tests/attempts/${attemptId}/violations`, 
          {
            type: "fullscreen_exit",
            details: "User exited fullscreen mode",
          }
        ).then((res) => {
          setViolations(res.data.violationCount);
          if (res.data.autoSubmitted) {
            alert("Test auto-submitted due to excessive proctoring violations.");
            navigate(`/tests/${testId}/attempts/${attemptId}/result`);
          }
        }).catch(console.error);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("copy", handleCopyPaste);
    document.addEventListener("paste", handleCopyPaste);
    document.addEventListener("contextmenu", (e) => e.preventDefault());
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("copy", handleCopyPaste);
      document.removeEventListener("paste", handleCopyPaste);
      document.removeEventListener("contextmenu", (e) => e.preventDefault());
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [attemptId]);

  // Webcam Monitoring
  useEffect(() => {
    if (!attemptId) return;

    const startWebcam = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
        
        // Load AI Model
        setIsModelLoading(true);
        await tf.ready();
        const model = await cocoSsd.load();
        modelRef.current = model;
        setIsModelLoading(false);

        // Start Detection Loop
        detectionInterval.current = setInterval(async () => {
          if (videoRef.current && modelRef.current && videoRef.current.readyState === 4) {
            const predictions = await modelRef.current.detect(videoRef.current);
            const suspiciousObjects = ["cell phone", "book", "laptop", "remote"];
            const detected = predictions.find(p => suspiciousObjects.includes(p.class) && p.score > 0.6);
            
            if (detected) {
              const violationData = {
                type: "ai_detection" as const,
                details: `AI Detection: Suspicious object identified (${detected.class})`,
              };

              if (navigator.onLine) {
                api.post<{ success: boolean; data: { violationCount: number; autoSubmitted?: boolean } }>(
                  `/api/tests/attempts/${attemptId}/violations`, 
                  violationData
                ).then((res) => {
                  setViolations(res.data.violationCount);
                  if (res.data.autoSubmitted) {
                    alert("Test auto-submitted due to excessive proctoring violations (AI Detection).");
                    navigate(`/tests/${testId}/attempts/${attemptId}/result`);
                  }
                }).catch(console.error);
              } else {
                syncQueue.current.push({ type: "violation", data: violationData });
              }
            }
          }
        }, 3000); // Check every 3 seconds to save resources

      } catch (err) {
        api.post<{ success: boolean; data: { violationCount: number; autoSubmitted?: boolean } }>(
          `/api/tests/attempts/${attemptId}/violations`, 
          {
            type: "webcam_violation",
            details: "Webcam access denied or unavailable",
          }
        ).then((res) => {
          setViolations(res.data.violationCount);
          if (res.data.autoSubmitted) {
            alert("Test auto-submitted due to excessive proctoring violations.");
            navigate(`/tests/${testId}/attempts/${attemptId}/result`);
          }
        }).catch(console.error);
        alert("Webcam access is required for this test. Please enable it to continue.");
      }
    };

    startWebcam();
  }, [attemptId]);

  const enterFullscreen = () => {
    document.documentElement.requestFullscreen().catch(console.error);
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const t = setInterval(() => {
      setRemainingMs((ms) => Math.max(0, ms - 1000));
    }, 1000);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(t);
    };
  }, []);

  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);

  const setAnswer = (questionId: string, answer: unknown) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const submit = async () => {
    if (!attemptId || submitting) return;
    if (!window.confirm("Submit your answers now? This cannot be undone.")) return;
    setSubmitting(true);
    try {
      await api.patch(`/api/tests/attempts/${attemptId}/answers`, {
        answers: Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer })),
      });
      await api.post(`/api/tests/attempts/${attemptId}/submit`);
      navigate(`/tests/${testId}/attempts/${attemptId}/result`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to submit");
      setSubmitting(false);
    }
  };

  if (!attemptId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-lg border bg-white p-6 text-center shadow-sm max-w-md">
          <h1 className="mb-2 text-lg font-semibold">Ready to begin?</h1>
          <div className="mb-4 text-sm text-gray-600 text-left space-y-2">
            <p>• The timer starts as soon as you begin.</p>
            <p>• Your answers are auto-saved.</p>
            <p>• <strong>Strict Proctoring Enabled:</strong></p>
            <ul className="list-disc list-inside ml-2">
              <li>Fullscreen mode is mandatory.</li>
              <li>Webcam monitoring with <strong>AI Object Detection</strong>.</li>
              <li>Tab switching and copy-pasting are disabled.</li>
            </ul>
          </div>
          <button
            onClick={() => void start()}
            className="rounded bg-indigo-600 px-6 py-2 font-medium text-white hover:bg-indigo-700 w-full"
          >
            Start Test
          </button>
        </div>
      </div>
    );
  }

  if (isModelLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto"></div>
          <h2 className="text-lg font-semibold text-slate-900">Initializing AI Proctoring...</h2>
          <p className="text-sm text-slate-500 mt-2">Loading security models for assessment integrity.</p>
        </div>
      </div>
    );
  }

  if (!isFullscreen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold mb-4">Fullscreen Mode Required</h2>
          <p className="mb-6">This test requires fullscreen mode to ensure academic integrity.</p>
          <button
            onClick={enterFullscreen}
            className="bg-indigo-600 hover:bg-indigo-700 px-8 py-3 rounded-lg font-bold transition-colors"
          >
            Enter Fullscreen & Continue
          </button>
        </div>
      </div>
    );
  }

  const question = questions[activeIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold">Test Attempt</h1>
            {!isOnline && (
              <span className="flex items-center gap-1 rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 uppercase">
                <i className="fas fa-wifi-slash"></i> Offline
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-16 overflow-hidden rounded bg-black border border-gray-300">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="h-full w-full object-cover mirror"
              />
            </div>
            {violations > 0 && (
              <span className="rounded bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
                Violations: {violations}
              </span>
            )}
            <span className="rounded bg-red-100 px-3 py-1 font-mono text-sm font-medium text-red-700">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-1.5">
          {questions.map((q, idx) => (
            <button
              key={q.questionId}
              onClick={() => setActiveIndex(idx)}
              className={`h-9 w-9 rounded text-sm font-medium ${
                idx === activeIndex
                  ? "bg-indigo-600 text-white"
                  : answers[q.questionId] !== undefined
                    ? "bg-green-200 text-green-800"
                    : "border bg-white text-gray-600"
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        {question && (
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <p className="mb-1 text-xs text-gray-500">
              Question {activeIndex + 1} of {questions.length} · {question.points} points
            </p>
            <h2 className="mb-1 text-lg font-semibold">{String(question.question.title)}</h2>
            <p className="mb-4 text-gray-700">{String(question.question.statement)}</p>
            <AnswerInput
              type={String(question.question.type)}
              question={question.question}
              value={answers[question.questionId]}
              onChange={(a) => setAnswer(question.questionId, a)}
            />
          </div>
        )}

        <div className="mt-4 flex justify-between">
          <button
            disabled={activeIndex === 0}
            onClick={() => setActiveIndex(activeIndex - 1)}
            className="rounded border bg-white px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-40"
          >
            Previous
          </button>
          {activeIndex < questions.length - 1 ? (
            <button
              onClick={() => setActiveIndex(activeIndex + 1)}
              className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Next
            </button>
          ) : (
            <button
              onClick={() => void submit()}
              disabled={submitting}
              className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit Test"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AnswerInput({
  type,
  question,
  value,
  onChange,
}: {
  type: string;
  question: Record<string, unknown>;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  if (type === "coding") {
    return (
      <div className="space-y-4">
        <textarea
          className="w-full rounded border font-mono text-sm px-3 py-2"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          rows={12}
          placeholder="// Write your code here..."
        />
        <div className="flex justify-end">
          <button
            onClick={() => {
              // Trigger code submission logic here if needed
              alert("Code saved. It will be automatically graded upon submission.");
            }}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Save Code
          </button>
        </div>
      </div>
    );
  }

  if (type === "mcq" || type === "true_false" || type === "aptitude" || type === "reasoning") {
    const choices = (question.options as { choices: { id: string; text: string }[] })?.choices ?? [];
    return (
      <div className="space-y-2">
        {choices.map((c) => (
          <label key={c.id} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name={String(question.id)}
              checked={value === c.id}
              onChange={() => onChange(c.id)}
            />
            {c.text}
          </label>
        ))}
      </div>
    );
  }

  if (type === "multi_select") {
    const choices = (question.options as { choices: { id: string; text: string }[] })?.choices ?? [];
    const selected = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div className="space-y-2">
        {choices.map((c) => (
          <label key={c.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selected.includes(c.id)}
              onChange={() => {
                const next = selected.includes(c.id) ? selected.filter((x) => x !== c.id) : [...selected, c.id];
                onChange(next);
              }}
            />
            {c.text}
          </label>
        ))}
      </div>
    );
  }

  if (type === "numerical") {
    return (
      <input
        type="number"
        className="w-full rounded border px-3 py-2"
        value={typeof value === "number" ? value : ""}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        placeholder="Enter a number"
      />
    );
  }

  if (type === "fill_blank") {
    return (
      <input
        className="w-full rounded border px-3 py-2"
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your answer"
      />
    );
  }

  return (
    <textarea
      className="w-full rounded border px-3 py-2"
      value={typeof value === "string" ? value : ""}
      onChange={(e) => onChange(e.target.value)}
      rows={5}
      placeholder="Write your answer here…"
    />
  );
}
