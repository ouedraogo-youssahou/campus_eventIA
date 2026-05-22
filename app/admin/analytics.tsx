import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAnalyticsSummary, getCategoryStats, getMostPopularEvents, getRecentRegistrations } from '../../database/events';
import { useAuth } from '../../context/AuthContext';

interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );
}

interface CategoryBarProps {
  category: string;
  count: number;
  registrations: number;
  maxValue: number;
}

function CategoryBar({ category, count, registrations, maxValue }: CategoryBarProps) {
  const percentage = maxValue > 0 ? (registrations / maxValue) * 100 : 0;
  
  return (
    <View style={styles.categoryItem}>
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryName}>{category}</Text>
        <Text style={styles.categoryStats}>{registrations} inscriptions</Text>
      </View>
      <View style={styles.barContainer}>
        <View style={[styles.bar, { width: `${percentage}%` }]} />
      </View>
      <Text style={styles.categoryCount}>{count} événements</Text>
    </View>
  );
}

export default function AnalyticsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [categoryStats, setCategoryStats] = useState<any[]>([]);
  const [popularEvents, setPopularEvents] = useState<any[]>([]);
  const [recentRegistrations, setRecentRegistrations] = useState<any[]>([]);
  
  const { user } = useAuth();
  const router = useRouter();

  const loadAnalytics = useCallback(async () => {
    try {
      const [summaryData, categoryData, popularData, registrationsData] = await Promise.all([
        getAnalyticsSummary(),
        getCategoryStats(),
        getMostPopularEvents(5),
        getRecentRegistrations(10)
      ]);
      
      setSummary(summaryData);
      setCategoryStats(categoryData);
      setPopularEvents(popularData);
      setRecentRegistrations(registrationsData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  function handleRefresh() {
    setRefreshing(true);
    loadAnalytics();
  }

  const maxRegistrations = Math.max(...categoryStats.map(c => c.registrations), 1);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tableau de bord</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Vue d'ensemble</Text>
          <View style={styles.statsGrid}>
            <StatCard title="Événements" value={summary?.totalEvents || 0} icon="📅" color="#007AFF" />
            <StatCard title="Inscriptions en cours" value={summary?.totalRegistrations || 0} icon="✅" color="#2ecc71" />
            <StatCard title="Favoris" value={summary?.totalFavorites || 0} icon="⭐" color="#f39c12" />
            <StatCard title="À venir" value={summary?.upcomingEvents || 0} icon="🗓️" color="#9b59b6" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📂 Par catégorie</Text>
          {categoryStats.map((cat, index) => (
            <CategoryBar
              key={cat.category}
              category={cat.category}
              count={cat.count}
              registrations={cat.registrations}
              maxValue={maxRegistrations}
            />
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔥 Événements populaires</Text>
          {popularEvents.length === 0 ? (
            <Text style={styles.emptyText}>Aucun événement</Text>
          ) : (
            popularEvents.map((event, index) => (
              <View key={event.id} style={styles.popularItem}>
                <View style={styles.popularRank}>
                  <Text style={styles.rankNumber}>{index + 1}</Text>
                </View>
                <View style={styles.popularContent}>
                  <Text style={styles.popularTitle} numberOfLines={1}>
                    {event.title}
                  </Text>
                  <Text style={styles.popularMeta}>
                    {event.category} • {event.registeredCount} inscriptions
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🕐 Inscriptions récentes</Text>
          {recentRegistrations.length === 0 ? (
            <Text style={styles.emptyText}>Aucune inscription récente</Text>
          ) : (
            recentRegistrations.map((reg, index) => (
              <View key={reg.id || index} style={styles.recentItem}>
                <View style={styles.recentDot} />
                <View style={styles.recentContent}>
                  <Text style={styles.recentUser}>{reg.userId}</Text>
                  <Text style={styles.recentEvent} numberOfLines={1}>
                    {reg.eventTitle}
                  </Text>
                  <Text style={styles.recentDate}>
                    {new Date(reg.createdAt).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            CampusEventsAI - Tableau de bord analytique
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  backButton: {
    padding: 8
  },
  backText: {
    color: '#007AFF',
    fontSize: 16
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333'
  },
  placeholder: {
    width: 60
  },
  scrollView: {
    flex: 1
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  statCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4
  },
  statIcon: {
    fontSize: 28,
    marginRight: 10
  },
  statContent: {
    flex: 1
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333'
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2
  },
  categoryItem: {
    marginBottom: 16
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333'
  },
  categoryStats: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500'
  },
  barContainer: {
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    marginTop: 6,
    marginBottom: 4,
    overflow: 'hidden'
  },
  bar: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4
  },
  categoryCount: {
    fontSize: 12,
    color: '#666'
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    paddingVertical: 20
  },
  popularItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  popularRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  rankNumber: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14
  },
  popularContent: {
    flex: 1
  },
  popularTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333'
  },
  popularMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 2
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  recentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2ecc71',
    marginTop: 6,
    marginRight: 12
  },
  recentContent: {
    flex: 1
  },
  recentUser: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333'
  },
  recentEvent: {
    fontSize: 13,
    color: '#666',
    marginTop: 2
  },
  recentDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2
  },
  footer: {
    padding: 20,
    alignItems: 'center'
  },
  footerText: {
    fontSize: 12,
    color: '#999'
  }
});