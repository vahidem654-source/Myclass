import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

interface ClientConnection {
  ws: WebSocket;
  userId: string;
  roomId: string;
}

const app = express();
app.use(express.json({ limit: '25mb' }));

const PORT = 3000;
const server = createServer(app);
const wss = new WebSocketServer({ server });

// In-memory Room State storage
interface RoomData {
  roomId: string;
  roomName: string;
  teacherId: string;
  teacherName: string;
  users: Map<string, {
    id: string;
    name: string;
    role: 'teacher' | 'student';
    joinedAt: string;
    handRaised: boolean;
    handRaisedAt?: number;
    isMuted: boolean;
    isVideoActive: boolean;
    isAudioActive: boolean;
  }>;
  chatMessages: any[];
  drawElements: any[];
  currentPage: number;
  totalPages: number;
  slideImages: string[];
  activePoll: any | null;
  teacherIsSharingScreen: boolean;
  teacherHasVideo: boolean;
  teacherHasAudio: boolean;
}

const rooms = new Map<string, RoomData>();
const clients = new Map<WebSocket, ClientConnection>();

function getOrCreateRoom(roomId: string, roomName?: string, teacherName?: string): RoomData {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      roomId,
      roomName: roomName || `کلاس آنلاین (${roomId})`,
      teacherId: '',
      teacherName: teacherName || 'استاد',
      users: new Map(),
      chatMessages: [
        {
          id: 'welcome-1',
          senderId: 'system',
          senderName: 'سامانه',
          senderRole: 'teacher',
          text: 'به کلاس آنلاین خوش آمدید! استاد و دانش‌آموزان می‌توانند به صورت همزمان از تخته، چت، آزمون و ویدیو استفاده کنند.',
          timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
          isAnnouncement: true,
        },
      ],
      drawElements: [],
      currentPage: 1,
      totalPages: 1,
      slideImages: [],
      activePoll: null,
      teacherIsSharingScreen: false,
      teacherHasVideo: false,
      teacherHasAudio: false,
    });
  }
  return rooms.get(roomId)!;
}

function broadcastToRoom(roomId: string, message: any, excludeWs?: WebSocket) {
  const payloadStr = JSON.stringify(message);
  for (const [ws, conn] of clients.entries()) {
    if (conn.roomId === roomId && ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      ws.send(payloadStr);
    }
  }
}

function getFormattedRoomState(room: RoomData) {
  return {
    roomId: room.roomId,
    roomName: room.roomName,
    teacherId: room.teacherId,
    teacherName: room.teacherName,
    users: Array.from(room.users.values()),
    chatMessages: room.chatMessages,
    drawElements: room.drawElements,
    currentPage: room.currentPage,
    totalPages: room.totalPages,
    slideImages: room.slideImages,
    activePoll: room.activePoll,
    teacherIsSharingScreen: room.teacherIsSharingScreen,
    teacherHasVideo: room.teacherHasVideo,
    teacherHasAudio: room.teacherHasAudio,
  };
}

