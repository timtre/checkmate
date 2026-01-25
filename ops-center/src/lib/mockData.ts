// StayMate PM Dashboard Mock Data

export type EscalationType = 'NOTIFY_PM_URGENT' | 'REQUEST_PM_INPUT' | 'NOTIFY_PM_PASSIVE';
export type Intent = 'access_issue' | 'arrival_navigation' | 'wifi_issue' | 'climate_or_water_issue' | 'cleanliness_or_missing_items' | 'noise_complaint';
export type Priority = 'critical' | 'high' | 'medium';
export type EscalationStatus = 'open' | 'waiting_on_guest' | 'waiting_on_pm' | 'resolved' | 'closed';
export type SatisfactionSignal = 'neutral' | 'unhappy' | 'happy';

export interface TimelineEvent {
  id: string;
  type: 'guest_message' | 'agent_message' | 'agent_action' | 'pm_action' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    action?: string;
    confidence?: number;
  };
}

export interface Escalation {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  propertyId: string;
  stayId: string;
  guestName: string;
  guestPhone?: string;
  unitName: string;
  checkIn: Date;
  checkOut: Date;
  intent: Intent;
  priority: Priority;
  pmActionType: EscalationType;
  status: EscalationStatus;
  agentAttempts: number;
  maxAttempts: number;
  lastAgentAction?: string;
  summary: string;
  recommendedActions: string[];
  timeline: TimelineEvent[];
  satisfactionSignal: SatisfactionSignal;
  maintenanceTicketId?: string;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  units: number;
}

export interface DashboardMetrics {
  activeStays: number;
  openEscalations: number;
  resolvedByAI: number;
  escalatedToHuman: number;
}

export interface DocSuggestion {
  id: string;
  propertyId: string;
  title: string;
  evidence: string[];
  impact: string;
  status: 'new' | 'accepted' | 'dismissed';
  createdAt: Date;
}

export const properties: Property[] = [
  { id: 'prop-1', name: 'Demo Apartment – Berlin', address: 'Alexanderplatz 12, Berlin', units: 4 },
  { id: 'prop-2', name: 'City Center Loft', address: 'Mitte District, Berlin', units: 2 },
];

export const dashboardMetrics: DashboardMetrics = {
  activeStays: 12,
  openEscalations: 4,
  resolvedByAI: 87,
  escalatedToHuman: 13,
};

