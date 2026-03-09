import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  RefreshControl, ActivityIndicator, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../config/api';
import { useApp } from '../../context/AppContext';

var screenWidth = Dimensions.get('window').width;

export default function DashboardScreen() {
  var { theme, user } = useApp();
  var [stats, setStats] = useState(null);
  var [loading, setLoading] = useState(true);
  var [refreshing, setRefreshing] = useState(false);
  var isAdmin = user && user.role === 'admin';

  var fetchStats = async function() {
    try {
      var res = await api.get('/dashboard/stats');
      setStats(res.data);
    } catch (err) {
      console.log('Dashboard error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(function() { fetchStats(); }, []);

  var onRefresh = useCallback(function() {
    setRefreshing(true);
    fetchStats();
  }, []);

  var getStatusColor = function(status) {
    var colors = {
      new: theme.statusNew,
      contacted: theme.statusContacted,
      qualified: theme.statusQualified,
      lost: theme.statusLost,
      converted: theme.statusConverted,
    };
    return colors[status] || theme.textMuted;
  };

  var getSourceColor = function(index) {
    var colors = ['#2196F3', '#FF9800', '#4CAF50', '#9C27B0', '#F44336', '#00BCD4', '#FF5722'];
    return colors[index % colors.length];
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

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSub }]}>جاري التحميل...</Text>
      </View>
    );
  }

  var maxStatusCount = 1;
  if (stats && stats.leadsByStatus) {
    stats.leadsByStatus.forEach(function(item) {
      var c = parseInt(item.count);
      if (c > maxStatusCount) maxStatusCount = c;
    });
  }

  var maxSourceCount = 1;
  if (stats && stats.leadsBySource) {
    stats.leadsBySource.forEach(function(item) {
      var c = parseInt(item.count);
      if (c > maxSourceCount) maxSourceCount = c;
    });
  }

  var maxMonthlyCount = 1;
  if (stats && stats.monthlyLeads) {
    stats.monthlyLeads.forEach(function(item) {
      var c = parseInt(item.count);
      if (c > maxMonthlyCount) maxMonthlyCount = c;
    });
  }

  var maxAgentLeads = 1;
  if (stats && stats.agentPerformance) {
    stats.agentPerformance.forEach(function(item) {
      var c = parseInt(item.total_leads);
      if (c > maxAgentLeads) maxAgentLeads = c;
    });
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.bg }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
    >
      {/* Welcome */}
      <View style={[styles.welcomeCard, { backgroundColor: theme.primary }]}>
        <View>
          <Text style={styles.welcomeText}>مرحباً {user ? user.name : ''}</Text>
          <Text style={styles.welcomeSub}>{isAdmin ? 'لوحة تحكم الإدارة' : 'لوحة التحكم'}</Text>
        </View>
        <Ionicons name="bar-chart" size={40} color="rgba(255,255,255,0.3)" />
      </View>

      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: theme.primary + '15' }]}>
          <View style={[styles.statIconBg, { backgroundColor: theme.primary + '25' }]}>
            <Ionicons name="people" size={22} color={theme.primary} />
          </View>
          <Text style={[styles.statNumber, { color: theme.text }]}>{stats ? stats.totalLeads : 0}</Text>
          <Text style={[styles.statLabel, { color: theme.textSub }]}>Leads</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.success + '15' }]}>
          <View style={[styles.statIconBg, { backgroundColor: theme.success + '25' }]}>
            <Ionicons name="business" size={22} color={theme.success} />
          </View>
          <Text style={[styles.statNumber, { color: theme.text }]}>{stats ? stats.totalCustomers : 0}</Text>
          <Text style={[styles.statLabel, { color: theme.textSub }]}>عملاء</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#9C27B0' + '15' }]}>
          <View style={[styles.statIconBg, { backgroundColor: '#9C27B0' + '25' }]}>
            <Ionicons name="trending-up" size={22} color="#9C27B0" />
          </View>
          <Text style={[styles.statNumber, { color: theme.text }]}>{stats ? stats.conversionRate : 0}%</Text>
          <Text style={[styles.statLabel, { color: theme.textSub }]}>معدل التحويل</Text>
        </View>
      </View>

      {/* Leads by Status - Bar Chart */}
      <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
        <View style={styles.chartHeader}>
          <Text style={[styles.chartTitle, { color: theme.text }]}>Leads حسب الحالة</Text>
          <Ionicons name="pie-chart" size={20} color={theme.primary} />
        </View>
        {stats && stats.leadsByStatus && stats.leadsByStatus.length > 0 ? (
          <View style={styles.barChart}>
            {stats.leadsByStatus.map(function(item, index) {
              var percentage = (parseInt(item.count) / maxStatusCount) * 100;
              return (
                <View key={index} style={styles.barRow}>
                  <View style={styles.barLabelContainer}>
                    <View style={[styles.barDot, { backgroundColor: getStatusColor(item.status) }]} />
                    <Text style={[styles.barLabel, { color: theme.textSub }]}>{item.status}</Text>
                  </View>
                  <View style={[styles.barTrack, { backgroundColor: theme.border }]}>
                    <View style={[styles.barFill, { width: percentage + '%', backgroundColor: getStatusColor(item.status) }]} />
                  </View>
                  <Text style={[styles.barValue, { color: theme.text }]}>{item.count}</Text>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>مفيش بيانات</Text>
        )}
      </View>

      {/* Leads by Source - Bar Chart */}
      <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
        <View style={styles.chartHeader}>
          <Text style={[styles.chartTitle, { color: theme.text }]}>Leads حسب المصدر</Text>
          <Ionicons name="globe" size={20} color={theme.primary} />
        </View>
        {stats && stats.leadsBySource && stats.leadsBySource.length > 0 ? (
          <View style={styles.barChart}>
            {stats.leadsBySource.map(function(item, index) {
              var percentage = (parseInt(item.count) / maxSourceCount) * 100;
              return (
                <View key={index} style={styles.barRow}>
                  <View style={styles.barLabelContainer}>
                    <View style={[styles.barDot, { backgroundColor: getSourceColor(index) }]} />
                    <Text style={[styles.barLabel, { color: theme.textSub }]}>{item.source}</Text>
                  </View>
                  <View style={[styles.barTrack, { backgroundColor: theme.border }]}>
                    <View style={[styles.barFill, { width: percentage + '%', backgroundColor: getSourceColor(index) }]} />
                  </View>
                  <Text style={[styles.barValue, { color: theme.text }]}>{item.count}</Text>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>مفيش بيانات</Text>
        )}
      </View>

      {/* Monthly Leads - Column Chart */}
      <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
        <View style={styles.chartHeader}>
          <Text style={[styles.chartTitle, { color: theme.text }]}>Leads شهرياً</Text>
          <Ionicons name="calendar" size={20} color={theme.primary} />
        </View>
        {stats && stats.monthlyLeads && stats.monthlyLeads.length > 0 ? (
          <View style={styles.columnChart}>
            {stats.monthlyLeads.map(function(item, index) {
              var percentage = (parseInt(item.count) / maxMonthlyCount) * 100;
              var monthName = item.month ? item.month.substring(5) : '';
              return (
                <View key={index} style={styles.columnItem}>
                  <Text style={[styles.columnValue, { color: theme.text }]}>{item.count}</Text>
                  <View style={[styles.columnTrack, { backgroundColor: theme.border }]}>
                    <View style={[styles.columnFill, { height: percentage + '%', backgroundColor: theme.primary }]} />
                  </View>
                  <Text style={[styles.columnLabel, { color: theme.textMuted }]}>{monthName}</Text>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>مفيش بيانات</Text>
        )}
      </View>

      {/* Agent Performance - Admin Only */}
      {isAdmin && stats && stats.agentPerformance && stats.agentPerformance.length > 0 ? (
        <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: theme.text }]}>أداء فريق المبيعات</Text>
            <Ionicons name="people-circle" size={20} color={theme.primary} />
          </View>
          {stats.agentPerformance.map(function(agent, index) {
            var total = parseInt(agent.total_leads);
            var converted = parseInt(agent.converted);
            var percentage = (total / maxAgentLeads) * 100;
            var convRate = total > 0 ? Math.round((converted / total) * 100) : 0;
            return (
              <View key={index} style={[styles.agentRow, { borderBottomColor: theme.border }]}>
                <View style={styles.agentInfo}>
                  <View style={[styles.agentAvatar, { backgroundColor: theme.primary + '20' }]}>
                    <Text style={[styles.agentAvatarText, { color: theme.primary }]}>{(agent.name || '?').charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.agentName, { color: theme.text }]}>{agent.name}</Text>
                    <View style={[styles.barTrack, { backgroundColor: theme.border, marginTop: 6 }]}>
                      <View style={[styles.barFill, { width: percentage + '%', backgroundColor: theme.primary }]} />
                    </View>
                  </View>
                </View>
                <View style={styles.agentStats}>
                  <Text style={[styles.agentStatNum, { color: theme.text }]}>{total}</Text>
                  <Text style={[styles.agentStatLabel, { color: theme.textMuted }]}>leads</Text>
                  <View style={[styles.convBadge, { backgroundColor: convRate >= 50 ? theme.success + '20' : theme.danger + '20' }]}>
                    <Text style={[styles.convText, { color: convRate >= 50 ? theme.success : theme.danger }]}>{convRate}%</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      {/* Recent Leads */}
      <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
        <View style={styles.chartHeader}>
          <Text style={[styles.chartTitle, { color: theme.text }]}>آخر الـ Leads</Text>
          <Ionicons name="time" size={20} color={theme.primary} />
        </View>
        {stats && stats.recentLeads && stats.recentLeads.length > 0 ? (
          stats.recentLeads.map(function(lead) {
            return (
              <View key={lead.id} style={[styles.listItem, { borderBottomColor: theme.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={[styles.listAvatar, { backgroundColor: getStatusColor(lead.status) + '20' }]}>
                    <Text style={[styles.listAvatarText, { color: getStatusColor(lead.status) }]}>{(lead.name || '?').charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listName, { color: theme.text }]}>{lead.name}</Text>
                    <Text style={[styles.listSub, { color: theme.textMuted }]}>{lead.email || 'No email'}</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <View style={[styles.miniBadge, { backgroundColor: getStatusColor(lead.status) }]}>
                    <Text style={styles.miniBadgeText}>{lead.status}</Text>
                  </View>
                  {lead.assigned_to_name ? (
                    <Text style={[styles.assignText, { color: theme.primary }]}>{lead.assigned_to_name}</Text>
                  ) : null}
                </View>
              </View>
            );
          })
        ) : (
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>مفيش Leads</Text>
        )}
      </View>

      {/* Recent Activities */}
      <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
        <View style={styles.chartHeader}>
          <Text style={[styles.chartTitle, { color: theme.text }]}>آخر الأنشطة</Text>
          <Ionicons name="pulse" size={20} color={theme.primary} />
        </View>
        {stats && stats.recentActivities && stats.recentActivities.length > 0 ? (
          stats.recentActivities.map(function(act) {
            return (
              <View key={act.id} style={[styles.activityRow, { borderBottomColor: theme.border }]}>
                <View style={[styles.activityIconBg, { backgroundColor: getActivityColor(act.type) + '20' }]}>
                  <Ionicons name={getActivityIcon(act.type)} size={16} color={getActivityColor(act.type)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.activityTitle, { color: theme.text }]}>{act.title}</Text>
                  <View style={{ flexDirection: 'row', marginTop: 3 }}>
                    {act.lead_name ? (
                      <Text style={[styles.activityMeta, { color: theme.primary }]}>{act.lead_name}</Text>
                    ) : null}
                    {act.user_name ? (
                      <Text style={[styles.activityMeta, { color: theme.textMuted }]}> • {act.user_name}</Text>
                    ) : null}
                  </View>
                </View>
                <Text style={[styles.activityDate, { color: theme.textMuted }]}>
                  {new Date(act.created_at).toLocaleDateString('ar-EG')}
                </Text>
              </View>
            );
          })
        ) : (
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>مفيش أنشطة</Text>
        )}
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

var styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10 },
  emptyText: { textAlign: 'center', padding: 20, fontSize: 14 },
  welcomeCard: {
    borderRadius: 16, padding: 20, marginBottom: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  welcomeText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  welcomeSub: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 4 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  statCard: {
    flex: 1, marginHorizontal: 4, padding: 16, borderRadius: 14, alignItems: 'center',
  },
  statIconBg: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statNumber: { fontSize: 26, fontWeight: 'bold' },
  statLabel: { fontSize: 12, marginTop: 4 },
  chartCard: {
    borderRadius: 16, padding: 18, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  chartTitle: { fontSize: 17, fontWeight: 'bold' },
  barChart: {},
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  barLabelContainer: { flexDirection: 'row', alignItems: 'center', width: 100 },
  barDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  barLabel: { fontSize: 12, textTransform: 'capitalize' },
  barTrack: { flex: 1, height: 12, borderRadius: 6, overflow: 'hidden', marginHorizontal: 8 },
  barFill: { height: '100%', borderRadius: 6, minWidth: 4 },
  barValue: { fontSize: 14, fontWeight: 'bold', width: 30, textAlign: 'right' },
  columnChart: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 160, paddingTop: 10 },
  columnItem: { alignItems: 'center', flex: 1 },
  columnValue: { fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  columnTrack: { width: 28, height: 120, borderRadius: 8, overflow: 'hidden', justifyContent: 'flex-end' },
  columnFill: { width: '100%', borderRadius: 8, minHeight: 4 },
  columnLabel: { fontSize: 10, marginTop: 6 },
  agentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 },
  agentInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  agentAvatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  agentAvatarText: { fontSize: 16, fontWeight: 'bold' },
  agentName: { fontSize: 14, fontWeight: '600' },
  agentStats: { alignItems: 'center', marginLeft: 12 },
  agentStatNum: { fontSize: 18, fontWeight: 'bold' },
  agentStatLabel: { fontSize: 10 },
  convBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 4 },
  convText: { fontSize: 11, fontWeight: 'bold' },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  listAvatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  listAvatarText: { fontSize: 16, fontWeight: 'bold' },
  listName: { fontSize: 14, fontWeight: '600' },
  listSub: { fontSize: 11, marginTop: 2 },
  miniBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  miniBadgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase' },
  assignText: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  activityRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  activityIconBg: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  activityTitle: { fontSize: 13, fontWeight: '600' },
  activityMeta: { fontSize: 11 },
  activityDate: { fontSize: 10, marginLeft: 8 },
});
