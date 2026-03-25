import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useAppContext } from '@/store/AppContext';
import { useToast } from '@/hooks/useToast';
import api from '@/services/api';

const TEMPLATES = [
  { icon: '🎉', title: 'Special Offer', message: 'Renew your membership this week and get 10% off! Offer valid till Sunday.' },
  { icon: '⚠️', title: 'Gym Closed', message: 'The gym will be closed tomorrow for maintenance. We apologize for the inconvenience.' },
  { icon: '🏋️', title: 'New Class Added', message: 'We have added a new Zumba class every Saturday at 9 AM. Book your spot now!' },
  { icon: '🎂', title: 'Holiday Hours', message: 'This holiday, the gym will operate from 8 AM to 2 PM. Plan your workout accordingly.' },
  { icon: '💪', title: 'Motivation', message: 'Every workout brings you one step closer to your goal. Keep pushing — you\'ve got this!' },
];

export default function BroadcastScreen() {
  const { gymId } = useAppContext();
  const toast = useToast();
  const [title, setTitle]         = useState('');
  const [message, setMessage]     = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Fill in title and message');
      return;
    }
    if (!gymId) return;
    setIsSending(true);
    try {
      const { data } = await api.post(`/gyms/${gymId}/notifications/broadcast`, {
        title:   title.trim(),
        message: message.trim(),
      });
      toast.success(`Sent to ${data.data?.sent ?? 0} members!`);
      setTitle('');
      setMessage('');
    } catch (err: any) {
      toast.error('Failed to send', err?.response?.data?.message);
    } finally { setIsSending(false); }
  };

  const handleExpiry = async () => {
    if (!gymId) return;
    setIsSending(true);
    try {
      const { data } = await api.post(`/gyms/${gymId}/notifications/expiry`);
      const r = data.data;
      toast.success(`Expiry reminders sent!`, `7-day: ${r?.week ?? 0}, 1-day: ${r?.day ?? 0}`);
    } catch {
      toast.error('Failed to send expiry reminders');
    } finally { setIsSending(false); }
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Broadcast</Text>
        <View style={{ width: 50 }} />
      </View>

      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          {/* Quick send expiry reminders */}
          <View style={s.quickCard}>
            <View style={{ flex: 1 }}>
              <Text style={s.quickTitle}>Send Expiry Reminders</Text>
              <Text style={s.quickSub}>Automatically notify members expiring in 7 days and 1 day</Text>
            </View>
            <TouchableOpacity style={s.quickBtn} onPress={handleExpiry} disabled={isSending}>
              {isSending ? <ActivityIndicator color="#fff" size="small" /> :
                <Text style={s.quickBtnText}>Send</Text>}
            </TouchableOpacity>
          </View>

          {/* Message templates */}
          <Text style={s.sectionTitle}>Quick Templates</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.templatesScroll} contentContainerStyle={s.templatesRow}>
            {TEMPLATES.map((t) => (
              <TouchableOpacity
                key={t.title}
                style={s.templateCard}
                onPress={() => { setTitle(t.title); setMessage(t.message); }}
              >
                <Text style={s.templateIcon}>{t.icon}</Text>
                <Text style={s.templateTitle}>{t.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Compose */}
          <Text style={s.sectionTitle}>Compose Message</Text>
          <View style={s.composeCard}>
            <Text style={s.fieldLabel}>TITLE</Text>
            <TextInput
              style={s.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Notification title..."
              placeholderTextColor={Colors.textMuted}
              maxLength={50}
            />
            <Text style={s.charCount}>{title.length}/50</Text>

            <Text style={[s.fieldLabel, { marginTop: 16 }]}>MESSAGE</Text>
            <TextInput
              style={s.messageInput}
              value={message}
              onChangeText={setMessage}
              placeholder="Write your message to all members..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={4}
              maxLength={200}
              textAlignVertical="top"
            />
            <Text style={s.charCount}>{message.length}/200</Text>
          </View>

          {/* Preview */}
          {(title || message) && (
            <View style={s.preview}>
              <Text style={s.previewLabel}>PREVIEW</Text>
              <View style={s.previewCard}>
                <View style={s.previewIcon}>
                  <Text style={s.previewIconText}>G</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.previewTitle}>{title || 'Title'}</Text>
                  <Text style={s.previewMessage} numberOfLines={2}>{message || 'Message'}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Send button */}
          <TouchableOpacity
            style={[s.sendBtn, (!title.trim() || !message.trim() || isSending) && s.sendBtnOff]}
            onPress={handleSend}
            disabled={!title.trim() || !message.trim() || isSending}
          >
            {isSending ? <ActivityIndicator color="#fff" size="small" /> :
              <Text style={s.sendBtnText}>📢  Send to All Members</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: Colors.background },
  flex:            { flex: 1 },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  back:            { fontSize: 15, color: Colors.textSecondary },
  title:           { fontSize: 18, fontWeight: '700', color: Colors.primary },
  scroll:          { padding: 16, paddingBottom: 40 },
  quickCard:       { flexDirection: 'row', alignItems: 'center', gap: 14,
                     backgroundColor: Colors.accent, borderRadius: 16, padding: 16, marginBottom: 20 },
  quickTitle:      { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 4 },
  quickSub:        { fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 16 },
  quickBtn:        { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 16,
                     paddingVertical: 10, borderRadius: 10 },
  quickBtnText:    { color: '#fff', fontSize: 13, fontWeight: '700' },
  sectionTitle:    { fontSize: 14, fontWeight: '700', color: Colors.primary, marginBottom: 10 },
  templatesScroll: { marginHorizontal: -16, marginBottom: 20 },
  templatesRow:    { paddingHorizontal: 16, gap: 10 },
  templateCard:    { backgroundColor: Colors.surface, borderRadius: 12, padding: 14, width: 110,
                     alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  templateIcon:    { fontSize: 24, marginBottom: 6 },
  templateTitle:   { fontSize: 11, fontWeight: '600', color: Colors.primary, textAlign: 'center' },
  composeCard:     { backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
                     borderWidth: 1, borderColor: Colors.border, marginBottom: 16 },
  fieldLabel:      { fontSize: 10, fontWeight: '700', color: Colors.textMuted,
                     letterSpacing: 1, marginBottom: 8 },
  titleInput:      { backgroundColor: Colors.background, borderRadius: 10, height: 48,
                     paddingHorizontal: 14, fontSize: 15, color: Colors.primary,
                     borderWidth: 1, borderColor: Colors.border },
  charCount:       { fontSize: 10, color: Colors.textMuted, textAlign: 'right', marginTop: 4 },
  messageInput:    { backgroundColor: Colors.background, borderRadius: 10, minHeight: 100,
                     padding: 14, fontSize: 14, color: Colors.primary,
                     borderWidth: 1, borderColor: Colors.border },
  preview:         { marginBottom: 16 },
  previewLabel:    { fontSize: 10, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1, marginBottom: 8 },
  previewCard:     { flexDirection: 'row', gap: 12, backgroundColor: Colors.surface, borderRadius: 14,
                     padding: 14, borderWidth: 1, borderColor: Colors.border },
  previewIcon:     { width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.primary,
                     alignItems: 'center', justifyContent: 'center' },
  previewIconText: { fontSize: 18, fontWeight: '800', color: '#fff' },
  previewTitle:    { fontSize: 13, fontWeight: '700', color: Colors.primary, marginBottom: 3 },
  previewMessage:  { fontSize: 12, color: Colors.textSecondary, lineHeight: 16 },
  sendBtn:         { backgroundColor: Colors.primary, borderRadius: 14, height: 56,
                     alignItems: 'center', justifyContent: 'center' },
  sendBtnOff:      { opacity: 0.4 },
  sendBtnText:     { color: '#fff', fontSize: 16, fontWeight: '700' },
});