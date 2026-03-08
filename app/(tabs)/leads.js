import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, Modal, TextInput, RefreshControl, ActivityIndicator, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../config/api';
import { useApp } from '../../context/AppContext';

export default function LeadsScreen() {
  var { theme, user } = useApp();
  var [leads, setLeads] = useState([]);
  var [agents, setAgents] = useState([]);
  var [loading, setLoading] = useState(true);
  var [refreshing, setRefreshing] = useState(false);
  var [modalVisible, setModalVisible] = useState(false);
  var [detailModal, setDetailModal] = useState(false);
  var [activityModal, setActivityModal] = useState(false);
  var [assignModal, setAssignModal] = useState(false);
  var [editingLead, setEditingLead] = useState(null);
  var [selectedLead, setSelectedLead] = useState(null);
  var [activities, setActivities] = useState([]);
  var [searchText, setSearchText] = useState('');
  var [filterStatus, setFilterStatus] = useState('all');
  var [form, setForm] = useState({ name: '', email: '', phone: '', source: '', status: 'new', notes: '' });
  var [activityForm, setActivityForm] = useState({ type: 'note', title: '', description: '', meeting_date: '' });

  var isAdmin = user && user.role === 'admin';

  var fetchLeads = async function() {
    try {
      var res = await api.get('/leads');
      setLeads(res.data);
    } catch (err) {
      console.log('Fetch leads error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  var fetchAgents = async function() {
    try {
      var res = await api.get('/auth/users');
      setAgents(res.data);
    } catch (err) {
      console.log('Fetch agents error:', err.message);
    }
  };

  var fetchActivities = async function(leadId) {
    try {
      var res = await api.get('/activities/lead/' + leadId);
      setActivities(res.data);
    } catch (err) {
      console.log('Fetch activities error:', err.message);
    }
  };

  useEffect(function() { fetchLeads(); fetchAgents(); }, []);

  var onRefresh = useCallback(function() { setRefreshing(true); fetchLeads(); }, []);

  var filteredLeads = leads.filter(function(lead) {
    var matchSearch = (lead.name || '').toLowerCase().includes(searchText.toLowerCase()) ||
      (lead.email || '').toLowerCase().includes(searchText.toLowerCase()) ||
      (lead.phone || '').includes(searchText);
    var matchFilter = filterStatus === 'all' || lead.status === filterStatus;
    return matchSearch && matchFilter;
  });

  var openAddModal = function() {
    setEditingLead(null);
    setForm({ name: '', email: '', phone: '', source: '', status: 'new', notes: '' });
    setModalVisible(true);
  };

  var openEditModal = function(lead) {
    setEditingLead(lead);
    setForm({
      name: lead.name || '', email: lead.email || '', phone: lead.phone || '',
      source: lead.source || '', status: lead.status || 'new', notes: lead.notes || '',
    });
    setModalVisible(true);
  };

  var openDetail = function(lead) {
    setSelectedLead(lead);
    fetchActivities(lead.id);
    setDetailModal(true);
  };

  var handleSave = async function() {
    if (!form.name.trim()) { Alert.alert('تنبيه', 'الاسم مطلوب'); return; }
    try {
      if (editingLead) {
        // لو الحالة اتغيرت، سجل النشاط
        if (editingLead.status !== form.status) {
          await api.post('/activities/status-change', {
            lead_id: editingLead.id,
            old_status: editingLead.status,
            new_status: form.status
          });
        }
        await api.put('/leads/' + editingLead.id, form);
      } else {
        await api.post('/leads', form);
      }
      setModalVisible(false);
      fetchLeads();
    } catch (err) {
      Alert.alert('خطأ', err.response?.data?.error || 'حصل مشكلة');
    }
  };

  var handleDelete = function(lead) {
    Alert.alert('حذف', 'متأكد تحذف ' + lead.name + '؟', [
      { text: 'لا', style: 'cancel' },
      {
        text: 'أيوا احذف', style: 'destructive',
        onPress: async function() {
          try { await api.delete('/leads/' + lead.id); fetchLeads(); setDetailModal(false); }
          catch (err) { Alert.alert('خطأ', err.response?.data?.error || 'مشكلة في الحذف'); }
        },
      },
    ]);
  };

  var handleConvert = function(lead) {
    Alert.alert('تحويل', 'تحوّل ' + lead.name + ' لعميل؟', [
      { text: 'لا', style: 'cancel' },
      {
        text: 'أيوا حوّل',
        onPress: async function() {
          try {
            await api.post('/leads/' + lead.id + '/convert');
            Alert.alert('تم', 'تم التحويل لعميل بنجاح!');
            fetchLeads(); setDetailModal(false);
          } catch (err) { Alert.alert('خطأ', err.response?.data?.error || 'مشكلة'); }
        },
      },
    ]);
  };

  var handleAssign = async function(agentId) {
    try {
      await api.put('/leads/' + selectedLead.id + '/assign', { assigned_to: agentId });
      Alert.alert('تم', 'تم التوزيع بنجاح');
      setAssignModal(false);
      fetchLeads();
      // تحديث الـ selectedLead
      var res = await api.get('/leads/' + selectedLead.id);
      setSelectedLead(res.data);
    } catch (err) {
      Alert.alert('خطأ', err.response?.data?.error || 'مشكلة في التوزيع');
    }
  };

  var handleAddActivity = async function() {
    if (activityForm.type === 'note' && !activityForm.description) {
      Alert.alert('تنبيه', 'اكتب الملاحظة');
      return;
    }
    if (activityForm.type === 'meeting' && !activityForm.title) {
      Alert.alert('تنبيه', 'اكتب عنوان الاجتماع');
      return;
    }
    try {
      if (activityForm.type === 'note') {
        await api.post('/activities/note', {
          lead_id: selectedLead.id,
          title: activityForm.title || 'ملاحظة',
          description: activityForm.description
        });
      } else {
        await api.post('/activities/meeting', {
          lead_id: selectedLead.id,
          title: activityForm.title,
          description: activityForm.description,
          meeting_date: activityForm.meeting_date || null
        });
      }
      setActivityModal(false);
      setActivityForm({ type: 'note', title: '', description: '', meeting_date: '' });
      fetchActivities(selectedLead.id);
    } catch (err) {
      Alert.alert('خطأ', err.response?.data?.error || 'مشكلة');
    }
  };

  var getStatusColor = function(status) {
    var colors = {
      new: theme.statusNew, contacted: theme.statusContacted,
      qualified: theme.statusQualified, lost: theme.statusLost, converted: theme.statusConverted,
    };
    return colors[status] || theme.textMuted;
  };

  var getActivityIcon = function(type) {
    if (type === 'note') return 'document-text';
    if (type === 'meeting') return 'calendar';
    if (type === 'status_change') return 'swap-horizontal';
    return 'ellipse';
  };

  var getActivityColor = function(type) {
    if (type === 'note') return '#FF9800';
    if (type === 'meeting') return '#9C27B0';
    if (type === 'status_change') return '#2196F3';
    return '#999';
  };

  var statuses = ['all', 'new', 'contacted', 'qualified', 'converted', 'lost'];

  if (loading) {
    return <View style={[styles.center, { backgroundColor: theme.bg }]}><ActivityIndicator size="large" color={theme.primary} /></View>;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Ionicons name="search" size={20} color={theme.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="بحث..." value={searchText} onChangeText={setSearchText}
          placeholderTextColor={theme.textMuted}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={function() { setSearchText(''); }}>
            <Ionicons name="close-circle" size={20} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
        {statuses.map(function(s) {
          return (
            <TouchableOpacity key={s}
              style={[styles.filterBtn, {
                backgroundColor: filterStatus === s ? getStatusColor(s === 'all' ? 'new' : s) : theme.card,
                borderColor: theme.border,
              }]}
              onPress={function() { setFilterStatus(s); }}
            >
              <Text style={[styles.filterText, { color: filterStatus === s ? '#fff' : theme.textSub }]}>
                {s === 'all' ? 'الكل' : s}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Leads List */}
      <FlatList
        data={filteredLeads}
        keyExtractor={function(item) { return item.id.toString(); }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={60} color={theme.textMuted} />
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>مفيش نتائج</Text>
          </View>
        }
        renderItem={function(obj) {
          var item = obj.item;
          return (
            <TouchableOpacity style={[styles.card, { backgroundColor: theme.card }]} onPress={function() { openDetail(item); }}>
              <View style={styles.cardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={[styles.avatar, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <Text style={[styles.avatarText, { color: getStatusColor(item.status) }]}>{(item.name || '?').charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardName, { color: theme.text }]}>{item.name}</Text>
                    {item.email ? <Text style={[styles.cardSub, { color: theme.textSub }]}>{item.email}</Text> : null}
                  </View>
                </View>
                <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
                  <Text style={styles.badgeText}>{item.status}</Text>
                </View>
              </View>
              {item.assigned_to_name ? (
                <View style={[styles.infoRow, { marginLeft: 52 }]}>
                  <Ionicons name="person" size={14} color={theme.primary} />
                  <Text style={[styles.infoText, { color: theme.primary }]}>{item.assigned_to_name}</Text>
                </View>
              ) : null}
              {item.phone ? (
                <View style={[styles.infoRow, { marginLeft: 52 }]}>
                  <Ionicons name="call-outline" size={14} color={theme.textMuted} />
                  <Text style={[styles.infoText, { color: theme.textSub }]}>{item.phone}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        }}
      />

      {/* FAB */}
      <TouchableOpacity style={[styles.fab, { backgroundColor: theme.primary }]} onPress={openAddModal}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* ===== Detail Modal ===== */}
      <Modal visible={detailModal} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalBg }]}>
          <View style={[styles.detailContent, { backgroundColor: theme.card }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedLead && (
                <>
                  <View style={styles.detailHeader}>
                    <View style={[styles.detailAvatar, { backgroundColor: getStatusColor(selectedLead.status) + '20' }]}>
                      <Text style={[styles.detailAvatarText, { color: getStatusColor(selectedLead.status) }]}>
                        {(selectedLead.name || '?').charAt(0)}
                      </Text>
                    </View>
                    <Text style={[styles.detailName, { color: theme.text }]}>{selectedLead.name}</Text>
                    <View style={[styles.badge, { backgroundColor: getStatusColor(selectedLead.status) }]}>
                      <Text style={styles.badgeText}>{selectedLead.status}</Text>
                    </View>
                    {selectedLead.assigned_to_name ? (
                      <Text style={[styles.assignedText, { color: theme.primary }]}>
                        Agent: {selectedLead.assigned_to_name}
                      </Text>
                    ) : null}
                  </View>

                  <View style={[styles.detailSection, { borderColor: theme.border }]}>
                    {selectedLead.email ? (
                      <View style={styles.detailRow}>
                        <Ionicons name="mail-outline" size={18} color={theme.primary} />
                        <Text style={[styles.detailText, { color: theme.text }]}>{selectedLead.email}</Text>
                      </View>
                    ) : null}
                    {selectedLead.phone ? (
                      <View style={styles.detailRow}>
                        <Ionicons name="call-outline" size={18} color={theme.primary} />
                        <Text style={[styles.detailText, { color: theme.text }]}>{selectedLead.phone}</Text>
                      </View>
                    ) : null}
                    {selectedLead.source ? (
                      <View style={styles.detailRow}>
                        <Ionicons name="globe-outline" size={18} color={theme.primary} />
                        <Text style={[styles.detailText, { color: theme.text }]}>{selectedLead.source}</Text>
                      </View>
                    ) : null}
                    {selectedLead.notes ? (
                      <View style={styles.detailRow}>
                        <Ionicons name="document-text-outline" size={18} color={theme.primary} />
                        <Text style={[styles.detailText, { color: theme.text }]}>{selectedLead.notes}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.detailActions}>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.primary }]}
                      onPress={function() { setDetailModal(false); openEditModal(selectedLead); }}>
                      <Ionicons name="create-outline" size={16} color="#fff" />
                      <Text style={styles.actionText}>تعديل</Text>
                    </TouchableOpacity>
                    {isAdmin ? (
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#9C27B0' }]}
                        onPress={function() { setAssignModal(true); }}>
                        <Ionicons name="person-add" size={16} color="#fff" />
                        <Text style={styles.actionText}>توزيع</Text>
                      </TouchableOpacity>
                    ) : null}
                    {selectedLead.status !== 'converted' ? (
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.success }]}
                        onPress={function() { handleConvert(selectedLead); }}>
                        <Ionicons name="swap-horizontal" size={16} color="#fff" />
                        <Text style={styles.actionText}>تحويل</Text>
                      </TouchableOpacity>
                    ) : null}
                    {isAdmin ? (
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.danger }]}
                        onPress={function() { handleDelete(selectedLead); }}>
                        <Ionicons name="trash" size={16} color="#fff" />
                        <Text style={styles.actionText}>حذف</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  {/* Activities Timeline */}
                  <View style={styles.timelineHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>سجل الأنشطة</Text>
                    <TouchableOpacity style={[styles.addActivityBtn, { backgroundColor: theme.primary + '15' }]}
                      onPress={function() { setActivityModal(true); }}>
                      <Ionicons name="add-circle" size={20} color={theme.primary} />
                      <Text style={[styles.addActivityText, { color: theme.primary }]}>إضافة</Text>
                    </TouchableOpacity>
                  </View>

                  {activities.length === 0 ? (
                    <Text style={[styles.noActivities, { color: theme.textMuted }]}>مفيش أنشطة لسه</Text>
                  ) : null}

                  {activities.map(function(act) {
                    return (
                      <View key={act.id} style={[styles.activityItem, { borderColor: theme.border }]}>
                        <View style={[styles.activityIcon, { backgroundColor: getActivityColor(act.type) + '20' }]}>
                          <Ionicons name={getActivityIcon(act.type)} size={18} color={getActivityColor(act.type)} />
                        </View>
                        <View style={styles.activityContent}>
                          <Text style={[styles.activityTitle, { color: theme.text }]}>{act.title}</Text>
                          {act.description ? (
                            <Text style={[styles.activityDesc, { color: theme.textSub }]}>{act.description}</Text>
                          ) : null}
                          <View style={styles.activityMeta}>
                            <Text style={[styles.activityDate, { color: theme.textMuted }]}>
                              {new Date(act.created_at).toLocaleDateString('ar-EG')}
                            </Text>
                            {act.user_name ? (
                              <Text style={[styles.activityUser, { color: theme.primary }]}>{act.user_name}</Text>
                            ) : null}
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </>
              )}
            </ScrollView>

            <TouchableOpacity style={[styles.closeBtn, { backgroundColor: theme.border }]}
              onPress={function() { setDetailModal(false); }}>
              <Text style={[styles.closeText, { color: theme.text }]}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ===== Add/Edit Modal ===== */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalBg }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <ScrollView>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {editingLead ? 'تعديل Lead' : 'إضافة Lead جديد'}
              </Text>
              <TextInput style={[styles.input, { borderColor: theme.border, backgroundColor: theme.inputBg, color: theme.text }]}
                placeholder="الاسم *" value={form.name}
                onChangeText={function(t) { setForm({ ...form, name: t }); }} placeholderTextColor={theme.textMuted} />
              <TextInput style={[styles.input, { borderColor: theme.border, backgroundColor: theme.inputBg, color: theme.text }]}
                placeholder="الإيميل" value={form.email}
                onChangeText={function(t) { setForm({ ...form, email: t }); }} keyboardType="email-address" placeholderTextColor={theme.textMuted} />
              <TextInput style={[styles.input, { borderColor: theme.border, backgroundColor: theme.inputBg, color: theme.text }]}
                placeholder="التليفون" value={form.phone}
                onChangeText={function(t) { setForm({ ...form, phone: t }); }} keyboardType="phone-pad" placeholderTextColor={theme.textMuted} />
              <TextInput style={[styles.input, { borderColor: theme.border, backgroundColor: theme.inputBg, color: theme.text }]}
                placeholder="المصدر" value={form.source}
                onChangeText={function(t) { setForm({ ...form, source: t }); }} placeholderTextColor={theme.textMuted} />
              <TextInput style={[styles.input, { borderColor: theme.border, backgroundColor: theme.inputBg, color: theme.text }]}
                placeholder="ملاحظات" value={form.notes}
                onChangeText={function(t) { setForm({ ...form, notes: t }); }} multiline placeholderTextColor={theme.textMuted} />

              <View style={styles.statusRow}>
                {['new', 'contacted', 'qualified', 'lost'].map(function(s) {
                  return (
                    <TouchableOpacity key={s}
                      style={[styles.statusBtn, {
                        backgroundColor: form.status === s ? getStatusColor(s) : theme.inputBg,
                        borderColor: theme.border,
                      }]}
                      onPress={function() { setForm({ ...form, status: s }); }}>
                      <Text style={[styles.statusBtnText, { color: form.status === s ? '#fff' : theme.textSub }]}>{s}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: theme.border }]}
                onPress={function() { setModalVisible(false); }}>
                <Text style={[styles.cancelText, { color: theme.text }]}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.primary }]} onPress={handleSave}>
                <Text style={styles.saveText}>حفظ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ===== Assign Modal ===== */}
      <Modal visible={assignModal} animationType="fade" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalBg }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>توزيع على Agent</Text>
            <FlatList
              data={agents.filter(function(a) { return a.role === 'agent'; })}
              keyExtractor={function(item) { return item.id.toString(); }}
              ListEmptyComponent={<Text style={[styles.noActivities, { color: theme.textMuted }]}>مفيش Agents مسجلين</Text>}
              renderItem={function(obj) {
                var agent = obj.item;
                return (
                  <TouchableOpacity
                    style={[styles.agentItem, { borderColor: theme.border }]}
                    onPress={function() { handleAssign(agent.id); }}>
                    <View style={[styles.agentAvatar, { backgroundColor: theme.primary + '20' }]}>
                      <Text style={[styles.agentAvatarText, { color: theme.primary }]}>{(agent.name || '?').charAt(0)}</Text>
                    </View>
                    <View>
                      <Text style={[styles.agentName, { color: theme.text }]}>{agent.name}</Text>
                      <Text style={[styles.agentEmail, { color: theme.textMuted }]}>{agent.email}</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
            <TouchableOpacity style={[styles.closeBtn, { backgroundColor: theme.border, marginTop: 16 }]}
              onPress={function() { setAssignModal(false); }}>
              <Text style={[styles.closeText, { color: theme.text }]}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ===== Activity Modal ===== */}
      <Modal visible={activityModal} animationType="fade" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalBg }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>إضافة نشاط</Text>

            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[styles.typeBtn, { backgroundColor: activityForm.type === 'note' ? '#FF9800' : theme.inputBg, borderColor: theme.border }]}
                onPress={function() { setActivityForm({ ...activityForm, type: 'note' }); }}>
                <Ionicons name="document-text" size={18} color={activityForm.type === 'note' ? '#fff' : theme.textSub} />
                <Text style={[styles.typeBtnText, { color: activityForm.type === 'note' ? '#fff' : theme.textSub }]}>ملاحظة</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, { backgroundColor: activityForm.type === 'meeting' ? '#9C27B0' : theme.inputBg, borderColor: theme.border }]}
                onPress={function() { setActivityForm({ ...activityForm, type: 'meeting' }); }}>
                <Ionicons name="calendar" size={18} color={activityForm.type === 'meeting' ? '#fff' : theme.textSub} />
                <Text style={[styles.typeBtnText, { color: activityForm.type === 'meeting' ? '#fff' : theme.textSub }]}>اجتماع</Text>
              </TouchableOpacity>
            </View>

            <TextInput style={[styles.input, { borderColor: theme.border, backgroundColor: theme.inputBg, color: theme.text }]}
              placeholder={activityForm.type === 'note' ? 'العنوان (اختياري)' : 'عنوان الاجتماع *'}
              value={activityForm.title}
              onChangeText={function(t) { setActivityForm({ ...activityForm, title: t }); }}
              placeholderTextColor={theme.textMuted} />

            <TextInput style={[styles.input, { borderColor: theme.border, backgroundColor: theme.inputBg, color: theme.text, height: 100, textAlignVertical: 'top' }]}
              placeholder={activityForm.type === 'note' ? 'اكتب الملاحظة *' : 'تفاصيل الاجتماع'}
              value={activityForm.description}
              onChangeText={function(t) { setActivityForm({ ...activityForm, description: t }); }}
              multiline placeholderTextColor={theme.textMuted} />

            {activityForm.type === 'meeting' ? (
              <TextInput style={[styles.input, { borderColor: theme.border, backgroundColor: theme.inputBg, color: theme.text }]}
                placeholder="تاريخ الاجتماع (مثال: 2025-03-15)"
                value={activityForm.meeting_date}
                onChangeText={function(t) { setActivityForm({ ...activityForm, meeting_date: t }); }}
                placeholderTextColor={theme.textMuted} />
            ) : null}

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: theme.border }]}
                onPress={function() { setActivityModal(false); }}>
                <Text style={[styles.cancelText, { color: theme.text }]}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: getActivityColor(activityForm.type) }]}
                onPress={handleAddActivity}>
                <Text style={styles.saveText}>إضافة</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

var styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 12,
    paddingHorizontal: 14, height: 46, borderRadius: 12, borderWidth: 1,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14 },
  filterScroll: { marginTop: 10, marginBottom: 5, maxHeight: 40 },
  filterRow: { paddingHorizontal: 12 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginHorizontal: 4, borderWidth: 1 },
  filterText: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  emptyContainer: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 16, marginTop: 10 },
  card: {
    marginHorizontal: 16, marginTop: 10, borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: 'bold' },
  cardName: { fontSize: 16, fontWeight: 'bold' },
  cardSub: { fontSize: 12, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  infoText: { fontSize: 13, marginLeft: 6 },
  fab: {
    position: 'absolute', bottom: 20, right: 20, width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5,
  },
  modalOverlay: { flex: 1, justifyContent: 'center', padding: 16 },
  modalContent: { borderRadius: 20, padding: 24, maxHeight: '85%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 15, marginBottom: 12 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10 },
  statusBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  statusBtnText: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  cancelBtn: { flex: 1, padding: 14, marginRight: 8, borderRadius: 12, alignItems: 'center' },
  cancelText: { fontSize: 16, fontWeight: '600' },
  saveBtn: { flex: 1, padding: 14, marginLeft: 8, borderRadius: 12, alignItems: 'center' },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  detailContent: { borderRadius: 20, padding: 24, maxHeight: '90%' },
  detailHeader: { alignItems: 'center', marginBottom: 16 },
  detailAvatar: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  detailAvatarText: { fontSize: 30, fontWeight: 'bold' },
  detailName: { fontSize: 22, fontWeight: 'bold', marginBottom: 6 },
  assignedText: { marginTop: 6, fontSize: 14, fontWeight: '600' },
  detailSection: { borderTopWidth: 1, paddingTop: 14, marginBottom: 14 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  detailText: { fontSize: 15, marginLeft: 12 },
  detailActions: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, marginRight: 8, marginBottom: 8 },
  actionText: { color: '#fff', fontSize: 12, fontWeight: '600', marginLeft: 4 },
  closeBtn: { padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  closeText: { fontSize: 16, fontWeight: '600' },
  timelineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold' },
  addActivityBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  addActivityText: { fontSize: 13, fontWeight: '600', marginLeft: 4 },
  noActivities: { textAlign: 'center', padding: 20, fontSize: 14 },
  activityItem: { flexDirection: 'row', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1 },
  activityIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  activityContent: { flex: 1 },
  activityTitle: { fontSize: 14, fontWeight: '600' },
  activityDesc: { fontSize: 13, marginTop: 3 },
  activityMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  activityDate: { fontSize: 11 },
  activityUser: { fontSize: 11, fontWeight: '600' },
  typeRow: { flexDirection: 'row', marginBottom: 16 },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 10, marginHorizontal: 4, borderWidth: 1 },
  typeBtnText: { fontSize: 14, fontWeight: '600', marginLeft: 6 },
  agentItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderRadius: 10, marginBottom: 8 },
  agentAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  agentAvatarText: { fontSize: 18, fontWeight: 'bold' },
  agentName: { fontSize: 15, fontWeight: '600' },
  agentEmail: { fontSize: 12, marginTop: 2 },
});
