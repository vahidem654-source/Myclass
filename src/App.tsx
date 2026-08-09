import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Users,
  MessageSquare,
  BarChart2,
  Video,
  Sparkles,
  Share2,
  Layers,
  Hand,
} from 'lucide-react';
import {
  ClassroomState,
  ClassroomUser,
  DrawElement,
  UserRole,
  WsMessage,
} from './types';
import { ClassroomHeader } from './components/ClassroomHeader';
import { Whiteboard } from './components/Whiteboard';
import { VideoGrid } from './components/VideoGrid';
import { AttendanceList } from './components/AttendanceList';
import { LiveChat } from './components/LiveChat';
import { PollsAndQuiz } from './components/PollsAndQuiz';
import { RoomJoinModal } from './components/RoomJoinModal';
import { AiAssistantModal } from './components/AiAssistantModal';

export default function App() {
  const [inRoom, setInRoom] = useState<boolean>(false);
  const [userId] = useState<string>(
    () => 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4)
  );
  const [userName, setUserName] = useState<string>('');
  const [userRole, setUserRole] = useState<UserRole>('student');
  const [roomId, setRoomId] = useState<string>('');
  const [roomName, setRoomName] = useState<string>('کلاس آنلاین');

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'whiteboard' | 'attendance' | 'chat' | 'polls'>('whiteboard');
  const [showAiModal, setShowAiModal] = useState<boolean>(false);

  // Classroom State
  const [roomState, setRoomState] = useState<ClassroomState>({
    roomId: '',
    roomName: '',
    teacherId: '',
    teacherName: 'استاد',
    users: [],
    chatMessages: [],
    drawElements: [],
    currentPage: 1,
    totalPages: 1,
    slideImages: [],
    activePoll: null,
    teacherIsSharingScreen: false,
    teacherHasVideo: false,
    teacherHasAudio: false,
  });

  const wsRef = useRef<WebSocket | null>(null);

  // Connect WebSocket when room is joined
  useEffect(() => {
    if (!inRoom || !roomId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      // Send JOIN_ROOM message
      ws.send(
        JSON.stringify({
          type: 'JOIN_ROOM',
          payload: {
            roomId,
            userId,
            name: userName,
            role: userRole,
            roomName: userRole === 'teacher' ? roomName : undefined,
          },
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const msg: WsMessage = JSON.parse(event.data);
        if (msg.type === 'ROOM_STATE') {
          setRoomState(msg.payload);
        } else if (msg.type === 'DRAW_ELEMENT') {
          setRoomState((prev) => ({
            ...prev,
            drawElements: [...prev.drawElements, msg.payload],
          }));
        } else if (msg.type === 'CLEAR_BOARD') {
          setRoomState((prev) => ({
            ...prev,
            drawElements: prev.drawElements.filter((el) => el.page !== msg.payload.page),
          }));
        } else if (msg.type === 'CHANGE_PAGE') {
          setRoomState((prev) => ({
            ...prev,
            currentPage: msg.payload.page,
          }));
        } else if (msg.type === 'CHAT_MESSAGE') {
          setRoomState((prev) => ({
            ...prev,
            chatMessages: [...prev.chatMessages, msg.payload],
          }));
        } else if (msg.type === 'TEACHER_MEDIA_STATE') {
          setRoomState((prev) => ({
            ...prev,
            teacherIsSharingScreen:
              msg.payload.teacherIsSharingScreen !== undefined
                ? msg.payload.teacherIsSharingScreen
                : prev.teacherIsSharingScreen,
            teacherHasVideo:
              msg.payload.teacherHasVideo !== undefined
                ? msg.payload.teacherHasVideo
                : prev.teacherHasVideo,
            teacherHasAudio:
              msg.payload.teacherHasAudio !== undefined
                ? msg.payload.teacherHasAudio
                : prev.teacherHasAudio,
          }));
        }
      } catch (err) {
        console.error('Error parsing WS message:', err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [inRoom, roomId, userId, userName, userRole, roomName]);

  const sendWs = (type: WsMessage['type'], payload: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload, senderId: userId }));
    }
  };

  const handleJoinRoom = (
    rId: string,
    uName: string,
    role: UserRole,
    rName?: string
  ) => {
    setRoomId(rId);
    setUserName(uName);
    setUserRole(role);
    if (rName) setRoomName(rName);
    setInRoom(true);
  };

  const handleLeaveRoom = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    setInRoom(false);
  };

  // Whiteboard Actions
  const handleDrawElement = (element: DrawElement) => {
    sendWs('DRAW_ELEMENT', element);
    setRoomState((prev) => ({
      ...prev,
      drawElements: [...prev.drawElements, element],
    }));
  };

  const handleClearBoard = (page: number) => {
    sendWs('CLEAR_BOARD', { page });
    setRoomState((prev) => ({
      ...prev,
      drawElements: prev.drawElements.filter((el) => el.page !== page),
    }));
  };

  const handleChangePage = (page: number) => {
    sendWs('CHANGE_PAGE', { page });
    setRoomState((prev) => ({ ...prev, currentPage: page }));
  };

  const handleUploadSlides = (slides: string[]) => {
    sendWs('UPLOAD_SLIDES', { slides });
  };

  // Chat Actions
  const handleSendMessage = (text: string, isAnnouncement?: boolean) => {
    sendWs('CHAT_MESSAGE', {
      senderName: userName,
      senderRole: userRole,
      text,
      isAnnouncement,
    });
  };

  // Student Raise Hand
  const handleToggleRaiseHand = (raised: boolean) => {
    sendWs('RAISE_HAND', { raised });
  };

  // Teacher Controls
  const handleLowerHand = (targetUserId: string) => {
    sendWs('RAISE_HAND', { targetUserId, raised: false });
  };

  const handleToggleMute = (targetUserId: string, isMuted: boolean) => {
    sendWs('TOGGLE_MUTE', { targetUserId, isMuted });
  };

  // Polls & Quizzes
  const handleCreatePoll = (question: string, options: string[]) => {
    sendWs('CREATE_POLL', { question, options });
  };

  const handleVotePoll = (optionId: string) => {
    sendWs('VOTE_POLL', { optionId, userId });
  };

  const handleClosePoll = () => {
    sendWs('CLOSE_POLL', {});
  };

  // Teacher Media State Update
  const handleUpdateMediaState = (state: {
    hasVideo?: boolean;
    hasAudio?: boolean;
    isSharingScreen?: boolean;
  }) => {
    sendWs('TEACHER_MEDIA_STATE', state);
  };

  const currentUserObj = roomState.users.find((u) => u.id === userId);
  const handRaised = currentUserObj ? currentUserObj.handRaised : false;

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {!inRoom ? (
        <RoomJoinModal onJoinRoom={handleJoinRoom} />
      ) : (
        <>
          {/* Top Header */}
          <ClassroomHeader
            roomName={roomState.roomName || roomName}
            roomId={roomId}
            userName={userName}
            role={userRole}
            userCount={roomState.users.length}
            isConnected={isConnected}
            onOpenAiModal={() => setShowAiModal(true)}
            onOpenShareModal={() => {
              let origin = window.location.origin;
              if (origin.includes('ais-dev-')) {
                origin = origin.replace('ais-dev-', 'ais-pre-');
              }
              const url = `${origin}${window.location.pathname}?room=${roomId}&role=student`;
              navigator.clipboard.writeText(url);
              alert('لینک عمومی و بدون نیاز به ورود دانش‌آموزان کپی شد:\n\n' + url + '\n\nاین لینک برای تمامی دانش‌آموزان روی موبایل و کامپیوتر قابل باز شدن است.');
            }}
            onLeaveRoom={handleLeaveRoom}
          />

          {/* Main Layout Grid */}
          <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 overflow-hidden">
            {/* Left Column (Desktop: 8 cols / Mobile: full) - Video Stream & Interactive Whiteboard */}
            <section className="lg:col-span-8 flex flex-col gap-3 h-full overflow-hidden">
              {/* Teacher Video / Screen Stream Box */}
              <div className="shrink-0">
                <VideoGrid
                  role={userRole}
                  teacherName={roomState.teacherName || 'استاد'}
                  teacherHasVideo={roomState.teacherHasVideo}
                  teacherHasAudio={roomState.teacherHasAudio}
                  teacherIsSharingScreen={roomState.teacherIsSharingScreen}
                  onUpdateMediaState={handleUpdateMediaState}
                />
              </div>

              {/* Whiteboard Interactive Canvas */}
              <div className="flex-1 min-h-[350px]">
                <Whiteboard
                  elements={roomState.drawElements}
                  currentPage={roomState.currentPage}
                  totalPages={roomState.totalPages}
                  slideImages={roomState.slideImages}
                  role={userRole}
                  onDrawElement={handleDrawElement}
                  onClearBoard={handleClearBoard}
                  onChangePage={handleChangePage}
                  onUploadSlides={handleUploadSlides}
                />
              </div>
            </section>

            {/* Right Column (Desktop: 4 cols / Mobile: full with tab switcher) */}
            <section className="lg:col-span-4 flex flex-col h-full overflow-hidden">
              {/* Navigation Tabs for Right Panel */}
              <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 mb-2">
                <button
                  onClick={() => setActiveTab('attendance')}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    activeTab === 'attendance'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>حضور و غیاب ({roomState.users.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer relative ${
                    activeTab === 'chat'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>چت آنلاین</span>
                </button>

                <button
                  onClick={() => setActiveTab('polls')}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer relative ${
                    activeTab === 'polls'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>کوییز / سوالات</span>
                  {roomState.activePoll && roomState.activePoll.isActive && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute top-1 right-2" />
                  )}
                </button>
              </div>

              {/* Tab Panel Render */}
              <div className="flex-1 overflow-hidden">
                {activeTab === 'attendance' && (
                  <AttendanceList
                    users={roomState.users}
                    currentUserId={userId}
                    role={userRole}
                    onLowerHand={handleLowerHand}
                    onToggleMute={handleToggleMute}
                  />
                )}

                {activeTab === 'chat' && (
                  <LiveChat
                    messages={roomState.chatMessages}
                    currentUserId={userId}
                    userName={userName}
                    role={userRole}
                    handRaised={handRaised}
                    onSendMessage={handleSendMessage}
                    onToggleRaiseHand={handleToggleRaiseHand}
                  />
                )}

                {activeTab === 'polls' && (
                  <PollsAndQuiz
                    activePoll={roomState.activePoll}
                    currentUserId={userId}
                    role={userRole}
                    onCreatePoll={handleCreatePoll}
                    onVotePoll={handleVotePoll}
                    onClosePoll={handleClosePoll}
                    onOpenAiQuizModal={() => setShowAiModal(true)}
                  />
                )}
              </div>
            </section>
          </main>

          {/* Gemini AI Assistant Modal */}
          <AiAssistantModal
            isOpen={showAiModal}
            onClose={() => setShowAiModal(false)}
            onCreatePoll={handleCreatePoll}
          />
        </>
      )}
    </div>
  );
}