export const escalations: Escalation[] = [
  {
    id: 'esc-001',
    createdAt: new Date(Date.now() - 1000 * 60 * 8), // 8 min ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 2),
    propertyId: 'prop-1',
    stayId: 'stay-101',
    guestName: 'Maria Schmidt',
    guestPhone: '+49 170 1234567',
    unitName: 'Unit 2A',
    checkIn: new Date(),
    checkOut: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
    intent: 'access_issue',
    priority: 'critical',
    pmActionType: 'NOTIFY_PM_URGENT',
    status: 'open',
    agentAttempts: 2,
    maxAttempts: 2,
    lastAgentAction: 'REGENERATE_ACCESS_CODE',
    summary: 'Guest locked out — door code not working after 2 AI attempts',
    recommendedActions: ['call_guest', 'unlock_door', 'send_new_code'],
    timeline: [
      { id: 't1', type: 'guest_message', content: "Hi, I'm at the door but the code isn't working. I've tried 4521 multiple times.", timestamp: new Date(Date.now() - 1000 * 60 * 12) },
      { id: 't2', type: 'agent_message', content: "I'm sorry to hear that! Let me verify your code. The correct code for Unit 2A should be 4521. Could you try entering it slowly, waiting for the beep between each digit?", timestamp: new Date(Date.now() - 1000 * 60 * 11) },
      { id: 't3', type: 'guest_message', content: "Still not working. I've been standing here for 10 minutes now.", timestamp: new Date(Date.now() - 1000 * 60 * 9) },
      { id: 't4', type: 'agent_action', content: 'Regenerated access code', timestamp: new Date(Date.now() - 1000 * 60 * 8), metadata: { action: 'REGENERATE_ACCESS_CODE' } },
      { id: 't5', type: 'agent_message', content: "I've generated a new code for you: 7892. Please try this one.", timestamp: new Date(Date.now() - 1000 * 60 * 8) },
      { id: 't6', type: 'guest_message', content: "The new code doesn't work either! This is really frustrating. I need to get inside.", timestamp: new Date(Date.now() - 1000 * 60 * 5) },
      { id: 't7', type: 'system', content: 'Escalated to Property Manager — guest locked out after 2 attempts', timestamp: new Date(Date.now() - 1000 * 60 * 4) },
    ],
    satisfactionSignal: 'unhappy',
  },
  {
    id: 'esc-002',
    createdAt: new Date(Date.now() - 1000 * 60 * 25),
    updatedAt: new Date(Date.now() - 1000 * 60 * 10),
    propertyId: 'prop-1',
    stayId: 'stay-102',
    guestName: 'James Wilson',
    guestPhone: '+44 7700 900123',
    unitName: 'Unit 3B',
    checkIn: new Date(Date.now() - 1000 * 60 * 60 * 24),
    checkOut: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
    intent: 'wifi_issue',
    priority: 'high',
    pmActionType: 'NOTIFY_PM_URGENT',
    status: 'open',
    agentAttempts: 2,
    maxAttempts: 2,
    lastAgentAction: 'SEND_STEP_BY_STEP',
    summary: 'Wi-Fi not connecting — router reset attempted, still failing',
    recommendedActions: ['send_hotspot_info', 'call_isp', 'create_ticket'],
    timeline: [
      { id: 't1', type: 'guest_message', content: "The Wi-Fi isn't working. I need internet for work tomorrow.", timestamp: new Date(Date.now() - 1000 * 60 * 30) },
      { id: 't2', type: 'agent_message', content: "I apologize for the inconvenience. Let me help you troubleshoot. The Wi-Fi network name is 'Unit3B-Guest' and the password is 'welcome2024'. Are you able to see this network?", timestamp: new Date(Date.now() - 1000 * 60 * 29) },
      { id: 't3', type: 'guest_message', content: "I can see it but it won't connect. Says 'No internet connection'.", timestamp: new Date(Date.now() - 1000 * 60 * 27) },
      { id: 't4', type: 'agent_action', content: 'Sent router reset instructions', timestamp: new Date(Date.now() - 1000 * 60 * 26), metadata: { action: 'SEND_STEP_BY_STEP' } },
      { id: 't5', type: 'agent_message', content: "Let's try resetting the router. It's located in the hallway closet. Please unplug it for 30 seconds, then plug it back in and wait 2 minutes.", timestamp: new Date(Date.now() - 1000 * 60 * 26) },
      { id: 't6', type: 'guest_message', content: "Done that, waited 5 minutes. Still no internet. This is a problem, I have calls in the morning.", timestamp: new Date(Date.now() - 1000 * 60 * 15) },
      { id: 't7', type: 'system', content: 'Escalated to Property Manager — Wi-Fi issue unresolved', timestamp: new Date(Date.now() - 1000 * 60 * 10) },
    ],
    satisfactionSignal: 'unhappy',
  },
  {
    id: 'esc-003',
    createdAt: new Date(Date.now() - 1000 * 60 * 45),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30),
    propertyId: 'prop-1',
    stayId: 'stay-103',
    guestName: 'Sophie Chen',
    unitName: 'Unit 1A',
    checkIn: new Date(),
    checkOut: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
    intent: 'arrival_navigation',
    priority: 'high',
    pmActionType: 'REQUEST_PM_INPUT',
    status: 'waiting_on_pm',
    agentAttempts: 1,
    maxAttempts: 2,
    lastAgentAction: 'SEND_STEP_BY_STEP',
    summary: 'Guest confused between main entrance and side door — needs clarification',
    recommendedActions: ['clarify_entrance', 'send_photo', 'call_guest'],
    timeline: [
      { id: 't1', type: 'guest_message', content: "I'm at the building but there are two doors. Which one should I use?", timestamp: new Date(Date.now() - 1000 * 60 * 50) },
      { id: 't2', type: 'agent_message', content: "The main entrance is the larger glass door facing the street. You should see 'Alexanderplatz 12' written above it.", timestamp: new Date(Date.now() - 1000 * 60 * 49) },
      { id: 't3', type: 'guest_message', content: "I see a glass door but it says 'Staff Only'. And there's another metal door with a keypad.", timestamp: new Date(Date.now() - 1000 * 60 * 45) },
      { id: 't4', type: 'system', content: 'Agent needs PM input — unclear which entrance guest is at', timestamp: new Date(Date.now() - 1000 * 60 * 43) },
    ],
    satisfactionSignal: 'neutral',
  },
  {
    id: 'esc-004',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60),
    propertyId: 'prop-1',
    stayId: 'stay-104',
    guestName: 'Michael Brown',
    unitName: 'Unit 4C',
    checkIn: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    checkOut: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4),
    intent: 'cleanliness_or_missing_items',
    priority: 'medium',
    pmActionType: 'NOTIFY_PM_PASSIVE',
    status: 'open',
    agentAttempts: 1,
    maxAttempts: 2,
    lastAgentAction: 'ACKNOWLEDGE_AND_LOG',
    summary: 'Missing towels reported — guest satisfied with delivery ETA',
    recommendedActions: ['send_cleaner', 'message_guest'],
    timeline: [
      { id: 't1', type: 'guest_message', content: "Hi, we only have 2 towels but there are 4 of us staying.", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2.5) },
      { id: 't2', type: 'agent_message', content: "I apologize for the oversight! I've logged this and our cleaning team will bring additional towels within 2 hours. Is that timeframe okay for you?", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2.4) },
      { id: 't3', type: 'guest_message', content: "Yes, that works. Thanks!", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2.3) },
      { id: 't4', type: 'system', content: 'FYI notification sent to PM — missing items reported', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) },
    ],
    satisfactionSignal: 'neutral',
  },
  {
    id: 'esc-005',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
    propertyId: 'prop-1',
    stayId: 'stay-105',
    guestName: 'Emma Davis',
    unitName: 'Unit 2B',
    checkIn: new Date(Date.now() - 1000 * 60 * 60 * 24),
    checkOut: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
    intent: 'climate_or_water_issue',
    priority: 'medium',
    pmActionType: 'NOTIFY_PM_PASSIVE',
    status: 'resolved',
    agentAttempts: 1,
    maxAttempts: 2,
    lastAgentAction: 'SEND_STEP_BY_STEP',
    summary: 'Heating controls explained — guest resolved issue',
    recommendedActions: [],
    timeline: [
      { id: 't1', type: 'guest_message', content: "How do I turn on the heating? It's quite cold.", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5) },
      { id: 't2', type: 'agent_message', content: "The thermostat is located on the wall in the living room, next to the kitchen entrance. Press the power button, then use the up arrow to set your desired temperature. It should warm up within 15-20 minutes.", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4.9) },
      { id: 't3', type: 'guest_message', content: "Found it, thanks! Working now.", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4.5) },
    ],
    satisfactionSignal: 'happy',
  },
];

