import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api, { setToken } from '../config/api';
import { useApp } from '../context/AppContext';

export default function LoginScreen() {
  const router = useRouter();
  const { theme, darkMode, toggleDarkMode, setUser } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('تنبيه', 'اكتب الإيميل والباسورد');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      setToken(res.data.token);
      setUser(res.data.user);
      router.replace('/(tabs)/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || 'مشكلة في الاتصال بالسيرفر';
      Alert.alert('خطأ', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableOpacity style={styles.darkModeBtn} onPress={toggleDarkMode}>
        <Ionicons name={darkMode ? 'sunny' : 'moon'} size={24} color={theme.text} />
      </TouchableOpacity>

      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <View style={styles.iconContainer}>
          <Ionicons name="briefcase" size={50} color={theme.primary} />
        </View>
        <Text style={[styles.title, { color: theme.primary }]}>CRM System</Text>
        <Text style={[styles.subtitle, { color: theme.textSub }]}>سجّل دخولك</Text>

        <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.inputBg }]}>
          <Ionicons name="mail-outline" size={20} color={theme.textMuted} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="البريد الإلكتروني"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={theme.textMuted}
          />
        </View>

        <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.inputBg }]}>
          <Ionicons name="lock-closed-outline" size={20} color={theme.textMuted} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: theme.text, flex: 1 }]}
            placeholder="كلمة المرور"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPass}
            placeholderTextColor={theme.textMuted}
          />
          <TouchableOpacity onPress={() => setShowPass(!showPass)}>
            <Ionicons name={showPass ? 'eye-off' : 'eye'} size={20} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>دخول</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/register')}>
          <Text style={[styles.link, { color: theme.primary }]}>مش عندك حساب؟ سجّل دلوقتي</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  darkModeBtn: { position: 'absolute', top: 50, right: 20, padding: 10 },
  card: {
    width: '100%', maxWidth: 400, borderRadius: 20, padding: 30,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 8,
  },
  iconContainer: { alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 5 },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 30 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, marginBottom: 15, height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16 },
  button: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  link: { textAlign: 'center', marginTop: 20, fontSize: 14 },
});
