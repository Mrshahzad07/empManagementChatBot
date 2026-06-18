import React, { useState, useRef, useEffect } from 'react';
import {
  Box, TextField, IconButton, Typography, Paper, Avatar, Chip,
  CircularProgress, Button, Divider, List, ListItemButton, ListItemText,
  Drawer, useTheme, alpha, Card, CardContent, Tooltip
} from '@mui/material';
import {
  Send, SmartToy, Person, Add, History, AttachFile,
  Download, EventNote, Money, Description, Delete,
  ContentCopy, Check, Close
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi, salaryApi, documentsApi } from '../../services/api';
import { useAppSelector } from '../../store';
import { ChatMessage, ChatSession } from '../../types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const QUICK_PROMPTS = [
  { label: 'Leave Balance', text: 'How many leaves do I have left?', icon: '📊' },
  { label: 'Apply Leave', text: 'I need leave tomorrow', icon: '🌴' },
  { label: 'Salary Slip', text: 'Give me last month salary slip', icon: '💰' },
  { label: 'Documents', text: 'Show my documents', icon: '📄' },
  { label: 'Leave History', text: 'Show my leave history', icon: '📅' },
  { label: 'Announcements', text: 'Any company announcements?', icon: '📢' },
];

interface MessageBubbleProps {
  message: ChatMessage;
  onDownload?: (data: any) => void;
}

function TypingIndicator() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5 }}>
      <Avatar sx={{ width: 32, height: 32, background: 'linear-gradient(135deg, #1565C0, #0D47A1)' }}>
        <SmartToy sx={{ fontSize: 18, color: 'white' }} />
      </Avatar>
      <Box sx={{
        px: 2, py: 1.5, borderRadius: '16px 16px 16px 4px',
        background: 'rgba(21,101,192,0.08)',
        border: '1px solid rgba(21,101,192,0.15)',
        display: 'flex', gap: 0.5, alignItems: 'center',
      }}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ y: [-4, 0, -4] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
          >
            <Box sx={{
              width: 7, height: 7, borderRadius: '50%',
              background: '#1565C0', opacity: 0.7,
            }} />
          </motion.div>
        ))}
      </Box>
    </Box>
  );
}

