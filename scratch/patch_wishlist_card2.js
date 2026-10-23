const fs = require('fs');
const path = require('path');

const filePath = path.join('src/screens/puja/WishlistScreen.tsx');
let txt = fs.readFileSync(filePath, 'utf8');

if (!txt.includes("  Eye,")) {
  txt = txt.replace(/Star,/, "Star,\n  Eye,");
}

const renderReplacement = `const renderWishlistItem = useCallback(
    ({ item: puja }: any) => {
      const pId = puja.puja_id || puja.puja_type_id;
      const pName = puja.puja_name || puja.puja_type_name;
      const isFav = pId ? favorites.includes(pId.toString()) : true;
      const pMinPrice = puja.minimum_price || puja.puja_with_samagri_amount || 0;
      const pMaxPrice = puja.maximum_price || puja.puja_without_samagri_amount || 0;
      const pPriceStr = pMinPrice === pMaxPrice
        ? \`₹\${pMinPrice.toLocaleString('en-IN')}\`
        : \`₹\${pMinPrice.toLocaleString('en-IN')}\`;
      let rawDuration = puja.duration || puja.puja_duration || '2';
      let pDuration = String(rawDuration).includes('hr') ? rawDuration : \`\${rawDuration} hr\`;

      return (
        <View style={styles.pujaCardRow}>
          {/* Left Side: Square Image area */}
          <View style={styles.cardImgLeftBox}>
            {puja.icon ? (
              <Image source={{ uri: puja.icon }} style={styles.pujaIconImage} resizeMode="cover" />
            ) : (
              <ImagePlaceholder />
            )}
          </View>

          {/* Right Side: content details */}
          <View style={styles.cardBodyRight}>
            {/* Title and Heart Icon row */}
            <View style={styles.titleHeartRow}>
              <Text style={styles.cardTitleDash} numberOfLines={1}>{pName}</Text>
              <TouchableOpacity
                style={styles.heartBtnOutline}
                onPress={async () => {
                  const state = await NetInfo.fetch();
                  if (state.isConnected) {
                    pId && handleToggleFavorite(pId.toString());
                  } else {
                    showToast({ message: t('common.connectionRequired'), type: 'error' });
                  }
                }}
              >
                <Heart
                  size={16}
                  color={isFav ? Colors.red : '#9CA3AF'}
                  fill={isFav ? Colors.red : 'transparent'}
                />
              </TouchableOpacity>
            </View>

            {/* Duration, Rating and Compare row */}
            <View style={styles.detailsRow}>
              <View style={styles.durationRatingBox}>
                <Clock size={12} color="#6B5E59" style={{ marginRight: 3 }} />
                <Text style={styles.durationText}>{pDuration}</Text>
              </View>
            </View>

            {/* Bottom Row: Packages from Price and View packages Orange Button with Eye Icon */}
            <View style={styles.cardFooterRow}>
              <View>
                <Text style={styles.packagesFromLabel}>{isBn ? 'প্যাকেজ শুরু' : 'Packages from'}</Text>
                <Text style={styles.priceValueText}>{pPriceStr}</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.bookBtnContainer,
                  puja.puja_active_status === 0 && styles.bookBtnDisabled,
                ]}
                disabled={puja.puja_active_status === 0 || openingPujaId === puja.puja_id}
                onPress={async () => {
                  setOpeningPujaId(puja.puja_id);
                  setSelectedPujaForPackages(puja);
                  // Save recently viewed via API
                  if (user?.user_id || user?.auth_id) {
                    savePujaTag({
                      userId: user.user_id || user.auth_id,
                      pujaId: puja.puja_id,
                      tagId: 5,
                      action: 1,
                      skipGlobalLoader: true
                    });
                  }
                  try {
                    await fetchPackages(puja.puja_id.toString()).unwrap();
                  } catch (error) {
                    console.error('Failed to fetch packages:', error);
                  } finally {
                    setOpeningPujaId(null);
                    setShowPackagesModal(true);
                  }
                }}
              >
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 8, overflow: 'hidden' }}>
                  <Svg height="100%" width="100%">
                    <Defs>
                      <LinearGradient id="btnGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor={puja.puja_active_status === 0 ? '#E5E7EB' : '#FF9933'} />
                        <Stop offset="100%" stopColor={puja.puja_active_status === 0 ? '#D1D5DB' : '#E07800'} />
                      </LinearGradient>
                    </Defs>
                    <Rect x="0" y="0" width="100%" height="100%" fill="url(#btnGrad)" />
                  </Svg>
                </View>
                <View style={styles.bookBtn}>
                  {openingPujaId === puja.puja_id && (
                    <View style={[StyleSheet.absoluteFillObject, { justifyContent: 'center', alignItems: 'center', zIndex: 2 }]}>
                      <ActivityIndicator size="small" color="#FFF" />
                    </View>
                  )}
                  <View style={{ flexDirection: 'row', alignItems: 'center', opacity: openingPujaId === puja.puja_id ? 0 : 1 }}>
                    <Eye size={12} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={[
                      styles.bookBtnText,
                      puja.puja_active_status === 0 && styles.bookBtnTextDisabled,
                    ]}>
                      {puja.puja_active_status === 0
                        ? isBn ? 'অনুপলব্ধ' : 'Not Available'
                        : isBn ? 'প্যাকেজ দেখুন' : 'View packages'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    },
    [favorites, handleToggleFavorite, isBn, navigation, showToast, t, fetchPackages, openingPujaId, savePujaTag, user],
  );`;

const oldStart = txt.indexOf('const renderWishlistItem = useCallback(');
const oldEnd = txt.indexOf('const renderHeader = () =>', oldStart);

txt = txt.substring(0, oldStart) + renderReplacement + '\\n\\n  ' + txt.substring(oldEnd);


const stylesToInject = `
  pujaCardRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FDBA74',
    padding: 14,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    marginHorizontal: 16,
  },
  cardImgLeftBox: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
  },
  pujaIconImage: {
    width: '100%',
    height: '100%',
  },
  cardBodyRight: {
    flex: 1,
  },
  titleHeartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitleDash: {
    fontSize: 14,
    fontWeight: '800',
    color: '#291811',
    flex: 1,
    marginRight: 6,
  },
  heartBtnOutline: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 4,
    paddingBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F3F4F6',
  },
  durationRatingBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationText: {
    fontSize: 10,
    color: '#6B5E59',
    fontWeight: '600',
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  packagesFromLabel: {
    fontSize: 8,
    color: '#6B5E59',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  priceValueText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#291811',
    marginTop: 1,
  },
  bookBtnContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  bookBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  bookBtnDisabled: {
    backgroundColor: Colors.disabled,
  },
  bookBtnText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  bookBtnTextDisabled: {
    color: Colors.gray,
  },
`;

if (!txt.includes('pujaCardRow: {')) {
  txt = txt.replace(/body: \{ flex: 1 \},/, 'body: { flex: 1 },' + stylesToInject);
}

fs.writeFileSync(filePath, txt, 'utf8');
console.log('Patched');
