import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import PageHeader from '../../components/PageHeader';
import { getLocationById, updateLocationTimeWindow, isNowWithinTimeWindow } from '../../lib/firebase-service';

function pad2(n) { return n.toString().padStart(2, '0'); }

// Format to a simple local string: YYYY-MM-DD HH:mm
function formatLocalDateTimeString(d) {
	if (!d) return '';
	const year = d.getFullYear();
	const month = pad2(d.getMonth() + 1);
	const day = pad2(d.getDate());
	const hour = pad2(d.getHours());
	const min = pad2(d.getMinutes());
	return `${year}-${month}-${day} ${hour}:${min}`;
}

// Parse from YYYY-MM-DD HH:mm to a Date (local)
function parseLocalDateTimeString(s) {
	if (!s || typeof s !== 'string') return null;
	const trimmed = s.trim();
	// Accept both with space or with T
	const normalized = trimmed.replace('T', ' ');
	const m = normalized.match(/^(\d{4})-(\d{2})-(\d{2})\s(\d{2}):(\d{2})$/);
	if (!m) return null;
	const [_, yy, mm, dd, HH, MM] = m;
	const year = Number(yy), month = Number(mm) - 1, day = Number(dd);
	const hour = Number(HH), minute = Number(MM);
	const d = new Date(year, month, day, hour, minute, 0, 0);
	return isNaN(d.getTime()) ? null : d;
}

