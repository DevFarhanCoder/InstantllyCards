import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';

type Item = { label: string; value: string };

export default function RNPickerSelectShim({
  value,
  onValueChange,
  items = [],
  placeholder = { label: 'Select', value: '' },
}: any) {
  const [open, setOpen] = useState(false);

  const selected = items.find((i: Item) => String(i.value) === String(value));

  return (
    <>
      <TouchableOpacity style={styles.button} onPress={() => setOpen(true)}>
        <Text style={styles.buttonText}>{selected ? selected.label : placeholder.label}</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <FlatList
              data={items}
              keyExtractor={(it: any) => String(it.value)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.item}
                  onPress={() => {
                    try { onValueChange(item.value); } catch (e) {}
                    setOpen(false);
                  }}
                >
                  <Text style={styles.itemText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.closeBtn} onPress={() => setOpen(false)}>
              <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: '#E5E7EB', minWidth: 120 },
  buttonText: { color: '#111827' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', maxHeight: '60%', borderTopLeftRadius: 12, borderTopRightRadius: 12, padding: 12 },
  item: { paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  itemText: { color: '#111827' },
  closeBtn: { padding: 12, alignItems: 'center' },
  closeText: { color: '#3B82F6', fontWeight: '700' },
});