export const docSuggestions: DocSuggestion[] = [
  {
    id: 'doc-1',
    propertyId: 'prop-1',
    title: 'Add Wi-Fi router location to house manual',
    evidence: ['esc-002', 'Previous chat from 2 days ago'],
    impact: 'Could reduce 15% of Wi-Fi related chats',
    status: 'new',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
  },
  {
    id: 'doc-2',
    propertyId: 'prop-1',
    title: 'Clarify entrance instructions with photos',
    evidence: ['esc-003', '3 similar escalations this month'],
    impact: 'Could prevent 8% of navigation issues',
    status: 'new',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
  {
    id: 'doc-3',
    propertyId: 'prop-1',
    title: 'Add thermostat location and model info',
    evidence: ['esc-005', '5 heating questions last week'],
    impact: 'Could reduce 12% of climate control chats',
    status: 'new',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
  },
];

export const topIntents = [
  { intent: 'access_issue', count: 23, percentage: 35 },
  { intent: 'wifi_issue', count: 18, percentage: 27 },
  { intent: 'climate_or_water_issue', count: 12, percentage: 18 },
  { intent: 'arrival_navigation', count: 8, percentage: 12 },
  { intent: 'cleanliness_or_missing_items', count: 5, percentage: 8 },
];

export const topQuestions = [
  { question: 'What is the Wi-Fi password?', count: 45, resolved: 43 },
  { question: 'How do I get into the building?', count: 32, resolved: 28 },
  { question: 'Where is the thermostat?', count: 24, resolved: 22 },
  { question: 'What time is checkout?', count: 18, resolved: 18 },
  { question: 'Is parking available?', count: 15, resolved: 15 },
];

// Helper functions
export function getIntentLabel(intent: Intent): string {
  const labels: Record<Intent, string> = {
    access_issue: 'Access Issue',
    arrival_navigation: 'Navigation',
    wifi_issue: 'Wi-Fi Issue',
    climate_or_water_issue: 'Climate/Water',
    cleanliness_or_missing_items: 'Cleanliness',
    noise_complaint: 'Noise',
  };
  return labels[intent];
}

export function getIntentIcon(intent: Intent): string {
  const icons: Record<Intent, string> = {
    access_issue: '🔑',
    arrival_navigation: '📍',
    wifi_issue: '📶',
    climate_or_water_issue: '🌡️',
    cleanliness_or_missing_items: '🧹',
    noise_complaint: '🔊',
  };
  return icons[intent];
}

export function getPriorityLabel(priority: Priority): string {
  const labels: Record<Priority, string> = {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
  };
  return labels[priority];
}

export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    call_guest: 'Call Guest',
    unlock_door: 'Unlock Door',
    send_new_code: 'Send New Code',
    message_guest: 'Message Guest',
    send_hotspot_info: 'Send Hotspot Info',
    call_isp: 'Call ISP',
    create_ticket: 'Create Ticket',
    clarify_entrance: 'Clarify Entrance',
    send_photo: 'Send Photo',
    send_cleaner: 'Send Cleaner',
    offer_refund: 'Offer Refund',
    contact_neighbor: 'Contact Neighbor',
    send_quiet_hours: 'Send Quiet Hours',
  };
  return labels[action] || action;
}