// WebSocket Event Handler
wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      const { type, payload, senderId } = msg;

      if (type === 'JOIN_ROOM') {
        const { roomId, userId, name, role, roomName } = payload;
        const room = getOrCreateRoom(roomId, roomName, role === 'teacher' ? name : undefined);

        if (role === 'teacher') {
          room.teacherId = userId;
          room.teacherName = name;
        }

        const newUser = {
          id: userId,
          name: name || (role === 'teacher' ? 'استاد' : 'دانش‌آموز'),
          role: role as 'teacher' | 'student',
          joinedAt: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
          handRaised: false,
          isMuted: false,
          isVideoActive: false,
          isAudioActive: false,
        };

        room.users.set(userId, newUser);
        clients.set(ws, { ws, userId, roomId });

        // Send full state back to joining user
        ws.send(
          JSON.stringify({
            type: 'ROOM_STATE',
            payload: getFormattedRoomState(room),
          })
        );

        // Notify others
        broadcastToRoom(
          roomId,
          {
            type: 'ROOM_STATE',
            payload: getFormattedRoomState(room),
          },
          ws
        );
      } else {
        const conn = clients.get(ws);
        if (!conn) return;
        const room = rooms.get(conn.roomId);
        if (!room) return;

        if (type === 'DRAW_ELEMENT') {
          room.drawElements.push(payload);
          broadcastToRoom(conn.roomId, { type: 'DRAW_ELEMENT', payload }, ws);
        } else if (type === 'CLEAR_BOARD') {
          room.drawElements = room.drawElements.filter((el) => el.page !== payload.page);
          broadcastToRoom(conn.roomId, { type: 'CLEAR_BOARD', payload });
        } else if (type === 'CHANGE_PAGE') {
          room.currentPage = payload.page;
          broadcastToRoom(conn.roomId, { type: 'CHANGE_PAGE', payload });
        } else if (type === 'UPLOAD_SLIDES') {
          room.slideImages = payload.slides;
          room.totalPages = payload.slides.length || 1;
          room.currentPage = 1;
          broadcastToRoom(conn.roomId, {
            type: 'ROOM_STATE',
            payload: getFormattedRoomState(room),
          });
        } else if (type === 'CHAT_MESSAGE') {
          const chatMsg = {
            id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            senderId: conn.userId,
            senderName: payload.senderName,
            senderRole: payload.senderRole,
            text: payload.text,
            timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
            isAnnouncement: payload.isAnnouncement || false,
          };
          room.chatMessages.push(chatMsg);
          broadcastToRoom(conn.roomId, { type: 'CHAT_MESSAGE', payload: chatMsg });
        } else if (type === 'RAISE_HAND') {
          const user = room.users.get(conn.userId);
          if (user) {
            user.handRaised = payload.raised;
            user.handRaisedAt = payload.raised ? Date.now() : undefined;
            broadcastToRoom(conn.roomId, {
              type: 'ROOM_STATE',
              payload: getFormattedRoomState(room),
            });
          }
        } else if (type === 'TOGGLE_MUTE') {
          const targetUser = room.users.get(payload.targetUserId);
          if (targetUser) {
            targetUser.isMuted = payload.isMuted;
            broadcastToRoom(conn.roomId, {
              type: 'ROOM_STATE',
              payload: getFormattedRoomState(room),
            });
          }
        } else if (type === 'CREATE_POLL') {
          room.activePoll = {
            id: 'poll-' + Date.now(),
            question: payload.question,
            options: payload.options.map((opt: string, idx: number) => ({
              id: 'opt-' + idx,
              text: opt,
              votes: [],
            })),
            isActive: true,
            createdByName: room.teacherName,
            createdAt: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
          };
          broadcastToRoom(conn.roomId, {
            type: 'ROOM_STATE',
            payload: getFormattedRoomState(room),
          });
        } else if (type === 'VOTE_POLL') {
          if (room.activePoll && room.activePoll.isActive) {
            const { optionId, userId } = payload;
            // Remove previous votes from this user
            room.activePoll.options.forEach((opt: any) => {
              opt.votes = opt.votes.filter((v: string) => v !== userId);
            });
            const targetOpt = room.activePoll.options.find((opt: any) => opt.id === optionId);
            if (targetOpt) {
              targetOpt.votes.push(userId);
            }
            broadcastToRoom(conn.roomId, {
              type: 'ROOM_STATE',
              payload: getFormattedRoomState(room),
            });
          }
        } else if (type === 'CLOSE_POLL') {
          if (room.activePoll) {
            room.activePoll.isActive = false;
            broadcastToRoom(conn.roomId, {
              type: 'ROOM_STATE',
              payload: getFormattedRoomState(room),
            });
          }
        } else if (type === 'TEACHER_MEDIA_STATE') {
          if (payload.isSharingScreen !== undefined) room.teacherIsSharingScreen = payload.isSharingScreen;
          if (payload.hasVideo !== undefined) room.teacherHasVideo = payload.hasVideo;
          if (payload.hasAudio !== undefined) room.teacherHasAudio = payload.hasAudio;
          broadcastToRoom(
            conn.roomId,
            {
              type: 'TEACHER_MEDIA_STATE',
              payload: {
                teacherIsSharingScreen: room.teacherIsSharingScreen,
                teacherHasVideo: room.teacherHasVideo,
                teacherHasAudio: room.teacherHasAudio,
              },
            },
            ws
          );
        } else if (type === 'WEBRTC_SIGNAL') {
          // Pass signaling data to target client or room
          broadcastToRoom(conn.roomId, { type: 'WEBRTC_SIGNAL', payload }, ws);
        }
      }
    } catch (err) {
      console.error('Error handling WebSocket message:', err);
    }
  });

  ws.on('close', () => {
    const conn = clients.get(ws);
    if (conn) {
      const room = rooms.get(conn.roomId);
      if (room) {
        room.users.delete(conn.userId);
        broadcastToRoom(conn.roomId, {
          type: 'ROOM_STATE',
          payload: getFormattedRoomState(room),
        });
      }
      clients.delete(ws);
    }
  });
});

