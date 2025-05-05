// src/components/common/AudioRecorder.tsx
import { useState, useRef, useEffect } from 'react';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import toast from 'react-hot-toast';

interface AudioRecorderProps {
  initialAudioUrl?: string;
  onAudioChange: (audioUrl: string | null) => void;
  label?: string;
}

const AudioRecorder = ({ initialAudioUrl, onAudioChange, label = 'Audio Instructions' }: AudioRecorderProps) => {
  const { supabase } = useSupabaseAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(initialAudioUrl || null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
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
        setAudioURL(url);

        // Upload the recorded audio
        handleUploadRecording(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Could not access microphone. Please check your browser permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Stop all audio tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleUploadRecording = async (audioBlob: Blob) => {
    if (!supabase) {
      toast.error('Database connection not available. Please try again later.');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null); // Clear any previous errors
    try {
      // Define bucket name
      const bucketName = 'audio-instructions';
      const fileName = `audio_${Date.now()}.wav`;
      const file = new File([audioBlob], fileName, { type: 'audio/wav' });

      // Check if bucket exists
      try {
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();

        if (listError) {
          console.error('Error listing buckets:', listError);
          throw listError;
        }

        // Check if our bucket exists
        const bucketExists = buckets && buckets.some(bucket => bucket.name === bucketName);

        // Create bucket if it doesn't exist
        if (!bucketExists) {
          console.log(`Bucket "${bucketName}" doesn't exist, creating it...`);
          const { error: createError } = await supabase.storage.createBucket(bucketName, {
            public: true,
            fileSizeLimit: 10485760 // 10MB
          });

          if (createError) {
            console.error('Error creating bucket:', createError);
            throw createError;
          }
          console.log(`Bucket "${bucketName}" created successfully`);
        }
      } catch (bucketError) {
        console.error('Error checking/creating bucket:', bucketError);
        // Continue anyway - the bucket might already exist
      }

      // Try to upload to Supabase Storage
      let uploadResult;
      try {
        uploadResult = await supabase.storage
          .from(bucketName)
          .upload(fileName, file);
      } catch (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { error } = uploadResult;

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      const publicUrl = publicUrlData.publicUrl;
      setAudioURL(publicUrl);
      onAudioChange(publicUrl);
      toast.success('Audio uploaded successfully');
    } catch (error) {
      console.error('Error uploading audio:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to upload audio';
      setErrorMessage(errorMsg);
      toast.error('Failed to upload audio. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!supabase) {
      toast.error('Database connection not available. Please try again later.');
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('audio/')) {
      toast.error('Please upload an audio file');
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Audio file size should be less than 10MB');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null); // Clear any previous errors
    try {
      // Define bucket name
      const bucketName = 'audio-instructions';
      const fileName = `audio_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

      // Check if bucket exists - reuse the same code as in handleUploadRecording
      try {
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();

        if (listError) {
          console.error('Error listing buckets:', listError);
          throw listError;
        }

        // Check if our bucket exists
        const bucketExists = buckets && buckets.some(bucket => bucket.name === bucketName);

        // Create bucket if it doesn't exist
        if (!bucketExists) {
          console.log(`Bucket "${bucketName}" doesn't exist, creating it...`);
          const { error: createError } = await supabase.storage.createBucket(bucketName, {
            public: true,
            fileSizeLimit: 10485760 // 10MB
          });

          if (createError) {
            console.error('Error creating bucket:', createError);
            throw createError;
          }
          console.log(`Bucket "${bucketName}" created successfully`);
        }
      } catch (bucketError) {
        console.error('Error checking/creating bucket:', bucketError);
        // Continue anyway - the bucket might already exist
      }

      // Try to upload to Supabase Storage
      let uploadResult;
      try {
        uploadResult = await supabase.storage
          .from(bucketName)
          .upload(fileName, file);
      } catch (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { error } = uploadResult;

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      const publicUrl = publicUrlData.publicUrl;
      setAudioURL(publicUrl);
      onAudioChange(publicUrl);
      toast.success('Audio uploaded successfully');
    } catch (error) {
      console.error('Error uploading audio:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to upload audio';
      setErrorMessage(errorMsg);
      toast.error('Failed to upload audio. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAudio = () => {
    setAudioURL(null);
    setErrorMessage(null);
    onAudioChange(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      {audioURL ? (
        <div className="bg-gray-50 p-4 rounded-lg">
          <audio src={audioURL} controls className="w-full mb-2" />
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={handleRemoveAudio}
              className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
            >
              Remove Audio
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex flex-col space-y-4">
            {isRecording ? (
              <div className="flex items-center space-x-2">
                <div className="animate-pulse h-3 w-3 bg-red-500 rounded-full"></div>
                <span className="text-red-500 font-medium">Recording... {formatTime(recordingTime)}</span>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="ml-auto px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Stop
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <button
                  type="button"
                  onClick={startRecording}
                  className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center"
                  disabled={isUploading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                  Record Audio
                </button>
                <div className="relative">
                  <input
                    type="file"
                    id="audio-upload"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isUploading}
                  />
                  <button
                    type="button"
                    className="w-full px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center justify-center"
                    disabled={isUploading}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    Upload Audio
                  </button>
                </div>
              </div>
            )}
            {isUploading && (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                <span className="text-gray-500">Uploading audio...</span>
              </div>
            )}

            {errorMessage && !isUploading && (
              <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{errorMessage}</p>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="mt-2 text-xs bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      <p className="text-xs text-gray-500">
        Add audio instructions to guide users through this assignment. You can record directly or upload an audio file (max 10MB).
      </p>
    </div>
  );
};

export default AudioRecorder;
