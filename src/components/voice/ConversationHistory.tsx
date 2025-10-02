import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Search, Download, Trash2, Clock, MessageSquare,
  Filter, Calendar, Volume2
} from 'lucide-react';

interface Conversation {
  id: string;
  created_at: string;
  message_type: string;
  message_content: string;
  message_data: any;
}

interface ConversationHistoryProps {
  userId?: string;
  familyGroupId?: string;
  onReplay?: (conversation: Conversation) => void;
}

export const ConversationHistory: React.FC<ConversationHistoryProps> = ({ 
  userId, 
  familyGroupId,
  onReplay 
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadConversations();
  }, [userId, familyGroupId]);

  useEffect(() => {
    filterConversations();
  }, [searchTerm, conversations]);

  const loadConversations = async () => {
    if (!userId || !familyGroupId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('communication_logs')
        .select('*')
        .eq('family_group_id', familyGroupId)
        .eq('sender_id', userId)
        .eq('message_type', 'ai_conversation')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setConversations((data || []) as Conversation[]);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Failed to load conversation history');
    } finally {
      setLoading(false);
    }
  };

  const filterConversations = () => {
    if (!searchTerm) {
      setFilteredConversations(conversations);
      return;
    }

    const filtered = conversations.filter(conv => {
      const messagePreview = conv.message_data?.messages?.[0]?.content || '';
      return (
        messagePreview.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.message_content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    setFilteredConversations(filtered);
  };

  const exportConversation = (conv: Conversation) => {
    const exportData = {
      date: new Date(conv.created_at).toLocaleString(),
      duration: conv.message_data?.duration || 0,
      voice: conv.message_data?.voice || 'unknown',
      messages: conv.message_data?.messages || []
    };

    // JSON export
    const jsonBlob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const jsonUrl = URL.createObjectURL(jsonBlob);
    const jsonLink = document.createElement('a');
    jsonLink.href = jsonUrl;
    jsonLink.download = `conversation-${conv.id}.json`;
    jsonLink.click();
    URL.revokeObjectURL(jsonUrl);

    // TXT export
    const txtContent = `Conversation Export - ${exportData.date}\n` +
      `Duration: ${exportData.duration.toFixed(1)} minutes\n` +
      `Voice: ${exportData.voice}\n\n` +
      exportData.messages.map((m: any) => {
        const time = new Date(m.timestamp).toLocaleTimeString();
        return `[${time}] ${m.type === 'user' ? 'You' : 'AI'}: ${m.content}`;
      }).join('\n\n');

    const txtBlob = new Blob([txtContent], { type: 'text/plain' });
    const txtUrl = URL.createObjectURL(txtBlob);
    const txtLink = document.createElement('a');
    txtLink.href = txtUrl;
    txtLink.download = `conversation-${conv.id}.txt`;
    txtLink.click();
    URL.revokeObjectURL(txtUrl);

    toast.success('Conversation exported (JSON + TXT)');
  };

  const deleteConversation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('communication_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setConversations(prev => prev.filter(c => c.id !== id));
      toast.success('Conversation deleted');
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete conversation');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Conversation History
        </CardTitle>
        <CardDescription>
          View, search, and export your past AI conversations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="icon" onClick={loadConversations}>
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        {/* Conversation List */}
        <ScrollArea className="h-[500px]">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading conversations...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No matching conversations found' : 'No conversations yet'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredConversations.map((conv) => {
                const messageCount = conv.message_data?.messages?.length || 0;
                const firstMessage = conv.message_data?.messages?.[0]?.content || '';
                const duration = conv.message_data?.duration || 0;
                const voice = conv.message_data?.voice || 'unknown';

                return (
                  <Card key={conv.id} className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {formatDate(conv.created_at)}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              {duration.toFixed(1)} min
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {firstMessage || 'No preview available'}
                          </p>
                          
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              {messageCount} messages
                            </span>
                            <span className="flex items-center gap-1">
                              <Volume2 className="w-3 h-3" />
                              {voice}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-1">
                          {onReplay && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onReplay(conv)}
                              title="Replay conversation"
                            >
                              <Volume2 className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => exportConversation(conv)}
                            title="Export conversation"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteConversation(conv.id)}
                            title="Delete conversation"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
