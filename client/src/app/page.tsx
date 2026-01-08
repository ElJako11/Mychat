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
  const [isUsernameLocked, setIsUsernameLocked] = useState(false);
  const [activeFormats, setActiveFormats] = useState({ bold: false, italic: false, underline: false });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

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
    <div className="w-full h-full min-h-screen flex justify-center items-center p-4 font-sans bg-transparent">
      {/* Main Window Frame - XP Style */}
      <div className="w-[800px] h-[600px] flex flex-col bg-[#eef3fa] border border-[#004e98] rounded-tl-[8px] rounded-tr-[8px] rounded-bl-[3px] rounded-br-[3px] shadow-[0_0_0_1px_rgba(255,255,255,0.3),0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden relative select-none">

        {/* Title Bar - Gradient Blue */}
        <div className="h-[28px] bg-gradient-to-r from-[#0058ee] via-[#3593ff] to-[#0058ee] flex items-center justify-between px-2 cursor-default relative z-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
          <div className="flex items-center gap-2">
            <div className="text-white text-[12px] font-bold drop-shadow-[0_1px_0_rgba(0,18,87,0.6)] pl-1">
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
              <div className="w-[26px] h-[26px] mb-[1px] opacity-90 group-hover:opacity-100 bg-center bg-no-repeat bg-contain"
                style={{ backgroundImage: `url('https://api.iconify.design/emojione:${['busts-in-silhouette', 'file-folder', 'video-camera', 'studio-microphone', 'soccer-ball', 'joystick'][i]}.svg')` }}></div>
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
                <img src={AVATARS[(avatarIndex + 1) % AVATARS.length]} alt="Remote" className="w-full h-full object-cover" />
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
    </div>
  );
}