function MessageBubble({ message, onDownload }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isDark = useAppSelector((s) => s.ui.themeMode) === 'dark';
  const [copied, setCopied] = useState(false);
  const toolResult = message.tool_result as any;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderActionCard = () => {
    if (!toolResult || toolResult.status === 'error') return null;

    // Salary slip download card
    if (toolResult.action === 'download_salary_slip' && toolResult.salary_record_id) {
      return (
        <Card sx={{
          mt: 1.5, background: 'linear-gradient(135deg, rgba(46,125,50,0.08), rgba(46,125,50,0.04))',
          border: '1px solid rgba(46,125,50,0.2)',
        }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="body2" fontWeight={700} sx={{ color: '#2E7D32' }}>
                  💰 {toolResult.month_name} {toolResult.year} Salary Slip
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Net: ₹{toolResult.net_salary?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  {' '}• {toolResult.payment_status}
                </Typography>
              </Box>
              <Button
                variant="contained"
                size="small"
                startIcon={<Download />}
                onClick={() => salaryApi.downloadSlip(toolResult.salary_record_id)}
                sx={{ background: '#2E7D32', '&:hover': { background: '#1B5E20' } }}
              >
                Download PDF
              </Button>
            </Box>
          </CardContent>
        </Card>
      );
    }

    // Leave balance card
    if (toolResult.balances && toolResult.status === 'success') {
      return (
        <Card sx={{
          mt: 1.5, background: 'rgba(21,101,192,0.04)',
          border: '1px solid rgba(21,101,192,0.15)',
        }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="body2" fontWeight={700} sx={{ color: '#1565C0', mb: 1.5 }}>
              📊 Leave Balance {toolResult.year}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {toolResult.balances?.map((b: any) => (
                <Chip
                  key={b.leave_type}
                  label={`${b.leave_type.charAt(0).toUpperCase() + b.leave_type.slice(1)}: ${b.remaining}/${b.allocated}`}
                  size="small"
                  sx={{
                    background: alpha('#1565C0', 0.1),
                    color: '#1565C0',
                    fontWeight: 600,
                  }}
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      );
    }

    // Leave applied card
    if (toolResult.leave_id && toolResult.status === 'success') {
      return (
        <Card sx={{
          mt: 1.5, background: 'linear-gradient(135deg, rgba(46,125,50,0.08), rgba(46,125,50,0.04))',
          border: '1px solid rgba(46,125,50,0.2)',
        }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="body2" fontWeight={700} sx={{ color: '#2E7D32', mb: 1 }}>
              ✅ Leave Applied Successfully
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip label={`ID: #${toolResult.leave_id}`} size="small" />
              <Chip label={toolResult.leave_type} size="small" color="primary" />
              <Chip label={`${toolResult.start_date} → ${toolResult.end_date}`} size="small" />
              <Chip label={`${toolResult.total_days} days`} size="small" />
              <Chip label="Pending HR Approval" size="small" color="warning" />
            </Box>
          </CardContent>
        </Card>
      );
    }

    // Salary list
    if (toolResult.action === 'show_salary_list' && toolResult.records?.length > 0) {
      return (
        <Card sx={{ mt: 1.5, border: '1px solid rgba(21,101,192,0.15)' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="body2" fontWeight={700} sx={{ color: '#1565C0', mb: 1 }}>
              💰 Salary Slips
            </Typography>
            {toolResult.records.map((r: any) => (
              <Box key={r.salary_record_id} sx={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                py: 0.75, borderBottom: '1px solid rgba(0,0,0,0.05)',
              }}>
                <Typography variant="body2">
                  {r.month_name} {r.year}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" fontWeight={600}>
                    ₹{r.net_salary.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </Typography>
                  <IconButton
                    size="small" color="primary"
                    onClick={() => salaryApi.downloadSlip(r.salary_record_id)}
                  >
                    <Download fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            ))}
          </CardContent>
        </Card>
      );
    }

    // Document download
    if (toolResult.action === 'download_document' && toolResult.document_id) {
      return (
        <Card sx={{
          mt: 1.5, background: 'linear-gradient(135deg, rgba(21,101,192,0.08), rgba(21,101,192,0.04))',
          border: '1px solid rgba(21,101,192,0.2)',
        }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="body2" fontWeight={700} sx={{ color: '#1565C0' }}>
                  📄 {toolResult.document_name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Added on {toolResult.created_at}
                </Typography>
              </Box>
              <Button
                variant="contained"
                size="small"
                startIcon={<Download />}
                onClick={() => documentsApi.download(toolResult.document_id)}
                sx={{ background: '#1565C0', '&:hover': { background: '#0D47A1' } }}
              >
                Download PDF
              </Button>
            </Box>
          </CardContent>
        </Card>
      );
    }

    // Document list
    if (toolResult.action === 'show_documents' && toolResult.documents?.length > 0) {
      return (
        <Card sx={{ mt: 1.5, border: '1px solid rgba(21,101,192,0.15)' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="body2" fontWeight={700} sx={{ color: '#1565C0', mb: 1 }}>
              📄 Your Documents
            </Typography>
            {toolResult.documents.map((d: any) => (
              <Box key={d.document_id} sx={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                py: 0.75, borderBottom: '1px solid rgba(0,0,0,0.05)',
              }}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {d.document_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {d.created_at}
                  </Typography>
                </Box>
                <IconButton
                  size="small" color="primary"
                  onClick={() => documentsApi.download(d.document_id)}
                >
                  <Download fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
    >
      <Box sx={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        gap: 1,
        mb: 2,
        px: 1,
      }}>
        <Avatar
          sx={{
            width: 34, height: 34, flexShrink: 0,
            background: isUser
              ? 'linear-gradient(135deg, #FF6F00, #E65100)'
              : 'linear-gradient(135deg, #1565C0, #0D47A1)',
          }}
        >
          {isUser ? <Person sx={{ fontSize: 18 }} /> : <SmartToy sx={{ fontSize: 18, color: 'white' }} />}
        </Avatar>

        <Box sx={{ maxWidth: { xs: '85%', sm: '75%', md: '70%' }, minWidth: 80 }}>
          <Box sx={{
            px: 2, py: 1.5,
            borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
            background: isUser
              ? 'linear-gradient(135deg, #FF6F00, #E65100)'
              : isDark ? 'rgba(21,101,192,0.12)' : 'rgba(21,101,192,0.07)',
            border: isUser ? 'none' : '1px solid rgba(21,101,192,0.15)',
            position: 'relative',
            group: 'message',
          }}>
            <Typography
              variant="body2"
              sx={{
                color: isUser ? 'white' : 'text.primary',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.65,
              }}
            >
              {message.content}
            </Typography>

            {!isUser && (
              <Tooltip title={copied ? 'Copied!' : 'Copy'}>
                <IconButton
                  size="small"
                  onClick={handleCopy}
                  sx={{
                    position: 'absolute',
                    top: 4, right: 4,
                    opacity: 0.3,
                    '&:hover': { opacity: 1 },
                    color: 'text.secondary',
                  }}
                >
                  {copied ? <Check sx={{ fontSize: 14 }} /> : <ContentCopy sx={{ fontSize: 14 }} />}
                </IconButton>
              </Tooltip>
            )}
          </Box>

          {/* Action Cards */}
          {!isUser && renderActionCard()}

          <Typography variant="caption" color="text.disabled" sx={{
            display: 'block', mt: 0.5,
            textAlign: isUser ? 'right' : 'left',
          }}>
            {format(new Date(message.created_at), 'HH:mm')}
            {message.tool_name && ` · Used: ${message.tool_name.replace(/_/g, ' ')}`}
          </Typography>
        </Box>
      </Box>
    </motion.div>
  );
}

export default function ChatPage() {
  const { user } = useAppSelector((s) => s.auth);
  const isDark = useAppSelector((s) => s.ui.themeMode) === 'dark';
  const queryClient = useQueryClient();

  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: sessions } = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: () => chatApi.getSessions().then((r) => r.data),
  });

  const sendMutation = useMutation({
    mutationFn: (message: string) => chatApi.sendMessage(message, currentSessionId),
    onMutate: async (message) => {
      // Optimistic user message
      const tempMsg: ChatMessage = {
        id: Date.now(),
        role: 'user',
        content: message,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempMsg]);
      setIsTyping(true);
    },
    onSuccess: (res) => {
      const data = res.data;
      if (!currentSessionId) {
        setCurrentSessionId(data.session_id);
      }
      setMessages((prev) => [...prev, data.message]);
      setIsTyping(false);
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
    onError: () => {
      setIsTyping(false);
      toast.error('Failed to send message. Please try again.');
    },
  });

  const handleSend = () => {
    if (!input.trim() || sendMutation.isPending) return;
    const message = input.trim();
    setInput('');
    sendMutation.mutate(message);
  };

  const loadSession = async (sessionId: string) => {
    try {
      const res = await chatApi.getSessionMessages(sessionId);
      setCurrentSessionId(sessionId);
      setMessages(res.data.messages);
      setShowSessions(false);
    } catch {
      toast.error('Failed to load conversation');
    }
  };

  const newConversation = () => {
    setCurrentSessionId(undefined);
    setMessages([]);
    setShowSessions(false);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box sx={{ display: 'flex', height: { xs: 'calc(100vh - 120px)', sm: 'calc(100vh - 130px)', md: 'calc(100vh - 140px)' }, gap: 2 }}>
      {/* Sessions Sidebar (desktop) */}
      <Paper
        sx={{
          width: 260,
          flexShrink: 0,
          display: { xs: 'none', lg: 'flex' },
          flexDirection: 'column',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: 2, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
          <Button
            fullWidth variant="contained" startIcon={<Add />}
            onClick={newConversation}
            sx={{ background: 'linear-gradient(135deg, #1565C0, #0D47A1)' }}
          >
            New Chat
          </Button>
        </Box>
        <Box sx={{ p: 1.5 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700}
            sx={{ px: 1, display: 'block', mb: 1 }}>
            RECENT CONVERSATIONS
          </Typography>
          {sessions?.map((session: ChatSession) => (
            <ListItemButton
              key={session.id}
              selected={session.id === currentSessionId}
              onClick={() => loadSession(session.id)}
              sx={{ borderRadius: 2, mb: 0.5 }}
            >
              <ListItemText
                primary={
                  <Typography variant="body2" noWrap fontWeight={session.id === currentSessionId ? 700 : 400}>
                    {session.title}
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    {session.message_count} messages
                  </Typography>
                }
              />
            </ListItemButton>
          ))}
        </Box>
      </Paper>

      {/* Main Chat Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Chat Header */}
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1.5,
          p: 2, mb: 1,
          background: isDark ? 'rgba(21,101,192,0.08)' : 'rgba(21,101,192,0.04)',
          borderRadius: 3, border: `1px solid ${isDark ? 'rgba(21,101,192,0.15)' : 'rgba(21,101,192,0.1)'}`,
        }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: '14px',
            background: 'linear-gradient(135deg, #1565C0, #0D47A1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(21,101,192,0.35)',
          }}>
            <SmartToy sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body1" fontWeight={700}>AI HR Assistant</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 7, height: 7, borderRadius: '50%', background: '#4CAF50' }} />
              <Typography variant="caption" color="text.secondary">
                Online • Supports English, Hindi, Hinglish
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={newConversation} title="New chat">
            <Add />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setShowSessions(!showSessions)}
            sx={{ display: { lg: 'none' } }}
          >
            <History />
          </IconButton>
        </Box>

        {/* Messages Area */}
        <Paper sx={{
          flex: 1, overflow: 'auto', p: 1,
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          borderRadius: 3,
          mb: 1,
        }}>
          {messages.length === 0 ? (
            <Box sx={{
              height: '100%', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', p: 3,
            }}>
              <Box sx={{
                width: 80, height: 80, borderRadius: '24px',
                background: 'linear-gradient(135deg, #1565C0, #0D47A1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                mb: 3, boxShadow: '0 16px 48px rgba(21,101,192,0.35)',
              }}>
                <SmartToy sx={{ fontSize: 44, color: 'white' }} />
              </Box>
              <Typography variant="h5" fontWeight={700} gutterBottom>
                Hi {user?.first_name}! 👋
              </Typography>
              <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 3, maxWidth: 400 }}>
                I'm your AI HR Assistant. Ask me anything — in English, Hindi, or Hinglish.
                I can help with leaves, salary slips, documents, and more.
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                {QUICK_PROMPTS.map((prompt) => (
                  <Chip
                    key={prompt.label}
                    label={`${prompt.icon} ${prompt.label}`}
                    onClick={() => {
                      setInput(prompt.text);
                      sendMutation.mutate(prompt.text);
                      setInput('');
                    }}
                    clickable
                    sx={{
                      fontWeight: 600,
                      background: isDark ? 'rgba(21,101,192,0.12)' : 'rgba(21,101,192,0.06)',
                      border: `1px solid ${isDark ? 'rgba(21,101,192,0.25)' : 'rgba(21,101,192,0.15)'}`,
                      color: '#1565C0',
                      '&:hover': {
                        background: 'rgba(21,101,192,0.2)',
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>
          ) : (
            <Box sx={{ py: 1 }}>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </Box>
          )}
        </Paper>

        {/* Input Area */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder={"Ask anything... 'Need leave tomorrow', 'March salary slip'"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                background: isDark ? 'rgba(255,255,255,0.03)' : 'white',
              },
            }}
          />
          <IconButton
            onClick={handleSend}
            disabled={!input.trim() || sendMutation.isPending}
            sx={{
              width: 48, height: 48, flexShrink: 0,
              background: 'linear-gradient(135deg, #1565C0, #0D47A1)',
              color: 'white',
              '&:hover': { background: 'linear-gradient(135deg, #1976D2, #1565C0)' },
              '&:disabled': { background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' },
              borderRadius: 2,
            }}
          >
            {sendMutation.isPending ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <Send sx={{ fontSize: 20 }} />
            )}
          </IconButton>
        </Box>
        <Typography variant="caption" color="text.disabled" sx={{ textAlign: 'center', mt: 0.5, display: { xs: 'none', sm: 'block' } }}>
          Press Enter to send · Shift+Enter for new line · All data secured with JWT authentication
        </Typography>
      </Box>
    </Box>
  );
}
