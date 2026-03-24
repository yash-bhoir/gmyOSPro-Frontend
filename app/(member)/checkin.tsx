import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { Colors } from '@/constants/colors';
import api from '@/services/api';

interface CheckInRecord { _id: string; checkedInAt: string; method: string; result: string; }

export default function CheckInScreen() {
  const [qrToken, setQrToken]       = useState<string | null>(null);
  const [memberCode, setMemberCode] = useState<string>('');
  const [attendance, setAttendance] = useState<CheckInRecord[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [qrRes, attRes] = await Promise.all([
        api.get('/me/qr-token'),
        api.get('/me/attendance'),
      ]);
      setQrToken(qrRes.data.data.token);
      setMemberCode(qrRes.data.data.memberCode);
      setAttendance(attRes.data.data || []);
    } catch { } finally {
      setLoading(false); setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const formatDate = (d: string) => new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });

  if (loading) {
    return <SafeAreaView style={s.safe}><View style={s.center}><ActivityIndicator size="large" color={Colors.accent} /></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
      >
        <Text style={s.title}>Check In</Text>
        <Text style={s.sub}>Show this QR code at the entrance</Text>

        {/* QR Card */}
        <View style={s.qrCard}>
          {qrToken ? (
            <>
              <QRCode value={qrToken} size={200} color={Colors.primary} backgroundColor={Colors.surface} />
              <Text style={s.memberCode}>{memberCode}</Text>
              <Text style={s.qrHint}>Tap to refresh QR code</Text>
            </>
          ) : (
            <View style={s.noQr}>
              <Text style={s.noQrText}>No active membership</Text>
              <Text style={s.noQrSub}>Contact your gym staff</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={s.refreshBtn} onPress={() => { setRefreshing(true); fetchData(); }}>
          <Text style={s.refreshText}>🔄  Refresh QR Code</Text>
        </TouchableOpacity>

        {/* Attendance history */}
        <Text style={s.sectionTitle}>Recent Attendance</Text>
        {attendance.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyIcon}>📋</Text>
            <Text style={s.emptyText}>No check-ins yet</Text>
          </View>
        ) : (
          attendance.map((item) => (
            <View key={item._id} style={s.attRow}>
              <View style={[s.attDot, item.result === 'success' ? s.dotGreen : s.dotRed]} />
              <View style={{ flex: 1 }}>
                <Text style={s.attDate}>{formatDate(item.checkedInAt)}</Text>
                <Text style={s.attMethod}>{item.method.toUpperCase()} · {item.result}</Text>
              </View>
              <Text style={[s.attStatus, item.result === 'success' ? s.statusGreen : s.statusRed]}>
                {item.result === 'success' ? '✓' : '✗'}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.background },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll:      { padding: 20, paddingBottom: 32 },
  title:       { fontSize: 24, fontWeight: '800', color: Colors.primary, marginBottom: 4 },
  sub:         { fontSize: 13, color: Colors.textSecondary, marginBottom: 24 },
  qrCard:      { backgroundColor: Colors.surface, borderRadius: 24, padding: 32,
                 alignItems: 'center', borderWidth: 1, borderColor: Colors.border, marginBottom: 14 },
  memberCode:  { fontSize: 18, fontWeight: '700', color: Colors.primary, marginTop: 16, letterSpacing: 2 },
  qrHint:      { fontSize: 12, color: Colors.textMuted, marginTop: 6 },
  noQr:        { alignItems: 'center', padding: 20 },
  noQrText:    { fontSize: 16, fontWeight: '600', color: Colors.primary },
  noQrSub:     { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  refreshBtn:  { backgroundColor: Colors.surface, borderRadius: 12, height: 48,
                 alignItems: 'center', justifyContent: 'center', borderWidth: 1,
                 borderColor: Colors.border, marginBottom: 24 },
  refreshText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  sectionTitle:{ fontSize: 15, fontWeight: '700', color: Colors.primary, marginBottom: 12 },
  emptyBox:    { alignItems: 'center', padding: 32 },
  emptyIcon:   { fontSize: 40, marginBottom: 12 },
  emptyText:   { fontSize: 15, color: Colors.textSecondary },
  attRow:      { flexDirection: 'row', alignItems: 'center', gap: 12,
                 backgroundColor: Colors.surface, borderRadius: 12, padding: 14, marginBottom: 8,
                 borderWidth: 1, borderColor: Colors.border },
  attDot:      { width: 10, height: 10, borderRadius: 5 },
  dotGreen:    { backgroundColor: Colors.success },
  dotRed:      { backgroundColor: Colors.danger },
  attDate:     { fontSize: 13, fontWeight: '600', color: Colors.primary, marginBottom: 2 },
  attMethod:   { fontSize: 11, color: Colors.textSecondary },
  attStatus:   { fontSize: 18, fontWeight: '700' },
  statusGreen: { color: Colors.success },
  statusRed:   { color: Colors.danger },
});