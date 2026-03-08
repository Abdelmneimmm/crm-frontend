import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  RefreshControl, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../config/api';
import { useApp } from '../../context/AppContext';

export default function DashboardScreen() {
  const { theme } = useApp();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await api.get('/dashboard/stats');
      setStats(res.data);
    } catch (err) {
      console.log('Dashboard error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStats();
  }, []);

  const getStatusColor = (status) => {
    const colors = {
      new: theme.statusNew,
      contacted: theme.statusContacted,
      qualified: theme.statusQualified,
      lost: theme.statusLost,
      converted: theme.statusConverted,
    };
    return colors[status] || theme.textMuted;
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSub }]}>جاري التحميل...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.bg }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
    >
      <View style={styles.cardsRow}>
        <View style={[styles.statCard, { backgroundColor: theme.primary + '15' }]}>
          <Ionicons name="people" size={28} color={theme.primary} />
          <Text style={[styles.statNumber, { color: theme.text }]}>{stats?.totalLeads || 0}</Text>
          <Text style={[styles.statLabel, { color: theme.textSub }]}>Leads</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.success + '15' }]}>
          <Ionicons name="business" size={28} color={theme.success} />
          <Text style={[styles.statNumber, { color: theme.text }]}>{stats?.totalCustomers || 0}</Text>
          <Text style={[styles.statLabel, { color: theme.textSub }]}>Customers</Text>
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Leads by Status</Text>
        {stats?.leadsByStatus?.length === 0 && (
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>مفيش بيانات لسه</Text>
        )}
        {stats?.leadsByStatus?.map((item, index) => (
          <View key={index} style={[styles.statusRow, { borderBottomColor: theme.border }]}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
            <Text style={[styles.statusCount, { color: theme.text }]}>{item.count}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Leads</Text>
        {stats?.recentLeads?.length === 0 && (
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>مفيش Leads لسه</Text>
        )}
        {stats?.recentLeads?.map((lead) => (
          <View key={lead.id} style={[styles.listItem, { borderBottomColor: theme.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.avatar, { backgroundColor: theme.primary + '20' }]}>
                <Text style={[styles.avatarText, { color: theme.primary }]}>{lead.name?.charAt(0)}</Text>
              </View>
              <View>
                <Text style={[styles.itemName, { color: theme.text }]}>{lead.name}</Text>
                <Text style={[styles.itemSub, { color: theme.textMuted }]}>{lead.email || 'No email'}</Text>
              </View>
            </View>
            <View style={[styles.miniBadge, { backgroundColor: getStatusColor(lead.status) }]}>
              <Text style={styles.miniBadgeText}>{lead.status}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Customers</Text>
        {stats?.recentCustomers?.length === 0 && (
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>مفيش عملاء لسه</Text>
        )}
        {stats?.recentCustomers?.map((cust) => (
          <View key={cust.id} style={[styles.listItem, { borderBottomColor: theme.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.avatar, { backgroundColor: theme.success + '20' }]}>
                <Text style={[styles.avatarText, { color: theme.success }]}>{cust.name?.charAt(0)}</Text>
              </View>
              <View>
                <Text style={[styles.itemName, { color: theme.text }]}>{cust.name}</Text>
                <Text style={[styles.itemSub, { color: theme.textMuted }]}>{cust.company || cust.email || 'No info'}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10 },
  emptyText: { textAlign: 'center', padding: 20 },
  cardsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statCard: { flex: 1, marginHorizontal: 5, padding: 20, borderRadius: 16, alignItems: 'center' },
  statNumber: { fontSize: 32, fontWeight: 'bold', marginTop: 8 },
  statLabel: { fontSize: 14, marginTop: 4 },
  section: {
    borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  statusRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1,
  },
  statusBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  statusCount: { fontSize: 20, fontWeight: 'bold' },
  listItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: 'bold' },
  itemName: { fontSize: 15, fontWeight: '600' },
  itemSub: { fontSize: 12, marginTop: 2 },
  miniBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  miniBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
});
