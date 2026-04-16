/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Image as ImageIcon, 
  Settings, 
  History, 
  Sparkles, 
  RefreshCw, 
  Edit3, 
  Trash2, 
  Plus, 
  ChevronRight, 
  ChevronLeft,
  Download,
  Share2,
  Save,
  Info,
  Layers,
  Palette,
  Camera,
  Wind,
  Smile,
  Maximize2
} from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

import { Message, AppStyle, GuidanceLevel, PromptDetails } from './types';
import { refinePrompt, generateImage, analyzeStyle } from './services/geminiService';

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Xin chào! Tôi là Kiến trúc sư Prompt AI. Tôi sẽ giúp bạn tạo ra những câu lệnh hình ảnh sống động và chuyên nghiệp.\n\nBạn có thể:\n1. **Mô tả ý tưởng** (VD: 'Một chú mèo trong không gian')\n2. **Dán một prompt có sẵn** để tôi tinh chỉnh lại\n3. **Tải lên ảnh tham khảo** để tôi phân tích phong cách\n\nTôi có thể giúp gì cho bạn hôm nay?",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [guidanceLevel, setGuidanceLevel] = useState<GuidanceLevel>('guided');
  const [currentStyle, setCurrentStyle] = useState<AppStyle | null>(null);
  const [savedStyles, setSavedStyles] = useState<AppStyle[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [showStructured, setShowStructured] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const viewport = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (overrideInput?: string) => {
    const text = overrideInput || input;
    if (!text.trim() && !overrideInput) return;

    const userMessage: Message = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      content: text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    if (!overrideInput) setInput('');
    setIsRefining(true);

    try {
      const result = await refinePrompt(text, guidanceLevel, currentStyle, showStructured);
      
      const assistantMessage: Message = {
        id: Math.random().toString(36).substring(7),
        role: 'assistant',
        content: `Tôi đã tinh chỉnh ý tưởng của bạn thành một câu lệnh chuyên nghiệp. Bạn hãy bấm nút **"Generate Image"** bên dưới để bắt đầu vẽ ảnh nhé!`,
        prompt: result.refinedPrompt,
        structuredPrompt: result.structured,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast.error("Failed to refine prompt. Please try again.");
      console.error(error);
    } finally {
      setIsRefining(false);
    }
  };

  const handleGenerateImage = async (prompt: string, messageId: string) => {
    setIsGenerating(true);
    toast.info("Generating image... this may take a moment.");

    try {
      const imageUrl = await generateImage(prompt);
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, image: imageUrl } : msg
      ));
      
      toast.success("Image generated successfully!");
    } catch (error) {
      toast.error("Failed to generate image.");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      
      toast.info("Analyzing image style...");
      try {
        const style = await analyzeStyle(base64);
        
        const userMessage: Message = {
          id: Math.random().toString(36).substring(7),
          role: 'user',
          content: "Analyze this image style",
          image: base64,
          timestamp: Date.now()
        };
        
        setMessages(prev => [...prev, userMessage]);
        
        const assistantMessage: Message = {
          id: Math.random().toString(36).substring(7),
          role: 'assistant',
          content: `I've analyzed the style of your image. It's a **${style.name}** style. Would you like me to remember this for future prompts?`,
          timestamp: Date.now()
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        
        // Temporarily store it to ask for saving
        setCurrentStyle(style);
        toast.success("Style analyzed!");
      } catch (error) {
        toast.error("Failed to analyze image.");
        console.error(error);
      }
    };
    reader.readAsDataURL(file);
  };

  const saveStyle = () => {
    if (currentStyle && !savedStyles.find(s => s.id === currentStyle.id)) {
      setSavedStyles(prev => [...prev, currentStyle]);
      toast.success(`Style "${currentStyle.name}" saved to memory.`);
    }
  };

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden">
        <Toaster position="top-center" richColors />

        {/* Sidebar */}
        <motion.aside 
          initial={false}
          animate={{ width: sidebarOpen ? 320 : 0, opacity: sidebarOpen ? 1 : 0 }}
          className="border-r border-white/10 bg-[#0f0f0f] flex flex-col overflow-hidden"
        >
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-black" />
              </div>
              <h1 className="font-bold text-xl tracking-tight">PromptArchitect</h1>
            </div>
          </div>

          <ScrollArea className="flex-1 px-4">
            <div className="space-y-8 pb-8">
              {/* Guidance Level */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-white/40">Guidance Mode</h3>
                  <Badge variant="outline" className="text-[10px] border-orange-500/50 text-orange-500">
                    {guidanceLevel.replace('-', ' ')}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['minimal', 'guided', 'highly-guided'] as GuidanceLevel[]).map((level) => (
                    <Button
                      key={level}
                      variant={guidanceLevel === level ? "default" : "outline"}
                      size="sm"
                      className={`text-[10px] h-8 ${guidanceLevel === level ? 'bg-orange-500 hover:bg-orange-600 text-black' : 'border-white/10 hover:bg-white/5'}`}
                      onClick={() => setGuidanceLevel(level)}
                    >
                      {level.split('-')[0]}
                    </Button>
                  ))}
                </div>
              </section>

              <Separator className="bg-white/5" />

              {/* Memory / Styles */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-white/40">Memory (Styles)</h3>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => fileInputRef.current?.click()}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Preset Styles */}
                <div className="grid grid-cols-1 gap-2 mb-4">
                  {[
                    { id: 'cartoon', name: 'Cartoon', description: 'Vibrant, playful animated style', details: { style: 'Cartoon, 3D animation style, vibrant colors' } },
                    { id: 'student-friendly', name: 'Student Friendly', description: 'Clear, educational, and approachable', details: { style: 'Clean, educational, student-friendly, soft lighting' } },
                    { id: 'human-like', name: 'Human-like', description: 'Realistic, natural human features', details: { style: 'Photorealistic, natural human features, cinematic lighting' } }
                  ].map((style) => (
                    <Button
                      key={style.id}
                      variant={currentStyle?.id === style.id ? "default" : "outline"}
                      size="sm"
                      className={`justify-start h-auto py-2 px-3 text-left border-white/10 ${currentStyle?.id === style.id ? 'bg-orange-500 hover:bg-orange-600 text-black' : 'hover:bg-white/5'}`}
                      onClick={() => setCurrentStyle(style as AppStyle)}
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold">{style.name}</span>
                        <span className="text-[10px] opacity-60 font-normal">{style.description}</span>
                      </div>
                    </Button>
                  ))}
                </div>

                {currentStyle && !['cartoon', 'student-friendly', 'human-like'].includes(currentStyle.id) && (
                  <Card className="bg-orange-500/10 border-orange-500/20 overflow-hidden">
                    <CardHeader className="p-3 pb-0">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm text-orange-500">{currentStyle.name}</CardTitle>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-orange-500" onClick={saveStyle}>
                          <Save className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3">
                      <p className="text-xs text-white/60 line-clamp-2">{currentStyle.description}</p>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-2">
                  {savedStyles.map((style) => (
                    <div 
                      key={style.id}
                      className={`group flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${currentStyle?.id === style.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
                      onClick={() => setCurrentStyle(style)}
                    >
                      <div className="w-10 h-10 rounded bg-white/5 overflow-hidden border border-white/10">
                        {style.referenceImage ? (
                          <img src={style.referenceImage} alt={style.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Palette className="w-4 h-4 text-white/20" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{style.name}</p>
                        <p className="text-[10px] text-white/40 truncate">{style.description}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSavedStyles(prev => prev.filter(s => s.id !== style.id));
                          if (currentStyle?.id === style.id) setCurrentStyle(null);
                        }}
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </Button>
                    </div>
                  ))}
                  {savedStyles.length === 0 && !currentStyle && (
                    <div className="text-center py-8 border border-dashed border-white/5 rounded-xl">
                      <ImageIcon className="w-8 h-8 text-white/10 mx-auto mb-2" />
                      <p className="text-xs text-white/20">No styles saved yet</p>
                    </div>
                  )}
                </div>
              </section>

              <Separator className="bg-white/5" />

              {/* Options */}
              <section className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-white/40">Options</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">Structured Output</label>
                    <p className="text-[10px] text-white/40">Show detailed breakdown</p>
                  </div>
                  <Switch checked={showStructured} onCheckedChange={setShowStructured} />
                </div>
              </section>
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">Architect Mode</p>
                <p className="text-[10px] text-white/40">v1.0.4 - Active</p>
              </div>
              <Settings className="w-4 h-4 text-white/20" />
            </div>
          </div>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col relative">
          {/* Header */}
          <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#0a0a0a]/80 backdrop-blur-xl z-10">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
                {sidebarOpen ? <ChevronLeft /> : <ChevronRight />}
              </Button>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-white/5 text-white/60 hover:bg-white/10">
                  {messages.length} Messages
                </Badge>
                {currentStyle && (
                  <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30">
                    Style: {currentStyle.name}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-xs text-white/40 hover:text-white" onClick={() => setMessages([])}>
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Chat
              </Button>
            </div>
          </header>

          {/* Chat Area */}
          <div className="flex-1 overflow-hidden relative">
            <ScrollArea ref={scrollRef} className="h-full">
              <div className="max-w-4xl mx-auto p-6 space-y-8 pb-40">
                {messages.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-20 space-y-6"
                >
                  <div className="w-20 h-20 bg-orange-500/10 rounded-3xl flex items-center justify-center mx-auto border border-orange-500/20">
                    <Sparkles className="w-10 h-10 text-orange-500" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Welcome to PromptArchitect</h2>
                    <p className="text-white/40 max-w-md mx-auto">
                      I help you craft professional AI image prompts. Start by describing an idea or paste a prompt you want to refine.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
                    {[
                      "A futuristic cyberpunk city in the rain",
                      "A cozy cottage in a mystical forest",
                      "A professional portrait of a space explorer",
                      "A minimalist 3D isometric room"
                    ].map((suggestion) => (
                      <Button 
                        key={suggestion}
                        variant="outline" 
                        className="justify-start text-left h-auto py-3 px-4 border-white/5 hover:bg-white/5 hover:border-white/10"
                        onClick={() => handleSend(suggestion)}
                      >
                        <span className="text-xs text-white/60">{suggestion}</span>
                      </Button>
                    ))}
                  </div>
                </motion.div>
              )}

              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-4 ${message.role === 'assistant' ? '' : 'flex-row-reverse'}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    message.role === 'assistant' ? 'bg-orange-500 text-black' : 'bg-white/10 text-white'
                  }`}>
                    {message.role === 'assistant' ? <Sparkles className="w-4 h-4" /> : <div className="text-[10px] font-bold">YOU</div>}
                  </div>
                  
                  <div className={`flex flex-col gap-3 max-w-[80%] ${message.role === 'assistant' ? '' : 'items-end'}`}>
                    <div className={`p-4 rounded-2xl ${
                      message.role === 'assistant' ? 'bg-white/5 border border-white/10' : 'bg-orange-500 text-black font-medium'
                    }`}>
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      
                      {message.image && !message.prompt && (
                        <div className="mt-4 rounded-xl overflow-hidden border border-white/10">
                          <img src={message.image} alt="Reference" className="w-full h-auto" referrerPolicy="no-referrer" />
                        </div>
                      )}
                    </div>

                    {message.prompt && (
                      <Card className="bg-[#151515] border-white/10 overflow-hidden">
                        <CardHeader className="p-4 pb-2 border-b border-white/5">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-[10px] border-orange-500/50 text-orange-500">AI Image Prompt</Badge>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                navigator.clipboard.writeText(message.prompt!);
                                toast.success("Prompt copied to clipboard!");
                              }}>
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4">
                          <p className="text-sm font-mono text-white/80 leading-relaxed italic">
                            "{message.prompt}"
                          </p>
                          
                          {message.structuredPrompt && (
                            <div className="mt-6 grid grid-cols-2 gap-4">
                              {Object.entries(message.structuredPrompt).map(([key, value]) => (
                                <div key={key} className="space-y-1">
                                  <p className="text-[10px] uppercase tracking-tighter text-white/30 font-bold">{key}</p>
                                  <p className="text-xs text-white/70">{value}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="p-4 pt-0 flex gap-2">
                          <Button 
                            className="flex-1 bg-orange-500 hover:bg-orange-600 text-black font-bold"
                            disabled={isGenerating}
                            onClick={() => handleGenerateImage(message.prompt!, message.id)}
                          >
                            {isGenerating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <ImageIcon className="w-4 h-4 mr-2" />}
                            Generate Image
                          </Button>
                          <Button variant="outline" className="border-white/10 hover:bg-white/5" onClick={() => setInput(message.prompt!)}>
                            <Edit3 className="w-4 h-4" />
                          </Button>
                        </CardFooter>

                        {message.image && (
                          <div className="p-4 pt-0">
                            <div className="relative group rounded-xl overflow-hidden border border-white/10">
                              <img src={message.image} alt="Generated" className="w-full h-auto" referrerPolicy="no-referrer" />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                <Button variant="secondary" size="sm" onClick={() => window.open(message.image)}>
                                  <Maximize2 className="w-4 h-4 mr-2" />
                                  View Full
                                </Button>
                                <Button variant="secondary" size="sm" onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = message.image!;
                                  link.download = 'generated-image.png';
                                  link.click();
                                }}>
                                  <Download className="w-4 h-4 mr-2" />
                                  Save
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </Card>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {isRefining && (
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-orange-500 text-black flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                    <div className="flex gap-1">
                      <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                      <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                      <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Input Area */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent">
            <div className="max-w-4xl mx-auto">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-1000"></div>
                <div className="relative bg-[#151515] border border-white/10 rounded-2xl overflow-hidden">
                  <Textarea 
                    placeholder="Describe an image idea or paste a prompt..."
                    className="min-h-[60px] max-h-[200px] w-full bg-transparent border-none focus-visible:ring-0 resize-none p-4 pr-32 text-sm"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <div className="absolute right-2 bottom-2 flex items-center gap-2">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                    <Tooltip>
                      <TooltipTrigger render={(props) => (
                        <Button 
                          {...props}
                          variant="ghost" 
                          size="icon" 
                          className="h-10 w-10 text-white/40 hover:text-white hover:bg-white/5"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Camera className="w-5 h-5" />
                        </Button>
                      )} />
                      <TooltipContent>Upload reference image</TooltipContent>
                    </Tooltip>
                    <Button 
                      className="h-10 px-4 bg-orange-500 hover:bg-orange-600 text-black font-bold"
                      onClick={() => handleSend()}
                      disabled={!input.trim() || isRefining}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Refine
                    </Button>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-center mt-3 text-white/20 uppercase tracking-widest">
                Press Enter to refine • Shift+Enter for new line
              </p>
            </div>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
