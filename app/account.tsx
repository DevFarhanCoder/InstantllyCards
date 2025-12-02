import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import api from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { ensureAuth } from '@/lib/auth';
import { COLORS } from '@/lib/theme';

export default function Account() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [birthdate, setBirthdate] = useState<string | null>(null);
  const [anniversary, setAnniversary] = useState<string | null>(null);

  // Editable states for card fields
  const [editingGender, setEditingGender] = useState(false);
  const [editingBirth, setEditingBirth] = useState(false);
  const [editingAnniv, setEditingAnniv] = useState(false);
  const [tempGender, setTempGender] = useState<string | null>(null);
  const [tempBirthText, setTempBirthText] = useState<string>('');
  const [tempAnnivText, setTempAnnivText] = useState<string>('');

  const [editingName, setEditingName] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempPhone, setTempPhone] = useState('');

  const queryClient = useQueryClient();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const token = await ensureAuth();
      if (!token) return;
      const response = await api.get('/auth/profile');
      const profileData = response.user || response;
      setUserProfile(profileData);
      setTempName(profileData?.name || '');
      setTempPhone(profileData?.phone || '');
      
      // Set gender, birthdate, anniversary from profile if available
      const hasProfileGender = !!profileData?.gender;
      const hasProfileBirthdate = !!profileData?.birthdate;
      const hasProfileAnniversary = !!profileData?.anniversary;
      
      if (hasProfileGender) setGender(profileData.gender);
      if (hasProfileBirthdate) setBirthdate(profileData.birthdate);
      if (hasProfileAnniversary) setAnniversary(profileData.anniversary);
      
      fetchUserCardDetails(profileData._id, hasProfileGender, hasProfileBirthdate, hasProfileAnniversary);
    } catch (err) {
      console.error('Account fetch error', err);
      Alert.alert('Error', 'Failed to load account');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCardDetails = async (userId: string, hasProfileGender = false, hasProfileBirthdate = false, hasProfileAnniversary = false) => {
    try {
      const defaultCardRaw = await AsyncStorage.getItem('default_card');
      if (defaultCardRaw) {
        try {
          const defaultCard = JSON.parse(defaultCardRaw);
          const cardObj = defaultCard && (defaultCard.data || defaultCard.card) ? (defaultCard.data || defaultCard.card) : defaultCard;
          // If we have a full card object in storage, use its fields ONLY if profile doesn't have them
          if (cardObj) {
            if (cardObj.gender && !hasProfileGender) setGender(cardObj.gender);
            if ((cardObj.birthdate || cardObj.dob) && !hasProfileBirthdate) setBirthdate(cardObj.birthdate || cardObj.dob);
            if ((cardObj.anniversary || cardObj.dob) && !hasProfileAnniversary) setAnniversary(cardObj.anniversary || cardObj.dob);
            return;
          }
          // If default_card only contains an id, try fetching that card directly
          const cardId = cardObj && (cardObj._id || cardObj.id);
          if (cardId) {
            try {
              const cardResp = await api.get(`/cards/${cardId}`);
              const cardData = cardResp?.data || cardResp;
              if (cardData) {
                setGender(cardData.gender || null);
                setBirthdate(cardData.birthdate || cardData.dob || null);
                setAnniversary(cardData.anniversary || cardData.dob || null);
                return;
              }
            } catch (e) {
              // fallthrough to listing cards
            }
          }
        } catch (e) {
          // fallthrough
        }
      }
      const resp = await api.get('/cards');
      // Handle multiple API shapes: resp may be array, or { data: [...] }, or { data: { data: [...] } }
      let cards: any[] = [];
      if (Array.isArray(resp)) cards = resp as any[];
      else if (Array.isArray(resp?.data)) cards = resp.data;
      else if (Array.isArray(resp?.data?.data)) cards = resp.data.data;
      else cards = [];

      if (Array.isArray(cards) && cards.length > 0) {
        const myCard = cards.find((c: any) => String(c.userId) === String(userId) || String(c._id) === String(userId));
        if (myCard) {
          setGender(myCard.gender || null);
          setBirthdate(myCard.birthdate || myCard.dob || null);
          setAnniversary(myCard.anniversary || null);
        }
      }
    } catch (err) {
      console.error('Failed to fetch card', err);
    }
  };

  const updateName = async () => {
    if (!tempName.trim()) { Alert.alert('Error', 'Name cannot be empty'); return; }
    setUpdating(true);
    try {
      await api.put('/auth/update-profile', { name: tempName.trim() });
      setUserProfile((prev: any) => prev ? { ...prev, name: tempName.trim() } : prev);
      setEditingName(false);
      Alert.alert('Success', 'Name updated');
      // merge into default_card for card creation
      mergeIntoDefaultCard({ name: tempName.trim() });
      // also update all user's cards' name but avoid re-syncing back to profile
      try {
        await updateAllUserCards({ name: tempName.trim() }, { syncProfile: false } as any);
      } catch (e) {
        // ignore card update failures here
      }
    } catch (err) {
      console.error('Update name', err);
      Alert.alert('Error', 'Failed to update name');
    } finally { setUpdating(false); }
  };

  const updatePhone = async () => {
    if (!tempPhone.trim()) { Alert.alert('Error', 'Phone cannot be empty'); return; }
    setUpdating(true);
    try {
      await api.put('/auth/update-profile', { phone: tempPhone.trim() });
      setUserProfile((prev: any) => prev ? { ...prev, phone: tempPhone.trim() } : prev);
      setEditingPhone(false);
      Alert.alert('Success', 'Phone updated');
      // merge into default_card for card creation
      mergeIntoDefaultCard({ phone: tempPhone.trim() });
      // also update all user's cards' phone but avoid re-syncing back to profile
      try {
        await updateAllUserCards({ phone: tempPhone.trim() }, { syncProfile: false } as any);
      } catch (e) {
        // ignore card update failures here
      }
    } catch (err) {
      console.error('Update phone', err);
      Alert.alert('Error', 'Failed to update phone');
    } finally { setUpdating(false); }
  };

  // Also merge name/phone into local default_card so card creation sees latest values
  const mergeIntoDefaultCard = async (fields: any) => {
    try {
      const defaultCardRaw = await AsyncStorage.getItem('default_card');
      if (!defaultCardRaw) return;
      try {
        const defaultCard = JSON.parse(defaultCardRaw);
        const updated = { ...defaultCard, ...fields };
        await AsyncStorage.setItem('default_card', JSON.stringify(updated));
      } catch (e) {
        // ignore parse errors
      }
    } catch (e) {
      console.error('mergeIntoDefaultCard error', e);
    }
  };

  // helpers: formatting and parsing date strings (DD-MM-YYYY)
  const formatIsoToDisplay = (iso: string | null) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return "";
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = String(d.getFullYear());
      return `${dd}-${mm}-${yyyy}`;
    } catch (e) {
      return "";
    }
  };

  const formatDigitsToDisplay = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0,8);
    if (digits.length <=2) return digits;
    if (digits.length <=4) return digits.slice(0,2) + '-' + digits.slice(2);
    return digits.slice(0,2) + '-' + digits.slice(2,4) + '-' + digits.slice(4);
  };

  const parseDisplayToIso = (s: string) => {
    if (!s) return null;
    const digits = s.replace(/\D/g, '');
    if (digits.length !== 8) return null;
    const dd = digits.slice(0,2);
    const mm = digits.slice(2,4);
    const yyyy = digits.slice(4);
    const iso = `${yyyy}-${mm}-${dd}T00:00:00.000Z`;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return iso;
  };

  // Resolve card id (prefer default_card in AsyncStorage)
  const resolveUserCardId = async (userId?: string) => {
    try {
      const defaultCardRaw = await AsyncStorage.getItem('default_card');
      if (defaultCardRaw) {
        try {
          const defaultCard = JSON.parse(defaultCardRaw);
          if (defaultCard && defaultCard._id) return defaultCard._id;
        } catch (e) {
          // ignore
        }
      }
      const resp = await api.get('/cards');
      const cards = resp?.data || (Array.isArray(resp) ? resp : []);
      if (Array.isArray(cards) && cards.length > 0) {
        const myCard = cards[0];
        return myCard._id;
      }
    } catch (err) {
      console.error('resolveUserCardId error', err);
    }
    return null;
  };

  const updateCardFields = async (fields: any, options: { syncProfile?: boolean } = { syncProfile: true }) => {
    setUpdating(true);
    try {
      const cardId = await resolveUserCardId(userProfile?._id);
      if (!cardId) throw new Error('No card found to update');
      const resp = await api.put(`/cards/${cardId}`, fields);
      // update local default_card if present
      const defaultCardRaw = await AsyncStorage.getItem('default_card');
      if (defaultCardRaw) {
        try {
          const defaultCard = JSON.parse(defaultCardRaw);
          const updated = { ...defaultCard, ...fields };
          await AsyncStorage.setItem('default_card', JSON.stringify(updated));
        } catch (e) {
          // ignore
        }
      }

      // Optionally sync certain card fields back to the user's profile
      if (options?.syncProfile) {
        const profileable: any = {};
        ['name', 'phone', 'gender', 'birthdate', 'anniversary'].forEach(k => {
          if (fields[k] !== undefined) profileable[k] = fields[k];
        });
        if (Object.keys(profileable).length > 0) {
          try {
            await api.put('/auth/update-profile', profileable);
            // update local userProfile state and AsyncStorage 'user' if present
            setUserProfile((prev: any) => prev ? { ...prev, ...profileable } : prev);
            try {
              const userRaw = await AsyncStorage.getItem('user');
              if (userRaw) {
                const userObj = JSON.parse(userRaw);
                const merged = { ...userObj, ...profileable };
                await AsyncStorage.setItem('user', JSON.stringify(merged));
              }
            } catch (e) {
              // ignore
            }
          } catch (e) {
            console.warn('Failed to sync card changes to profile:', e);
          }
        }
      }

      return resp?.data;
    } catch (err) {
      console.error('Failed to update card fields:', err);
      throw err;
    } finally {
      setUpdating(false);
    }
  };

  // Update all cards belonging to current user with given fields
  const updateAllUserCards = async (fields: any, options: { syncProfile?: boolean } = { syncProfile: false }) => {
    setUpdating(true);
    try {
      const userId = userProfile?._id;
      if (!userId) throw new Error('No user logged in');
      const resp = await api.get('/cards');
      let cards: any[] = [];
      if (Array.isArray(resp)) cards = resp as any[];
      else if (Array.isArray(resp?.data)) cards = resp.data;
      else if (Array.isArray(resp?.data?.data)) cards = resp.data.data;
      else cards = [];

      const myCards = cards.filter(c => String(c.userId) === String(userId) || String(c.owner) === String(userId));
      // Map profile.phone -> card.personalPhone
      const cardFields: any = { ...fields };
      if (fields.phone !== undefined) {
        cardFields.personalPhone = fields.phone;
        delete cardFields.phone;
      }

      await Promise.all(myCards.map(async (c: any) => {
        try {
          await api.put(`/cards/${c._id}`, cardFields);
        } catch (e) {
          console.warn('Failed updating card', c._id, e);
        }
      }));

      // update local default_card if present
      const defaultCardRaw = await AsyncStorage.getItem('default_card');
      if (defaultCardRaw) {
        try {
          const defaultCard = JSON.parse(defaultCardRaw);
          const updated = { ...defaultCard, ...fields };
          await AsyncStorage.setItem('default_card', JSON.stringify(updated));
        } catch (e) { /* ignore */ }
      }

      // Optionally sync to profile as well
      if (options?.syncProfile) {
        const profileable: any = {};
        ['name', 'phone', 'gender', 'birthdate', 'anniversary'].forEach(k => {
          if (fields[k] !== undefined) profileable[k] = fields[k];
        });
        if (Object.keys(profileable).length > 0) {
          try {
            await api.put('/auth/update-profile', profileable);
            setUserProfile((prev: any) => prev ? { ...prev, ...profileable } : prev);
            try {
              const userRaw = await AsyncStorage.getItem('user');
              if (userRaw) {
                const userObj = JSON.parse(userRaw);
                const merged = { ...userObj, ...profileable };
                await AsyncStorage.setItem('user', JSON.stringify(merged));
              }
            } catch (e) { /* ignore */ }
          } catch (e) {
            console.warn('Failed to sync profile after bulk card update', e);
          }
        }
      }

      // Invalidate card/profile/home queries so UI updates immediately
      try { queryClient.invalidateQueries({ queryKey: ['cards'] }); queryClient.invalidateQueries({ queryKey: ['public-feed'] }); queryClient.invalidateQueries({ queryKey: ['contacts-feed'] }); queryClient.invalidateQueries({ queryKey: ['profile'] }); } catch (e) {}
      return true;
    } catch (err) {
      console.error('updateAllUserCards error', err);
      throw err;
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.loadingText}>Loading Account...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[ 'top' ]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[ '#4F6AF3', '#6B7FFF' ]} start={{ x:0,y:0 }} end={{ x:1,y:1 }} style={styles.headerGradient}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 12 }}>
              <Ionicons name="chevron-back" size={22} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Your Account</Text>
          </View>
        </LinearGradient>

        <View style={styles.profileCard}>
          <View style={styles.profileInfo}>
            <View style={styles.listCard}>
              {/* Name */}
              <View style={styles.itemRow}>
                <View style={styles.itemLeft}><Ionicons name="person" size={18} color="#4F6AF3" /></View>
                <View style={styles.itemBody}>
                  <Text style={styles.itemLabel}>Full Name</Text>
                  {editingName ? (
                    <View>
                      <TextInput style={[styles.textInput, styles.textInputInside]} value={tempName} onChangeText={setTempName} />
                      <View style={{ flexDirection: 'row' }}>
                        <TouchableOpacity style={[styles.actionButton, styles.cancelButton, { marginRight: 8 }]} onPress={() => { setTempName(userProfile?.name||''); setEditingName(false); }}>
                          <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionButton, styles.saveButton]} onPress={updateName} disabled={updating}>
                          {updating ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveButtonText}>Save</Text>}
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.itemValue}>{userProfile?.name}</Text>
                  )}
                </View>
                {!editingName && (
                  <View style={styles.itemRight}>
                    <TouchableOpacity onPress={() => setEditingName(true)}>
                      <Ionicons name="pencil" size={18} color="#4F6AF3" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.divider} />

              {/* Phone */}
              <View style={styles.itemRow}>
                <View style={styles.itemLeft}><Ionicons name="call" size={18} color="#4F6AF3" /></View>
                <View style={styles.itemBody}>
                  <Text style={styles.itemLabel}>Phone</Text>
                  {editingPhone ? (
                    <View>
                      <TextInput style={[styles.textInput, styles.textInputInside]} value={tempPhone} onChangeText={setTempPhone} keyboardType="phone-pad" />
                      <View style={{ flexDirection: 'row' }}>
                        <TouchableOpacity style={[styles.actionButton, styles.cancelButton, { marginRight: 8 }]} onPress={() => { setTempPhone(userProfile?.phone||''); setEditingPhone(false); }}>
                          <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionButton, styles.saveButton]} onPress={updatePhone} disabled={updating}>
                          {updating ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveButtonText}>Save</Text>}
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.itemValue}>{userProfile?.phone}</Text>
                  )}
                </View>
                {!editingPhone && (
                  <View style={styles.itemRight}>
                    <TouchableOpacity onPress={() => setEditingPhone(true)}>
                      <Ionicons name="pencil" size={18} color="#4F6AF3" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.divider} />

              {/* Gender (editable) */}
              <View style={styles.itemRow}>
                <View style={styles.itemLeft}><Ionicons name="transgender" size={18} color="#4F6AF3" /></View>
                <View style={styles.itemBody}>
                  <Text style={styles.itemLabel}>Gender</Text>
                  {editingGender ? (
                    <View>
                      <View style={{ flexDirection: 'row' }}>
                        <TouchableOpacity style={[styles.editIconButton, tempGender === 'male' ? { backgroundColor: '#4F6AF3' } : {}, { marginRight: 8 }]} onPress={() => setTempGender('male')}>
                          <Text style={{ color: tempGender === 'male' ? '#fff' : '#4F6AF3', fontWeight: '700' }}>M</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.editIconButton, tempGender === 'female' ? { backgroundColor: '#4F6AF3' } : {}]} onPress={() => setTempGender('female')}>
                          <Text style={{ color: tempGender === 'female' ? '#fff' : '#4F6AF3', fontWeight: '700' }}>F</Text>
                        </TouchableOpacity>
                        {/* 'Other' option removed because cards do not support it */}
                      </View>
                      <View style={{ flexDirection: 'row', marginTop: 8 }}>
                        <TouchableOpacity style={[styles.actionButton, styles.cancelButton, { marginRight: 8 }]} onPress={() => { setTempGender(gender); setEditingGender(false); }}>
                          <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionButton, styles.saveButton]} onPress={async () => {
                          try {
                            await updateAllUserCards({ gender: tempGender });
                            setGender(tempGender);
                            setEditingGender(false);
                            Alert.alert('Success', 'Gender updated');
                          } catch (err) {
                            Alert.alert('Error', 'Failed to update gender');
                          }
                        }} disabled={updating}>
                          {updating ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveButtonText}>Save</Text>}
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.itemValue}>{gender ? String(gender).toUpperCase() : 'Not set'}</Text>
                  )}
                </View>
                <View style={styles.itemRight}>
                  {!editingGender && (
                    <TouchableOpacity onPress={() => { setTempGender(gender); setEditingGender(true); }}>
                      <Ionicons name="pencil" size={18} color="#4F6AF3" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={styles.divider} />

              {/* Birthday (editable) */}
              <View style={styles.itemRow}>
                <View style={styles.itemLeft}><Ionicons name="calendar" size={18} color="#4F6AF3" /></View>
                <View style={styles.itemBody}>
                  <Text style={styles.itemLabel}>Birthday</Text>
                  {editingBirth ? (
                    <View>
                      <TextInput
                        style={[styles.textInput, styles.textInputInside]}
                        placeholder="DD-MM-YYYY"
                        value={tempBirthText}
                        onChangeText={(t) => setTempBirthText(formatDigitsToDisplay(t))}
                        keyboardType="number-pad"
                        maxLength={10}
                      />
                      <View style={{ flexDirection: 'row' }}>
                        <TouchableOpacity style={[styles.actionButton, styles.cancelButton, { marginRight: 8 }]} onPress={() => { setTempBirthText(formatIsoToDisplay(birthdate)); setEditingBirth(false); }}>
                          <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionButton, styles.saveButton]} onPress={async () => {
                          const iso = parseDisplayToIso(tempBirthText);
                          if (tempBirthText && !iso) { Alert.alert('Error', 'Enter valid date as DD-MM-YYYY'); return; }
                          try {
                            await updateAllUserCards({ birthdate: iso });
                            setBirthdate(iso);
                            setEditingBirth(false);
                            Alert.alert('Success', 'Birthdate updated');
                          } catch (err) {
                            Alert.alert('Error', 'Failed to update birthdate');
                          }
                        }} disabled={updating}>
                          {updating ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveButtonText}>Save</Text>}
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.itemValue}>{birthdate ? formatIsoToDisplay(birthdate) : 'Not set'}</Text>
                  )}
                </View>
                <View style={styles.itemRight}>
                  {!editingBirth && (
                    <TouchableOpacity onPress={() => { setTempBirthText(formatIsoToDisplay(birthdate)); setEditingBirth(true); }}>
                      <Ionicons name="pencil" size={18} color="#4F6AF3" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={styles.divider} />

              {/* Anniversary (editable) */}
              <View style={styles.itemRow}>
                <View style={styles.itemLeft}><Ionicons name="heart" size={18} color="#4F6AF3" /></View>
                <View style={styles.itemBody}>
                  <Text style={styles.itemLabel}>Anniversary</Text>
                  {editingAnniv ? (
                    <View>
                      <TextInput
                        style={[styles.textInput, styles.textInputInside]}
                        placeholder="DD-MM-YYYY"
                        value={tempAnnivText}
                        onChangeText={(t) => setTempAnnivText(formatDigitsToDisplay(t))}
                        keyboardType="number-pad"
                        maxLength={10}
                      />
                      <View style={{ flexDirection: 'row' }}>
                        <TouchableOpacity style={[styles.actionButton, styles.cancelButton, { marginRight: 8 }]} onPress={() => { setTempAnnivText(formatIsoToDisplay(anniversary)); setEditingAnniv(false); }}>
                          <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionButton, styles.saveButton]} onPress={async () => {
                          const iso = parseDisplayToIso(tempAnnivText);
                          if (tempAnnivText && !iso) { Alert.alert('Error', 'Enter valid date as DD-MM-YYYY'); return; }
                          try {
                            await updateAllUserCards({ anniversary: iso });
                            setAnniversary(iso);
                            setEditingAnniv(false);
                            Alert.alert('Success', 'Anniversary updated');
                          } catch (err) {
                            Alert.alert('Error', 'Failed to update anniversary');
                          }
                        }} disabled={updating}>
                          {updating ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveButtonText}>Save</Text>}
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.itemValue}>{anniversary ? formatIsoToDisplay(anniversary) : 'Not set'}</Text>
                  )}
                </View>
                <View style={styles.itemRight}>
                  {!editingAnniv && (
                    <TouchableOpacity onPress={() => { setTempAnnivText(formatIsoToDisplay(anniversary)); setEditingAnniv(true); }}>
                      <Ionicons name="pencil" size={18} color="#4F6AF3" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  scrollView: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' },
  loadingText: { color: '#666', fontSize: 16, marginTop: 16, fontWeight: '500' },
  headerGradient: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 30, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { color: COLORS.white, fontSize: 22, fontWeight: '800', letterSpacing: 0.5 },
  profileCard: { marginTop: -20, marginHorizontal: 12, backgroundColor: COLORS.white, borderRadius: 18, paddingBottom: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6 },
  profileInfo: { paddingHorizontal: 10, marginTop: 6 },
  listCard: { backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 6, paddingHorizontal: 6, marginTop: 8, borderWidth: 1, borderColor: '#E8ECEF' },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 6 },
  editIconButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  itemLeft: { width: 36, alignItems: 'center', justifyContent: 'center' },
  itemBody: { flex: 1, marginLeft: 8 },
  itemLabel: { color: '#6B7280', fontSize: 12, fontWeight: '700' },
  itemValue: { color: '#111827', fontSize: 15, fontWeight: '700', marginTop: 2 },
  itemRight: { width: 34, alignItems: 'flex-end', justifyContent: 'center' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 6 },
  textInput: { backgroundColor: COLORS.white, color: '#1A1A1A', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, fontSize: 14, fontWeight: '500', marginBottom: 6, borderWidth: 2, borderColor: '#4F6AF3' },
  textInputInside: { backgroundColor: 'transparent', paddingHorizontal: 0, paddingVertical: 8, borderWidth: 0, color: '#1A1A1A' },
  actionButton: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cancelButton: { backgroundColor: '#E8ECEF' },
  cancelButtonText: { color: '#666', fontWeight: '700', fontSize: 13 },
  saveButton: { backgroundColor: '#4F6AF3', shadowColor: '#4F6AF3', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  saveButtonText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
});
