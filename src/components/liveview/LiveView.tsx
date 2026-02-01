import React, { useEffect, useRef, useState, useCallback } from 'react';
import JMuxer from 'jmuxer';

// --- Types for JMuxer (since it lacks official types) ---
interface JMuxerOptions {
  node: HTMLVideoElement;
  mode: 'video' | 'audio' | 'both';
  flushingTime?: number;
  fps?: number;
  debug?: boolean;
  clearBuffer?: boolean;
  onReady?: () => void;
  onError?: (data: any) => void;
}

interface JMuxerInput {
  video?: Uint8Array;
  audio?: Uint8Array;
  duration?: number;
}

interface JMuxerInstance {
  feed(data: JMuxerInput): void;
  destroy(): void;
}
// -------------------------------------------------------

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

interface LiveViewProps {
  /** WebSocket URL for the video stream */
  url?: string;
  /** Width of the video element */
  width?: number;
  /** Height of the video element */
  height?: number;
  /** Auto-reconnect on disconnect */
  autoReconnect?: boolean;
  /** Reconnect delay in milliseconds */
  reconnectDelay?: number;
  /** Maximum reconnect attempts (0 = infinite) */
  maxReconnectAttempts?: number;
}

export const LiveView: React.FC<LiveViewProps> = ({
  url = 'ws://jhnnsrs-lab:8099/ws/video',
  width = 640,
  height = 480,
  autoReconnect = true,
  reconnectDelay = 2000,
  maxReconnectAttempts = 5,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const jmuxerRef = useRef<JMuxerInstance | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCleaningUpRef = useRef(false);

  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ bytesReceived: 0, chunksReceived: 0 });

  // Forward declaration for connect to allow mutual references
  const connectRef = useRef<() => void>(() => {});

  // Cleanup function
  const cleanup = useCallback(() => {
    isCleaningUpRef.current = true;

    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Close WebSocket
    if (socketRef.current) {
      socketRef.current.onopen = null;
      socketRef.current.onmessage = null;
      socketRef.current.onerror = null;
      socketRef.current.onclose = null;
      if (
        socketRef.current.readyState === WebSocket.OPEN ||
        socketRef.current.readyState === WebSocket.CONNECTING
      ) {
        socketRef.current.close();
      }
      socketRef.current = null;
    }

    // Destroy JMuxer instance
    if (jmuxerRef.current) {
      try {
        jmuxerRef.current.destroy();
      } catch (e) {
        console.error('Error destroying JMuxer:', e);
      }
      jmuxerRef.current = null;
    }

    // Clear video source
    if (videoRef.current) {
      videoRef.current.src = '';
      videoRef.current.load();
    }

    isCleaningUpRef.current = false;
  }, []);

  // Connect to WebSocket and set up JMuxer
  const connect = useCallback(() => {
    if (isCleaningUpRef.current) return;
    if (!videoRef.current) return;

    setConnectionState('connecting');
    setError(null);

    try {
      // 1. Initialize JMuxer
      // We cast JMuxer as any to bypass the constructor type check
      jmuxerRef.current = new (JMuxer as any)({
        node: videoRef.current,
        mode: 'video',
        flushingTime: 0, // 0 = Immediate playback for lowest latency
        fps: 30,         // Must match server FPS
        debug: false,
        clearBuffer: true,
        onError: (data: any) => {
          console.error('JMuxer error:', data);
          // If buffer is broken, we might want to force a reconnect
          if (String(data).includes('Invalid NAL unit')) {
             // Optional: Handle corruption
          }
        }
      } as JMuxerOptions);

      // 2. Connect WebSocket
      const socket = new WebSocket(url);
      socket.binaryType = 'arraybuffer';
      socketRef.current = socket;

      socket.onopen = () => {
        if (isCleaningUpRef.current) return;
        console.log('Video stream connected');
        setConnectionState('connected');
        reconnectAttemptsRef.current = 0;
        setStats({ bytesReceived: 0, chunksReceived: 0 });
      };

      socket.onmessage = (event: MessageEvent) => {
        if (isCleaningUpRef.current) return;
        
        // Feed raw binary data directly to JMuxer
        if (jmuxerRef.current) {
            const data = new Uint8Array(event.data as ArrayBuffer);
            
            setStats(prev => ({
                bytesReceived: prev.bytesReceived + data.byteLength,
                chunksReceived: prev.chunksReceived + 1,
            }));

            jmuxerRef.current.feed({
                video: data
            });
        }
      };

      socket.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('WebSocket connection error');
        setConnectionState('error');
      };

      socket.onclose = (event) => {
        if (isCleaningUpRef.current) return;

        console.log('Video stream disconnected:', event.code, event.reason);
        setConnectionState('disconnected');

        // Handle reconnection
        if (
          autoReconnect &&
          (maxReconnectAttempts === 0 || reconnectAttemptsRef.current < maxReconnectAttempts)
        ) {
          reconnectAttemptsRef.current++;
          console.log(`Reconnecting... Attempt ${reconnectAttemptsRef.current}`);

          reconnectTimeoutRef.current = setTimeout(() => {
            cleanup();
            connectRef.current();
          }, reconnectDelay);
        }
      };
    } catch (err) {
      console.error('Error setting up stream:', err);
      setError(err instanceof Error ? err.message : 'Failed to set up video stream');
      setConnectionState('error');
    }
  }, [url, autoReconnect, reconnectDelay, maxReconnectAttempts, cleanup]);

  // Keep connectRef updated
  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  // Manual reconnect handler
  const handleReconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    cleanup();
    setTimeout(() => connectRef.current(), 100);
  }, [cleanup]);

  // Initialize connection on mount
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      connectRef.current();
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Format bytes for display
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 gap-4">
      <h3 className="text-xl font-bold">Live Video Stream (H.264)</h3>

      {/* Status indicator */}
      <div className="flex items-center gap-2 text-sm">
        <div
          className={`w-3 h-3 rounded-full ${
            connectionState === 'connected'
              ? 'bg-green-500'
              : connectionState === 'connecting'
              ? 'bg-yellow-500 animate-pulse'
              : connectionState === 'error'
              ? 'bg-red-500'
              : 'bg-gray-500'
          }`}
        />
        <span className="capitalize">{connectionState}</span>
        {connectionState === 'connected' && (
          <span className="text-gray-400 text-xs">
            ({formatBytes(stats.bytesReceived)} / {stats.chunksReceived} chunks)
          </span>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-2 rounded text-sm max-w-md text-center">
          {error}
        </div>
      )}

      {/* Video element */}
      <div className="relative">
        <video
          ref={videoRef}
          className="border border-gray-700 bg-black"
          style={{ width, height }}
          width={width}
          height={height}
          autoPlay
          muted
          playsInline
          controls
        />

        {/* Overlay for disconnected state */}
        {connectionState !== 'connected' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            {connectionState === 'connecting' && (
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="text-white text-sm">Connecting...</span>
              </div>
            )}
            {(connectionState === 'disconnected' || connectionState === 'error') && (
              <button
                onClick={handleReconnect}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                Reconnect
              </button>
            )}
          </div>
        )}
      </div>

      {/* Debug info */}
      <div className="text-xs text-gray-500 text-center">
        <p>URL: {url}</p>
        <p>Resolution: {width}x{height}</p>
      </div>
    </div>
  );
};

export default LiveView;