// Gemini AI Setup
const getAiClient = () => {
  if (!process.env.GEMINI_API_KEY) return null;
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// API Endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', activeRooms: rooms.size, totalClients: clients.size });
});

// AI Endpoint: Generate Quiz Questions
app.post('/api/ai/quiz', async (req, res) => {
  try {
    const { topic, numQuestions } = req.body;
    const ai = getAiClient();
    if (!ai) {
      return res.status(400).json({ error: 'کلید GEMINI_API_KEY تنظیم نشده است.' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `شما یک معلم با تجربه هستید. لطفاً برای موضوع "${topic || 'عمومی'}" تعداد ${numQuestions || 3} سوال چهارگزینه‌ای به زبان فارسی طراحی کنید.
خروجی باید دقیقاً فرمت JSON مطابق الگوی زیر باشد:
{
  "question": "متن سوال اول",
  "options": ["گزینه ۱", "گزینه ۲", "گزینه ۳", "گزینه ۴"],
  "correctIndex": 0
}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              correctIndex: { type: Type.INTEGER },
            },
            required: ['question', 'options'],
          },
        },
      },
    });

    const quizData = JSON.parse(response.text || '[]');
    res.json({ success: true, quiz: quizData });
  } catch (error: any) {
    console.error('Quiz Generation Error:', error);
    res.status(500).json({ error: 'خطا در ساخت سوالات آزمون با هوش مصنوعی: ' + error.message });
  }
});

// AI Endpoint: Explain or Summarize Lesson
app.post('/api/ai/explain', async (req, res) => {
  try {
    const { prompt, context } = req.body;
    const ai = getAiClient();
    if (!ai) {
      return res.status(400).json({ error: 'کلید GEMINI_API_KEY تنظیم نشده است.' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `شما دستیار هوشمند معلم در کلاس آنلاین هستید.
زمینه درس: ${context || 'کلاس درس عمومی'}
سوال/درخواست: ${prompt}

لطفاً پاسخی روان، ساده، جذاب و آموزشی به زبان فارسی برای دانش‌آموزان بدهید. پاسخ را با فرمت مناسب و کوتاه بنویسید.`,
    });

    res.json({ success: true, answer: response.text });
  } catch (error: any) {
    console.error('AI Explain Error:', error);
    res.status(500).json({ error: 'خطا در پاسخ هوش مصنوعی: ' + error.message });
  }
});

// Serve Vite in development / Static in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Classroom Live Server running on http://localhost:${PORT}`);
  });
}

startServer();
