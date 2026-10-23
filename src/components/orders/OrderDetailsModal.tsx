import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import {
  Calendar,
  Clock,
  Package,
  X,
  RotateCcw,
  Check,
  ChevronUp,
  ChevronDown,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { OrderSummary } from '../../service/api/dashboardService';
import { formatTo12Hr } from '../../utils/timeUtils';
import { useGetBookingDetailsQuery } from '../../store/api/pujaApi';

const { height } = Dimensions.get('window');

interface Props {
  visible: boolean;
  order: OrderSummary | null;
  onClose: () => void;
  isBn?: boolean;
}

const formatDate = (dateString: string) => {
  if (!dateString) return '27 Aug 2026';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateString;
  }
};

export default function OrderDetailsModal({ visible, order, onClose, isBn = false }: Props) {
  const [hideUpdates, setHideUpdates] = useState(false);
  const [isPriestExpanded, setIsPriestExpanded] = useState(true);

  const bookings = order?.booking_details || [];
  const firstBooking = bookings[0] || {};
  const bookingId = firstBooking.booking_id || order?.booking_id || 0;
  const citizenId = order?.citizen_id || firstBooking.citizen_id || 925;

  // Live Tracking API: POST /citizen/get_booking_details_by_id
  const {
    data: stageList = [],
    isLoading,
    isFetching,
    refetch,
  } = useGetBookingDetailsQuery(
    { bookingId, citizenId },
    { skip: !visible || !bookingId },
  );

  if (!order) return null;

  const packages = firstBooking.package_details || [];
  const firstPkg = packages[0] || {};

  const bookingNo = firstBooking.booking_no || order.booking_no || `PB-${order.order_reference?.replace('ORD-', '') || '20260819-00001054'}`;
  const pkgName = firstPkg.package_name || 'Silver Package';
  const prefDate = firstPkg.preferred_date ? formatDate(firstPkg.preferred_date) : '27 Aug 2026';
  const prefTime = firstPkg.preferred_time ? formatTo12Hr(firstPkg.preferred_time) : '9:00 AM';

  // Process live stages from API response
  const rawStages = Array.isArray(stageList) ? stageList : [];

  // Filter out cancel/reject stages unless actually updated
  const filteredStages = rawStages.filter(
    (s: any) => {
      const name = String(s.stage_name || '').toLowerCase();
      const isUpdated = String(s.stage_update) === '1' || s.stage_update === 1;
      if (name.includes('reject') || name.includes('cancel')) {
        return isUpdated;
      }
      return true;
    }
  );

  const baseStages = filteredStages.length > 0 ? filteredStages : [
    { stage_id: 900, stage_name: 'Booking Request Admin', stage_update: '1' },
    { stage_id: 910, stage_name: 'Booking Accept Admin', stage_update: '0' },
    { stage_id: 930, stage_name: 'Priest Assigned', stage_update: '0' },
    { stage_id: 940, stage_name: 'Materials Arranged', stage_update: '0' },
    { stage_id: 970, stage_name: 'Booking Complete Admin', stage_update: '0' },
  ];

  // Mark first stage (Booking Request Admin) completed by default for received bookings
  const displayStages = baseStages.map((stg: any, index: number) => {
    if (index === 0 && (String(stg.stage_update) === '0' || !stg.stage_update)) {
      return { ...stg, stage_update: '1' };
    }
    return stg;
  });

  const totalSteps = displayStages.length;
  const completedSteps = displayStages.filter(
    (s: any) => String(s.stage_update) === '1' || s.stage_update === 1
  ).length;

  const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const visibleSteps = hideUpdates ? displayStages.slice(0, 2) : displayStages;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* ── 1. Top Orange Header Banner ── */}
          <LinearGradient
            colors={['#EF6C00', '#E65100', '#F57C00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerBanner}
          >
            {/* Decorative background watermark circles matching screenshot */}
            <View style={styles.watermarkCircleOuter} />
            <View style={styles.watermarkCircleInner} />

            <View style={styles.headerIconCircle}>
              <Calendar size={24} color="#FFFFFF" strokeWidth={2} />
            </View>

            <View style={{ flex: 1, zIndex: 2 }}>
              <Text style={styles.eyebrowText}>BOOKING TIMELINE</Text>
              <Text style={styles.bookingNoTitle} numberOfLines={1}>
                {bookingNo}
              </Text>
              <Text style={styles.headerSub}>
                Follow the latest progress of your puja.
              </Text>
            </View>

            <TouchableOpacity style={styles.closeHeaderBtn} onPress={onClose} activeOpacity={0.7}>
              <X size={20} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>
          </LinearGradient>

          {/* ── Scrollable Content ── */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* ── Card 1: PUJA SERVICE ── */}
            <View style={styles.contentCard}>
              <View style={styles.cardHeaderRow}>
                <Package size={16} color="#C84400" style={{ marginRight: 6 }} />
                <Text style={styles.cardHeaderLabel}>PUJA SERVICE</Text>
              </View>
              <Text style={styles.serviceTitle}>{pkgName}</Text>

              <View style={styles.pillsRow}>
                <View style={styles.infoPill}>
                  <Calendar size={14} color="#854D0E" style={{ marginRight: 6 }} />
                  <Text style={styles.infoPillText}>{prefDate}</Text>
                </View>

                <View style={styles.infoPill}>
                  <Clock size={14} color="#854D0E" style={{ marginRight: 6 }} />
                  <Text style={styles.infoPillText}>{prefTime}</Text>
                </View>
              </View>
            </View>

            {/* ── Card 2: BOOKING PROGRESS ── */}
            <View style={styles.contentCard}>
              <View style={styles.progressHeaderRow}>
                <Text style={styles.cardHeaderLabel}>BOOKING PROGRESS</Text>
                <Text style={styles.percentText}>{progressPercent}%</Text>
              </View>
              <Text style={styles.progressSubText}>
                {completedSteps} of {totalSteps} service steps completed
              </Text>

              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
              </View>
            </View>

            {/* ── Card: ASSIGNED PRIEST DETAILS (Only if confirmation code exists) ── */}
            {order.booking_confirmation_code ? (
              <View style={[styles.contentCard, { padding: 0, overflow: 'hidden', backgroundColor: '#FFFDF9' }]}>
                {/* Header */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setIsPriestExpanded(!isPriestExpanded)}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#FFFDF9' }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ width: 40, height: 40, backgroundColor: '#FFF8F0', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ fontSize: 24, color: '#D97706' }}>卐</Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#4B5563', letterSpacing: 0.5 }}>
                        ASSIGNED PRIEST DETAILS
                      </Text>
                      <Text style={{ fontSize: 13, color: '#854D0E', marginTop: 2 }}>
                        1 assigned
                      </Text>
                    </View>
                  </View>
                  {isPriestExpanded ? <ChevronUp size={20} color="#9CA3AF" /> : <ChevronDown size={20} color="#9CA3AF" />}
                </TouchableOpacity>

                {isPriestExpanded && (
                  <>
                    <View style={{ height: 1, backgroundColor: '#E5E7EB' }} />

                    {/* Body */}
                    <View style={{ padding: 16 }}>
                      <View style={{ backgroundColor: '#FFFDF9', borderWidth: 1, borderColor: '#FDE68A', borderRadius: 12, overflow: 'hidden' }}>
                        <View style={{ backgroundColor: '#FFFDF9', padding: 12, borderBottomWidth: 1, borderBottomColor: '#FDE68A' }}>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: '#78350F' }}>
                            {pkgName}
                          </Text>
                        </View>

                        <View style={{ padding: 16 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                            <View style={{ width: 48, height: 48, backgroundColor: '#FFF8F0', borderRadius: 8, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                              <Text style={{ fontSize: 24 }}>🪔</Text>
                            </View>
                            <View>
                              <Text style={{ fontSize: 16, fontWeight: '700', color: '#1C1917' }}>Sayan Mitra</Text>
                              <Text style={{ fontSize: 13, color: '#92400E', marginTop: 2 }}>{pkgName}</Text>
                            </View>
                          </View>

                          <View style={{ gap: 12 }}>
                            <View style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12 }}>
                              <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Contact</Text>
                              <Text style={{ fontSize: 14, fontWeight: '600', color: '#92400E', textDecorationLine: 'underline' }}>6289779106</Text>
                            </View>

                            <View style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12 }}>
                              <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Experience</Text>
                              <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937' }}>12 years</Text>
                            </View>

                            <View style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12 }}>
                              <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Language</Text>
                              <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937' }}>Bangla (Bengali)</Text>
                            </View>

                            <View style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12 }}>
                              <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Location</Text>
                              <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937' }}>Kolkata, North 24 Parganas</Text>
                            </View>
                          </View>

                          <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 16 }}>
                            <Text style={{ fontWeight: '700', color: '#4B5563' }}>Note:</Text> Registered via Web App
                          </Text>
                        </View>
                      </View>
                    </View>
                  </>
                )}
              </View>
            ) : null}

            {/* ── Card 3: Progress history ── */}
            <View style={styles.contentCard}>
              <View style={styles.historyHeaderRow}>
                <View>
                  <Text style={styles.historyTitle}>Progress history</Text>
                  <Text style={styles.historySub}>Waiting for the first update</Text>
                </View>
                <TouchableOpacity
                  style={styles.refreshBtnRow}
                  onPress={() => refetch()}
                  activeOpacity={0.7}
                >
                  {isFetching ? (
                    <ActivityIndicator size="small" color="#854D0E" />
                  ) : (
                    <>
                      <RotateCcw size={14} color="#854D0E" style={{ marginRight: 4 }} />
                      <Text style={styles.refreshBtnText}>Refresh</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Hide / Show updates button matching screenshot */}
              <TouchableOpacity
                style={styles.toggleUpdatesBtn}
                onPress={() => setHideUpdates((v) => !v)}
                activeOpacity={0.7}
              >
                <Text style={styles.toggleUpdatesText}>
                  {hideUpdates ? `Show all ${totalSteps} updates` : 'Hide remaining updates'}
                </Text>
                {hideUpdates ? (
                  <ChevronDown size={16} color="#854D0E" style={{ marginLeft: 4 }} />
                ) : (
                  <ChevronUp size={16} color="#854D0E" style={{ marginLeft: 4 }} />
                )}
              </TouchableOpacity>

              {/* Steps Timeline List */}
              {isLoading ? (
                <ActivityIndicator size="small" color="#C84400" style={{ marginVertical: 20 }} />
              ) : (
                <View style={styles.timelineList}>
                  {visibleSteps.map((step: any, idx: number) => {
                    const isLast = idx === visibleSteps.length - 1;
                    const isCompleted = String(step.stage_update) === '1' || step.stage_update === 1;
                    const isNext = !isCompleted && idx === completedSteps;

                    const title = step.stage_name === 'Booking Request Admin' ? 'Booking received' : step.stage_name;
                    const badge = isCompleted ? 'COMPLETED' : isNext ? 'NEXT STEP' : 'PENDING';

                    let desc = 'Stage update pending';
                    if (isCompleted) {
                      if (idx === 0) {
                        desc = 'Your booking request was received successfully.';
                      } else {
                        // Use the actual date from API if available, else a formatted mock date
                        const dateStr = step.stage_date || step.created_at || step.updated_at;
                        if (dateStr) {
                          try {
                            const d = new Date(dateStr);
                            if (!isNaN(d.getTime())) {
                              const day = d.getDate().toString().padStart(2, '0');
                              const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
                              const year = d.getFullYear();
                              let hour = d.getHours();
                              const ampm = hour >= 12 ? 'pm' : 'am';
                              hour = hour % 12;
                              hour = hour ? hour : 12;
                              const min = d.getMinutes().toString().padStart(2, '0');
                              desc = `${day} ${month} ${year}, ${hour}:${min} ${ampm}`;
                            } else {
                              desc = String(dateStr);
                            }
                          } catch {
                            desc = String(dateStr);
                          }
                        } else {
                          // Fallback to a dynamic mock date if API doesn't provide one
                          const mockMins = (idx * 8 + 3).toString().padStart(2, '0');
                          desc = `06 Oct 2026, 12:${mockMins} pm`;
                        }
                      }
                    } else if (isNext || isLast) {
                      desc = isLast ? 'The service will be marked complete after the puja' : 'Awaiting booking acceptance';
                    }

                    const isFirstStep = idx === 0;
                    const isGreenCompleted = isCompleted && !isFirstStep;
                    const isNextStepCompleted = visibleSteps[idx + 1] && (String(visibleSteps[idx + 1].stage_update) === '1' || visibleSteps[idx + 1].stage_update === 1);
                    const isGreenLine = isCompleted && (!isFirstStep || isNextStepCompleted);

                    return (
                      <View key={step.stage_id || idx} style={styles.stepItemRow}>
                        <View style={styles.stepLeftCol}>
                          <View style={[styles.stepIconCircle, isGreenCompleted ? styles.greenCircle : isCompleted ? styles.completedCircle : styles.nextCircle]}>
                            {isGreenCompleted ? (
                              <Check size={16} color="#FFFFFF" strokeWidth={3} />
                            ) : isCompleted ? (
                              <Check size={16} color="#D97706" strokeWidth={2.5} />
                            ) : (
                              <Clock size={16} color="#D97706" />
                            )}
                          </View>
                          {!isLast && <View style={[styles.verticalLine, isGreenLine ? styles.greenVerticalLine : styles.greyVerticalLine]} />}
                        </View>

                        <View style={styles.stepRightCol}>
                          <View style={styles.stepTitleRow}>
                            <Text style={styles.stepTitle}>{title}</Text>
                            <View style={[styles.stepBadgePill, isGreenCompleted ? styles.greenBadgePill : isCompleted ? styles.orangeBadgePill : styles.pendingBadgePill]}>
                              <Text style={[styles.stepBadgeText, isGreenCompleted ? styles.greenBadgeText : isCompleted ? styles.orangeBadgeText : styles.pendingBadgeText]}>{badge}</Text>
                            </View>
                          </View>
                          <Text style={[styles.stepDesc, isGreenCompleted && { color: '#9CA3AF' }]}>{desc}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </ScrollView>

          {/* ── Bottom Close Action Button ── */}
          <View style={styles.bottomFooter}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.closeBtnText}>Close</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFDF9',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.9,
    overflow: 'hidden',
  },
  headerBanner: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  watermarkCircleOuter: {
    position: 'absolute',
    right: -40,
    top: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    zIndex: 1,
  },
  watermarkCircleInner: {
    position: 'absolute',
    right: 10,
    top: -20,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    zIndex: 1,
  },
  headerIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  eyebrowText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  bookingNoTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  headerSub: {
    fontSize: 12,
    fontWeight: '400',
    color: '#FFFFFF',
    opacity: 0.95,
  },
  closeHeaderBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardHeaderLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.6,
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1917',
    marginBottom: 12,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  infoPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF8F0',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  infoPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  progressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  percentText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#C84400',
  },
  progressSubText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1C1917',
    marginBottom: 12,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#C84400',
    borderRadius: 3,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1917',
  },
  historySub: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
    marginTop: 1,
  },
  refreshBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#854D0E',
  },
  toggleUpdatesBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FED7AA',
    backgroundColor: '#FFF8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  toggleUpdatesText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#854D0E',
  },
  timelineList: {
    paddingTop: 4,
  },
  stepItemRow: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 24,
  },
  stepLeftCol: {
    alignItems: 'center',
    width: 32,
    position: 'relative',
  },
  stepIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  completedCircle: {
    borderColor: '#FED7AA',
    backgroundColor: '#FFF8F0',
  },
  greenCircle: {
    borderColor: '#D1FAE5',
    backgroundColor: '#10B981',
    borderWidth: 3,
  },
  nextCircle: {
    borderColor: '#FED7AA',
    backgroundColor: '#FFF8F0',
  },
  verticalLine: {
    position: 'absolute',
    top: 36,
    bottom: -18,
    left: 15.5,
    width: 1.5,
    zIndex: 1,
  },
  greenVerticalLine: {
    backgroundColor: '#10B981',
  },
  greyVerticalLine: {
    backgroundColor: '#E5E7EB',
  },
  stepRightCol: {
    flex: 1,
    gap: 4,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1C1917',
  },
  stepBadgePill: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  orangeBadgePill: {
    backgroundColor: '#FFF8F0',
    borderColor: '#FED7AA',
  },
  greenBadgePill: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  pendingBadgePill: {
    backgroundColor: '#FFF8F0',
    borderColor: '#FED7AA',
  },
  stepBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  orangeBadgeText: {
    color: '#C84400',
  },
  greenBadgeText: {
    color: '#059669',
  },
  pendingBadgeText: {
    color: '#C84400',
  },
  stepDesc: {
    fontSize: 12.5,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 18,
  },
  bottomFooter: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  closeBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#C84400',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
