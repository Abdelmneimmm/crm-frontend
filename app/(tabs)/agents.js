import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, Modal, RefreshControl, ActivityIndicator, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../config/api';
import { useApp } from '../../context/AppContext';

export default function AgentsScreen() {
  var { theme, user } = useApp();
  var [agents, setAgents] = useState([]);
  var [allLeads, setAllLeads] = useState([]);
  var [loading, setLoading] = useState(true);
  var [refreshing, setRefreshing] = useState(false);
  var [assignModal, setAssignModal] = useState(false);
  var [selectedAgent, setSelectedAgent] = useState(null);
  var [agentLeads, setAgentLeads] = useState([]);

  var fetchData = async function() {
    try {
      var usersRes = await api.get('/auth/users');
      var leadsRes = await api.get('/leads');
      setAgents(usersRes.data);
      setAllLeads(leadsRes.data);
    } catch (err) {
      console.log('Fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(function() { fetchData(); }, []);

  var onRefresh = useCallback(function() { setRefreshing(true); fetchData(); }, []);

  var getAgentLeadsCount = function(agentId) {
    return allLeads.filter(function(l) { return l.assigned_to === agentId; }).length;
  };

  var getAgentLeadsList = function(agentId) {
    return allLeads.filter(function(l) { return l.assigned_to === agentId; });
  };

  var getUnassignedLeads = function() {
    return allLeads.filter(function(l) { return !l.assigned_to && l.status !== 'converted'; });
  };

  var openAgentDetail = function(agent) {
    setSelectedAgent(agent);
    setAgentLeads(getAgentLeadsList(agent.id));
    setAssignModal(true);
  };

  var handleAssignLead = function(leadId) {
    Alert.alert('توزيع', 'توزع الـ Lead ده على ' + selectedAgent.name + '؟', [
      { text: 'لا', style: 'cancel' },
      {
        text: 'أيوا وزّع',
        onPress: async function() {
          try {
            await api.put('/leads/' + leadId + '/assign', { assigned_to: selectedAgent.id });
            Alert.alert('تم', 'تم التوزيع بنجاح');
            fetchData();
            setAgentLeads(getAgentLeadsList(selectedAgent.id));
          } catch (err) {
            Alert.alert('خطأ', err.response?.data?.error || 'مشكلة في التوزيع');
          }
        },
      },
    ]);
  };

  var handleUnassignLead = function(leadId) {
    Alert.alert('إلغاء التوزيع', 'تلغي توزيع الـ Lead ده؟', [
      { text: 'لا', style: 'cancel' },
      {
        text: 'أيوا ألغي',
        onPress: async function() {
          try {
            await api.put('/leads/' + leadId + '/assign', { assigned_to: null });
            Alert.alert('تم', 'تم إلغاء التوزيع');
            fetchData();
            setAgentLeads(function(prev) { return prev.filter(function(l) { return l.id !== leadId; }); });
          } catch (err) {
            Alert.alert('خطأ', 'مشكلة');
          }
        },
      },
    ]);
  };

  var handleChangeRole = function(agentId, currentRole) {
    var newRole = currentRole === 'admin' ? 'agent' : 'admin';
    Alert.alert('تغيير الصلاحية', 'تغيّر الصلاحية لـ ' + newRole + '؟', [
      { text: 'لا', style: 'cancel' },
      {
        text: 'أيوا غيّر',
        onPress: async function() {
          try {
            await api.put('/auth/users/' + agentId + '/role', { role: newRole });
            fetchData();
          } catch (err) {
            Alert.alert('خطأ', err.response?.data?.error || 'مشكلة');
          }
        },
      },
    ]);
  };

  var getStatusColor = function(status) {
    var colors = {
      new: theme.statusNew, contacted: theme.statusContacted,
      qualified: theme.statusQualified, lost: theme.statusLost, converted: theme.statusConverted,
    };
    return colors[status] || theme.textMuted;
  };

  if (loading) {
    return <View style={[styles.center, { backgroundColor: theme.bg }]}><ActivityIndicator size="large" color={theme.primary} /></View>;
  }

  var unassignedLeads = getUnassignedLeads();

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <FlatList
        data={agents}
        keyExtractor={function(item) { return item.id.toString(); }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        ListHeaderComponent={
          <View>
            {/* Unassigned Leads Card */}
            {unassignedLeads.length > 0 ? (
              <View style={[styles.unassignedCard, { backgroundColor: theme.danger + '15', borderColor: theme.danger + '30' }]}>
                <View style={styles.unassignedHeader}>
                  <Ionicons name="alert-circle" size={22} color={theme.danger} />
                  <Text style={[styles.unassignedTitle, { color: theme.danger }]}>
                    {unassignedLeads.length} Lead بدون Agent
                  </Text>
                </View>
                <Text style={[styles.unassignedSub, { color: theme.textSub }]}>
                  اضغط على أي Agent تحت عشان توزع عليه
                </Text>
              </View>
            ) : null}

            <Text style={[styles.sectionHeader, { color: theme.text }]}>الفريق</Text>
          </View>
        }
        renderItem={function(obj) {
          var agent = obj.item;
          var leadsCount = getAgentLeadsCount(agent.id);
          var isCurrentUser = user && user.id === agent.id;
          return (
            <TouchableOpacity
              style={[styles.agentCard, { backgroundColor: theme.card }]}
              onPress={function() { openAgentDetail(agent); }}
            >
              <View style={styles.agentRow}>
                <View style={[styles.avatar, { backgroundColor: agent.role === 'admin' ? theme.primary + '20' : theme.success + '20' }]}>
                  <Text style={[styles.avatarText, { color: agent.role === 'admin' ? theme.primary : theme.success }]}>
                    {(agent.name || '?').charAt(0)}
                  </Text>
                </View>
                <View style={styles.agentInfo}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.agentName, { color: theme.text }]}>{agent.name}</Text>
                    {isCurrentUser ? <Text style={[styles.youBadge, { color: theme.primary }]}>(أنت)</Text> : null}
                  </View>
                  <Text style={[styles.agentEmail, { color: theme.textMuted }]}>{agent.email}</Text>
                  <View style={styles.metaRow}>
                    <View style={[styles.roleBadge, { backgroundColor: agent.role === 'admin' ? theme.primary + '15' : theme.success + '15' }]}>
                      <Text style={[styles.roleText, { color: agent.role === 'admin' ? theme.primary : theme.success }]}>
                        {agent.role}
                      </Text>
                    </View>
                    <View style={styles.leadsCountContainer}>
                      <Ionicons name="people" size={14} color={theme.textMuted} />
                      <Text style={[styles.leadsCount, { color: theme.textSub }]}>{leadsCount} Lead</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.roleChangeBtn, { backgroundColor: theme.border }]}
                  onPress={function() { handleChangeRole(agent.id, agent.role); }}
                >
                  <Ionicons name="swap-vertical" size={18} color={theme.textSub} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Agent Detail + Assign Modal */}
      <Modal visible={assignModal} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalBg }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            {selectedAgent && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <View style={[styles.modalAvatar, { backgroundColor: theme.primary + '20' }]}>
                    <Text style={[styles.modalAvatarText, { color: theme.primary }]}>
                      {(selectedAgent.name || '?').charAt(0)}
                    </Text>
                  </View>
                  <Text style={[styles.modalName, { color: theme.text }]}>{selectedAgent.name}</Text>
                  <Text style={[styles.modalEmail, { color: theme.textMuted }]}>{selectedAgent.email}</Text>
                  <View style={[styles.roleBadge, { backgroundColor: theme.primary + '15', marginTop: 8 }]}>
                    <Text style={[styles.roleText, { color: theme.primary }]}>{selectedAgent.role}</Text>
                  </View>
                </View>

                {/* Leads المتوزعة على الـ Agent */}
                <Text style={[styles.modalSectionTitle, { color: theme.text }]}>
                  Leads المتوزعة ({getAgentLeadsList(selectedAgent.id).length})
                </Text>

                {getAgentLeadsList(selectedAgent.id).length === 0 ? (
                  <Text style={[styles.emptyText, { color: theme.textMuted }]}>مفيش Leads متوزعة</Text>
                ) : null}

                {getAgentLeadsList(selectedAgent.id).map(function(lead) {
                  return (
                    <View key={lead.id} style={[styles.leadItem, { borderColor: theme.border }]}>
                      <View style={styles.leadInfo}>
                        <Text style={[styles.leadName, { color: theme.text }]}>{lead.name}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(lead.status) }]}>
                          <Text style={styles.statusText}>{lead.status}</Text>
                        </View>
                      </View>
                      <TouchableOpacity onPress={function() { handleUnassignLead(lead.id); }}>
                        <Ionicons name="close-circle" size={22} color={theme.danger} />
                      </TouchableOpacity>
                    </View>
                  );
                })}

                {/* Leads بدون Agent */}
                {unassignedLeads.length > 0 ? (
                  <>
                    <Text style={[styles.modalSectionTitle, { color: theme.text, marginTop: 20 }]}>
                      وزّع Lead جديد ({unassignedLeads.length} متاح)
                    </Text>
                    {unassignedLeads.map(function(lead) {
                      return (
                        <TouchableOpacity key={lead.id}
                          style={[styles.leadItem, { borderColor: theme.border }]}
                          onPress={function() { handleAssignLead(lead.id); }}
                        >
                          <View style={styles.leadInfo}>
                            <Text style={[styles.leadName, { color: theme.text }]}>{lead.name}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(lead.status) }]}>
                              <Text style={styles.statusText}>{lead.status}</Text>
                            </View>
                          </View>
                          <Ionicons name="add-circle" size={22} color={theme.success} />
                        </TouchableOpacity>
                      );
                    })}
                  </>
                ) : null}
              </ScrollView>
            )}

            <TouchableOpacity style={[styles.closeBtn, { backgroundColor: theme.border }]}
              onPress={function() { setAssignModal(false); }}>
              <Text style={[styles.closeText, { color: theme.text }]}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

var styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  unassignedCard: {
    marginHorizontal: 16, marginTop: 12, padding: 16, borderRadius: 14, borderWidth: 1,
  },
  unassignedHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  unassignedTitle: { fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  unassignedSub: { fontSize: 13, marginLeft: 30 },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 16, marginTop: 16, marginBottom: 4 },
  agentCard: {
    marginHorizontal: 16, marginTop: 10, borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  agentRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  avatarText: { fontSize: 22, fontWeight: 'bold' },
  agentInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  agentName: { fontSize: 17, fontWeight: 'bold' },
  youBadge: { fontSize: 12, marginLeft: 6, fontWeight: '600' },
  agentEmail: { fontSize: 13, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  roleText: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  leadsCountContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: 12 },
  leadsCount: { fontSize: 13, marginLeft: 4 },
  roleChangeBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'center', padding: 16 },
  modalContent: { borderRadius: 20, padding: 24, maxHeight: '90%' },
  modalHeader: { alignItems: 'center', marginBottom: 20 },
  modalAvatar: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  modalAvatarText: { fontSize: 30, fontWeight: 'bold' },
  modalName: { fontSize: 22, fontWeight: 'bold' },
  modalEmail: { fontSize: 14, marginTop: 4 },
  modalSectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  emptyText: { textAlign: 'center', padding: 16, fontSize: 14 },
  leadItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderRadius: 8, marginBottom: 4,
  },
  leadInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  leadName: { fontSize: 15, fontWeight: '600', marginRight: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  closeBtn: { padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  closeText: { fontSize: 16, fontWeight: '600' },
});
