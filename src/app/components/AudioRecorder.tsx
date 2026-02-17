import { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2, X, RefreshCw } from "lucide-react";
import { api } from "@/services/api";

interface AudioRecorderProps {
  onTranscription: (text: string) => void;
}

export default function AudioRecorder({ onTranscription }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      audioChunksRef.current = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = handleStop;
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);
      
      intervalRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Erro ao acessar microfone:", err);
      alert("Permita o acesso ao microfone para gravar seu relato.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop()); // Libera microfone
      setIsRecording(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  };

  const handleStop = async () => {
    setIsProcessing(true);
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const file = new File([audioBlob], "recording.webm", { type: "audio/webm" });
      
      const data = await api.transcrever(file);
      if (data.texto) {
        onTranscription(data.texto);
      }
    } catch (error) {
      console.error(error);
      alert("Não foi possível transcrever o áudio. Tente novamente ou digite o relato.");
    } finally {
      setIsProcessing(false);
      setRecordingTime(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isProcessing) {
    return (
      <div className="flex items-center gap-2 text-[#1c80b2] bg-blue-50 px-3 py-2 rounded-full text-xs font-medium animate-pulse">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Transcrevendo...</span>
      </div>
    );
  }

  if (isRecording) {
    return (
      <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-2 rounded-full">
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        <span className="text-xs font-bold text-red-600 w-10">{formatTime(recordingTime)}</span>
        <button 
          onClick={stopRecording}
          className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full transition-colors"
          title="Parar gravação"
        >
          <Square className="w-3 h-3 fill-current" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={startRecording}
      className="flex items-center gap-2 text-gray-500 hover:text-[#1c80b2] hover:bg-blue-50 px-3 py-2 rounded-full transition-all text-xs font-medium border border-transparent hover:border-blue-100"
      title="Gravar relato por voz"
    >
      <Mic className="w-4 h-4" />
      <span>Gravar relato</span>
    </button>
  );
}
