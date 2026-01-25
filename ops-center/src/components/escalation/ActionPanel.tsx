import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Phone, Unlock, RefreshCw, MessageSquare, Send, CheckCircle, Wifi, ChevronDown, Loader2, BookOpen } from 'lucide-react';
import { Escalation, getIntentLabel } from '@/lib/mockData';
import { useReplyToEscalation } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ActionPanelProps {
  escalation: Escalation;
}

export function ActionPanel({ escalation }: ActionPanelProps) {
  const [message, setMessage] = useState('');
  const [isResolved, setIsResolved] = useState(escalation.status === 'resolved');
  const [showPlaybook, setShowPlaybook] = useState(false);

  const replyMutation = useReplyToEscalation();

  const handleAction = (action: string) => {
    console.log(`Action triggered: ${action}`);
    toast.info(`Action: ${action}`);
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      replyMutation.mutate(
        {
          escalationId: escalation.id,
          replyText: message,
          repliedBy: 'property_manager',
        },
        {
          onSuccess: () => {
            toast.success('Message sent to guest');
            setMessage('');
            setIsResolved(true);
          },
          onError: (error) => {
            toast.error(`Failed to send message: ${error.message}`);
          },
        }
      );
    }
  };

  const handleResolve = () => {
    if (!isResolved) {
      // Send an empty reply to mark as resolved
      replyMutation.mutate(
        {
          escalationId: escalation.id,
          replyText: '[Resolved without additional message]',
          repliedBy: 'property_manager',
        },
        {
          onSuccess: () => {
            setIsResolved(true);
            toast.success('Escalation marked as resolved');
          },
          onError: (error) => {
            toast.error(`Failed to resolve: ${error.message}`);
          },
        }
      );
    }
  };

  const renderActionButtons = () => {
    switch (escalation.intent) {
      case 'access_issue':
        return (
          <div className="space-y-2">
            <Button
              size="lg"
              className="w-full justify-start gap-2 h-11"
              onClick={() => handleAction('call_guest')}
            >
              <Phone className="w-4 h-4" />
              Call Guest
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => handleAction('unlock_door')}
              >
                <Unlock className="w-4 h-4" />
                Unlock
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => handleAction('send_new_code')}
              >
                <RefreshCw className="w-4 h-4" />
                New Code
              </Button>
            </div>
          </div>
        );
      case 'wifi_issue':
        return (
          <div className="space-y-2">
            <Button
              size="lg"
              className="w-full justify-start gap-2 h-11"
              onClick={() => handleAction('send_hotspot_info')}
            >
              <Wifi className="w-4 h-4" />
              Send Hotspot Info
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => handleAction('call_isp')}
            >
              <Phone className="w-4 h-4" />
              Call ISP
            </Button>
          </div>
        );
      case 'arrival_navigation':
        return (
          <div className="space-y-2">
            <Button
              size="lg"
              className="w-full justify-start gap-2 h-11"
              onClick={() => handleAction('send_photo')}
            >
              <MessageSquare className="w-4 h-4" />
              Send Entrance Photo
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => handleAction('call_guest')}
            >
              <Phone className="w-4 h-4" />
              Call Guest
            </Button>
          </div>
        );
      default:
        return (
          <Button
            size="lg"
            className="w-full justify-start gap-2 h-11"
            onClick={() => handleAction('message_guest')}
          >
            <MessageSquare className="w-4 h-4" />
            Message Guest
          </Button>
        );
    }
  };

  const getPlaybookSteps = () => {
    switch (escalation.intent) {
      case 'access_issue':
        return [
          'Verify guest identity and booking',
          'Resend access code',
          'Regenerate new code if still blocked',
          'Escalate to PM',
        ];
      case 'wifi_issue':
        return [
          'Confirm network name and password',
          'Guide through router reset',
          'Check if multiple devices affected',
          'Escalate if unresolved',
        ];
      case 'arrival_navigation':
        return [
          'Send text directions',
          'Share landmark-based instructions',
          'Escalate if guest still confused',
        ];
      default:
        return [
          'Acknowledge issue',
          'Attempt resolution',
          'Escalate if needed',
        ];
    }
  };

  return (
    <div className="space-y-6">
      {/* Intent context */}
      <div>
        <p className="section-label mb-1">Issue Type</p>
        <p className="text-sm font-medium">{getIntentLabel(escalation.intent)}</p>
      </div>

      {/* Primary actions */}
      <div className="pt-4 border-t border-border">
        <p className="section-label mb-3">Quick Actions</p>
        {renderActionButtons()}
      </div>

      {/* Message composer */}
      <div className="pt-4 border-t border-border">
        <p className="section-label mb-3">Message Guest</p>
        <Textarea
          placeholder="Type a message to the guest..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="min-h-[80px] resize-none text-sm"
          disabled={replyMutation.isPending}
        />
        <Button
          className="w-full mt-2 gap-2"
          variant="outline"
          onClick={handleSendMessage}
          disabled={!message.trim() || replyMutation.isPending}
        >
          {replyMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {replyMutation.isPending ? 'Sending...' : 'Send'}
        </Button>
      </div>

      {/* Resolution */}
      <div className="pt-4 border-t border-border">
        <Button
          className={cn(
            'w-full gap-2',
            isResolved && 'bg-success hover:bg-success/90 text-success-foreground'
          )}
          variant={isResolved ? 'default' : 'outline'}
          onClick={handleResolve}
          disabled={isResolved || replyMutation.isPending}
        >
          {replyMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4" />
          )}
          {isResolved ? 'Resolved' : 'Mark as Resolved'}
        </Button>
      </div>

      {/* Playbook - collapsible */}
      <div className="pt-4 border-t border-border">
        <button
          onClick={() => setShowPlaybook(!showPlaybook)}
          className="flex items-center justify-between w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            <span>AI Playbook</span>
          </div>
          <ChevronDown className={cn('w-4 h-4 transition-transform', showPlaybook && 'rotate-180')} />
        </button>

        {showPlaybook && (
          <div className="mt-3 p-3 bg-muted/50 rounded-md animate-fade-in">
            <ol className="space-y-2 text-sm text-muted-foreground">
              {getPlaybookSteps().map((step, index) => (
                <li key={index} className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-muted text-xs text-muted-foreground font-medium">
                    {index + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
