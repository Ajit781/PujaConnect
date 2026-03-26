import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../../constants/Colors';

interface Option {
  id: string | number;
  name: string;
}

interface Props {
  label?: string;
  placeholder?: string;
  options: Option[];
  value: string | number | null;
  onSelect: (value: any) => void;
  isLoading?: boolean;
  error?: string;
  required?: boolean;
}

const OptionItem = React.memo(({ item, value, onSelect }: any) => (
  <TouchableOpacity
    style={[styles.optionItem, item.id === value && styles.optionItemSelected]}
    onPress={() => onSelect(item.id)}
  >
    <Text
      style={[
        styles.optionText,
        item.id === value && styles.optionTextSelected,
      ]}
    >
      {item.name}
    </Text>
    {item.id === value && <Text style={styles.check}>✓</Text>}
  </TouchableOpacity>
));

export default function Dropdown({
  label,
  placeholder = 'Select an option',
  options,
  value,
  onSelect,
  isLoading = false,
  error,
  required = false,
}: Props) {
  const [visible, setVisible] = useState(false);

  const selectedOption = options.find(opt => opt.id === value);

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
      )}

      <TouchableOpacity
        style={[styles.dropdown, error ? styles.dropdownError : null]}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Text
          style={[styles.valueText, !selectedOption && styles.placeholderText]}
        >
          {selectedOption ? selectedOption.name : placeholder}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      {error ? <Text style={styles.errorText}>⚠ {error}</Text> : null}

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{placeholder}</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading options...</Text>
              </View>
            ) : options.length === 0 ? (
              <View style={styles.centerBox}>
                <Text style={styles.noDataText}>No records found</Text>
              </View>
            ) : (
              <FlatList
                data={options}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => (
                  <OptionItem
                    item={item}
                    value={value}
                    onSelect={(id: any) => {
                      onSelect(id);
                      setVisible(false);
                    }}
                  />
                )}
                contentContainerStyle={styles.listContent}
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Removed marginVertical to allow external layout control (e.g. within fieldWrap)
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  required: {
    color: Colors.dangerRed,
  },
  dropdown: {
    height: 48,
    backgroundColor: Colors.ultraLightGray,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  dropdownError: {
    borderColor: Colors.dangerRed,
  },
  valueText: {
    fontSize: 14,
    color: Colors.textMain,
  },
  placeholderText: {
    color: Colors.textMuted,
  },
  arrow: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  errorText: {
    color: Colors.dangerRed,
    fontSize: 11,
    marginTop: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxHeight: '60%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    backgroundColor: Colors.lightOrange,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textMain,
  },
  closeBtn: {
    fontSize: 20,
    color: Colors.textMuted,
  },
  listContent: {
    paddingVertical: 8,
  },
  optionItem: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.ultraLightGray,
  },
  optionItemSelected: {
    backgroundColor: Colors.lightOrange,
  },
  optionText: {
    fontSize: 15,
    color: Colors.textMain,
  },
  optionTextSelected: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  check: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  centerBox: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textMuted,
  },
  noDataText: {
    fontSize: 15,
    color: Colors.textMuted,
  },
});
