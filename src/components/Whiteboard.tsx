import React, { useRef, useEffect, useState } from 'react';
import {
  Pen,
  Eraser,
  Highlighter,
  Square,
  Circle,
  MoveRight,
  Type,
  Trash2,
  Download,
  ChevronRight,
  ChevronLeft,
  Plus,
  Image as ImageIcon,
  Minus,
  Sparkles,
} from 'lucide-react';
import { DrawElement, ToolType, UserRole } from '../types';

interface WhiteboardProps {
  elements: DrawElement[];
  currentPage: number;
  totalPages: number;
  slideImages: string[];
  role: UserRole;
  onDrawElement: (element: DrawElement) => void;
  onClearBoard: (page: number) => void;
  onChangePage: (page: number) => void;
  onUploadSlides: (slides: string[]) => void;
}

export const Whiteboard: React.FC<WhiteboardProps> = ({
  elements,
  currentPage,
  totalPages,
  slideImages,
  role,
  onDrawElement,
  onClearBoard,
  onChangePage,
  onUploadSlides,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [activeTool, setActiveTool] = useState<ToolType>('pen');
  const [activeColor, setActiveColor] = useState<string>('#4f46e5');
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);

  const isTeacher = role === 'teacher';

  const colors = [
    '#000000',
    '#4f46e5', // Indigo
    '#2563eb', // Blue
    '#059669', // Emerald
    '#d97706', // Amber
    '#dc2626', // Red
    '#9333ea', // Purple
    '#ffffff',
  ];

  // Draw Canvas content
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    if (containerRef.current) {
      canvas.width = containerRef.current.clientWidth;
      canvas.height = containerRef.current.clientHeight;
    }

    // Clear background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render Grid lines lightly
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    const gridSize = 30;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Render background slide image if available
    const currentSlideImg = slideImages[currentPage - 1];
    if (currentSlideImg) {
      const img = new Image();
      img.src = currentSlideImg;
      img.onload = () => {
        // Fit image maintaining aspect ratio
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        renderElements(ctx);
      };
    } else {
      renderElements(ctx);
    }
  }, [elements, currentPage, slideImages, containerRef.current?.clientWidth, containerRef.current?.clientHeight]);

  const renderElements = (ctx: CanvasRenderingContext2D) => {
    const pageElements = elements.filter((el) => el.page === currentPage);

    pageElements.forEach((el) => {
      ctx.save();
      ctx.strokeStyle = el.color;
      ctx.fillStyle = el.color;
      ctx.lineWidth = el.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (el.type === 'highlighter') {
        ctx.globalAlpha = 0.35;
      }

      if (el.type === 'pen' || el.type === 'highlighter' || el.type === 'eraser') {
        if (el.type === 'eraser') {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = el.strokeWidth * 4;
        }
        if (el.points && el.points.length > 0) {
          ctx.beginPath();
          ctx.moveTo(el.points[0].x, el.points[0].y);
          for (let i = 1; i < el.points.length; i++) {
            ctx.lineTo(el.points[i].x, el.points[i].y);
          }
          ctx.stroke();
        }
      } else if (el.type === 'line' && el.x1 !== undefined && el.y1 !== undefined && el.x2 !== undefined && el.y2 !== undefined) {
        ctx.beginPath();
        ctx.moveTo(el.x1, el.y1);
        ctx.lineTo(el.x2, el.y2);
        ctx.stroke();
      } else if (el.type === 'rect' && el.x1 !== undefined && el.y1 !== undefined && el.x2 !== undefined && el.y2 !== undefined) {
        ctx.beginPath();
        ctx.rect(el.x1, el.y1, el.x2 - el.x1, el.y2 - el.y1);
        ctx.stroke();
      } else if (el.type === 'circle' && el.x1 !== undefined && el.y1 !== undefined && el.x2 !== undefined && el.y2 !== undefined) {
        const radius = Math.hypot(el.x2 - el.x1, el.y2 - el.y1);
        ctx.beginPath();
        ctx.arc(el.x1, el.y1, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (el.type === 'arrow' && el.x1 !== undefined && el.y1 !== undefined && el.x2 !== undefined && el.y2 !== undefined) {
        const headlen = 12;
        const dx = el.x2 - el.x1;
        const dy = el.y2 - el.y1;
        const angle = Math.atan2(dy, dx);
        ctx.beginPath();
        ctx.moveTo(el.x1, el.y1);
        ctx.lineTo(el.x2, el.y2);
        ctx.lineTo(el.x2 - headlen * Math.cos(angle - Math.PI / 6), el.y2 - headlen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(el.x2, el.y2);
        ctx.lineTo(el.x2 - headlen * Math.cos(angle + Math.PI / 6), el.y2 - headlen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      } else if (el.type === 'text' && el.text && el.x1 !== undefined && el.y1 !== undefined) {
        ctx.font = `${el.strokeWidth * 6}px Vazirmatn, Tahoma, sans-serif`;
        ctx.fillText(el.text, el.x1, el.y1);
      }

      ctx.restore();
    });
  };

  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Both teacher and active student can draw if permitted
    const pt = getCanvasPoint(e);
    setIsDrawing(true);

    if (activeTool === 'text') {
      const textInput = prompt('متن یا توضیح خود را وارد کنید:');
      if (textInput) {
        const newEl: DrawElement = {
          id: 'text-' + Date.now(),
          type: 'text',
          text: textInput,
          x1: pt.x,
          y1: pt.y,
          color: activeColor,
          strokeWidth,
          page: currentPage,
        };
        onDrawElement(newEl);
      }
      setIsDrawing(false);
      return;
    }

    setStartPoint(pt);
    if (activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'eraser') {
      setCurrentPath([pt]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const pt = getCanvasPoint(e);

    if (activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'eraser') {
      setCurrentPath((prev) => [...prev, pt]);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const endPt = getCanvasPoint(e);

    if (activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'eraser') {
      if (currentPath.length > 0) {
        const newEl: DrawElement = {
          id: 'draw-' + Date.now(),
          type: activeTool,
          points: currentPath,
          color: activeColor,
          strokeWidth,
          page: currentPage,
        };
        onDrawElement(newEl);
      }
    } else if (startPoint && (activeTool === 'line' || activeTool === 'rect' || activeTool === 'circle' || activeTool === 'arrow')) {
      const newEl: DrawElement = {
        id: 'shape-' + Date.now(),
        type: activeTool,
        x1: startPoint.x,
        y1: startPoint.y,
        x2: endPt.x,
        y2: endPt.y,
        color: activeColor,
        strokeWidth,
        page: currentPage,
      };
      onDrawElement(newEl);
    }

    setCurrentPath([]);
    setStartPoint(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newSlides: string[] = [];
    let loadedCount = 0;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newSlides.push(event.target.result as string);
        }
        loadedCount++;
        if (loadedCount === files.length) {
          onUploadSlides(newSlides);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const downloadCanvasAsImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `whiteboard-page-${currentPage}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg relative">
      {/* Top Whiteboard Toolbar */}
      <div className="bg-slate-800/90 border-b border-slate-700/80 p-2 flex flex-wrap items-center justify-between gap-2 z-10">
        {/* Drawing Tools */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-700/60">
          <button
            onClick={() => setActiveTool('pen')}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              activeTool === 'pen' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="قلم"
          >
            <Pen className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool('highlighter')}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              activeTool === 'highlighter' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="هایلایتر"
          >
            <Highlighter className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool('line')}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              activeTool === 'line' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="خط مستقیم"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool('rect')}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              activeTool === 'rect' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="مستطیل"
          >
            <Square className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool('circle')}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              activeTool === 'circle' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="دایره"
          >
            <Circle className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool('arrow')}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              activeTool === 'arrow' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="فلش اشاره"
          >
            <MoveRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool('text')}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              activeTool === 'text' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="متن"
          >
            <Type className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool('eraser')}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              activeTool === 'eraser' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="پاک‌کن"
          >
            <Eraser className="w-4 h-4" />
          </button>
        </div>

        {/* Color Picker & Thickness */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded-xl border border-slate-700/60">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setActiveColor(c)}
                className={`w-5 h-5 rounded-full border border-slate-600 transition cursor-pointer ${
                  activeColor === c ? 'scale-125 ring-2 ring-indigo-400' : 'opacity-80 hover:opacity-100'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="flex items-center gap-2 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-slate-700/60 text-xs text-slate-300">
            <span>ضخامت:</span>
            <input
              type="range"
              min="1"
              max="20"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-16 accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Slide Upload & Page Controls */}
        <div className="flex items-center gap-2">
          {isTeacher && (
            <label className="flex items-center gap-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-2.5 py-1.5 rounded-lg cursor-pointer border border-slate-600 transition">
              <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>بارگذاری اسلاید</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          )}

          <div className="flex items-center gap-1 bg-slate-900/80 px-2 py-1 rounded-xl border border-slate-700/60 text-xs text-slate-200">
            <button
              onClick={() => onChangePage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="p-1 hover:text-indigo-400 disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="font-mono">
              صفحه {currentPage} از {totalPages}
            </span>
            <button
              onClick={() => onChangePage(Math.min(totalPages + 1, currentPage + 1))}
              className="p-1 hover:text-indigo-400 transition cursor-pointer"
              title="صفحه بعدی"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {isTeacher && (
            <button
              onClick={() => onClearBoard(currentPage)}
              className="p-1.5 bg-rose-900/40 hover:bg-rose-800/60 text-rose-300 rounded-lg border border-rose-700/50 transition cursor-pointer"
              title="پاکسازی تخته"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={downloadCanvasAsImage}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition cursor-pointer"
            title="دانلود تصویر تخته"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas Drawing Surface */}
      <div ref={containerRef} className="flex-1 w-full h-full relative cursor-crosshair bg-white">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="w-full h-full block"
        />

        {/* Floating Page Badge */}
        <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur text-slate-300 text-xs px-3 py-1.5 rounded-full border border-slate-700 pointer-events-none font-mono">
          صفحه {currentPage}
        </div>
      </div>
    </div>
  );
};
