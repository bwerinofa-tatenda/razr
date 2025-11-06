// Voice Input Component
// Provides voice-to-text functionality for hands-free note taking

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Settings,
  Download,
  Trash2,
  Clock,
  Globe,
  Sparkles
} from 'lucide-react';
import { VoiceNote, advancedLibraryService } from '../../lib/advancedLibraryService';
import { useAuth } from '../../contexts/AuthContext';

interface VoiceInputProps {
  noteId: string;
  onTranscript: (transcript: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface VoiceSettings {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
}

const VoiceInput: React.FC<VoiceInputProps> = ({
  noteId,
  onTranscript,
  isOpen,
  onClose
}) => {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<VoiceSettings>({
    language: 'en-US',
    continuous: true,
    interimResults: true,
    maxAlternatives: 1
  });
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check for Web Speech API support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = settings.continuous;
      recognitionInstance.interimResults = settings.interimResults;
      recognitionInstance.lang = settings.language;
      recognitionInstance.maxAlternatives = settings.maxAlternatives;
      
      recognitionInstance.onstart = () => {
        setIsListening(true);
        setError(null);
      };
      
      recognitionInstance.onresult = (event) => {
        let finalTranscript = '';
        let interimText = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimText += result[0].transcript;
          }
        }
        
        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript);
        }
        setInterimTranscript(interimText);
      };
      
      recognitionInstance.onerror = (event) => {
        setError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
        setIsRecording(false);
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
        if (isRecording && !isPaused) {
          // Auto-restart if continuous mode is on
          setTimeout(() => {
            if (recognitionInstance && isRecording && !isPaused) {
              recognitionInstance.start();
            }
          }, 100);
        }
      };
      
      setRecognition(recognitionInstance);
    } else {
      setIsSupported(false);
      setError('Speech recognition is not supported in this browser');
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [settings, isRecording, isPaused]);

  const startRecording = async () => {
    if (!user || !recognition) return;
    
    try {
      setError(null);
      setTranscript('');
      setInterimTranscript('');
      
      // Start audio recording
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      startTimeRef.current = Date.now();
      
      // Start speech recognition
      recognition.start();
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(Date.now() - startTimeRef.current);
      }, 1000);
      
      setIsRecording(true);
      setIsPaused(false);
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      setError('Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (recognition) {
      recognition.stop();
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setIsRecording(false);
    setIsPaused(false);
    setIsListening(false);
  };

  const pauseRecording = () => {
    if (recognition) {
      recognition.stop();
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setIsPaused(true);
    setIsListening(false);
  };

  const resumeRecording = () => {
    if (recognition && isPaused) {
      recognition.start();
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      
      // Resume timer
      timerRef.current = setInterval(() => {
        setRecordingTime(Date.now() - startTimeRef.current);
      }, 1000);
    }
    
    setIsPaused(false);
  };

  const clearRecording = () => {
    setTranscript('');
    setInterimTranscript('');
    setRecordingTime(0);
    setAudioUrl(null);
    setError(null);
    
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  };

  const saveVoiceNote = async () => {
    if (!user || !audioUrl) return;
    
    setIsSaving(true);
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
      
      await advancedLibraryService.saveVoiceNote(
        noteId,
        user.id,
        audioBlob,
        transcript
      );
      
      onTranscript(transcript);
      onClose();
    } catch (error) {
      console.error('Failed to save voice note:', error);
      setError('Failed to save voice note');
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const playAudio = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.volume = isMuted ? 0 : volume;
      audio.play();
      setIsPlaying(true);
      
      audio.onended = () => setIsPlaying(false);
    }
  };

  const stopAudio = () => {
    const audio = new Audio(audioUrl || '');
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
  };

  if (!isOpen) return null;

  if (!isSupported) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
          <div className="p-6">
            <div className="text-center">
              <MicOff className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Voice Input Not Supported
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Your browser doesn't support speech recognition. Please use a modern browser like Chrome or Edge.
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Mic className="w-5 h-5 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Voice Input
            </h2>
            {isRecording && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-red-600">
                  {formatTime(recordingTime)}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <MicOff className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Recording Controls */}
          <div className="flex items-center justify-center space-x-4">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="flex items-center space-x-2 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <Mic className="w-5 h-5" />
                <span>Start Recording</span>
              </button>
            ) : (
              <>
                {!isPaused ? (
                  <button
                    onClick={pauseRecording}
                    className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                  >
                    <Pause className="w-4 h-4" />
                    <span>Pause</span>
                  </button>
                ) : (
                  <button
                    onClick={resumeRecording}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    <span>Resume</span>
                  </button>
                )}
                
                <button
                  onClick={stopRecording}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <Square className="w-4 h-4" />
                  <span>Stop</span>
                </button>
              </>
            )}
            
            {audioUrl && !isRecording && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={isPlaying ? stopAudio : playAudio}
                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                
                <button
                  onClick={clearRecording}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="text-center">
            {error && (
              <p className="text-red-600 text-sm mb-2">{error}</p>
            )}
            {isRecording && (
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                {isPaused ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>Paused</span>
                  </>
                ) : isListening ? (
                  <>
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span>Listening...</span>
                  </>
                ) : (
                  <>
                    <MicOff className="w-4 h-4" />
                    <span>Processing...</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Audio Controls */}
          {audioUrl && !isRecording && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Recording ({formatTime(recordingTime)})
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-1 text-gray-500 hover:text-gray-700"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-16"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Transcript */}
          {(transcript || interimTranscript) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Transcript
                </h3>
                <span className="text-xs text-gray-500">
                  {transcript.split(' ').filter(word => word.length > 0).length} words
                </span>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-40 overflow-y-auto">
                <p className="text-sm text-gray-900 dark:text-white">
                  {transcript}
                  {interimTranscript && (
                    <span className="text-gray-500 italic">
                      {interimTranscript}
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {transcript && !isRecording && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={clearRecording}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Clear
              </button>
              
              <button
                onClick={saveVoiceNote}
                disabled={isSaving}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Add to Note</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default VoiceInput;
