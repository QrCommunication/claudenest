/**
 * CredentialsScreen
 * Manage Claude API keys and OAuth tokens
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SettingsStackParamList } from '@/navigation/types';
import { useCredentialsStore, type Credential } from '@/stores/credentialsStore';
import { colors, spacing, typography } from '@/theme';
import { LoadingSpinner, ErrorMessage } from '@/components/common';

type Props = NativeStackScreenProps<SettingsStackParamList, 'Credentials'>;

// ─── Add Credential Modal ─────────────────────────────────────────────────────
interface AddModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    auth_type: 'api_key' | 'oauth';
    api_key?: string;
    claude_dir_mode: 'shared' | 'isolated';
  }) => void;
  isSubmitting: boolean;
}

const AddCredentialModal: React.FC<AddModalProps> = ({ visible, onClose, onSubmit, isSubmitting }) => {
  const [name, setName] = useState('');
  const [authType, setAuthType] = useState<'api_key' | 'oauth'>('api_key');
  const [apiKey, setApiKey] = useState('');
  const [dirMode, setDirMode] = useState<'shared' | 'isolated'>('shared');

  const reset = () => { setName(''); setAuthType('api_key'); setApiKey(''); setDirMode('shared'); };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = () => {
    if (!name.trim()) { Alert.alert('Error', 'Name is required'); return; }
    if (!/^[a-z0-9-]+$/.test(name)) { Alert.alert('Error', 'Use only lowercase letters, numbers, and dashes'); return; }
    if (authType === 'api_key' && !apiKey.trim()) { Alert.alert('Error', 'API key is required'); return; }
    onSubmit({ name, auth_type: authType, api_key: authType === 'api_key' ? apiKey : undefined, claude_dir_mode: dirMode });
    reset();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={modalStyles.container}>
        <View style={modalStyles.header}>
          <Text style={modalStyles.title}>Add Credential</Text>
          <TouchableOpacity onPress={handleClose}><Icon name="close" size={24} color={colors.text.muted} /></TouchableOpacity>
        </View>
        <ScrollView style={modalStyles.body} keyboardShouldPersistTaps="handled">
          {/* Name */}
          <Text style={modalStyles.label}>Name <Text style={{ color: colors.semantic.error }}>*</Text></Text>
          <TextInput
            style={modalStyles.input}
            value={name}
            onChangeText={setName}
            placeholder="my-credential"
            placeholderTextColor={colors.text.muted}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={modalStyles.hint}>Lowercase letters, numbers, and dashes only</Text>

          {/* Auth Type */}
          <Text style={[modalStyles.label, { marginTop: spacing.md }]}>Type</Text>
          <View style={modalStyles.tabs}>
            <TouchableOpacity style={[modalStyles.tab, authType === 'api_key' && modalStyles.tabActive]} onPress={() => setAuthType('api_key')}>
              <Icon name="vpn-key" size={16} color={authType === 'api_key' ? colors.text.primary : colors.text.muted} />
              <Text style={[modalStyles.tabText, authType === 'api_key' && modalStyles.tabTextActive]}>API Key</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[modalStyles.tab, authType === 'oauth' && modalStyles.tabActive]} onPress={() => setAuthType('oauth')}>
              <Icon name="verified-user" size={16} color={authType === 'oauth' ? colors.text.primary : colors.text.muted} />
              <Text style={[modalStyles.tabText, authType === 'oauth' && modalStyles.tabTextActive]}>OAuth</Text>
            </TouchableOpacity>
          </View>

          {/* API Key field */}
          {authType === 'api_key' && (
            <>
              <Text style={[modalStyles.label, { marginTop: spacing.md }]}>API Key <Text style={{ color: colors.semantic.error }}>*</Text></Text>
              <TextInput
                style={modalStyles.input}
                value={apiKey}
                onChangeText={setApiKey}
                placeholder="sk-ant-..."
                placeholderTextColor={colors.text.muted}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </>
          )}

          {/* OAuth info */}
          {authType === 'oauth' && (
            <View style={modalStyles.infoBox}>
              <Icon name="info" size={18} color={colors.primary.cyan} />
              <Text style={modalStyles.infoText}>
                After creating, use "Connect" to authenticate via your Claude account.
              </Text>
            </View>
          )}

          {/* Dir Mode */}
          <Text style={[modalStyles.label, { marginTop: spacing.md }]}>Claude Directory Mode</Text>
          <View style={modalStyles.tabs}>
            <TouchableOpacity style={[modalStyles.tab, dirMode === 'shared' && modalStyles.tabActive]} onPress={() => setDirMode('shared')}>
              <Text style={[modalStyles.tabText, dirMode === 'shared' && modalStyles.tabTextActive]}>Shared</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[modalStyles.tab, dirMode === 'isolated' && modalStyles.tabActive]} onPress={() => setDirMode('isolated')}>
              <Text style={[modalStyles.tabText, dirMode === 'isolated' && modalStyles.tabTextActive]}>Isolated</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={modalStyles.footer}>
          <TouchableOpacity style={modalStyles.btnSecondary} onPress={handleClose} disabled={isSubmitting}>
            <Text style={modalStyles.btnSecondaryText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[modalStyles.btnPrimary, isSubmitting && { opacity: 0.5 }]} onPress={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={modalStyles.btnPrimaryText}>Create</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ─── Credential Card ──────────────────────────────────────────────────────────
const CredentialCard: React.FC<{
  credential: Credential;
  onSetDefault: () => void;
  onConnect: () => void;
  onRefresh: () => void;
  onTest: () => void;
  onDelete: () => void;
  isActionLoading: boolean;
}> = ({ credential, onSetDefault, onConnect, onRefresh, onTest, onDelete, isActionLoading }) => {
  const statusColor = {
    ok: colors.semantic.success,
    expired: colors.semantic.warning,
    missing: colors.semantic.error,
    needs_login: colors.semantic.error,
  }[credential.token_status] ?? colors.text.muted;

  const statusText = {
    ok: 'Active',
    expired: 'Expired',
    missing: 'Missing',
    needs_login: 'Needs Login',
  }[credential.token_status] ?? 'Unknown';

  const needsReconnect = ['missing', 'needs_login'].includes(credential.token_status) ||
    (credential.token_status === 'expired' && !credential.has_refresh_token);

  return (
    <View style={cardStyles.container}>
      <View style={cardStyles.header}>
        <View style={cardStyles.nameRow}>
          <Text style={cardStyles.name}>{credential.name}</Text>
          {credential.is_default && <Icon name="star" size={14} color="#fbbf24" style={{ marginLeft: 4 }} />}
        </View>
        <View style={[cardStyles.typeBadge, credential.auth_type === 'oauth' && cardStyles.typeBadgeOAuth]}>
          <Text style={[cardStyles.typeBadgeText, credential.auth_type === 'oauth' && cardStyles.typeBadgeTextOAuth]}>
            {credential.auth_type === 'api_key' ? 'API Key' : 'OAuth'}
          </Text>
        </View>
      </View>

      <View style={cardStyles.body}>
        <View style={cardStyles.row}>
          <Text style={cardStyles.rowLabel}>Status</Text>
          <View style={cardStyles.statusRow}>
            <View style={[cardStyles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[cardStyles.rowValue, { color: statusColor }]}>{statusText}</Text>
          </View>
        </View>
        {credential.masked_key && (
          <View style={cardStyles.row}>
            <Text style={cardStyles.rowLabel}>Key</Text>
            <Text style={cardStyles.maskedKey}>{credential.masked_key}</Text>
          </View>
        )}
        {credential.auth_type === 'oauth' && (
          <View style={cardStyles.row}>
            <Text style={cardStyles.rowLabel}>Refresh</Text>
            <Text style={[cardStyles.rowValue, { color: credential.has_refresh_token ? colors.semantic.success : colors.text.muted }]}>
              {credential.has_refresh_token ? 'Available' : 'Not set'}
            </Text>
          </View>
        )}
      </View>

      <View style={cardStyles.actions}>
        <TouchableOpacity style={cardStyles.actionBtn} onPress={onTest} disabled={isActionLoading}>
          <Icon name="check-circle" size={16} color={colors.text.secondary} />
          <Text style={cardStyles.actionBtnText}>Test</Text>
        </TouchableOpacity>

        {credential.auth_type === 'oauth' && needsReconnect && (
          <TouchableOpacity style={[cardStyles.actionBtn, cardStyles.connectBtn]} onPress={onConnect} disabled={isActionLoading}>
            <Icon name="link" size={16} color={colors.primary.purple} />
            <Text style={[cardStyles.actionBtnText, { color: colors.primary.purple }]}>Connect</Text>
          </TouchableOpacity>
        )}

        {credential.auth_type === 'oauth' && credential.has_refresh_token && !needsReconnect && (
          <TouchableOpacity style={cardStyles.actionBtn} onPress={onRefresh} disabled={isActionLoading}>
            <Icon name="refresh" size={16} color={colors.text.secondary} />
            <Text style={cardStyles.actionBtnText}>Refresh</Text>
          </TouchableOpacity>
        )}

        {!credential.is_default && (
          <TouchableOpacity style={cardStyles.actionBtn} onPress={onSetDefault} disabled={isActionLoading}>
            <Icon name="star-border" size={16} color={colors.text.secondary} />
            <Text style={cardStyles.actionBtnText}>Default</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={[cardStyles.actionBtn, cardStyles.deleteBtn]} onPress={onDelete} disabled={isActionLoading}>
          <Icon name="delete" size={16} color={colors.semantic.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const CredentialsScreen: React.FC<Props> = ({ navigation }) => {
  const { credentials, isLoading, error, fetchCredentials, createCredential, deleteCredential, setDefault, testCredential, refreshCredential, initiateOAuth, clearError } = useCredentialsStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => { fetchCredentials(); }, []);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => setShowAddModal(true)} style={{ marginRight: spacing.sm }}>
          <Icon name="add" size={26} color={colors.primary.purple} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const handleCreate = useCallback(async (data: Parameters<typeof createCredential>[0]) => {
    setIsSubmitting(true);
    try {
      await createCredential(data);
      setShowAddModal(false);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error?.message ?? 'Failed to create credential');
    } finally {
      setIsSubmitting(false);
    }
  }, [createCredential]);

  const handleAction = useCallback(async (id: string, action: () => Promise<void>, successMsg: string) => {
    setActionLoadingId(id);
    try {
      await action();
      Alert.alert('Success', successMsg);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error?.message ?? 'Action failed');
    } finally {
      setActionLoadingId(null);
    }
  }, []);

  const handleDelete = useCallback((id: string, name: string) => {
    Alert.alert('Delete Credential', `Delete "${name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setActionLoadingId(id);
        try { await deleteCredential(id); } catch { Alert.alert('Error', 'Failed to delete'); }
        finally { setActionLoadingId(null); }
      }},
    ]);
  }, [deleteCredential]);

  const handleConnect = useCallback(async (id: string) => {
    setActionLoadingId(id);
    try {
      await initiateOAuth(id);
    } catch (e: any) {
      Alert.alert('OAuth Failed', e?.message ?? 'Connection failed');
    } finally {
      setActionLoadingId(null);
    }
  }, [initiateOAuth]);

  if (isLoading && credentials.length === 0) return <LoadingSpinner text="Loading credentials..." fullScreen />;

  return (
    <View style={styles.container}>
      {error && <ErrorMessage message={error} onDismiss={clearError} />}

      {credentials.length === 0 && !isLoading ? (
        <View style={styles.emptyState}>
          <Icon name="key" size={56} color={colors.text.disabled} />
          <Text style={styles.emptyTitle}>No credentials yet</Text>
          <Text style={styles.emptySubtitle}>Add your Claude API key or connect via OAuth</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
            <Icon name="add" size={20} color="#fff" />
            <Text style={styles.addBtnText}>Add Credential</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={credentials}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <CredentialCard
              credential={item}
              isActionLoading={actionLoadingId === item.id}
              onTest={() => handleAction(item.id, () => testCredential(item.id).then(r => { if (!r.valid) throw new Error(r.message); }), 'Credential is valid')}
              onConnect={() => handleConnect(item.id)}
              onRefresh={() => handleAction(item.id, () => refreshCredential(item.id), 'Token refreshed')}
              onSetDefault={() => handleAction(item.id, () => setDefault(item.id), 'Default credential updated')}
              onDelete={() => handleDelete(item.id, item.name)}
            />
          )}
        />
      )}

      <AddCredentialModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleCreate}
        isSubmitting={isSubmitting}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.dark2 },
  list: { padding: spacing.md, gap: spacing.md },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.text.primary, marginTop: spacing.md },
  emptySubtitle: { fontSize: 14, color: colors.text.muted, marginTop: spacing.xs, textAlign: 'center' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.primary.purple, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: 10, marginTop: spacing.lg },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});

const cardStyles = StyleSheet.create({
  container: { borderRadius: 10, overflow: 'hidden', backgroundColor: colors.background.dark3, borderWidth: 1, borderColor: colors.background.dark4 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.background.dark4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, backgroundColor: 'rgba(168, 85, 247, 0.15)' },
  typeBadgeOAuth: { backgroundColor: 'rgba(34, 211, 238, 0.15)' },
  typeBadgeText: { fontSize: 11, fontWeight: '600', color: colors.primary.purple },
  typeBadgeTextOAuth: { color: colors.primary.cyan },
  body: { padding: spacing.md, gap: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontSize: 13, color: colors.text.muted },
  rowValue: { fontSize: 13, color: colors.text.secondary },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  maskedKey: { fontFamily: 'monospace', fontSize: 12, color: colors.text.muted },
  actions: { flexDirection: 'row', alignItems: 'center', padding: spacing.sm, gap: spacing.xs, borderTopWidth: 1, borderTopColor: colors.background.dark4, backgroundColor: colors.background.dark4, flexWrap: 'wrap' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: 6, backgroundColor: colors.background.dark3 },
  actionBtnText: { fontSize: 12, color: colors.text.secondary },
  connectBtn: { borderWidth: 1, borderColor: 'rgba(168, 85, 247, 0.3)' },
  deleteBtn: { marginLeft: 'auto' },
});

const modalStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.dark2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.background.dark4 },
  title: { fontSize: 18, fontWeight: '700', color: colors.text.primary },
  body: { flex: 1, padding: spacing.lg },
  label: { fontSize: 13, fontWeight: '500', color: colors.text.secondary, marginBottom: spacing.xs },
  input: { backgroundColor: colors.background.dark3, borderWidth: 1, borderColor: colors.background.dark4, borderRadius: 8, paddingHorizontal: spacing.md, paddingVertical: 10, color: colors.text.primary, fontSize: 14 },
  hint: { fontSize: 11, color: colors.text.muted, marginTop: 4 },
  tabs: { flexDirection: 'row', gap: spacing.sm },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 8, backgroundColor: colors.background.dark3, borderWidth: 1, borderColor: colors.background.dark4 },
  tabActive: { backgroundColor: 'rgba(168, 85, 247, 0.15)', borderColor: colors.primary.purple },
  tabText: { fontSize: 13, fontWeight: '500', color: colors.text.muted },
  tabTextActive: { color: colors.text.primary },
  infoBox: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, backgroundColor: 'rgba(34, 211, 238, 0.08)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(34, 211, 238, 0.2)', marginTop: spacing.sm },
  infoText: { flex: 1, fontSize: 13, color: colors.text.muted, lineHeight: 18 },
  footer: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.background.dark4 },
  btnPrimary: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, backgroundColor: colors.primary.purple },
  btnPrimaryText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  btnSecondary: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, backgroundColor: colors.background.dark3 },
  btnSecondaryText: { color: colors.text.secondary, fontWeight: '500', fontSize: 15 },
});
