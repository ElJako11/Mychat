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

const EMOJIS = ["😊", "😂", "🥺", "😍", "😒", "😭", "😩", "😳", "😔", "😤", "😠", "😡", "🤬", "🤯", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿", "👹", "👺", "🤡", "💩", "👻", "💀", "☠️", "👽", "👾", "🤖", "🎃", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾"];

export default function Home() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [username, setUsername] = useState('Guest');
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [remoteAvatarIndex] = useState(1); // Fixed or random, independent of local
  const [isUsernameLocked, setIsUsernameLocked] = useState(false);
  const [activeFormats, setActiveFormats] = useState({ bold: false, italic: false, underline: false });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Taskbar State
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isStartOpen, setIsStartOpen] = useState(false);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
    if (!editorRef.current || !socket) return;

    const content = editorRef.current.innerHTML;
    // Basic check for empty content (considering html tags)
    if (!editorRef.current.innerText.trim() && !content.includes('<img')) return;

    const name = username.trim() || "Anonimo";

    socket.emit('mensaje', {
      nombre: name,
      texto: content
    });

    // Lock username on first send (simulating the original behavior)
    if (!isUsernameLocked) {
      setIsUsernameLocked(true);
    }

    editorRef.current.innerHTML = '';
    // Reset formats after send
    setActiveFormats({ bold: false, italic: false, underline: false });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // Handle Alt+S to send
    if (e.altKey && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      handleSend();
    }
  };

  const checkFormatState = () => {
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline')
    });
  };

  const handleFormat = (command: string) => {
    document.execCommand(command, false, undefined);
    editorRef.current?.focus();
    checkFormatState();
  };

  const handleInsertEmoji = (emoji: string) => {
    // Insert text at cursor
    document.execCommand('insertText', false, emoji);
    setShowEmojiPicker(false);
    editorRef.current?.focus();
  };

  // Safe message formatting (Sanitization)
  const formatMessage = (html: string) => {
    // Very basic sanitization to prevent script injection
    // In a real app, use a library like DOMPurify
    const cleanHtml = html
      .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gm, "")
      .replace(/on\w+="[^"]*"/g, "");

    return <span dangerouslySetInnerHTML={{ __html: cleanHtml }} />;
  };

  const lastMessageTime = messages.length > 0 ? messages[messages.length - 1].time : '--:--';

  return (
    <div className="w-full h-full min-h-screen flex justify-center items-center p-4 font-sans bg-transparent relative">

      {/* Desktop Icons */}
      <div className="absolute top-4 left-4 flex flex-col gap-6 z-0">
        <div className="flex flex-col items-center gap-1 group cursor-pointer w-[70px]">
          <img src="/My Computer.ico" alt="My Computer" className="w-[48px] h-[48px] drop-shadow-md" />
          <span className="text-white text-[12px] font-sans drop-shadow-[1px_1px_1px_rgba(0,0,0,1)] text-center leading-tight group-hover:bg-[#0b61ff] group-hover:text-white px-1 rounded-[2px] transition-colors">
            My Computer
          </span>
        </div>

        <div className="flex flex-col items-center gap-1 group cursor-pointer w-[70px]">
          <img src="/Full Recycle Bin.ico" alt="Recycle Bin" className="w-[48px] h-[48px] drop-shadow-md" />
          <span className="text-white text-[12px] font-sans drop-shadow-[1px_1px_1px_rgba(0,0,0,1)] text-center leading-tight group-hover:bg-[#0b61ff] group-hover:text-white px-1 rounded-[2px] transition-colors">
            Recycle Bin
          </span>
        </div>
      </div>

      {/* Main Window Frame - XP Style */}
      <div className="w-[800px] h-[600px] flex flex-col bg-[#eef3fa] border border-[#004e98] rounded-tl-[8px] rounded-tr-[8px] rounded-bl-[3px] rounded-br-[3px] shadow-[0_0_0_1px_rgba(255,255,255,0.3),0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden relative select-none">

        {/* Title Bar - Gradient Blue */}
        <div className="h-[28px] bg-gradient-to-r from-[#0058ee] via-[#3593ff] to-[#0058ee] flex items-center justify-between px-2 cursor-default relative z-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
          <div className="flex items-center gap-2">
            <img src="/Messenger.png" alt="App Icon" className="w-[18px] h-[18px] ml-1" />
            <div className="text-white text-[12px] font-bold drop-shadow-[0_1px_0_rgba(0,18,87,0.6)]">
              MSN Messenger
            </div>
          </div>
          <div className="flex gap-[2px]">
            {/* Window Controls */}
            <button className="w-[21px] h-[21px] bg-gradient-to-b from-[#7db4ff] via-[#246ae3] to-[#0344b5] border border-white/60 rounded-[3px] flex items-center justify-center text-white font-bold text-[14px] shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_1px_1px_rgba(0,0,0,0.3)] hover:brightness-110 active:brightness-90 leading-none pb-2 cursor-default">_</button>
            <button className="w-[21px] h-[21px] bg-gradient-to-b from-[#7db4ff] via-[#246ae3] to-[#0344b5] border border-white/60 rounded-[3px] flex items-center justify-center text-white font-bold text-[12px] shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_1px_1px_rgba(0,0,0,0.3)] hover:brightness-110 active:brightness-90 opacity-80 cursor-default">□</button>
            <button className="w-[21px] h-[21px] bg-gradient-to-b from-[#e09888] via-[#cf5044] to-[#c72728] border border-white/60 rounded-[3px] flex items-center justify-center text-white font-bold text-[12px] shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_1px_1px_rgba(0,0,0,0.3)] hover:brightness-110 active:brightness-90 cursor-default">X</button>
          </div>
        </div>

        {/* Menu Bar - Draggable Region */}
        <div className="h-[22px] bg-[#eef3fa] flex items-center px-1 border-b border-[#abc0d8] relative z-0">
          {['File', 'Edit', 'Actions', 'Tools', 'Help'].map((item) => (
            <div key={item} className="px-2 text-[11px] text-[#000] hover:bg-[#ffe1ac] hover:border hover:border-[#ebb560] cursor-default border border-transparent rounded-[2px] transition-colors duration-75">
              <span className="underline">{item[0]}</span>{item.slice(1)}
            </div>
          ))}
        </div>

        {/* Main Toolbar */}
        <div className="h-[58px] bg-gradient-to-b from-[#fff] via-[#f4f8fd] to-[#dceefb] border-b border-[#96b8d5] flex items-center px-4 gap-4 overflow-hidden relative shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          {/* Swoosh Background */}
          <div className="absolute right-0 top-0 h-full w-[300px] bg-gradient-to-l from-[#b5d5f0] to-transparent opacity-40 pointer-events-none"></div>

          {['Invite', 'Send Files', 'Video', 'Voice', 'Activities', 'Games'].map((tool, i) => (
            <div key={tool} className="flex flex-col items-center justify-center cursor-pointer group px-1 py-1 rounded-[3px] hover:bg-gradient-to-b hover:from-[#fff] hover:to-[#ffd69b] hover:border hover:border-[#cecece] border border-transparent min-w-[50px] transition-all duration-75">
              <span className={`w-[26px] h-[26px] mb-[1px] opacity-90 group-hover:opacity-100 ${['icon-[emojione--busts-in-silhouette]', 'icon-[emojione--file-folder]', 'icon-[emojione--video-camera]', 'icon-[emojione--studio-microphone]', 'icon-[emojione--soccer-ball]', 'icon-[emojione--joystick]'][i]
                }`} />
              <span className="text-[10px] text-[#222] group-hover:text-black">{tool}</span>
            </div>
          ))}

          <div className="flex-grow"></div>

          <div className="flex flex-col items-end mr-2 cursor-pointer opacity-90 hover:opacity-100">
            <div className="flex items-center">
              <span className="text-[#004bbb] font-extrabold italic text-[22px] tracking-tighter drop-shadow-sm">msn</span>
              <span className="text-[#fba310] text-[18px] ml-[1px]">🦋</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-grow flex bg-[#f6fbfe] p-[8px] gap-[8px] relative">
          <div className="absolute inset-0 bg-gradient-to-b from-[#f3f8fd] to-[#dceaf7] pointer-events-none z-0"></div>

          {/* Chat Section */}
          <div className="flex-grow flex flex-col gap-[6px] relative z-10 min-w-0">

            {/* Contact Header */}
            <div className="h-[26px] bg-[#fff] border border-[#aabccf] rounded-t-[4px] flex items-center px-3 text-[11px] text-[#444] shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-[#f7fbff] to-[#e4eff9] opacity-70"></div>
              <div className="relative z-10 w-full flex justify-between items-center">
                <span>To: <span className="font-bold text-[#000]">{username || "Participant"}</span></span>
                <span className="text-[#888] cursor-pointer hover:text-[#555]">▼</span>
              </div>
            </div>

            {/* Chat History */}
            <div className="flex-grow bg-[#fff] border border-[#83a6c6] rounded-b-[2px] rounded-r-[2px] p-2 overflow-y-auto font-sans shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
              <div className="text-[10px] text-[#888] text-center mb-3 border-b border-[#eee] pb-1 mx-4">
                Email address not verified
              </div>
              {messages.map((msg, idx) => (
                <div key={idx} className="mb-1 leading-snug hover:bg-[#f9f9f9] px-1 rounded-[2px]">
                  <div className="text-[#666] text-[11px] mb-[1px]">
                    <span className="text-[#0000aa] font-medium cursor-pointer hover:underline">{msg.nombre}</span> <span className="text-[#888]">says:</span>
                  </div>
                  <div className="text-[#222] pl-3 text-[12px] font-sans">
                    {formatMessage(msg.texto)}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Toolbar */}
            <div className="h-[28px] flex items-center bg-[#f0f6fb] border border-[#aabccf] border-b-0 px-1 gap-1 rounded-t-[2px] relative z-20">
              {['Bold', 'Italic', 'Underline'].map((command) => (
                <div
                  key={command}
                  onClick={() => handleFormat(command.toLowerCase())}
                  className={`font-serif px-2 py-[1px] cursor-pointer hover:bg-[#ffe1ac] hover:border hover:border-[#ebb560] border border-transparent rounded-[2px] text-[12px] text-[#444] ${command === 'Bold' ? 'font-bold' : command === 'Italic' ? 'italic' : 'underline'} ${activeFormats[command.toLowerCase() as keyof typeof activeFormats] ? 'bg-[#ffe1ac] border-[#ebb560]' : ''}`}
                >
                  {command[0]}
                </div>
              ))}
              <div className="w-[1px] h-[16px] bg-[#ccc] mx-1"></div>

              {/* Emoji Picker Button */}
              <div className="relative">
                <div
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`px-1 py-[1px] cursor-pointer hover:bg-[#ffe1ac] hover:border hover:border-[#ebb560] border border-transparent rounded-[2px] ${showEmojiPicker ? 'bg-[#ffe1ac] border-[#ebb560]' : ''}`}
                >
                  <span className="text-[14px] leading-none">😊</span>
                </div>

                {/* Emoji Picker Popup */}
                {showEmojiPicker && (
                  <div className="absolute bottom-[30px] left-0 bg-white border border-[#83a6c6] shadow-lg rounded-[3px] p-2 flex flex-wrap gap-1 w-[220px] h-[150px] overflow-y-auto z-50">
                    {EMOJIS.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => handleInsertEmoji(emoji)}
                        className="text-[16px] w-[24px] h-[24px] flex items-center justify-center hover:bg-[#f0f6fb] rounded-[2px]"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-1 py-[1px] cursor-pointer hover:bg-[#ffe1ac] hover:border hover:border-[#ebb560] border border-transparent rounded-[2px] flex items-center gap-1">
                <span className="text-[10px] text-[#444]">Voice Clip</span>
              </div>
              <div className="flex-grow"></div>
              <div className="px-2 py-[1px] bg-[#fff] border border-[#ccc] rounded-[2px] text-[10px] text-[#666] cursor-pointer hover:border-[#999]">
                Backgrounds ▼
              </div>
            </div>

            {/* Input & Send */}
            <div className="h-[90px] flex gap-[6px]">
              <div className="flex-grow flex flex-col h-full bg-[#fff] border border-[#83a6c6] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] rounded-b-[2px] cursor-text" onClick={() => editorRef.current?.focus()}>
                <div
                  ref={editorRef}
                  contentEditable
                  onKeyDown={handleKeyDown}
                  onKeyUp={checkFormatState}
                  onMouseUp={checkFormatState}
                  className="flex-grow w-full border-none p-2 text-[12px] outline-none font-sans overflow-y-auto"
                />
              </div>
              <div className="w-[74px] flex flex-col gap-[4px] py-[1px]">
                <button
                  onClick={handleSend}
                  className="h-[46px] bg-gradient-to-b from-[#f8fdff] to-[#ddecf7] border border-[#8fafd4] rounded-[3px] text-[12px] text-[#333] hover:border-[#4b8cd9] active:bg-[#d6e7f5] shadow-[0_1px_1px_rgba(0,0,0,0.1)] flex flex-col items-center justify-center leading-none gap-[2px]"
                >
                  <span className="font-bold text-[13px]">Send</span>
                  <span className="text-[9px] text-[#666]">(Alt+S)</span>
                </button>
                <button className="h-[26px] bg-gradient-to-b from-[#f8fdff] to-[#ddecf7] border border-[#8fafd4] rounded-[3px] text-[11px] text-[#333] hover:border-[#4b8cd9] active:bg-[#d6e7f5] shadow-[0_1px_1px_rgba(0,0,0,0.1)]">
                  Search
                </button>
              </div>
            </div>

          </div>

          {/* Right Sidebar - Avatars */}
          <div className="w-[150px] flex flex-col gap-3 pt-5 relative z-10">

            {/* Remote Avatar */}
            <div className="w-full aspect-square bg-[#fff] p-[3px] rounded-[5px] shadow-[0_2px_4px_rgba(0,0,0,0.2)] border border-[#fff] relative">
              <div className="w-full h-full border border-[#a2a2a2] rounded-[3px] overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[rgba(0,0,0,0.1)] pointer-events-none z-10"></div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={AVATARS[remoteAvatarIndex]} alt="Remote" className="w-full h-full object-cover" />
              </div>
              <div className="absolute top-[8px] -right-[14px] w-[14px] h-[32px] bg-[#fff] border border-[#a2a2a2] border-l-0 rounded-r-[6px] shadow-sm flex items-center justify-center cursor-pointer hover:bg-[#f0f0f0]">
                <span className="text-[#666] text-[8px]">▼</span>
              </div>
            </div>

            <div className="flex-grow"></div>

            {/* Local Avatar */}
            <div className="w-full aspect-square bg-[#fff] p-[3px] rounded-[5px] shadow-[0_2px_4px_rgba(0,0,0,0.2)] border border-[#fff] relative cursor-pointer" onClick={toggleAvatar}>
              <div className="w-full h-full border border-[#a2a2a2] rounded-[3px] overflow-hidden relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={AVATARS[avatarIndex]} alt="Local" className="w-full h-full object-cover" />
              </div>
              <div className="absolute top-[8px] -right-[14px] w-[14px] h-[32px] bg-[#fff] border border-[#a2a2a2] border-l-0 rounded-r-[6px] shadow-sm flex items-center justify-center cursor-pointer hover:bg-[#f0f0f0]">
                <span className="text-[#666] text-[8px]">▼</span>
              </div>
            </div>

            {/* User Status */}
            <div className="text-center -mt-1">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isUsernameLocked}
                className={`w-full text-center text-[11px] font-bold bg-transparent outline-none border-b border-transparent hover:border-[#888] focus:border-[#000] drop-shadow-[0_1px_0_rgba(255,255,255,0.8)] ${isUsernameLocked ? 'text-[#000]' : 'text-[#555]'}`}
              />
              <div className="text-[10px] text-[#444] flex items-center justify-center gap-1 cursor-pointer hover:underline mt-[1px]">
                <span className="w-[8px] h-[8px] bg-green-500 rounded-full border border-white shadow-sm"></span>
                <span>(Online)</span> ▾
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="h-[26px] bg-[#fcfeff] border-t border-[#c6dbf1] flex items-center px-2 justify-center cursor-pointer hover:bg-[#ffffe0] transition-colors relative z-10">
          {/* Ad Banner Placeholder */}
          <div className="flex items-center gap-2 text-[10px] text-[#444]">
            <span className="font-bold text-[#d6aa2a] text-[14px]">★</span>
            <span>Click for new <span className="underline text-blue-800">Emoticons</span> and <span className="underline text-blue-800">Theme Packs</span> from Blue Mountain</span>
          </div>

          {/* Resize Grip */}
          <div className="absolute bottom-[2px] right-[2px] flex gap-[2px]">
            <div className="w-[12px] h-[12px] opacity-40" style={{ backgroundImage: "radial-gradient(circle, #666 40%, transparent 50%)", backgroundSize: "4px 4px" }}></div>
          </div>
        </div>

      </div>

      {/* Windows XP Taskbar */}
      <div className="fixed bottom-0 left-0 w-full h-[30px] bg-[#245dbd] flex items-center select-none z-50 font-[Tahoma,sans-serif] text-[11px] border-t-[2px] border-[#3e75d4] shadow-[0_-1px_0_1px_rgba(0,0,0,0.1)]"
        style={{
          background: 'linear-gradient(to bottom, #245dbd 0%, #6e9ae3 10%, #245dbd 20%, #2358b9 100%)'
        }}
      >
        {/* Start Button */}
        <div
          className="relative h-full pl-[2px] py-[2px]"
          onClick={() => setIsStartOpen(!isStartOpen)}
        >
          <div className="h-full flex items-center px-2 gap-1 rounded-r-[8px] rounded-tl-[8px] rounded-bl-[8px] cursor-pointer transition-all hover:brightness-110 active:brightness-95 relative overflow-hidden group"
            style={{
              background: 'linear-gradient(to bottom, #3f9c46 0%, #6ebf64 10%, #3f9c46 30%, #308332 100%)',
              boxShadow: 'inset 1px 1px 2px rgba(255,255,255,0.5), 1px 1px 1px rgba(0,0,0,0.4)',
              border: '1px solid #005000',
              borderRight: '1px solid #003300',
              borderBottom: '1px solid #003300'
            }}
          >
            {/* Windows Logo (CSS ONLY) */}
            <div className="w-[16px] h-[16px] relative drop-shadow-sm filter brightness-110">
              <div className="absolute top-[1px] left-[1px] w-[6px] h-[6px] bg-[#f34d3d] rounded-tl-[2px]"></div>
              <div className="absolute top-[1px] right-[1px] w-[6px] h-[6px] bg-[#25ba38] rounded-tr-[2px]"></div>
              <div className="absolute bottom-[1px] left-[1px] w-[6px] h-[6px] bg-[#2a73eb] rounded-bl-[2px]"></div>
              <div className="absolute bottom-[1px] right-[1px] w-[6px] h-[6px] bg-[#fdbb00] rounded-br-[2px]"></div>
            </div>

            <span className="text-white font-bold italic text-[14px] pr-3 select-none" style={{ textShadow: '1px 1px 1px rgba(0,0,0,0.5)' }}>start</span>
          </div>

          {/* Start Menu Placeholder (Optional decorative pop-up) */}
          {/* Start Menu with Icons */}
          {isStartOpen && (
            <div className="absolute bottom-[32px] left-0 w-[380px] h-[480px] bg-white border border-[#003399] rounded-t-[5px] shadow-2xl flex flex-col overflow-hidden z-50 rounded-tr-[5px] rounded-tl-[5px]">
              <div className="h-[50px] bg-gradient-to-b from-[#166bae] to-[#0d4f9b] flex items-center px-2 gap-3 border-b border-[#0d4f9b] shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
                <div className="w-[36px] h-[36px] bg-white rounded-[3px] overflow-hidden border-[2px] border-white shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={AVATARS[avatarIndex]} alt="User" className="w-full h-full object-cover" />
                </div>
                <span className="text-white font-bold text-[16px] drop-shadow-md">{username}</span>
              </div>
              <div className="flex-grow flex border-t border-[#fcae42]">
                <div className="w-1/2 bg-white p-2 flex flex-col gap-1 border-r border-[#d3d3d3] relative">
                  <div className="font-bold text-[#333] mb-1 px-1 text-[11px]">Internet</div>
                  <div className="flex items-center gap-2 p-1 hover:bg-[#316ac5] hover:text-white cursor-pointer group rounded-[2px] mb-1">
                    <img src="/Internet explorer.ico" alt="IE" className="w-[32px] h-[32px] object-contain" />
                    <div className="flex flex-col leading-none">
                      <span className="text-[12px] font-bold text-[#333] group-hover:text-white mb-[2px]">Internet Explorer</span>
                      <span className="text-[10px] text-[#888] group-hover:text-[#dceaf7]">Browser</span>
                    </div>
                  </div>

                  <div className="font-bold text-[#333] mb-1 px-1 mt-1 text-[11px]">E-mail</div>
                  <div className="flex items-center gap-2 p-1 hover:bg-[#316ac5] hover:text-white cursor-pointer group rounded-[2px]">
                    <img src="/Outlook_Express_XP_Icon.webp" alt="Outlook" className="w-[32px] h-[32px] object-contain" />
                    <div className="flex flex-col leading-none">
                      <span className="text-[12px] font-bold text-[#333] group-hover:text-white mb-[2px]">Outlook Express</span>
                      <span className="text-[10px] text-[#888] group-hover:text-[#dceaf7]">E-mail</span>
                    </div>
                  </div>

                  <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#ddd] to-transparent my-1"></div>

                  {/* Pinned List */}
                  <div className="flex items-center gap-2 p-1 hover:bg-[#316ac5] hover:text-white cursor-pointer group rounded-[2px]">
                    <span className="icon-[emojione--butterfly] w-[16px] h-[16px]" />
                    <span className="text-[11px] text-[#333] group-hover:text-white">MSN Messenger</span>
                  </div>
                  <div className="flex items-center gap-2 p-1 hover:bg-[#316ac5] hover:text-white cursor-pointer group rounded-[2px]">
                    <span className="icon-[flat-color-icons--video-file] w-[16px] h-[16px]" />
                    <span className="text-[11px] text-[#333] group-hover:text-white">Windows Media Player</span>
                  </div>
                  <div className="flex items-center gap-2 p-1 hover:bg-[#316ac5] hover:text-white cursor-pointer group rounded-[2px]">
                    <span className="icon-[emojione--busts-in-silhouette] w-[16px] h-[16px]" />
                    <span className="text-[11px] text-[#333] group-hover:text-white">Windows Messenger</span>
                  </div>
                  <div className="flex items-center gap-2 p-1 hover:bg-[#316ac5] hover:text-white cursor-pointer group rounded-[2px]">
                    <span className="icon-[flat-color-icons--briefcase] w-[16px] h-[16px]" />
                    <span className="text-[11px] text-[#333] group-hover:text-white">Tour Windows XP</span>
                  </div>

                  <div className="mt-auto flex justify-center py-2 border-t border-[#eee]">
                    <div className="flex items-center gap-1 font-bold text-[#333] text-[11px] cursor-pointer hover:bg-[#eefcfeb6] p-1 rounded">
                      All Programs <span className="bg-[#2f8b39] text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px] pl-[1px]">▶</span>
                    </div>
                  </div>
                </div>

                <div className="w-1/2 bg-[#d3e5fa] p-2 flex flex-col gap-[2px] border-l border-[#95bdee] text-[11px]">
                  <div className="flex items-center gap-2 p-1 hover:bg-[#316ac5] hover:text-white cursor-pointer rounded-[2px] group">
                    <span className="icon-[flat-color-icons--folder] w-[18px] h-[18px]" />
                    <span className="text-[#00135b] font-bold group-hover:text-white">My Documents</span>
                  </div>
                  <div className="flex items-center gap-2 p-1 hover:bg-[#316ac5] hover:text-white cursor-pointer rounded-[2px] group">
                    <span className="icon-[flat-color-icons--document] w-[18px] h-[18px]" />
                    <span className="text-[#00135b] font-bold group-hover:text-white">My Recent Documents</span>
                  </div>
                  <div className="flex items-center gap-2 p-1 hover:bg-[#316ac5] hover:text-white cursor-pointer rounded-[2px] group">
                    <span className="icon-[flat-color-icons--picture] w-[18px] h-[18px]" />
                    <span className="text-[#00135b] font-bold group-hover:text-white">My Pictures</span>
                  </div>
                  <div className="flex items-center gap-2 p-1 hover:bg-[#316ac5] hover:text-white cursor-pointer rounded-[2px] group">
                    <span className="icon-[flat-color-icons--music] w-[18px] h-[18px]" />
                    <span className="text-[#00135b] font-bold group-hover:text-white">My Music</span>
                  </div>
                  <div className="flex items-center gap-2 p-1 hover:bg-[#316ac5] hover:text-white cursor-pointer rounded-[2px] group mt-1">
                    <span className="icon-[flat-color-icons--display] w-[18px] h-[18px]" />
                    <span className="text-[#00135b] font-bold group-hover:text-white">My Computer</span>
                  </div>

                  <div className="w-full h-[1px] bg-[#95bdee] my-1"></div>

                  <div className="flex items-center gap-2 p-1 hover:bg-[#316ac5] hover:text-white cursor-pointer rounded-[2px] group">
                    <span className="icon-[flat-color-icons--settings] w-[18px] h-[18px]" />
                    <span className="text-[#00135b] group-hover:text-white">Control Panel</span>
                  </div>
                  <div className="flex items-center gap-2 p-1 hover:bg-[#316ac5] hover:text-white cursor-pointer rounded-[2px] group">
                    <span className="icon-[flat-color-icons--list] w-[18px] h-[18px]" />
                    <span className="text-[#00135b] group-hover:text-white">Set Program Access...</span>
                  </div>
                  <div className="flex items-center gap-2 p-1 hover:bg-[#316ac5] hover:text-white cursor-pointer rounded-[2px] group">
                    <span className="icon-[flat-color-icons--print] w-[18px] h-[18px]" />
                    <span className="text-[#00135b] group-hover:text-white">Printers and Faxes</span>
                  </div>

                  <div className="w-full h-[1px] bg-[#95bdee] my-1"></div>

                  <div className="flex items-center gap-2 p-1 hover:bg-[#316ac5] hover:text-white cursor-pointer rounded-[2px] group">
                    <span className="icon-[mdi--help-circle] w-[18px] h-[18px] text-[#1b73e8] group-hover:text-white" />
                    <span className="text-[#00135b] group-hover:text-white">Help and Support</span>
                  </div>
                  <div className="flex items-center gap-2 p-1 hover:bg-[#316ac5] hover:text-white cursor-pointer rounded-[2px] group">
                    <span className="icon-[flat-color-icons--search] w-[18px] h-[18px]" />
                    <span className="text-[#00135b] group-hover:text-white">Search</span>
                  </div>
                  <div className="flex items-center gap-2 p-1 hover:bg-[#316ac5] hover:text-white cursor-pointer rounded-[2px] group">
                    <span className="icon-[flat-color-icons--command-line] w-[18px] h-[18px]" />
                    <span className="text-[#00135b] group-hover:text-white">Run...</span>
                  </div>
                </div>
              </div>
              <div className="h-[40px] bg-gradient-to-b from-[#4e81d1] to-[#1a57b8] flex items-center justify-end px-2 gap-3 border-t border-[#fcae42]">
                <div className="flex items-center gap-1 cursor-pointer hover:bg-[#316ac5] px-1 rounded flex-none transition-colors">
                  <div className="w-[20px] h-[20px] bg-[#e5a041] rounded-[2px] border border-white/40 flex items-center justify-center shadow-sm">
                    <span className="icon-[mdi--key-variant] w-[14px] h-[14px] text-white" />
                  </div>
                  <span className="text-white text-[11px]">Log Off</span>
                </div>
                <div className="flex items-center gap-1 cursor-pointer hover:bg-[#316ac5] px-1 rounded flex-none transition-colors">
                  <div className="w-[20px] h-[20px] bg-[#cf4e46] rounded-[2px] border border-white/40 flex items-center justify-center shadow-sm">
                    <span className="icon-[mdi--power] w-[14px] h-[14px] text-white" />
                  </div>
                  <span className="text-white text-[11px]">Turn Off Computer</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Separator / Handle */}
        <div className="w-[10px] h-full flex items-center justify-center opacity-30 mx-1">
          <div className="w-[1px] h-[80%] bg-white/20 border-l border-black/10"></div>
        </div>

        {/* Task Buttons Container */}
        <div className="flex-grow flex items-center gap-1 overflow-hidden px-1">
          {/* Active Window Button (MSN) */}
          <div className="w-[160px] h-[24px] bg-[#1e52b7] rounded-[2px] flex items-center px-2 gap-2 cursor-pointer shadow-[inset_1px_2px_3px_rgba(0,0,0,0.3)] border-t border-[#153a82] border-l border-[#153a82] border-r border-[#3a75e6] border-b border-[#3a75e6]"
            style={{
              background: 'linear-gradient(to bottom, #194398 0%, #194398 100%)',
            }}
          >
            <img src="/Messenger.png" alt="Task Icon" className="w-[16px] h-[16px]" />
            <span className="text-white text-[11px] truncate shadow-black drop-shadow-md opacity-90">MSN Messenger</span>
          </div>

          {/* Inactive Button Example (Hidden for now, just decorative) */}
        </div>

        {/* System Tray */}
        <div className="h-full flex items-center pl-2 pr-4 gap-2 border-l border-[#135fba] shadow-[inset_1px_1px_1px_rgba(0,0,0,0.15)] relative"
          style={{
            background: 'linear-gradient(to bottom, #1290e8 0%, #2f9ce8 10%, #0b77e9 30%, #1290e8 100%)'
          }}
        >
          {/* Collapse Arrow */}
          <div className="w-[16px] h-[16px] bg-[#1290e8] rounded-full flex items-center justify-center cursor-pointer hover:bg-white/20 border border-white/20 shadow-sm text-white text-[10px]">
            ‹
          </div>

          {/* Tray Icons */}
          <div className="flex items-center gap-1 mx-1">
            {/* Generic Icons: Volume, Network, USB */}
            <span className="text-white/90 text-[12px] cursor-pointer hover:text-white translate-y-[1px]">🔈</span>
            <span className="text-white/90 text-[12px] cursor-pointer hover:text-white">🛡️</span>
          </div>

          {/* Clock */}
          <div className="text-white text-[11px] font-thin tracking-wide flex flex-col items-center justify-center leading-none pl-2 border-l border-black/10 shadow-[inset_1px_0_0_rgba(255,255,255,0.1)] h-full cursor-default hover:bg-[#1975c9] px-2 transition-colors min-w-[50px]">
            {currentTime ? currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </div>
        </div>

      </div>
    </div>
  );
}
