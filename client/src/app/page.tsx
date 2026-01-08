'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
  nombre: string;
  texto: string;
  time: string;
}

const AVATARS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Willow",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Chester"
];

export default function Home() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [username, setUsername] = useState('Guest');
  const [inputText, setInputText] = useState('');
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [isUsernameLocked, setIsUsernameLocked] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Connect to the server
    const newSocket = io("http://localhost:6969");
    setSocket(newSocket);

    // Initial welcome message
    setMessages([{
      nombre: "System",
      texto: "Welcome to the chat!",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);

    // Handle incoming messages
    newSocket.on('mensaje', (data: { nombre: string; texto: string }) => {
      const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages(prev => [...prev, {
        nombre: data.nombre,
        texto: data.texto,
        time: timeString
      }]);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  // Auto-scroll to bottom using scrollIntoView
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleAvatar = () => {
    setAvatarIndex((prev) => (prev + 1) % AVATARS.length);
  };

  const handleSend = () => {
    if (!inputText.trim() || !socket) return;

    const name = username.trim() || "Anonimo";

    socket.emit('mensaje', {
      nombre: name,
      texto: inputText.trim()
    });

    // Lock username on first send (simulating the original behavior)
    if (!isUsernameLocked) {
      setIsUsernameLocked(true);
    }

    setInputText('');
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const lastMessageTime = messages.length > 0 ? messages[messages.length - 1].time : '--:--';

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden relative backdrop-blur-[5px] bg-gradient-to-b from-[#f8fdff] to-[#d1ebf7]">
      {/* Title Bar */}
      <div className="h-[30px] flex items-center px-[10px] justify-between">
        <div className="text-[12px] text-[#444] font-bold flex items-center gap-[5px]">
          Windows Live Messenger
        </div>
        <div className="flex gap-[5px]">
          <div className="w-[20px] h-[20px] border border-black/10 rounded-[3px] flex items-center justify-center text-[10px] cursor-default bg-white/40">_</div>
          <div className="w-[20px] h-[20px] border border-black/10 rounded-[3px] flex items-center justify-center text-[10px] cursor-default bg-white/40">□</div>
          <div className="w-[20px] h-[20px] border border-[#b00b1a] rounded-[3px] flex items-center justify-center text-[10px] cursor-default bg-[#e81123] text-white">X</div>
        </div>
      </div>

      {/* Header */}
      <div className="flex px-[15px] py-[10px] items-center gap-[15px] border-b border-white/50">
        <div
          onClick={toggleAvatar}
          className="w-[80px] h-[80px] border-[4px] border-white shadow-md bg-[#eee] overflow-hidden relative cursor-pointer active:scale-95 transition-transform"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={AVATARS[avatarIndex]}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-grow">
          <div className="text-[18px] font-bold text-[#111] shadow-white drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isUsernameLocked}
              placeholder="Your Name"
              className={`text-[18px] font-bold text-[#111] bg-transparent outline-none w-[200px] ${isUsernameLocked
                  ? 'border-none text-black bg-transparent'
                  : 'border-b border-dashed border-[#999] text-[#444]'
                }`}
            />
          </div>
          <div className="text-[12px] text-[#555] mt-[4px] italic cursor-text">
            <span className="text-[#888] mr-[5px] not-italic">(Away)</span>
            &lt;Type a personal message&gt;
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-grow flex p-[10px] gap-[10px] bg-gradient-to-b from-[#eff7fa] to-[#d6f0fa]">
        <div className="flex-grow bg-white border border-[#a4cddb] rounded-[3px] p-[10px] overflow-y-auto text-[13px] flex flex-col gap-[8px] shadow-inner">
          {messages.map((msg, idx) => (
            <div key={idx} className="mb-[5px] animate-[fadeIn_0.2s_ease-out]">
              <div className="text-[#666] text-[11px] mb-[2px]">
                <span className="text-[#0066cc] font-bold">{msg.nombre}</span> <span className="text-[#999]">says:</span>
              </div>
              <div className="text-[#222] pl-[10px] break-words">
                {msg.texto}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-[0_10px_10px_10px]">
        {/* Toolbar */}
        <div className="h-[30px] bg-[#f0f8ff] border border-b-0 border-[#a4cddb] flex items-center px-[5px] gap-[10px] rounded-t-[3px] mt-[5px]">
          <span className="font-serif font-bold text-[#444] cursor-pointer text-[14px] px-[6px] py-[2px] hover:bg-black/5 hover:rounded-[2px]">B</span>
          <span className="font-serif italic text-[#444] cursor-pointer text-[14px] px-[6px] py-[2px] hover:bg-black/5 hover:rounded-[2px]">I</span>
          <span className="font-serif underline text-[#444] cursor-pointer text-[14px] px-[6px] py-[2px] hover:bg-black/5 hover:rounded-[2px]">U</span>
          <span className="font-serif text-[#444] cursor-pointer text-[14px] px-[6px] py-[2px] hover:bg-black/5 hover:rounded-[2px]">☺</span>
          <span className="font-serif text-[#444] cursor-pointer text-[14px] px-[6px] py-[2px] hover:bg-black/5 hover:rounded-[2px]">Wizz!</span>
        </div>

        <div className="flex flex-col">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            className="h-[60px] resize-none border border-[#a4cddb] border-t-dashed border-t-[#ccc] w-full p-[8px] outline-none text-[13px] font-sans"
          />
        </div>

        <div className="flex justify-between items-center mt-[8px]">
          <div className="text-[11px] text-[#666]">
            Last message received at <span>{lastMessageTime}</span>
          </div>
          <button
            onClick={handleSend}
            className="bg-[#fcfcfc] border border-[#bbb] rounded-[3px] px-[15px] py-[4px] text-[12px] cursor-pointer shadow-sm hover:border-[#888] hover:bg-[#f0f0f0] active:shadow-inner"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
