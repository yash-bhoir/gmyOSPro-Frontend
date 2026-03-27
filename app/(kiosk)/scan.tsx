import { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { BarCodeScanner, BarCodeScannerResult } from 'expo-barcode-scanner';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useAppContext } from '@/store/AppContext';
import api from '@/services/api';

export default function KioskScan() {
  const { gymId } = useAppContext();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned]             = useState(false);
  const [processing, setProcessing]       = useState(false);
  const lastScan = useRef<string>('');

  useEffect(() => {
    BarCodeScanner.requestPermissionsAsync().then(({ status }) => {
      setHasPermission(status === 'granted');
    });
  }, []);

  // Auto return to idle after 30s
  useEffect(() => {
    const t = setTimeout(() => router.replace('/(kiosk)/idle'), 30000);
    return () => clearTimeout(t);
  }, []);

  const handleScan = async ({ data }: BarCodeScannerResult) => {
    if (scanned || processing || data === lastScan.current) return;
    lastScan.current = data;
    setScanned(true);
    setProcessing(true);

    try {
      const parts = data.split('.');
      if (parts.length !== 3) throw new Error('Invalid QR');
      const payload  = JSON.parse(atob(parts[1]));
      const memberId = payload.userId;
      if (!gymId || !memberId) throw new Error('Invalid QR payload');

      const res = await api.post(
        `/gyms/${gymId}/members/${memberId}/checkin`,
        { method: 'qr' }
      );

      if (res.data.data?.result === 'success') {
        router.replace({ pathname: '/(kiosk)/success' as any, params: { memberId } });
      } else {
        router.replace({
          pathname: '/(kiosk)/denied' as any,
          params: { reason: res.data.data?.denialReason || 'Membership issue' },
        });
      }
    } catch {
      router.replace({
        pathname: '/(kiosk)/denied' as any,
        params: { reason: 'Invalid QR code' },
      });
    } finally {
      setProcessing(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={s.msg}>Requesting camera access...</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={s.center}>
        <Text style={s.msg}>Camera permission required</Text>
        <TouchableOpacity
          style={s.permBtn}
          onPress={() =>
            BarCodeScanner.requestPermissionsAsync().then(({ status }) =>
              setHasPermission(status === 'granted')
            )
          }
        >
          <Text style={s.permBtnText}>Allow Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('/(kiosk)/idle')}>
          <Text style={s.backText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <BarCodeScanner
        style={StyleSheet.absoluteFill}
        onBarCodeScanned={scanned ? undefined : handleScan}
        barCodeTypes={[BarCodeScanner.Constants.BarCodeType.qr]}
      />

      {/* Overlay */}
      <View style={s.overlay}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => router.replace('/(kiosk)/idle')}
        >
          <Text style={s.backBtnText}>← Back</Text>
        </TouchableOpacity>

        <Text style={s.instruction}>Align QR code within the frame</Text>

        {/* Scan frame corners */}
        <View style={s.frame}>
          <View style={[s.corner, s.TL]} />
          <View style={[s.corner, s.TR]} />
          <View style={[s.corner, s.BL]} />
          <View style={[s.corner, s.BR]} />
          {processing && (
            <View style={s.processingBox}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={s.processingText}>Verifying...</Text>
            </View>
          )}
        </View>

        <Text style={s.hint}>QR code auto-detects</Text>
      </View>
    </View>
  );
}

const C = 24;
const s = StyleSheet.create({
  center:         { flex: 1, backgroundColor: '#000', alignItems: 'center',
                    justifyContent: 'center', padding: 24 },
  msg:            { color: '#fff', fontSize: 16, textAlign: 'center',
                    marginBottom: 20, marginTop: 20 },
  permBtn:        { backgroundColor: Colors.accent, borderRadius: 12,
                    paddingHorizontal: 24, paddingVertical: 12, marginBottom: 12 },
  permBtnText:    { color: '#fff', fontSize: 15, fontWeight: '700' },
  backText:       { color: 'rgba(255,255,255,0.6)', fontSize: 14, padding: 12 },
  overlay:        { ...StyleSheet.absoluteFillObject, alignItems: 'center',
                    justifyContent: 'center', padding: 24 },
  backBtn:        { position: 'absolute', top: 50, left: 24,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  backBtnText:    { color: '#fff', fontSize: 14, fontWeight: '600' },
  instruction:    { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 32,
                    textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 4 },
  frame:          { width: 260, height: 260, alignItems: 'center', justifyContent: 'center' },
  corner:         { position: 'absolute', width: C, height: C,
                    borderColor: Colors.accent, borderWidth: 3 },
  TL:             { top: 0,    left: 0,    borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 4 },
  TR:             { top: 0,    right: 0,   borderLeftWidth: 0,  borderBottomWidth: 0, borderTopRightRadius: 4 },
  BL:             { bottom: 0, left: 0,    borderRightWidth: 0, borderTopWidth: 0,   borderBottomLeftRadius: 4 },
  BR:             { bottom: 0, right: 0,   borderLeftWidth: 0,  borderTopWidth: 0,   borderBottomRightRadius: 4 },
  processingBox:  { alignItems: 'center', gap: 8 },
  processingText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  hint:           { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 32 },
});