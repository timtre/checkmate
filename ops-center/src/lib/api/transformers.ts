// Transform backend API responses to ops-center UI models

import type {
  EscalationItem,
  MessageItem,
  BatchSuggestion,
  PropertyItem,
  QuestionInsight,
} from './types';
import type {
  Escalation,
  EscalationType,
  Intent,
  Priority,
  EscalationStatus,
  SatisfactionSignal,
  TimelineEvent,
  Property,
  DocSuggestion,
} from '../mockData';

// ===== Priority Derivation =====

export function derivePriority(confidence: number, reason: string): Priority {
  if (confidence < 0.3 || reason === 'dissatisfied') return 'critical';
  if (confidence < 0.5 || reason === 'low_confidence') return 'high';
  return 'medium';
}

// ===== PM Action Type Derivation =====

export function derivePmActionType(reason: string, confidence: number): EscalationType {
  if (reason === 'dissatisfied' || confidence < 0.3) return 'NOTIFY_PM_URGENT';
  if (reason === 'repeated_question' || reason === 'knowledge_gap') return 'REQUEST_PM_INPUT';
  return 'NOTIFY_PM_PASSIVE';
}

// ===== Intent Derivation (keyword-based heuristic) =====

export function deriveIntent(message: string): Intent {
  const lower = message.toLowerCase();

  if (/door|code|key|lock|access|enter|entry|locked out/.test(lower)) {
    return 'access_issue';
  }
  if (/wifi|wi-fi|internet|network|connect|password|router/.test(lower)) {
    return 'wifi_issue';
  }
  if (/heat|cold|water|ac|temperature|thermostat|hot|warm|freezing|shower/.test(lower)) {
    return 'climate_or_water_issue';
  }
  if (/direction|find|where|entrance|building|address|navigate|lost|location/.test(lower)) {
    return 'arrival_navigation';
  }
  if (/clean|dirty|towel|sheet|missing|broken|maintenance|stain/.test(lower)) {
    return 'cleanliness_or_missing_items';
  }
  if (/noise|loud|neighbor|party|quiet/.test(lower)) {
    return 'noise_complaint';
  }

  // Default
  return 'access_issue';
}

// ===== Satisfaction Signal Derivation =====

export function deriveSatisfactionSignal(
  confidence: number,
  reason: string,
  guestMessage: string
): SatisfactionSignal {
  const lower = guestMessage.toLowerCase();

  // Check for positive signals
  if (/thank|thanks|great|perfect|awesome|resolved|worked|fixed/.test(lower)) {
    return 'happy';
  }

  // Check for negative signals
  if (/frustrated|frustrating|angry|terrible|awful|ridiculous|unacceptable/.test(lower)) {
    return 'unhappy';
  }

  // Use reason
  if (reason === 'dissatisfied') return 'unhappy';

  // Use confidence as fallback
  if (confidence < 0.3) return 'unhappy';

  return 'neutral';
}

// ===== Status Mapping =====

export function mapStatus(backendStatus: string): EscalationStatus {
  const statusMap: Record<string, EscalationStatus> = {
    open: 'open',
    replied: 'resolved',
    resolved: 'resolved',
    closed: 'closed',
    pending: 'open',
    waiting_pm: 'waiting_on_pm',
    waiting_guest: 'waiting_on_guest',
  };
  return statusMap[backendStatus] || 'open';
}

// ===== Recommended Actions =====

export function deriveRecommendedActions(intent: Intent): string[] {
  const actionsMap: Record<Intent, string[]> = {
    access_issue: ['call_guest', 'unlock_door', 'send_new_code'],
    wifi_issue: ['send_hotspot_info', 'call_isp', 'create_ticket'],
    climate_or_water_issue: ['send_cleaner', 'create_ticket', 'message_guest'],
    arrival_navigation: ['clarify_entrance', 'send_photo', 'call_guest'],
    cleanliness_or_missing_items: ['send_cleaner', 'message_guest', 'offer_refund'],
    noise_complaint: ['contact_neighbor', 'send_quiet_hours', 'call_guest'],
  };
  return actionsMap[intent] || ['message_guest'];
}

// ===== Main Transformers =====

export function mapBackendEscalation(
  item: EscalationItem,
  propertyId: string,
  messages?: MessageItem[]
): Escalation {
  const intent = deriveIntent(item.guest_message);
  const priority = derivePriority(item.confidence, item.reason);
  const pmActionType = derivePmActionType(item.reason, item.confidence);
  const status = mapStatus(item.status);
  const satisfactionSignal = deriveSatisfactionSignal(
    item.confidence,
    item.reason,
    item.guest_message
  );

  // Build timeline from messages if available
  const timeline: TimelineEvent[] = messages
    ? buildTimeline(messages)
    : buildMinimalTimeline(item);

  const createdAt = new Date(item.created_at);

  return {
    id: item.escalation_id,
    createdAt,
    updatedAt: createdAt, // Backend doesn't have updatedAt
    propertyId,
    stayId: `stay-${item.conversation_id.slice(0, 8)}`, // Generate from conversation
    guestName: item.guest_name,
    unitName: 'Unit', // Not in backend data
    checkIn: new Date(), // Not in backend data
    checkOut: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Not in backend data
    intent,
    priority,
    pmActionType,
    status,
    agentAttempts: 1,
    maxAttempts: 2,
    summary: generateSummary(item, intent),
    recommendedActions: deriveRecommendedActions(intent),
    timeline,
    satisfactionSignal,
  };
}

