import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Phone,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Monitor,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import {
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  collection,
  addDoc,
  getDoc,
  arrayUnion,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  RTC_CONFIG,
  callAudioEffects,
  getMediaStream,
  sanitizeCandidate,
  sanitizeCandidateItem,
  clearCallCandidates,
  playAudioSafely,
  CallDataFirestore,
  CallCandidatePayload,
  CandidateItem,
} from '../lib/webrtc-call';

interface VideoCallModalProps {
  roomId: string;
  myUserId: string;
  myUserName: string;
  peerUserName: string;
  callType: 'video' | 'audio';
  isOpen: boolean;
  isCaller: boolean;
  incomingCallData: CallDataFirestore | null;
  onClose: () => void;
}

export const VideoCallModal: React.FC<VideoCallModalProps> = ({
  roomId,
  myUserId,
  myUserName,
  peerUserName,
  callType,
  isOpen,
  isCaller,
  incomingCallData,
  onClose,
}) => {
  // Call status state machine:
  // 'initiating' -> acquiring devices & creating SDP offer
  // 'calling' -> waiting for peer to answer (caller side)
  // 'ringing' -> incoming call alert (callee side)
  // 'connecting' -> peer answered, exchanging ICE & negotiating media
  // 'connected' -> active media stream flowing
  // 'declined' -> peer declined call
  // 'missed' -> timeout with no answer
  // 'ended' -> call ended
  // 'error' -> permission or device failure
  const [callStatus, setCallStatus] = useState<
    'initiating' | 'calling' | 'ringing' | 'connecting' | 'connected' | 'declined' | 'missed' | 'ended' | 'error'
  >(isCaller ? 'initiating' : 'ringing');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // In-call media states
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [peerIsScreenSharing, setPeerIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [remoteHasVideo, setRemoteHasVideo] = useState(callType === 'video');
  const [speechEnergy, setSpeechEnergy] = useState<number>(10);

  // Media Streams stored in React state to ensure elements mount and re-render immediately
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  // Unique session ID to isolate candidates and prevent stale crosstalk
  const sessionIdRef = useRef<string>(
    incomingCallData?.sessionId ||
    `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  );

  // Audio / Video element refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // WebRTC & Lifecycle refs
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const cameraTrackRef = useRef<MediaStreamTrack | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const unsubscribersRef = useRef<Unsubscribe[]>([]);
  const durationTimerRef = useRef<number | null>(null);
  const ringingTimeoutRef = useRef<number | null>(null);
  const audioMeterTimerRef = useRef<number | null>(null);

  // Buffer for ICE candidates that arrive before setRemoteDescription completes
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const addedCandidatesRef = useRef<Set<string>>(new Set());
  const hasRemoteDescRef = useRef<boolean>(false);
  const isTerminatedRef = useRef<boolean>(false);

  // Firestore call document reference
  const callDocRef = useRef(doc(db, 'rooms', roomId, 'calls', 'current'));

  // Format call duration MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // -------------------------------------------------------------
  // Mark connection as active and start duration counter
  // -------------------------------------------------------------
  const markConnected = useCallback(() => {
    if (isTerminatedRef.current) return;
    callAudioEffects.stopRinging();
    setCallStatus((prev) => {
      if (prev === 'connected') return prev;
      callAudioEffects.playConnectedTone();
      return 'connected';
    });

    if (!durationTimerRef.current) {
      durationTimerRef.current = window.setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
  }, []);

  // -------------------------------------------------------------
  // Clean up all resources, streams, oscillators, and timers
  // -------------------------------------------------------------
  const cleanupCall = useCallback(() => {
    isTerminatedRef.current = true;
    callAudioEffects.stopRinging();

    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    if (ringingTimeoutRef.current) {
      clearTimeout(ringingTimeoutRef.current);
      ringingTimeoutRef.current = null;
    }
    if (audioMeterTimerRef.current) {
      clearInterval(audioMeterTimerRef.current);
      audioMeterTimerRef.current = null;
    }

    // Stop local media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      localStreamRef.current = null;
    }

    if (screenTrackRef.current) {
      try {
        screenTrackRef.current.stop();
      } catch {
        // ignore
      }
      screenTrackRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.close();
      } catch {
        // ignore
      }
      peerConnectionRef.current = null;
    }

    // Unsubscribe from all Firestore listeners
    unsubscribersRef.current.forEach((unsub) => {
      try {
        unsub();
      } catch {
        // ignore
      }
    });
    unsubscribersRef.current = [];

    pendingIceCandidatesRef.current = [];
    addedCandidatesRef.current.clear();
    hasRemoteDescRef.current = false;
    setLocalStream(null);
    setRemoteStream(null);
  }, []);

  // -------------------------------------------------------------
  // Safe ICE Candidate queuing and flushing
  // -------------------------------------------------------------
  const handleAddIceCandidate = useCallback(async (candidateData: RTCIceCandidateInit) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    if (!candidateData.candidate || typeof candidateData.candidate !== 'string') {
      return;
    }

    if (hasRemoteDescRef.current && pc.remoteDescription) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidateData));
      } catch (err) {
        console.warn('[WebRTC] addIceCandidate error:', err);
      }
    } else {
      pendingIceCandidatesRef.current.push(candidateData);
    }
  }, []);

  const flushPendingIceCandidates = useCallback(async () => {
    const pc = peerConnectionRef.current;
    if (!pc || !pc.remoteDescription) return;
    hasRemoteDescRef.current = true;

    const queue = [...pendingIceCandidatesRef.current];
    pendingIceCandidatesRef.current = [];
    for (const cand of queue) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(cand));
      } catch (err) {
        console.warn('[WebRTC] Flushing candidate error:', err);
      }
    }
  }, []);

  // -------------------------------------------------------------
  // Caller Flow: Initiate offer, upload candidates, wait for callee
  // -------------------------------------------------------------
  const initiateCaller = useCallback(async () => {
    try {
      isTerminatedRef.current = false;
      callAudioEffects.unlock();
      setCallStatus('initiating');
      setErrorMessage(null);
      hasRemoteDescRef.current = false;
      pendingIceCandidatesRef.current = [];
      addedCandidatesRef.current.clear();

      // Generate a new fresh session ID
      const newSessionId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      sessionIdRef.current = newSessionId;

      const wantVideo = callType === 'video';

      // 1. Acquire media (camera + mic, or mic only with synthetic video fallback)
      const { stream, hasVideo } = await getMediaStream(wantVideo, true, myUserName);
      localStreamRef.current = stream;
      setLocalStream(stream);

      if (hasVideo) {
        cameraTrackRef.current = stream.getVideoTracks()[0] || null;
      }

      // 2. Clear old candidates in Firestore in background
      clearCallCandidates(roomId, 'current').catch(() => {});

      // 3. Create Peer Connection
      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionRef.current = pc;

      // Add local tracks to peer connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle incoming remote tracks
      pc.ontrack = (event) => {
        console.log('[WebRTC] Caller ontrack received:', event.track.kind);
        const remoteStr =
          event.streams[0] ||
          (remoteStreamRef.current ? remoteStreamRef.current : new MediaStream());

        if (!remoteStr.getTracks().some((t) => t.id === event.track.id)) {
          remoteStr.addTrack(event.track);
        }
        remoteStreamRef.current = remoteStr;
        const freshStream = new MediaStream(remoteStr.getTracks());
        setRemoteStream(freshStream);

        const hasVideoTrack = freshStream.getVideoTracks().some((t) => t.readyState === 'live');
        if (hasVideoTrack || event.track.kind === 'video') {
          setRemoteHasVideo(true);
        }

        if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== freshStream) {
          remoteVideoRef.current.srcObject = freshStream;
          remoteVideoRef.current.play().catch(() => {});
        }
        if (remoteAudioRef.current && remoteAudioRef.current.srcObject !== freshStream) {
          remoteAudioRef.current.srcObject = freshStream;
          playAudioSafely(remoteAudioRef.current);
        }

        markConnected();
      };

      // Emit local ICE candidates to Firestore via both document array (fast) and subcollection (backup)
      const candidatesCol = collection(db, 'rooms', roomId, 'calls', 'current', 'candidates');
      pc.onicecandidate = (event) => {
        if (event.candidate && event.candidate.candidate) {
          const item = sanitizeCandidateItem(event.candidate);
          updateDoc(callDocRef.current, {
            callerCandidates: arrayUnion(item),
          }).catch(() => {});

          const payload = sanitizeCandidate(event.candidate, newSessionId, 'caller');
          addDoc(candidatesCol, payload).catch(() => {});
        }
      };

      // Monitor connection states
      pc.onconnectionstatechange = () => {
        console.log('[WebRTC] Caller ConnectionState:', pc.connectionState);
        if (pc.connectionState === 'connected') {
          markConnected();
        } else if (
          pc.connectionState === 'disconnected' ||
          pc.connectionState === 'failed' ||
          pc.connectionState === 'closed'
        ) {
          if (durationTimerRef.current) {
            handleEndCall();
          }
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log('[WebRTC] Caller IceConnectionState:', pc.iceConnectionState);
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          markConnected();
        }
      };

      // 4. Generate SDP Offer
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: wantVideo,
      });
      await pc.setLocalDescription(offer);

      // 5. Publish call document to Firestore
      const callData: CallDataFirestore = {
        id: 'current',
        sessionId: newSessionId,
        callerId: myUserId,
        callerName: myUserName,
        callType: callType,
        status: 'calling',
        offer: { type: offer.type, sdp: offer.sdp || '' },
        videoEnabled: hasVideo,
        audioEnabled: true,
        callerCandidates: [],
        calleeCandidates: [],
        createdAt: new Date().toISOString(),
      };

      await setDoc(callDocRef.current, callData);

      // 6. Enter calling / ringing state & start outgoing ringing tone
      setCallStatus('calling');
      callAudioEffects.startOutgoingRinging();

      // 45-second timeout if peer doesn't pick up
      ringingTimeoutRef.current = window.setTimeout(async () => {
        callAudioEffects.stopRinging();
        callAudioEffects.playBusyTone();
        setCallStatus('missed');
        try {
          await updateDoc(callDocRef.current, {
            status: 'missed',
            endedAt: new Date().toISOString(),
          });
        } catch {
          // ignore
        }
        setTimeout(() => {
          cleanupCall();
          onClose();
        }, 3000);
      }, 45000);

      // 7. Listen to call document for answer, candidates, or status changes
      const unsubCallDoc = onSnapshot(callDocRef.current, async (snap) => {
        if (!snap.exists()) return;
        const data = snap.data() as CallDataFirestore;

        // Ensure update belongs to this specific call session
        if (data.sessionId && data.sessionId !== newSessionId) return;

        // Peer declined
        if (data.status === 'declined') {
          if (ringingTimeoutRef.current) clearTimeout(ringingTimeoutRef.current);
          callAudioEffects.stopRinging();
          callAudioEffects.playBusyTone();
          setCallStatus('declined');
          setTimeout(() => {
            cleanupCall();
            onClose();
          }, 2500);
          return;
        }

        // Call ended by peer
        if (data.status === 'ended') {
          if (ringingTimeoutRef.current) clearTimeout(ringingTimeoutRef.current);
          callAudioEffects.stopRinging();
          callAudioEffects.playEndCallTone();
          setCallStatus('ended');
          setTimeout(() => {
            cleanupCall();
            onClose();
          }, 1500);
          return;
        }

        // Callee video enabled status sync
        if (data.calleeVideoEnabled !== undefined) {
          setRemoteHasVideo(data.calleeVideoEnabled);
        }

        // Screen sharing sync
        if (data.isScreenSharing !== undefined) {
          const peerSharing = !!data.isScreenSharing && data.activeScreenSharer !== myUserId;
          setPeerIsScreenSharing(peerSharing);
          if (peerSharing) {
            setRemoteHasVideo(true);
          }
        }

        // Callee answered! Set remote description
        if (data.answer && !hasRemoteDescRef.current) {
          if (ringingTimeoutRef.current) clearTimeout(ringingTimeoutRef.current);
          callAudioEffects.stopRinging();
          setCallStatus('connecting');

          try {
            const rtcAnswer = new RTCSessionDescription(data.answer as RTCSessionDescriptionInit);
            await pc.setRemoteDescription(rtcAnswer);
            await flushPendingIceCandidates();
          } catch (err) {
            console.error('[WebRTC] Error applying remote answer:', err);
          }
        }

        // Process callee candidates from the call doc array
        if (Array.isArray(data.calleeCandidates)) {
          for (const cand of data.calleeCandidates) {
            if (cand && cand.candidate && !addedCandidatesRef.current.has(cand.candidate)) {
              addedCandidatesRef.current.add(cand.candidate);
              await handleAddIceCandidate({
                candidate: cand.candidate,
                sdpMid: cand.sdpMid || undefined,
                sdpMLineIndex: cand.sdpMLineIndex ?? undefined,
              });
            }
          }
        }
      });
      unsubscribersRef.current.push(unsubCallDoc);

      // 8. Backup listener: Callee ICE candidates from subcollection
      const unsubCandidates = onSnapshot(candidatesCol, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            const candData = change.doc.data() as CallCandidatePayload;
            if (candData.sessionId === newSessionId && candData.sender === 'callee') {
              if (candData.candidate && !addedCandidatesRef.current.has(candData.candidate)) {
                addedCandidatesRef.current.add(candData.candidate);
                await handleAddIceCandidate({
                  candidate: candData.candidate,
                  sdpMid: candData.sdpMid,
                  sdpMLineIndex: candData.sdpMLineIndex,
                });
              }
            }
          }
        });
      });
      unsubscribersRef.current.push(unsubCandidates);
    } catch (err: unknown) {
      console.error('[WebRTC] Caller initialization error:', err);
      callAudioEffects.stopRinging();
      setCallStatus('error');
      const errStr = err instanceof Error ? err.message : String(err);
      if (errStr.includes('Permission') || errStr.includes('denied') || errStr.includes('NotAllowedError')) {
        setErrorMessage(
          callType === 'video'
            ? 'Camera or microphone permission was denied. Please allow access in browser settings to make calls.'
            : 'Microphone permission was denied. Please allow microphone access in browser settings.'
        );
      } else {
        setErrorMessage(
          `Could not start ${callType === 'video' ? 'video' : 'voice'} call: ${
            err instanceof Error ? err.message : 'Media device error'
          }`
        );
      }
    }
  }, [
    roomId,
    myUserId,
    myUserName,
    callType,
    onClose,
    cleanupCall,
    markConnected,
    handleAddIceCandidate,
    flushPendingIceCandidates,
  ]);

  // -------------------------------------------------------------
  // Callee Flow: Answer call, create answer, exchange ICE candidates
  // -------------------------------------------------------------
  const answerCall = useCallback(async () => {
    try {
      isTerminatedRef.current = false;
      callAudioEffects.unlock();
      callAudioEffects.stopRinging();
      setCallStatus('connecting');
      setErrorMessage(null);
      hasRemoteDescRef.current = false;
      pendingIceCandidatesRef.current = [];
      addedCandidatesRef.current.clear();

      const wantVideo = (incomingCallData?.callType || callType) === 'video';

      // 1. Acquire media (with synthetic video fallback if camera is busy or unavailable)
      const { stream, hasVideo } = await getMediaStream(wantVideo, true, myUserName);
      localStreamRef.current = stream;
      setLocalStream(stream);

      if (hasVideo) {
        cameraTrackRef.current = stream.getVideoTracks()[0] || null;
      }

      // 2. Create RTCPeerConnection
      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionRef.current = pc;

      // Add local tracks
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle remote tracks
      pc.ontrack = (event) => {
        console.log('[WebRTC] Callee ontrack received:', event.track.kind);
        const remoteStr =
          event.streams[0] ||
          (remoteStreamRef.current ? remoteStreamRef.current : new MediaStream());

        if (!remoteStr.getTracks().some((t) => t.id === event.track.id)) {
          remoteStr.addTrack(event.track);
        }
        remoteStreamRef.current = remoteStr;
        const freshStream = new MediaStream(remoteStr.getTracks());
        setRemoteStream(freshStream);

        const hasVideoTrack = freshStream.getVideoTracks().some((t) => t.readyState === 'live');
        if (hasVideoTrack || event.track.kind === 'video') {
          setRemoteHasVideo(true);
        }

        if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== freshStream) {
          remoteVideoRef.current.srcObject = freshStream;
          remoteVideoRef.current.play().catch(() => {});
        }
        if (remoteAudioRef.current && remoteAudioRef.current.srcObject !== freshStream) {
          remoteAudioRef.current.srcObject = freshStream;
          playAudioSafely(remoteAudioRef.current);
        }

        markConnected();
      };

      // Read current session ID
      let activeSessionId = sessionIdRef.current;

      // Emit callee ICE candidates via doc array and subcollection
      const candidatesCol = collection(db, 'rooms', roomId, 'calls', 'current', 'candidates');
      pc.onicecandidate = (event) => {
        if (event.candidate && event.candidate.candidate) {
          const item = sanitizeCandidateItem(event.candidate);
          updateDoc(callDocRef.current, {
            calleeCandidates: arrayUnion(item),
          }).catch(() => {});

          const payload = sanitizeCandidate(event.candidate, activeSessionId, 'callee');
          addDoc(candidatesCol, payload).catch(() => {});
        }
      };

      // Connection status listeners
      pc.onconnectionstatechange = () => {
        console.log('[WebRTC] Callee ConnectionState:', pc.connectionState);
        if (pc.connectionState === 'connected') {
          markConnected();
        } else if (
          pc.connectionState === 'disconnected' ||
          pc.connectionState === 'failed' ||
          pc.connectionState === 'closed'
        ) {
          if (durationTimerRef.current) {
            handleEndCall();
          }
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log('[WebRTC] Callee IceConnectionState:', pc.iceConnectionState);
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          markConnected();
        }
      };

      // 3. Fetch latest call offer from Firestore to guarantee fresh SDP and initial candidates
      let offer = incomingCallData?.offer;
      let initialCallerCandidates: CandidateItem[] = [];
      const snap = await getDoc(callDocRef.current);
      if (snap.exists()) {
        const liveData = snap.data() as CallDataFirestore;
        if (liveData.offer) {
          offer = liveData.offer;
        }
        if (liveData.sessionId) {
          activeSessionId = liveData.sessionId;
          sessionIdRef.current = liveData.sessionId;
        }
        if (Array.isArray(liveData.callerCandidates)) {
          initialCallerCandidates = liveData.callerCandidates;
        }
        if (liveData.videoEnabled !== undefined) {
          setRemoteHasVideo(liveData.videoEnabled);
        }
      }

      if (!offer || !offer.sdp) {
        throw new Error('Call offer payload not found or expired');
      }

      // 4. Set remote description from caller's offer
      await pc.setRemoteDescription(new RTCSessionDescription(offer as RTCSessionDescriptionInit));
      await flushPendingIceCandidates();

      // Immediately flush any caller candidates that were already in the call document
      for (const c of initialCallerCandidates) {
        if (c && c.candidate && !addedCandidatesRef.current.has(c.candidate)) {
          addedCandidatesRef.current.add(c.candidate);
          await handleAddIceCandidate({
            candidate: c.candidate,
            sdpMid: c.sdpMid || undefined,
            sdpMLineIndex: c.sdpMLineIndex ?? undefined,
          });
        }
      }

      // 5. Create local answer and set local description
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // 6. Update Firestore call session with answer and callee's video status
      await updateDoc(callDocRef.current, {
        status: 'answered',
        answer: { type: answer.type, sdp: answer.sdp || '' },
        calleeVideoEnabled: hasVideo,
        answeredAt: new Date().toISOString(),
      });

      // 7. Listen to call document for subsequent caller candidates, video toggles, and status
      const unsubCallDoc = onSnapshot(callDocRef.current, async (snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.data() as CallDataFirestore;

        if (data.status === 'ended') {
          callAudioEffects.stopRinging();
          callAudioEffects.playEndCallTone();
          setCallStatus('ended');
          setTimeout(() => {
            cleanupCall();
            onClose();
          }, 1500);
          return;
        }

        if (data.videoEnabled !== undefined) {
          setRemoteHasVideo(data.videoEnabled);
        }

        if (data.isScreenSharing !== undefined) {
          const peerSharing = !!data.isScreenSharing && data.activeScreenSharer !== myUserId;
          setPeerIsScreenSharing(peerSharing);
          if (peerSharing) {
            setRemoteHasVideo(true);
          }
        }

        if (Array.isArray(data.callerCandidates)) {
          for (const c of data.callerCandidates) {
            if (c && c.candidate && !addedCandidatesRef.current.has(c.candidate)) {
              addedCandidatesRef.current.add(c.candidate);
              await handleAddIceCandidate({
                candidate: c.candidate,
                sdpMid: c.sdpMid || undefined,
                sdpMLineIndex: c.sdpMLineIndex ?? undefined,
              });
            }
          }
        }
      });
      unsubscribersRef.current.push(unsubCallDoc);

      // 8. Backup listener for caller ICE candidates from subcollection
      const unsubCandidates = onSnapshot(candidatesCol, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            const candData = change.doc.data() as CallCandidatePayload;
            if (candData.sessionId === activeSessionId && candData.sender === 'caller') {
              if (candData.candidate && !addedCandidatesRef.current.has(candData.candidate)) {
                addedCandidatesRef.current.add(candData.candidate);
                await handleAddIceCandidate({
                  candidate: candData.candidate,
                  sdpMid: candData.sdpMid,
                  sdpMLineIndex: candData.sdpMLineIndex,
                });
              }
            }
          }
        });
      });
      unsubscribersRef.current.push(unsubCandidates);
    } catch (err: unknown) {
      console.error('[WebRTC] Callee answer error:', err);
      setCallStatus('error');
      const errStr = err instanceof Error ? err.message : String(err);
      if (errStr.includes('Permission') || errStr.includes('denied') || errStr.includes('NotAllowedError')) {
        setErrorMessage(
          'Microphone or camera permission was denied. Please allow device access in browser settings.'
        );
      } else {
        setErrorMessage(
          'Could not answer call: ' + (err instanceof Error ? err.message : 'Device connection error')
        );
      }
    }
  }, [
    roomId,
    incomingCallData,
    callType,
    markConnected,
    handleAddIceCandidate,
    flushPendingIceCandidates,
  ]);

  // Decline incoming call
  const declineCall = async () => {
    callAudioEffects.stopRinging();
    try {
      await updateDoc(callDocRef.current, {
        status: 'declined',
        endedAt: new Date().toISOString(),
      });
    } catch {
      // ignore
    }
    cleanupCall();
    onClose();
  };

  // Hang up / End call
  const handleEndCall = async () => {
    callAudioEffects.playEndCallTone();
    try {
      await updateDoc(callDocRef.current, {
        status: 'ended',
        endedAt: new Date().toISOString(),
      });
    } catch {
      // ignore
    }
    cleanupCall();
    onClose();
  };

  // Toggle Audio Mute
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        const nextMuted = !audioTrack.enabled;
        setIsAudioMuted(nextMuted);
        const field = isCaller ? 'audioEnabled' : 'calleeAudioEnabled';
        updateDoc(callDocRef.current, { [field]: !nextMuted }).catch(() => {});
      }
    }
  };

  // Toggle Speaker Output Mute
  const toggleSpeaker = () => {
    const nextMuted = !isSpeakerMuted;
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = nextMuted;
    }
    setIsSpeakerMuted(nextMuted);
  };

  // Toggle Video Camera
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        const nextMuted = !videoTrack.enabled;
        setIsVideoMuted(nextMuted);
        const field = isCaller ? 'videoEnabled' : 'calleeVideoEnabled';
        updateDoc(callDocRef.current, { [field]: !nextMuted }).catch(() => {});
      }
    }
  };

  // Stop Screen Sharing Helper
  const stopScreenSharing = useCallback(async () => {
    if (!peerConnectionRef.current) return;
    try {
      if (screenTrackRef.current) {
        screenTrackRef.current.onended = null;
        screenTrackRef.current.stop();
        screenTrackRef.current = null;
      }

      const senders = peerConnectionRef.current.getSenders();
      const videoSender = senders.find((s) => s.track?.kind === 'video');

      if (cameraTrackRef.current && cameraTrackRef.current.readyState === 'live') {
        if (videoSender) {
          await videoSender.replaceTrack(cameraTrackRef.current);
        }
        if (localStreamRef.current) {
          setLocalStream(localStreamRef.current);
        }
      } else if (videoSender) {
        await videoSender.replaceTrack(null);
      }

      setIsScreenSharing(false);
      updateDoc(callDocRef.current, {
        isScreenSharing: false,
        activeScreenSharer: null,
      }).catch(() => {});
    } catch (err) {
      console.error('[WebRTC] Error stopping screen share:', err);
    }
  }, []);

  // Toggle Screen Sharing
  const toggleScreenShare = async () => {
    if (!peerConnectionRef.current) return;

    if (isScreenSharing) {
      await stopScreenSharing();
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        const screenTrack = screenStream.getVideoTracks()[0];
        if (!screenTrack) return;
        screenTrackRef.current = screenTrack;

        screenTrack.onended = () => {
          stopScreenSharing();
        };

        const senders = peerConnectionRef.current.getSenders();
        let videoSender = senders.find((s) => s.track?.kind === 'video');
        if (videoSender) {
          await videoSender.replaceTrack(screenTrack);
        } else {
          peerConnectionRef.current.addTrack(screenTrack, screenStream);
        }

        setLocalStream(screenStream);
        setIsScreenSharing(true);
        const field = isCaller ? 'videoEnabled' : 'calleeVideoEnabled';
        updateDoc(callDocRef.current, {
          [field]: true,
          isScreenSharing: true,
          activeScreenSharer: myUserId,
        }).catch(() => {});
      } catch (err: any) {
        if (err?.name !== 'NotAllowedError') {
          console.warn('[WebRTC] Screen sharing cancelled or failed:', err);
        }
      }
    }
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // -------------------------------------------------------------
  // Stream Bindings to DOM Video & Audio Elements via Callback Refs
  // -------------------------------------------------------------
  const bindLocalVideo = useCallback((node: HTMLVideoElement | null) => {
    localVideoRef.current = node;
    if (node && localStream) {
      if (node.srcObject !== localStream) {
        node.srcObject = localStream;
      }
      node.play().catch(() => {});
    }
  }, [localStream]);

  const bindRemoteVideo = useCallback((node: HTMLVideoElement | null) => {
    remoteVideoRef.current = node;
    if (node && remoteStream) {
      if (node.srcObject !== remoteStream) {
        node.srcObject = remoteStream;
      }
      node.play().catch((err) => {
        console.warn('[WebRTC] remote video play error:', err);
      });
    }
  }, [remoteStream]);

  const bindRemoteAudio = useCallback((node: HTMLAudioElement | null) => {
    remoteAudioRef.current = node;
    if (node && remoteStream) {
      if (node.srcObject !== remoteStream) {
        node.srcObject = remoteStream;
      }
      playAudioSafely(node);
    }
  }, [remoteStream]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      if (localVideoRef.current.srcObject !== localStream) {
        localVideoRef.current.srcObject = localStream;
      }
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream, isScreenSharing]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      if (remoteVideoRef.current.srcObject !== remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      remoteVideoRef.current.play().catch((err) => {
        console.warn('[WebRTC] remote video play error:', err);
      });
    }

    if (remoteAudioRef.current && remoteStream) {
      if (remoteAudioRef.current.srcObject !== remoteStream) {
        remoteAudioRef.current.srcObject = remoteStream;
      }
      playAudioSafely(remoteAudioRef.current);
    }
  }, [remoteStream]);

  // -------------------------------------------------------------
  // Initialize call on modal open
  // -------------------------------------------------------------
  useEffect(() => {
    if (!isOpen) return;

    if (isCaller) {
      initiateCaller();
    } else {
      setCallStatus('ringing');
      callAudioEffects.startIncomingRinging();

      // Listen to call cancellation while ringing
      const unsubCallDoc = onSnapshot(callDocRef.current, (snap) => {
        if (!snap.exists()) return;
        const data = snap.data() as CallDataFirestore;
        if (data.status === 'ended') {
          callAudioEffects.stopRinging();
          callAudioEffects.playEndCallTone();
          setCallStatus('ended');
          setTimeout(() => {
            cleanupCall();
            onClose();
          }, 1500);
        }
      });
      unsubscribersRef.current.push(unsubCallDoc);
    }

    // Voice frequency animation ticker for voice calls
    audioMeterTimerRef.current = window.setInterval(() => {
      setSpeechEnergy(Math.floor(20 + Math.random() * 60));
    }, 150);

    return () => {
      cleanupCall();
    };
  }, [isOpen, isCaller]); // Intentionally stable dependencies

  if (!isOpen) return null;

  const isAudioCall = callType === 'audio' || incomingCallData?.callType === 'audio';

  return (
    <div
      ref={containerRef}
      id="call-modal-container"
      className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-2xl flex flex-col items-center justify-center p-2 sm:p-4 text-white select-none animate-in fade-in duration-200"
    >
      {/* Dedicated audio element for remote speech audio in all call modes */}
      <audio ref={bindRemoteAudio} autoPlay playsInline />

      {/* Top Header Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 pointer-events-auto">
        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-lg">
          <div className="relative">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-md ${
                isAudioCall
                  ? 'bg-gradient-to-tr from-sky-600 to-indigo-500'
                  : 'bg-gradient-to-tr from-emerald-600 to-teal-500'
              }`}
            >
              {peerUserName.slice(0, 2).toUpperCase()}
            </div>
            {callStatus === 'connected' && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full animate-pulse" />
            )}
          </div>
          <div>
            <div className="font-semibold text-sm sm:text-base flex items-center gap-2">
              <span>{peerUserName}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono">
                Room #{roomId}
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
              {callStatus === 'connected' ? (
                <>
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
                  <span>{formatDuration(callDuration)}</span>
                  <span className="text-emerald-400 font-sans ml-1 text-[11px] font-semibold">
                    • {isAudioCall ? 'Free Voice Call (P2P)' : 'HD Video Call'}
                  </span>
                </>
              ) : callStatus === 'calling' ? (
                <span className="text-sky-400 animate-pulse">Calling peer... Waiting for answer...</span>
              ) : callStatus === 'ringing' ? (
                <span className="text-amber-400 animate-pulse">Incoming call ringing...</span>
              ) : callStatus === 'connecting' ? (
                <span className="text-emerald-400 animate-pulse">Connecting peer-to-peer stream...</span>
              ) : callStatus === 'declined' ? (
                <span className="text-rose-400">Call was declined</span>
              ) : callStatus === 'missed' ? (
                <span className="text-amber-400">No answer from peer</span>
              ) : callStatus === 'ended' ? (
                <span className="text-slate-400">Call ended</span>
              ) : (
                <span>Securing connection...</span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={toggleFullscreen}
          id="call-fullscreen-btn"
          className="p-2.5 bg-slate-900/80 backdrop-blur-md hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-white/10 transition-colors cursor-pointer"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Main Center Call Stage */}
      <div className="relative w-full h-full max-w-6xl max-h-[88vh] rounded-3xl overflow-hidden bg-slate-900 border border-white/10 shadow-2xl flex items-center justify-center">
        {/* Screen Sharing Active Banner Notification */}
        {peerIsScreenSharing && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-slate-950/90 backdrop-blur-md border border-emerald-500/50 text-emerald-300 text-xs font-semibold shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
            <Monitor className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>{peerUserName} is sharing their screen</span>
          </div>
        )}

        {isScreenSharing && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-slate-950/90 backdrop-blur-md border border-emerald-500/50 text-emerald-300 text-xs font-semibold shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
            <Monitor className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>You are sharing your screen</span>
            <button
              onClick={stopScreenSharing}
              className="ml-2 px-2.5 py-0.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[11px] font-bold border border-rose-500/30 transition-colors cursor-pointer"
            >
              Stop Sharing
            </button>
          </div>
        )}

        {/* Video Mode OR Active Screen Share Presentation View */}
        {(!isAudioCall || peerIsScreenSharing || isScreenSharing) && (
          <video
            ref={bindRemoteVideo}
            id="remote-video-element"
            autoPlay
            playsInline
            muted
            className={`w-full h-full transition-opacity duration-300 ${
              peerIsScreenSharing || isScreenSharing
                ? 'object-contain bg-black'
                : 'object-cover'
            } ${
              callStatus === 'connected' || (remoteStream && remoteStream.getVideoTracks().length > 0)
                ? 'opacity-100'
                : 'opacity-0'
            }`}
          />
        )}

        {/* VOICE MODE: High-End Acoustic Pulse & Waveform Stage (when no screen is shared) */}
        {isAudioCall && !peerIsScreenSharing && !isScreenSharing && callStatus === 'connected' && (
          <div className="flex flex-col items-center justify-center p-8 z-10 space-y-8">
            {/* Concentric Audio Waves */}
            <div className="relative flex items-center justify-center">
              <div
                style={{ transform: `scale(${1 + speechEnergy * 0.005})` }}
                className="absolute w-56 h-56 rounded-full border border-sky-500/20 bg-sky-500/5 transition-transform duration-150"
              />
              <div
                style={{ transform: `scale(${1 + speechEnergy * 0.003})` }}
                className="absolute w-44 h-44 rounded-full border border-sky-500/30 bg-sky-500/10 transition-transform duration-150"
              />
              <div className="relative w-32 h-32 rounded-3xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-teal-400 flex items-center justify-center text-4xl font-bold text-white shadow-2xl ring-8 ring-sky-500/20">
                {peerUserName.slice(0, 2).toUpperCase()}
              </div>
            </div>

            {/* Voice Activity Indicator Bars */}
            <div className="flex items-center gap-1.5 h-10">
              {[0.4, 0.8, 1, 0.6, 0.9, 0.5, 0.7, 0.3, 0.85, 0.65].map((factor, idx) => (
                <div
                  key={idx}
                  style={{
                    height: `${Math.max(6, Math.min(36, speechEnergy * factor))}px`,
                  }}
                  className="w-1.5 bg-gradient-to-t from-sky-500 to-teal-300 rounded-full transition-all duration-100"
                />
              ))}
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold">{peerUserName}</h3>
              <p className="text-xs text-slate-400 flex items-center justify-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Encrypted Peer-to-Peer Voice Stream</span>
                <span>•</span>
                <span>100% Free Internet Audio</span>
              </p>
            </div>
          </div>
        )}

        {/* NON-CONNECTED STATES (Ringing, Calling, Connecting, Errors) */}
        {callStatus !== 'connected' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-slate-950/60 backdrop-blur-sm">
            {callStatus === 'ringing' ? (
              // CALLEE RINGING SCREEN
              <div className="flex flex-col items-center max-w-sm animate-in zoom-in-95 duration-200">
                <div className="relative mb-6">
                  <div
                    className={`w-24 h-24 rounded-3xl flex items-center justify-center text-3xl font-bold text-white shadow-xl ring-8 animate-pulse ${
                      isAudioCall
                        ? 'bg-gradient-to-tr from-sky-600 to-indigo-500 ring-sky-500/20'
                        : 'bg-gradient-to-tr from-emerald-600 to-teal-400 ring-emerald-500/20'
                    }`}
                  >
                    {peerUserName.slice(0, 2).toUpperCase()}
                  </div>
                  <div
                    className={`absolute -inset-3 rounded-3xl border-2 animate-ping ${
                      isAudioCall ? 'border-sky-400/40' : 'border-emerald-400/40'
                    }`}
                  />
                </div>

                <span
                  className={`text-xs uppercase tracking-widest font-bold px-3 py-1 rounded-full mb-3 ${
                    isAudioCall
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {isAudioCall ? 'Incoming Free Voice Call' : 'Incoming HD Video Call'}
                </span>

                <h3 className="text-2xl font-bold mb-1">{incomingCallData?.callerName || peerUserName}</h3>
                <p className="text-sm text-slate-400 mb-8 leading-relaxed">
                  Inviting you to a private 1-to-1 {isAudioCall ? 'voice call' : 'video call'} in Room #{roomId}.
                </p>

                <div className="flex items-center gap-4">
                  <button
                    onClick={declineCall}
                    id="call-decline-btn"
                    className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-semibold transition-all shadow-lg shadow-rose-600/30 cursor-pointer"
                  >
                    <PhoneOff className="w-5 h-5" />
                    Decline
                  </button>

                  <button
                    onClick={answerCall}
                    id="call-answer-btn"
                    className={`flex items-center gap-2 px-7 py-3.5 rounded-2xl active:scale-95 text-slate-950 font-bold transition-all shadow-lg cursor-pointer ${
                      isAudioCall
                        ? 'bg-sky-400 hover:bg-sky-300 shadow-sky-400/40'
                        : 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/40'
                    }`}
                  >
                    {isAudioCall ? (
                      <>
                        <Phone className="w-5 h-5 text-slate-950" />
                        Answer Voice Call
                      </>
                    ) : (
                      <>
                        <Video className="w-5 h-5 text-slate-950" />
                        Answer with Video
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : callStatus === 'calling' ? (
              // CALLER CALLING SCREEN
              <div className="flex flex-col items-center max-w-sm animate-in zoom-in-95 duration-200">
                <div className="relative mb-6">
                  <div
                    className={`w-24 h-24 rounded-3xl flex items-center justify-center text-3xl font-bold text-white shadow-xl ring-8 animate-pulse ${
                      isAudioCall
                        ? 'bg-gradient-to-tr from-sky-600 to-indigo-500 ring-sky-500/20'
                        : 'bg-gradient-to-tr from-emerald-600 to-teal-400 ring-emerald-500/20'
                    }`}
                  >
                    {peerUserName.slice(0, 2).toUpperCase()}
                  </div>
                  <div
                    className={`absolute -inset-3 rounded-3xl border-2 animate-ping ${
                      isAudioCall ? 'border-sky-400/40' : 'border-emerald-400/40'
                    }`}
                  />
                </div>

                <span
                  className={`text-xs uppercase tracking-widest font-bold px-3 py-1 rounded-full mb-3 ${
                    isAudioCall
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {isAudioCall ? 'Voice Call' : 'Video Call'}
                </span>

                <h3 className="text-xl font-bold mb-1">Calling {peerUserName}...</h3>
                <p className="text-sm text-slate-400 mb-8 leading-relaxed">
                  Ringing peer in Room #{roomId}... Waiting for answer...
                </p>

                <button
                  onClick={handleEndCall}
                  id="call-cancel-btn"
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-semibold transition-all shadow-lg shadow-rose-600/30 cursor-pointer"
                >
                  <PhoneOff className="w-5 h-5" />
                  Cancel Call
                </button>
              </div>
            ) : callStatus === 'connecting' ? (
              // CONNECTING PEER-TO-PEER STATE
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 border-4 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin mb-4" />
                <h4 className="text-base font-bold text-slate-200 mb-1">Securing Direct Stream</h4>
                <p className="text-slate-400 text-xs">Exchanging ICE candidates and establishing P2P connection...</p>
              </div>
            ) : callStatus === 'declined' ? (
              // DECLINED SCREEN
              <div className="flex flex-col items-center max-w-sm">
                <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4 border border-rose-500/20">
                  <PhoneOff className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-rose-300 mb-1">Call Declined</h3>
                <p className="text-xs text-slate-400">{peerUserName} declined the call.</p>
              </div>
            ) : callStatus === 'missed' ? (
              // MISSED / NO ANSWER SCREEN
              <div className="flex flex-col items-center max-w-sm">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 border border-amber-500/20">
                  <PhoneOff className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-amber-300 mb-1">No Answer</h3>
                <p className="text-xs text-slate-400">{peerUserName} did not respond to the call.</p>
              </div>
            ) : callStatus === 'error' ? (
              // PERMISSION OR DEVICE ERROR SCREEN
              <div className="flex flex-col items-center max-w-md bg-slate-950/80 p-8 rounded-3xl border border-rose-500/30 shadow-2xl">
                <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4 border border-rose-500/20">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-rose-300 mb-2">Device Permission Required</h3>
                <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                  {errorMessage || 'Could not access audio/video devices.'}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => (isCaller ? initiateCaller() : answerCall())}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                  </button>
                  <button
                    onClick={() => {
                      cleanupCall();
                      onClose();
                    }}
                    className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ) : (
              // FALLBACK TRANSITION SCREEN
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-slate-700 border-t-slate-400 rounded-full animate-spin mb-4" />
                <p className="text-slate-400 text-sm font-medium">Securing connection...</p>
              </div>
            )}
          </div>
        )}

        {/* Remote Camera Muted Overlay in Video Mode */}
        {!isAudioCall && !peerIsScreenSharing && callStatus === 'connected' && !remoteHasVideo && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 z-0">
            <div className="w-20 h-20 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center text-2xl font-bold text-slate-300 mb-3">
              {peerUserName.slice(0, 2).toUpperCase()}
            </div>
            <p className="text-sm text-slate-400">{peerUserName} turned off their camera</p>
          </div>
        )}

        {/* Local Video Floating Picture-in-Picture */}
        {(!isAudioCall || isScreenSharing) && localStream && localStream.getVideoTracks().length > 0 && (
          <div
            id="local-video-pip-container"
            className="absolute bottom-20 sm:bottom-24 right-4 sm:right-6 w-32 sm:w-48 aspect-video rounded-2xl overflow-hidden bg-slate-950 border-2 border-white/20 shadow-2xl z-20 transition-all hover:scale-105"
          >
            <video
              ref={bindLocalVideo}
              id="local-video-element"
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${!isScreenSharing ? '-scale-x-100' : ''}`}
            />
            {isVideoMuted && !isScreenSharing && (
              <div className="absolute inset-0 bg-slate-900/90 flex items-center justify-center flex-col gap-1">
                <VideoOff className="w-5 h-5 text-slate-400" />
                <span className="text-[10px] text-slate-400 font-medium">Camera Off</span>
              </div>
            )}
            <div className="absolute bottom-1.5 left-2 text-[10px] font-semibold bg-black/60 px-1.5 py-0.5 rounded text-white/90">
              {isScreenSharing ? 'Presenting Screen' : `You ${isAudioMuted ? '• Muted' : ''}`}
            </div>
          </div>
        )}

        {/* Bottom Control Bar */}
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 sm:gap-3 bg-slate-950/85 backdrop-blur-xl px-4 sm:px-6 py-3 rounded-full border border-white/10 shadow-2xl">
          {/* Mute / Unmute Microphone */}
          <button
            onClick={toggleAudio}
            id="call-mute-audio-btn"
            className={`p-3 rounded-full transition-all active:scale-90 cursor-pointer ${
              isAudioMuted
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            title={isAudioMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Speaker Mute / Unmute */}
          <button
            onClick={toggleSpeaker}
            id="call-mute-speaker-btn"
            className={`p-3 rounded-full transition-all active:scale-90 cursor-pointer ${
              isSpeakerMuted
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            title={isSpeakerMuted ? 'Unmute Speaker' : 'Mute Speaker'}
          >
            {isSpeakerMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          {/* Camera On / Off (Only in Video Mode) */}
          {!isAudioCall && (
            <button
              onClick={toggleVideo}
              id="call-mute-video-btn"
              className={`p-3 rounded-full transition-all active:scale-90 cursor-pointer ${
                isVideoMuted
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              title={isVideoMuted ? 'Turn Camera On' : 'Turn Camera Off'}
            >
              {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
          )}

          {/* Screen Share (Available in both Video and Voice Calls) */}
          <button
            onClick={toggleScreenShare}
            id="call-screen-share-btn"
            className={`p-3 rounded-full transition-all active:scale-90 cursor-pointer ${
              isScreenSharing
                ? 'bg-emerald-500 text-neutral-950 font-bold shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400/50'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
          >
            <Monitor className="w-5 h-5" />
          </button>

          <div className="w-px h-6 bg-white/20 mx-1" />

          {/* End / Hang Up Button */}
          <button
            onClick={handleEndCall}
            id="call-hangup-btn"
            className="flex items-center gap-2 px-5 py-3 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold transition-all shadow-lg shadow-rose-600/40 cursor-pointer"
            title="End Call"
          >
            <PhoneOff className="w-5 h-5" />
            <span className="hidden sm:inline">End Call</span>
          </button>
        </div>
      </div>
    </div>
  );
};
