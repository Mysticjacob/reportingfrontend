import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text } from 'react-native';
import Header from '../../components/Header';
import Card from '../../components/Card';
import StatTile from '../../components/StatTile';
import { api } from '../../services/api';
import { colors, spacing, typography } from '../../theme/theme';

export default function MonitoringScreen() {
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  useEffect(() => {
    api.get('/reports').then(r => setReports(r.data));
    api.get('/users/lecturers').then(r => setUsers(r.data)).catch(() => {});
  }, []);
  const avgAttend = reports.length
    ? Math.round(reports.reduce((a, b) => a + (Number(b.actualStudentsPresent) / Math.max(1, Number(b.totalRegisteredStudents))) * 100, 0) / reports.length)
    : 0;
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Monitoring" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <View style={{ flexDirection: 'row', marginBottom: spacing.md }}>
          <StatTile label="Reports" value={reports.length} />
          <StatTile label="Lecturers" value={users.length} />
          <StatTile label="Avg attend" value={`${avgAttend}%`} />
        </View>
        {users.map(u => (
          <Card key={u.id}>
            <Text style={typography.h3}>{u.name}</Text>
            <Text style={typography.small}>{u.email} · {u.stream || '—'}</Text>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}