export default function ConditionEdit() {
	const { locationId, huntId } = useLocalSearchParams();
	const router = useRouter();

	const [loading, setLoading] = useState(true);
	const [name, setName] = useState('');
	const [fromStr, setFromStr] = useState('');
	const [toStr, setToStr] = useState('');
	const [currentWindowActive, setCurrentWindowActive] = useState(false);

	useEffect(() => {
		const load = async () => {
			if (!locationId) {
				Alert.alert('Error', 'Missing locationId');
				setLoading(false);
				return;
			}
			try {
				setLoading(true);
				const loc = await getLocationById(String(locationId));
				if (!loc) {
					Alert.alert('Not found', 'Location could not be found');
					setLoading(false);
					return;
				}
				setName(loc.locationName || '');
				const from = loc.availableFrom ? loc.availableFrom.toDate() : null;
				const to = loc.availableTo ? loc.availableTo.toDate() : null;
				setFromStr(from ? formatLocalDateTimeString(from) : '');
				setToStr(to ? formatLocalDateTimeString(to) : '');
				setCurrentWindowActive(isNowWithinTimeWindow(loc.availableFrom ?? null, loc.availableTo ?? null));
			} catch (e) {
				console.error(e);
				Alert.alert('Error', 'Failed to load location');
			} finally {
				setLoading(false);
			}
		};
		load();
	}, [locationId]);

	const handleQuickNow = () => {
		const now = new Date();
		setFromStr(formatLocalDateTimeString(now));
	};

	const handleQuickPlus1h = () => {
		const now = new Date();
		now.setHours(now.getHours() + 1);
		setToStr(formatLocalDateTimeString(now));
	};

	const handleSave = async () => {
		// Allow clearing either bound by leaving input empty
		const from = fromStr.trim() ? parseLocalDateTimeString(fromStr) : null;
		const to = toStr.trim() ? parseLocalDateTimeString(toStr) : null;

		if (fromStr.trim() && !from) {
			Alert.alert('Invalid time', 'Start time format must be YYYY-MM-DD HH:mm');
			return;
		}
		if (toStr.trim() && !to) {
			Alert.alert('Invalid time', 'End time format must be YYYY-MM-DD HH:mm');
			return;
		}
		if (from && to && from.getTime() > to.getTime()) {
			Alert.alert('Invalid range', 'Start time must be before end time');
			return;
		}

		try {
			setLoading(true);
			await updateLocationTimeWindow(String(locationId), {
				availableFrom: fromStr.trim() ? from : null,
				availableTo: toStr.trim() ? to : null,
			});
			Alert.alert('Saved', 'Time window updated', [
				{ text: 'OK', onPress: () => router.back() }
			]);
		} catch (e) {
			console.error(e);
			Alert.alert('Error', 'Failed to update time window');
		} finally {
			setLoading(false);
		}
	};

	const activePreview = useMemo(() => {
		const from = fromStr.trim() ? parseLocalDateTimeString(fromStr) : null;
		const to = toStr.trim() ? parseLocalDateTimeString(toStr) : null;
		const now = new Date();
		const inWindow = (() => {
			const fromMs = from ? from.getTime() : Number.NEGATIVE_INFINITY;
			const toMs = to ? to.getTime() : Number.POSITIVE_INFINITY;
			const nowMs = now.getTime();
			return nowMs >= fromMs && nowMs <= toMs;
		})();
		return inWindow;
	}, [fromStr, toStr]);

	return (
		<ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
			<PageHeader
				title={name ? `Availability • ${name}` : 'Availability'}
				subtitle={huntId ? `Hunt ID: ${huntId}` : undefined}
				showBackButton={true}
				onBackPress={() => router.back()}
			/>

			<View style={styles.section}>
				<Text style={styles.help}>Set when this location is active. Leave a field empty to make the window open-ended.</Text>
			</View>

			<View style={styles.formGroup}>
				<Text style={styles.label}>Start (YYYY-MM-DD HH:mm)</Text>
				<TextInput
					style={styles.input}
					placeholder="e.g. 2025-11-18 09:00"
					value={fromStr}
					onChangeText={setFromStr}
					autoCapitalize="none"
					autoCorrect={false}
				/>
				<Pressable style={styles.quickBtn} onPress={handleQuickNow}>
					<Text style={styles.quickBtnText}>Set to now</Text>
				</Pressable>
			</View>

			<View style={styles.formGroup}>
				<Text style={styles.label}>End (YYYY-MM-DD HH:mm)</Text>
				<TextInput
					style={styles.input}
					placeholder="e.g. 2025-11-18 17:00"
					value={toStr}
					onChangeText={setToStr}
					autoCapitalize="none"
					autoCorrect={false}
				/>
				<Pressable style={styles.quickBtn} onPress={handleQuickPlus1h}>
					<Text style={styles.quickBtnText}>+1 hour</Text>
				</Pressable>
			</View>

			<View style={styles.preview}>
				<Text style={styles.previewText}>Now status: <Text style={{ fontWeight: '700', color: activePreview ? '#065f46' : '#7f1d1d' }}>{activePreview ? 'ACTIVE' : 'INACTIVE'}</Text></Text>
			</View>

			<View style={styles.actions}>
				<Pressable style={[styles.btn, styles.cancel]} onPress={() => router.back()}>
					<Text style={styles.btnText}>Cancel</Text>
				</Pressable>
				<Pressable disabled={loading} style={[styles.btn, styles.save, loading && styles.btnDisabled]} onPress={handleSave}>
					<Text style={styles.btnText}>{loading ? 'Saving...' : 'Save'}</Text>
				</Pressable>
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: '#f9fafb' },
	section: { paddingHorizontal: 16, paddingTop: 8 },
	help: { color: '#4b5563' },
	formGroup: { backgroundColor: '#fff', margin: 16, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
	label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
	input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, backgroundColor: '#fff', color: '#111827' },
	quickBtn: { alignSelf: 'flex-start', marginTop: 10, backgroundColor: '#e5e7eb', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
	quickBtnText: { color: '#111827', fontWeight: '600' },
	preview: { marginHorizontal: 16, marginTop: 4 },
	previewText: { color: '#374151' },
	actions: { flexDirection: 'row', gap: 12, margin: 16 },
	btn: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
	cancel: { backgroundColor: '#6b7280' },
	save: { backgroundColor: '#10b981' },
	btnDisabled: { opacity: 0.6 },
	btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
