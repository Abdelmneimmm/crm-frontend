import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, Modal, TextInput, RefreshControl, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../config/api';
import { useApp } from '../../context/AppContext';

export default function CustomersScreen() {
  const { theme } = useApp();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', address: '', notes: '' });

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(res.data);
    } catch (err) {
      console.log('Fetch customers error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchCustomers(); }, []);

  const filteredCustomers = customers.filter((c) => {
    return c.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchText.toLowerCase()) ||
      c.phone?.includes(searchText) ||
      c.company?.toLowerCase().includes(searchText.toLowerCase());
  });

  const openAddModal = () => {
    setEditingCustomer(null);
    setForm({ name: '', email: '', phone: '', company: '', address: '', notes: '' });
    setModalVisible(true);
  };

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setForm({
      name: customer.name || '', email: customer.email || '', phone: customer.phone || '',
      company: customer.company || '', address: customer.address || '', notes: customer.notes || '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { Alert.alert('تنبيه', 'الاسم مطلوب'); return; }
    try {
      if (editingCustomer) {
        await api.put('/customers/' + editingCustomer.id, form);
      } else {
        await api.post('/customers', form);
      }
      setModalVisible(false);
      fetchCustomers();
    } catch (err) {
      Alert.alert('خطأ', err.response?.data?.error || 'حصل مشكلة');
    }
  };

  const handleDelete = (customer) => {
    Alert.alert('حذف', 'متأكد تحذف ' + customer.name + '؟', [
      { text: 'لا', style: 'cancel' },
      {
        text: 'أيوا احذف', style: 'destructive',
        onPress: async () => {
          try { await api.delete('/customers/' + customer.id); fetchCustomers(); }
          catch (err) { Alert.alert('خطأ', 'مشكلة في الحذف'); }
        },
      },
    ]);
  };

  if (loading) {
    return <View style={[styles.center, { backgroundColor: theme.bg }]}><ActivityIndicator size="large" color={theme.primary} /></View>;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Ionicons name="search" size={20} color={theme.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="بحث بالاسم أو الشركة أو التليفون..."
          value={searchText} onChangeText={setSearchText}
          placeholderTextColor={theme.textMuted}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close-circle" size={20} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredCustomers}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={60} color={theme.textMuted} />
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>مفيش عملاء</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.card, { backgroundColor: theme.card }]} onPress={() => openEditModal(item)}>
            <View style={styles.cardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={[styles.avatar, { backgroundColor: theme.success + '20' }]}>
                  <Text style={[styles.avatarText, { color: theme.success }]}>{item.name?.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardName, { color: theme.text }]}>{item.name}</Text>
                  {item.email && <Text style={[styles.cardSub, { color: theme.textSub }]}>{item.email}</Text>}
                </View>
              </View>
              {item.company && (
                <View style={[styles.companyBadge, { backgroundColor: theme.success + '15' }]}>
                  <Text style={[styles.companyText, { color: theme.success }]}>{item.company}</Text>
                </View>
              )}
            </View>
            {item.phone && (
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={14} color={theme.textMuted} />
                <Text style={[styles.infoText, { color: theme.textSub }]}>{item.phone}</Text>
              </View>
            )}
            {item.address && (
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={14} color={theme.textMuted} />
                <Text style={[styles.infoText, { color: theme.textSub }]}>{item.address}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
              <Ionicons name="trash-outline" size={18} color={theme.danger} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={[styles.fab, { backgroundColor: theme.success }]} onPress={openAddModal}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalBg }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {editingCustomer ? 'تعديل العميل' : 'إضافة عميل جديد'}
            </Text>

            <TextInput style={[styles.input, { borderColor: theme.border, backgroundColor: theme.inputBg, color: theme.text }]}
              placeholder="الاسم *" value={form.name}
              onChangeText={(t) => setForm({ ...form, name: t })} placeholderTextColor={theme.textMuted} />
            <TextInput style={[styles.input, { borderColor: theme.border, backgroundColor: theme.inputBg, color: theme.text }]}
              placeholder="الإيميل" value={form.email}
              onChangeText={(t) => setForm({ ...form, email: t })} keyboardType="email-address" placeholderTextColor={theme.textMuted} />
            <TextInput style={[styles.input, { borderColor: theme.border, backgroundColor: theme.inputBg, color: theme.text }]}
              placeholder="التليفون" value={form.phone}
              onChangeText={(t) => setForm({ ...form, phone: t })} keyboardType="phone-pad" placeholderTextColor={theme.textMuted} />
            <TextInput style={[styles.input, { borderColor: theme.border, backgroundColor: theme.inputBg, color: theme.text }]}
              placeholder="الشركة" value={form.company}
              onChangeText={(t) => setForm({ ...form, company: t })} placeholderTextColor={theme.textMuted} />
            <TextInput style={[styles.input, { borderColor: theme.border, backgroundColor: theme.inputBg, color: theme.text }]}
              placeholder="العنوان" value={form.address}
              onChangeText={(t) => setForm({ ...form, address: t })} placeholderTextColor={theme.textMuted} />
            <TextInput style={[styles.input, { borderColor: theme.border, backgroundColor: theme.inputBg, color: theme.text }]}
              placeholder="ملاحظات" value={form.notes}
              onChangeText={(t) => setForm({ ...form, notes: t })} multiline placeholderTextColor={theme.textMuted} />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: theme.border }]}
                onPress={() => setModalVisible(false)}>
                <Text style={[styles.cancelText, { color: theme.text }]}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.success }]} onPress={handleSave}>
                <Text style={styles.saveText}>حفظ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 12,
    paddingHorizontal: 14, height: 46, borderRadius: 12, borderWidth: 1,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14 },
  emptyContainer: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 16, marginTop: 10 },
  card: {
    marginHorizontal: 16, marginTop: 10, borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: 'bold' },
  cardName: { fontSize: 16, fontWeight: 'bold' },
  cardSub: { fontSize: 12, marginTop: 2 },
  companyBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  companyText: { fontSize: 11, fontWeight: '600' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginLeft: 52 },
  infoText: { fontSize: 13, marginLeft: 6 },
  deleteBtn: { position: 'absolute', bottom: 16, right: 16 },
  fab: {
    position: 'absolute', bottom: 20, right: 20,
    width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 5,
  },
  modalOverlay: { flex: 1, justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 20, padding: 24, maxHeight: '85%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 15, marginBottom: 12 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  cancelBtn: { flex: 1, padding: 14, marginRight: 8, borderRadius: 12, alignItems: 'center' },
  cancelText: { fontSize: 16, fontWeight: '600' },
  saveBtn: { flex: 1, padding: 14, marginLeft: 8, borderRadius: 12, alignItems: 'center' },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