function generateSummary(item: EscalationItem, intent: Intent): string {
  const intentLabels: Record<Intent, string> = {
    access_issue: 'Access issue',
    wifi_issue: 'Wi-Fi issue',
    climate_or_water_issue: 'Climate/water issue',
    arrival_navigation: 'Navigation assistance needed',
    cleanliness_or_missing_items: 'Cleanliness/missing items',
    noise_complaint: 'Noise complaint',
  };

  const reasonLabels: Record<string, string> = {
    low_confidence: 'low AI confidence',
    dissatisfied: 'guest dissatisfaction detected',
    repeated_question: 'repeated question',
    knowledge_gap: 'knowledge gap detected',
  };

  const reasonText = reasonLabels[item.reason] || item.reason;
  return `${intentLabels[intent]} — ${reasonText}`;
}

function buildMinimalTimeline(item: EscalationItem): TimelineEvent[] {
  const timestamp = new Date(item.created_at);
  const events: TimelineEvent[] = [
    {
      id: `t-guest-${item.message_id}`,
      type: 'guest_message',
      content: item.guest_message,
      timestamp: new Date(timestamp.getTime() - 60000), // 1 min before
    },
    {
      id: `t-agent-${item.message_id}`,
      type: 'agent_message',
      content: item.ai_answer,
      timestamp,
      metadata: { confidence: item.confidence },
    },
    {
      id: `t-system-${item.escalation_id}`,
      type: 'system',
      content: `Escalated to Property Manager — ${item.reason.replace('_', ' ')}`,
      timestamp: new Date(timestamp.getTime() + 1000),
    },
  ];

  if (item.pm_reply) {
    events.push({
      id: `t-pm-${item.escalation_id}`,
      type: 'pm_action',
      content: item.pm_reply,
      timestamp: new Date(timestamp.getTime() + 60000),
    });
  }

  return events;
}

export function buildTimeline(messages: MessageItem[]): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  for (const msg of messages) {
    const type = mapMessageRoleToTimelineType(msg.role);
    events.push({
      id: `t-${msg.message_id}`,
      type,
      content: msg.content,
      timestamp: new Date(msg.created_at),
      metadata: msg.confidence ? { confidence: msg.confidence } : undefined,
    });

    // Add system event for escalated messages
    if (msg.escalated && msg.role === 'assistant') {
      events.push({
        id: `t-esc-${msg.message_id}`,
        type: 'system',
        content: 'Escalated to Property Manager',
        timestamp: new Date(new Date(msg.created_at).getTime() + 1000),
      });
    }
  }

  return events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

function mapMessageRoleToTimelineType(
  role: 'guest' | 'assistant' | 'property_manager'
): TimelineEvent['type'] {
  switch (role) {
    case 'guest':
      return 'guest_message';
    case 'assistant':
      return 'agent_message';
    case 'property_manager':
      return 'pm_action';
    default:
      return 'system';
  }
}

// ===== Property Transformer =====

export function mapBackendProperty(item: PropertyItem): Property {
  return {
    id: item.property_id,
    name: item.name,
    address: '', // Not in backend data, could be added later
    units: 1, // Not in backend data
    imageUrl: item.image_url || undefined,
  };
}

// ===== Doc Suggestion Transformer =====

export function mapBatchSuggestion(item: BatchSuggestion): DocSuggestion {
  const statusMap: Record<string, 'new' | 'accepted' | 'dismissed'> = {
    pending: 'new',
    new: 'new',
    approved: 'accepted',
    accepted: 'accepted',
    dismissed: 'dismissed',
    rejected: 'dismissed',
  };

  return {
    id: item.suggestion_id,
    propertyId: item.property_id,
    title: item.title,
    evidence: item.source_patterns,
    impact: item.reasoning,
    status: statusMap[item.status] || 'new',
    createdAt: item.created_at ? new Date(item.created_at) : new Date(),
  };
}

// ===== Analytics Transformers =====

export interface TopIntentItem {
  intent: Intent;
  count: number;
  percentage: number;
}

export function mapInsightsToTopIntents(
  escalations: EscalationItem[]
): TopIntentItem[] {
  // Group escalations by derived intent
  const intentCounts = new Map<Intent, number>();

  for (const esc of escalations) {
    const intent = deriveIntent(esc.guest_message);
    intentCounts.set(intent, (intentCounts.get(intent) || 0) + 1);
  }

  const total = escalations.length || 1;
  const results: TopIntentItem[] = [];

  for (const [intent, count] of intentCounts) {
    results.push({
      intent,
      count,
      percentage: Math.round((count / total) * 100),
    });
  }

  return results.sort((a, b) => b.count - a.count);
}

export interface TopQuestionItem {
  question: string;
  count: number;
  resolved: number;
}

export function mapInsightsToTopQuestions(
  mostAsked: QuestionInsight[]
): TopQuestionItem[] {
  return mostAsked.slice(0, 5).map((q) => ({
    question: q.question_pattern,
    count: q.count,
    resolved: q.count - q.escalation_count,
  }));
}
