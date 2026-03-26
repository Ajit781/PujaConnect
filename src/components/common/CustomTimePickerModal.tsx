import { Colors } from '../../constants/Colors';
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  PanResponder,
} from 'react-native';

const { width } = Dimensions.get('window');
const CLOCK_SIZE = width * 0.7;
const CENTER = CLOCK_SIZE / 2;
const RADIUS = CLOCK_SIZE * 0.4;

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (time: string) => void;
  initialTime?: string;
}

export default function CustomTimePickerModal({
  visible,
  onClose,
  onSelect,
  initialTime = '12:00 PM',
}: Props) {
  // Parse initial time
  const [hour, setHour] = useState(initialTime.split(':')[0] || '12');
  const [minute, setMinute] = useState(
    initialTime.split(':')[1]?.split(' ')[0] || '00',
  );
  const [period, setPeriod] = useState(
    initialTime.includes('AM') ? 'AM' : 'PM',
  );
  const [viewMode, setViewMode] = useState<'hour' | 'minute'>('hour');

  const hours = useMemo(
    () => ['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'],
    [],
  );
  const minutesArr = useMemo(
    () => [
      '00',
      '05',
      '10',
      '15',
      '20',
      '25',
      '30',
      '35',
      '40',
      '45',
      '50',
      '55',
    ],
    [],
  );

  const handleConfirm = () => {
    onSelect(`${hour}:${minute} ${period}`);
    onClose();
  };

  const calculateSelection = useCallback(
    (locationX: number, locationY: number) => {
      const dx = locationX - CENTER;
      const dy = locationY - CENTER;
      let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      if (angle < 0) angle += 360;

      // Each item is 30 degrees apart
      const index = Math.round(angle / 30) % 12;
      if (viewMode === 'hour') {
        setHour(hours[index]);
      } else {
        setMinute(minutesArr[index]);
      }
    },
    [viewMode, hours, minutesArr],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: evt => {
          calculateSelection(
            evt.nativeEvent.locationX,
            evt.nativeEvent.locationY,
          );
        },
        onPanResponderMove: evt => {
          calculateSelection(
            evt.nativeEvent.locationX,
            evt.nativeEvent.locationY,
          );
        },
        onPanResponderRelease: (_evt, _gestureState) => {
          // If we were selecting hour, auto-switch to minute after a brief drag or tap
          if (viewMode === 'hour') {
            setViewMode('minute');
          }
        },
      }),
    [viewMode, calculateSelection],
  );

  const renderClockFace = () => {
    const items = viewMode === 'hour' ? hours : minutesArr;
    const currentVal = viewMode === 'hour' ? hour : minute;

    return (
      <View style={styles.clockContainer}>
        <View style={styles.clockCircle} {...panResponder.panHandlers}>
          {items.map((val, index) => {
            const angle = (index * 30 - 90) * (Math.PI / 180);
            const x = CENTER + RADIUS * Math.cos(angle) - 20;
            const y = CENTER + RADIUS * Math.sin(angle) - 20;

            const isSelected =
              (viewMode === 'hour' && val === hour) ||
              (viewMode === 'minute' && val === minute);

            return (
              <View
                key={val}
                style={[
                  styles.clockNumberWrap,
                  { left: x, top: y },
                  isSelected && styles.selectedNumberWrap,
                ]}
                pointerEvents="none"
              >
                <Text
                  style={[
                    styles.clockNumberText,
                    isSelected && styles.selectedNumberText,
                  ]}
                >
                  {val}
                </Text>
              </View>
            );
          })}

          {/* Clock Hand */}
          <View
            pointerEvents="none"
            style={[
              styles.clockHandContainer,
              {
                transform: [{ rotate: `${items.indexOf(currentVal) * 30}deg` }],
              },
            ]}
          >
            <View style={styles.clockHandVisible} />
            <View style={styles.clockHandCircle} />
          </View>

          <View style={styles.clockCenterPoint} />
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header Section */}
          <View style={styles.header}>
            <Text style={styles.headerLabel}>SELECT TIME</Text>
            <View style={styles.timeDisplayRow}>
              <View style={styles.timeBox}>
                <TouchableOpacity
                  onPress={() => setViewMode('hour')}
                  style={[
                    styles.timePart,
                    viewMode === 'hour' && styles.activeTimePart,
                  ]}
                >
                  <Text style={styles.timePartText}>{hour}</Text>
                </TouchableOpacity>
                <Text style={styles.separator}>:</Text>
                <TouchableOpacity
                  onPress={() => setViewMode('minute')}
                  style={[
                    styles.timePart,
                    viewMode === 'minute' && styles.activeTimePart,
                  ]}
                >
                  <Text style={styles.timePartText}>{minute}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.periodColumn}>
                <TouchableOpacity
                  onPress={() => setPeriod('AM')}
                  style={[
                    styles.periodBtn,
                    period === 'AM' && styles.activePeriodBtn,
                  ]}
                >
                  <Text
                    style={[
                      styles.periodText,
                      period === 'AM' && styles.activePeriodText,
                    ]}
                  >
                    AM
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setPeriod('PM')}
                  style={[
                    styles.periodBtn,
                    period === 'PM' && styles.activePeriodBtn,
                  ]}
                >
                  <Text
                    style={[
                      styles.periodText,
                      period === 'PM' && styles.activePeriodText,
                    ]}
                  >
                    PM
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Clock Face Section */}
          <View style={styles.body}>
            <Text style={styles.viewModeTitle}>
              {viewMode === 'hour' ? 'Select Hour' : 'Select Minutes'}
            </Text>
            {renderClockFace()}
          </View>

          {/* Footer Section */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.footerBtn}>
              <Text style={styles.footerBtnTextCancel}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConfirm}
              style={styles.footerBtnOk}
            >
              <Text style={styles.footerBtnTextOk}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    width: width * 0.85,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: Colors.black,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  headerLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 16,
  },
  timeDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timePart: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  activeTimePart: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  timePartText: {
    color: Colors.white,
    fontSize: 48,
    fontWeight: '600',
  },
  separator: {
    color: Colors.white,
    fontSize: 40,
    marginHorizontal: 8,
    opacity: 0.8,
  },
  periodColumn: {
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  periodBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  activePeriodBtn: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  periodText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '800',
  },
  activePeriodText: {
    color: Colors.white,
  },
  body: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  viewModeTitle: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '700',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  clockContainer: {
    width: CLOCK_SIZE,
    height: CLOCK_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clockCircle: {
    width: CLOCK_SIZE,
    height: CLOCK_SIZE,
    borderRadius: CLOCK_SIZE / 2,
    backgroundColor: Colors.border,
    position: 'relative',
  },
  clockNumberWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  selectedNumberWrap: {
    backgroundColor: Colors.primary,
    zIndex: 2,
  },
  clockNumberText: {
    fontSize: 14,
    color: Colors.textMain,
    fontWeight: '600',
  },
  selectedNumberText: {
    color: Colors.white,
    fontWeight: '800',
  },
  clockCenterPoint: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    position: 'absolute',
    left: CENTER - 5,
    top: CENTER - 5,
    zIndex: 4,
  },
  clockHandContainer: {
    width: 2,
    height: RADIUS * 2,
    position: 'absolute',
    left: CENTER - 1,
    top: CENTER - RADIUS,
    zIndex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  clockHandVisible: {
    width: 2,
    height: RADIUS,
    backgroundColor: Colors.primary,
  },
  clockHandCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    position: 'absolute',
    top: -20,
    left: -19,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    gap: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  footerBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  footerBtnOk: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  footerBtnTextCancel: {
    color: Colors.textMuted,
    fontWeight: '700',
    fontSize: 15,
  },
  footerBtnTextOk: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 15,
  },
});
