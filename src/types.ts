export type UserRole = 'teacher' | 'student';

export interface ClassroomUser {
  id: string;
  name: string;
  role: UserRole;
  joinedAt: string;
  handRaised: boolean;
  handRaisedAt?: number;
  isMuted: boolean;
  isVideoActive: boolean;
  isAudioActive: boolean;
}

export type ToolType = 'pen' | 'highlighter' | 'eraser' | 'line' | 'rect' | 'circle' | 'arrow' | 'text';

export interface DrawPoint {
  x: number;
  y: number;
}

export interface DrawElement {
  id: string;
  type: ToolType;
  points?: DrawPoint[];
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  text?: string;
  color: string;
  strokeWidth: number;
  opacity?: number;
  page: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  timestamp: string;
  isAnnouncement?: boolean;
}

export interface PollOption {
  id: string;
  text: string;
  votes: string[]; // array of userIds
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  isActive: boolean;
  createdByName: string;
  createdAt: string;
}

export interface ClassroomState {
  roomId: string;
  roomName: string;
  teacherId: string;
  teacherName: string;
  users: ClassroomUser[];
  chatMessages: ChatMessage[];
  drawElements: DrawElement[];
  currentPage: number;
  totalPages: number;
  slideImages: string[]; // Base64 or URL
  activePoll: Poll | null;
  teacherIsSharingScreen: boolean;
  teacherHasVideo: boolean;
  teacherHasAudio: boolean;
}

export interface WsMessage {
  type:
    | 'JOIN_ROOM'
    | 'ROOM_STATE'
    | 'USER_JOINED'
    | 'USER_LEFT'
    | 'DRAW_ELEMENT'
    | 'CLEAR_BOARD'
    | 'CHANGE_PAGE'
    | 'UPLOAD_SLIDES'
    | 'CHAT_MESSAGE'
    | 'RAISE_HAND'
    | 'LOWER_HAND'
    | 'TOGGLE_MUTE'
    | 'CREATE_POLL'
    | 'VOTE_POLL'
    | 'CLOSE_POLL'
    | 'TEACHER_MEDIA_STATE'
    | 'WEBRTC_SIGNAL'
    | 'ERROR';
  payload: any;
  senderId?: string;
}
