import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Loader2,
  MapPin,
  Navigation,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import AccessibleDialog from "@/components/common/AccessibleDialog";
import { SearchableSelect } from "@/components/SearchableDropdown";
import { callApi, getUserContact, getUserId } from "@/config/apiV1";
import { useLanguageNavigate } from "@/hooks/useLanguageNavigate";
import { StatePayload } from "@/services/CommonApi/PayloadConst";
import "@/styles/AddressBook.css";

interface AddressType {
  address_type_id: number;
  address_type: string;
}

interface StateOption {
  state_id: number;
  state_name: string;
}

interface RelativeOption {
  relative_auth_id: number;
  relative_full_name: string;
  relative_contact_no: string;
}

interface EditingAddress {
  id: number;
  name: string;
  contact_no: string;
  label: string;
  address: string;
  street: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  is_default: 0 | 1;
  latitude: number;
  longitude: number;
  relation_type: string;
  relation_type_id: number;
  address_type_id: number;
  state_id: number;
  state_name: string;
  delivery_contact_no: string;
  delivery_instruction: string;
}

interface NavState {
  address?: EditingAddress;
  hasExistingAddresses?: boolean;
  whoFor?: "self" | "relative";
  selectedRelative?: RelativeOption | null;
  ownPhoneNumber?: string;
  ownName?: string;
  ownerAuthId?: number;
  isRelative?: boolean;
  returnTo?: {
    activeTab: 1 | 2;
    selectedRelativeAuthId: number | null;
  } | null;
  returnPath?: string;
}

interface FormState {
  address_type_id: number;
  label: string;
  address: string;
  street: string;
  landmark: string;
  city: string;
  state_id: number;
  state_name: string;
  pincode: string;
  is_default: 0 | 1;
  latitude: number;
  longitude: number;
  instructions: string;
  delivery_contact_no: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const safePhone = (value: unknown) => String(value ?? "").replace(/\D/g, "").slice(-10);
const isValidPhone = (value: string) => /^\d{10}$/.test(value);
const supportedText = /^[\p{L}\p{M}\p{N}\s.,'’()/#&+-]*$/u;
const containsLetter = /\p{L}/u;

const FIELD_LIMITS = {
  label: 60,
  address: 180,
  street: 120,
  landmark: 120,
  city: 80,
  instructions: 300,
} as const;

function initialForm(address?: EditingAddress): FormState {
  return {
    address_type_id: address?.address_type_id || 0,
    label: address?.label || "",
    address: address?.address || "",
    street: address?.street || "",
    landmark: address?.landmark || "",
    city: address?.city || "",
    state_id: address?.state_id || 0,
    state_name: address?.state_name || address?.state || "",
    pincode: address?.pincode || "",
    is_default: address?.is_default || 0,
    latitude: Number(address?.latitude) || 0,
    longitude: Number(address?.longitude) || 0,
    instructions: address?.delivery_instruction || "",
    delivery_contact_no: safePhone(address?.delivery_contact_no || address?.contact_no),
  };
}

const mapContainerStyle = {
  width: "100%",
  height: "300px",
  borderRadius: "8px",
  marginTop: "16px",
};

const defaultCenter = {
  lat: 28.6139,
  lng: 77.2090,
};

export default function AddressForm() {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: "AIzaSyCJdxW3rsQ9SGb1nH2PI7JwI4JCp98TCVQ",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);

  const { t } = useTranslation("address");
  const { lNavigate } = useLanguageNavigate();
  const location = useLocation();
  const navState = (location.state as NavState | null) || {};
  const editingAddress = navState.address;
  const editingId = editingAddress?.id ?? null;
  const isRelative = Boolean(navState.isRelative || navState.whoFor === "relative");
  const accountPhone = safePhone(navState.ownPhoneNumber || getUserContact());
  const relativePhone = safePhone(navState.selectedRelative?.relative_contact_no);
  const relativeName = navState.selectedRelative?.relative_full_name || "";
  const needsAddressCount = typeof navState.hasExistingAddresses !== "boolean";
  const [form, setForm] = useState<FormState>(() => {
    const value = initialForm(editingAddress);
    if (!value.delivery_contact_no) {
      value.delivery_contact_no = isRelative ? relativePhone : accountPhone;
    }
    return value;
  });
  const [hasExistingAddresses, setHasExistingAddresses] = useState(
    typeof navState.hasExistingAddresses === "boolean" ? navState.hasExistingAddresses : true,
  );
  const [defaultStatusUnknown, setDefaultStatusUnknown] = useState(false);
  const [useAlternatePhone, setUseAlternatePhone] = useState(() => {
    const currentPhone = form.delivery_contact_no;
    const knownPhones = [isRelative ? relativePhone : "", accountPhone].filter(Boolean);
    return !knownPhones.some((phone) => phone === currentPhone)
      || (!isValidPhone(isRelative ? relativePhone : accountPhone) && !isValidPhone(accountPhone));
  });
  const initialSnapshot = useRef(JSON.stringify(form));
  const [addressTypes, setAddressTypes] = useState<AddressType[]>([]);
  const [states, setStates] = useState<StateOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);

  const dirty = JSON.stringify(form) !== initialSnapshot.current;
  const isFirstAddress = !hasExistingAddresses && editingId === null;

  const localizedAddressType = (type: AddressType) => {
    const normalized = type.address_type.trim().toLocaleLowerCase();
    if (normalized.includes("home")) return t("form.types.home");
    if (normalized.includes("office") || normalized.includes("work")) return t("form.types.office");
    if (normalized.includes("other")) return t("form.types.other");
    return type.address_type;
  };

  const loadOptions = useCallback(async () => {
    setLoadingOptions(true);
    setOptionsError(false);
    try {
      const [typeResponse, stateResponse] = await Promise.all([
        callApi("/master/get_all_address_type", "POST", {}),
        callApi("/master/get_all_states", "POST", { country_id: StatePayload.countryId }),
      ]);
      if (typeResponse?.status !== 0 || stateResponse?.status !== 0) throw new Error();
      const parsedTypes = typeof typeResponse.data === "string"
        ? JSON.parse(typeResponse.data)
        : typeResponse.data;
      const parsedStates = typeof stateResponse.data === "string"
        ? JSON.parse(stateResponse.data)
        : stateResponse.data;
      if (!Array.isArray(parsedTypes) || !Array.isArray(parsedStates)) throw new Error();
      if (parsedTypes.length === 0 || parsedStates.length === 0) throw new Error();
      setAddressTypes(parsedTypes);
      setStates(parsedStates);

      if (needsAddressCount) {
        try {
          const ownerAuthId = Number(getUserId());
          if (!Number.isFinite(ownerAuthId) || ownerAuthId <= 0) throw new Error();
          const countResponse = await callApi("/citizen/get_addresses_count", "POST", {
            ctzn_id: ownerAuthId,
          });
          if (countResponse?.status !== 0 || countResponse.data == null) throw new Error();
          const countData = typeof countResponse.data === "string"
            ? JSON.parse(countResponse.data)
            : countResponse.data;
          setHasExistingAddresses(Number(countData?.citizen_total_address_count) > 0);
          setDefaultStatusUnknown(false);
        } catch {
          setHasExistingAddresses(true);
          setDefaultStatusUnknown(true);
        }
      }
    } catch {
      setOptionsError(true);
    } finally {
      setLoadingOptions(false);
    }
  }, [needsAddressCount]);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length > 2) {
      setIsSearchingPlaces(true);
      const timerId = setTimeout(async () => {
        try {
          const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&countrycodes=in&limit=5`;
          const res = await fetch(url, { headers: { 'User-Agent': 'PujaConnect Web / 1.0' } });
          const json = await res.json();
          if (json && json.length > 0) {
            setSearchResults(json.map((item: any) => ({
              id: item.place_id.toString(),
              description: item.display_name,
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
            })));
          } else {
            setSearchResults([]);
          }
        } catch (error) {
          console.error('OSM API Error', error);
          setSearchResults([]);
        } finally {
          setIsSearchingPlaces(false);
        }
      }, 600);
      return () => clearTimeout(timerId);
    } else {
      setSearchResults([]);
      setIsSearchingPlaces(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (!dirty) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [dirty]);

  const update = (field: keyof FormState, value: FormState[keyof FormState]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const updateText = (field: keyof FormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      update(field, event.target.value.replace(/^\s+/, ""));
    };

  const leaveForm = () => {
    if (navState.returnPath) {
      lNavigate(navState.returnPath, { replace: true });
      return;
    }
    lNavigate("/user/address", { state: { returnTo: navState.returnTo ?? null } });
  };

  const requestLeave = () => {
    if (dirty) setShowDiscard(true);
    else leaveForm();
  };

  const validate = () => {
    const next: FormErrors = {};
    const textFields: Array<keyof Pick<FormState, "label" | "address" | "street" | "landmark" | "city">> = [
      "label",
      "address",
      "street",
      "landmark",
      "city",
    ];
    if (!form.address_type_id) next.address_type_id = t("form.errors.type");
    if (!form.label.trim()) next.label = t("form.errors.label");
    if (!form.state_id) next.state_id = t("form.errors.state");
    if (!form.city.trim() || !containsLetter.test(form.city)) next.city = t("form.errors.city");
    if (!/^[1-9]\d{5}$/.test(form.pincode)) next.pincode = t("form.errors.pincode");
    if (!form.address.trim()) next.address = t("form.errors.address");
    textFields.forEach((field) => {
      if (form[field] && !supportedText.test(String(form[field]))) {
        next[field] = t("form.errors.characters");
      }
    });
    if (!isValidPhone(form.delivery_contact_no)) next.delivery_contact_no = t("form.errors.phone");
    setErrors(next);
    const firstError = Object.keys(next)[0];
    if (firstError) {
      window.requestAnimationFrame(() => {
        document.querySelector<HTMLElement>(`[data-field="${firstError}"]`)?.focus();
      });
    }
    return Object.keys(next).length === 0;
  };

  const saveAddress = async () => {
    if (saving || !validate()) {
      if (!saving) toast.error(t("form.fixErrors"));
      return;
    }
    const userId = Number(getUserId());
    const ownerAuthId = isRelative
      ? Number(navState.ownerAuthId || navState.selectedRelative?.relative_auth_id)
      : userId;
    if (!Number.isFinite(ownerAuthId) || ownerAuthId <= 0) {
      toast.error(t("manager.sessionError"));
      return;
    }

    setSaving(true);
    try {
      const response = await callApi("/citizen/save_address_v1", "POST", {
        in_ctzn_address_id: editingId ?? 0,
        ctzn_auth_id: ownerAuthId,
        address_type_id: form.address_type_id,
        label: form.label.trim(),
        name: isRelative ? relativeName : (navState.ownName || ""),
        contact_no: form.delivery_contact_no,
        address: form.address.trim(),
        street: form.street.trim(),
        landmark: form.landmark.trim(),
        city: form.city.trim(),
        state: form.state_id,
        pincode: form.pincode,
        is_default: isFirstAddress ? 1 : form.is_default,
        latitude: form.latitude,
        longitude: form.longitude,
        delivery_contact_no: form.delivery_contact_no,
        delivery_instruction: form.instructions.trim(),
      });
      if (response?.status !== 0) throw new Error(response?.message || t("form.saveError"));
      initialSnapshot.current = JSON.stringify(form);
      toast.success(t(editingId === null ? "form.saved" : "form.updated"));
      leaveForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("form.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const captureLocation = () => {
    if (!navigator.geolocation) {
      toast.error(t("form.locationUnsupported"));
      return;
    }
    if (!window.isSecureContext) {
      toast.error(t("form.locationSecure"));
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((current) => ({
          ...current,
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
        }));
        setGettingLocation(false);
        toast.success(t("form.locationCaptured"));
      },
      (error) => {
        setGettingLocation(false);
        const message = error.code === error.PERMISSION_DENIED
          ? t("form.locationDenied")
          : error.code === error.POSITION_UNAVAILABLE
            ? t("form.locationUnavailable")
            : error.code === error.TIMEOUT
              ? t("form.locationTimeout")
              : t("form.locationUnavailable");
        toast.error(message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const fieldError = (field: keyof FormState) => errors[field] ? `${field}-error` : undefined;
  const inputProps = (field: keyof FormState) => ({
    "data-field": field,
    "aria-invalid": Boolean(errors[field]),
    "aria-describedby": fieldError(field),
  });

  return (
    <main className="address-form-page">
      <div className="address-form-shell">
        <button type="button" className="address-form-back" onClick={requestLeave}>
          <ArrowLeft aria-hidden="true" />
          {t(navState.returnPath ? "form.backSchedule" : "form.backAddresses")}
        </button>

        <header className="address-form-heading">
          <span>{t("form.eyebrow")}</span>
          <h1>{t(editingId === null ? "form.addTitle" : "form.editTitle")}</h1>
          <p>{t(editingId === null ? "form.addSubtitle" : "form.editSubtitle")}</p>
          <p className="address-required-hint">{t("form.requiredHint")}</p>
        </header>

        {loadingOptions ? (
          <section className="address-form-card address-state" aria-live="polite">
            <span><Loader2 className="is-spinning" aria-hidden="true" /></span>
            <p>{t("form.loading")}</p>
          </section>
        ) : optionsError ? (
          <section className="address-form-card address-state is-error" role="alert">
            <span><AlertCircle aria-hidden="true" /></span>
            <h2>{t("form.loadErrorTitle")}</h2>
            <p>{t("form.loadErrorCopy")}</p>
            <button type="button" className="address-secondary-button" onClick={() => void loadOptions()}>
              {t("form.retry")}
            </button>
          </section>
        ) : (
          <form
            className="address-form-card"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              void saveAddress();
            }}
          >
            <section className="address-form-section">
              <h2>{t("form.addressType")}</h2>
              <div className="address-type-options" role="group" aria-label={t("form.addressType")}>
                {addressTypes.map((type) => (
                  <button
                    key={type.address_type_id}
                    type="button"
                    data-field={type.address_type_id === addressTypes[0]?.address_type_id ? "address_type_id" : undefined}
                    aria-pressed={form.address_type_id === type.address_type_id}
                    onClick={() => update("address_type_id", type.address_type_id)}
                  >
                    {form.address_type_id === type.address_type_id && <Check aria-hidden="true" />}
                    {localizedAddressType(type)}
                  </button>
                ))}
              </div>
              {errors.address_type_id && <p id="address_type_id-error" className="address-field-error">{errors.address_type_id}</p>}
            </section>

            <section className="address-form-section">
              <div className="address-form-grid address-location-fields">
                <div className="address-field is-wide">
                  <label htmlFor="address-label">{t("form.label")} <span aria-hidden="true">*</span></label>
                  <input
                    id="address-label"
                    value={form.label}
                    onChange={updateText("label")}
                    maxLength={FIELD_LIMITS.label}
                    placeholder={t("form.labelPlaceholder")}
                    {...inputProps("label")}
                  />
                  {errors.label && <p id="label-error" className="address-field-error">{errors.label}</p>}
                </div>

                <div className="address-field is-third">
                  <label htmlFor="address-state">{t("form.state")} <span aria-hidden="true">*</span></label>
                  <SearchableSelect
                    id="address-state"
                    value={form.state_id}
                    options={states.map((state) => ({ value: state.state_id, label: state.state_name }))}
                    placeholder={t("form.selectState")}
                    searchPlaceholder={t("form.searchState")}
                    noResultsText={t("form.noStateResults")}
                    className="address-select"
                    onChange={(stateId) => {
                      const selected = states.find((state) => state.state_id === stateId);
                      setForm((current) => ({
                        ...current,
                        state_id: stateId,
                        state_name: selected?.state_name || "",
                      }));
                      setErrors((current) => ({ ...current, state_id: undefined }));
                    }}
                    {...inputProps("state_id")}
                  />
                  {errors.state_id && <p id="state_id-error" className="address-field-error">{errors.state_id}</p>}
                </div>

                <div className="address-field is-third">
                  <label htmlFor="address-city">{t("form.city")} <span aria-hidden="true">*</span></label>
                  <input
                    id="address-city"
                    value={form.city}
                    onChange={updateText("city")}
                    maxLength={FIELD_LIMITS.city}
                    autoComplete="address-level2"
                    placeholder={t("form.cityPlaceholder")}
                    {...inputProps("city")}
                  />
                  {errors.city && <p id="city-error" className="address-field-error">{errors.city}</p>}
                </div>

                <div className="address-field is-third">
                  <label htmlFor="address-pincode">{t("form.pincode")} <span aria-hidden="true">*</span></label>
                  <input
                    id="address-pincode"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    maxLength={6}
                    value={form.pincode}
                    onChange={(event) => update("pincode", event.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="700001"
                    {...inputProps("pincode")}
                  />
                  {errors.pincode && <p id="pincode-error" className="address-field-error">{errors.pincode}</p>}
                </div>

                <div className="address-field is-wide">
                  <label htmlFor="address-line">{t("form.addressLine")} <span aria-hidden="true">*</span></label>
                  <textarea
                    id="address-line"
                    rows={3}
                    maxLength={FIELD_LIMITS.address}
                    autoComplete="address-line1"
                    value={form.address}
                    onChange={updateText("address")}
                    placeholder={t("form.addressPlaceholder")}
                    {...inputProps("address")}
                  />
                  {errors.address && <p id="address-error" className="address-field-error">{errors.address}</p>}
                </div>

                <div className="address-field is-half">
                  <label htmlFor="address-street">{t("form.street")}</label>
                  <input
                    id="address-street"
                    value={form.street}
                    onChange={updateText("street")}
                    maxLength={FIELD_LIMITS.street}
                    autoComplete="address-line2"
                    placeholder={t("form.streetPlaceholder")}
                    {...inputProps("street")}
                  />
                  {errors.street && <p id="street-error" className="address-field-error">{errors.street}</p>}
                </div>

                <div className="address-field is-half">
                  <label htmlFor="address-landmark">{t("form.landmark")}</label>
                  <input
                    id="address-landmark"
                    value={form.landmark}
                    onChange={updateText("landmark")}
                    maxLength={FIELD_LIMITS.landmark}
                    autoComplete="off"
                    placeholder={t("form.landmarkPlaceholder")}
                    {...inputProps("landmark")}
                  />
                  {errors.landmark && <p id="landmark-error" className="address-field-error">{errors.landmark}</p>}
                </div>
              </div>
            </section>

            <section className="address-form-section address-location-panel">
              <div className="address-location-copy">
                <span><MapPin aria-hidden="true" /></span>
                <div>
                  <h2>{t("form.locationTitle")}</h2>
                  <p>{t("form.locationCopy")}</p>
                </div>
              </div>
              <button
                type="button"
                className="address-secondary-button"
                disabled={gettingLocation}
                onClick={captureLocation}
              >
                {gettingLocation
                  ? <Loader2 className="is-spinning" aria-hidden="true" />
                  : <Navigation aria-hidden="true" />}
                {t(gettingLocation ? "form.capturing" : "form.captureLocation")}
              </button>
              {(form.latitude !== 0 || form.longitude !== 0) && (
                <div className="address-coordinates" aria-live="polite">
                  <span>{t("form.latitude")} <strong>{form.latitude}</strong></span>
                  <span>{t("form.longitude")} <strong>{form.longitude}</strong></span>
                </div>
              )}
              <div style={{ marginTop: "16px", width: "100%", position: "relative" }}>
                <input
                  type="text"
                  placeholder={t("form.searchLocation") || "Search area or landmark..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1px solid #D1D5DB",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none"
                  }}
                />
                {isSearchingPlaces && (
                  <div style={{ position: "absolute", right: "12px", top: "12px" }}>
                    <Loader2 size={16} className="is-spinning" color="#c65316" />
                  </div>
                )}
                {searchResults.length > 0 && (
                  <div style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    backgroundColor: "white",
                    border: "1px solid #D1D5DB",
                    borderRadius: "8px",
                    marginTop: "4px",
                    zIndex: 10,
                    maxHeight: "200px",
                    overflowY: "auto",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                  }}>
                    {searchResults.map((place) => (
                      <div
                        key={place.id}
                        onClick={() => {
                          setForm((current) => ({
                            ...current,
                            latitude: Number(place.lat.toFixed(6)),
                            longitude: Number(place.lng.toFixed(6)),
                          }));
                          setSearchQuery(place.description);
                          setSearchResults([]);
                        }}
                        style={{
                          padding: "12px 14px",
                          borderBottom: "1px solid #E5E7EB",
                          cursor: "pointer",
                          fontSize: "14px",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F3F4F6")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                      >
                        {place.description}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {isLoaded ? (
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={form.latitude !== 0 ? { lat: form.latitude, lng: form.longitude } : defaultCenter}
                  zoom={14}
                  onClick={(e) => {
                    if (e.latLng) {
                      setForm((current) => ({
                        ...current,
                        latitude: Number(e.latLng.lat().toFixed(6)),
                        longitude: Number(e.latLng.lng().toFixed(6)),
                      }));
                    }
                  }}
                >
                  {form.latitude !== 0 && (
                    <Marker
                      position={{ lat: form.latitude, lng: form.longitude }}
                      draggable={true}
                      onDragEnd={(e) => {
                        if (e.latLng) {
                          setForm((current) => ({
                            ...current,
                            latitude: Number(e.latLng.lat().toFixed(6)),
                            longitude: Number(e.latLng.lng().toFixed(6)),
                          }));
                        }
                      }}
                    />
                  )}
                </GoogleMap>
              ) : (
                <p style={{ marginTop: "16px", textAlign: "center" }}>{t("form.loadingMap") || "Loading Map..."}</p>
              )}
            </section>

            <section className="address-form-section">
              <div className="address-form-grid">
                <div className="address-field is-wide">
                  <label htmlFor="delivery-instructions">
                    {t("form.deliveryInstructions")} <small>{t("form.optional")}</small>
                  </label>
                  <textarea
                    id="delivery-instructions"
                    rows={3}
                    maxLength={FIELD_LIMITS.instructions}
                    value={form.instructions}
                    onChange={updateText("instructions")}
                    placeholder={t("form.instructionsPlaceholder")}
                  />
                  <span className="address-character-count" aria-live="polite">
                    {t("form.characterCount", {
                      current: form.instructions.length,
                      max: FIELD_LIMITS.instructions,
                    })}
                  </span>
                </div>

                <fieldset className="address-phone-field is-wide">
                  <legend>{t("form.deliveryPhone")} <span aria-hidden="true">*</span></legend>
                  <div className="address-phone-options">
                    {isRelative && (
                      <label className={!isValidPhone(relativePhone) ? "is-disabled" : ""}>
                        <input
                          type="radio"
                          name="delivery-phone"
                          checked={!useAlternatePhone && Boolean(relativePhone) && form.delivery_contact_no === relativePhone}
                          disabled={!isValidPhone(relativePhone)}
                          onChange={() => {
                            setUseAlternatePhone(false);
                            update("delivery_contact_no", relativePhone);
                          }}
                        />
                        <span>
                          <strong>{t("form.relativePhone", { name: relativeName || t("recipient.family") })}</strong>
                          {relativePhone || t("form.phoneUnavailable")}
                        </span>
                      </label>
                    )}
                    <label className={!isValidPhone(accountPhone) ? "is-disabled" : ""}>
                      <input
                        type="radio"
                        name="delivery-phone"
                        checked={!useAlternatePhone && Boolean(accountPhone) && form.delivery_contact_no === accountPhone}
                        disabled={!isValidPhone(accountPhone)}
                        onChange={() => {
                          setUseAlternatePhone(false);
                          update("delivery_contact_no", accountPhone);
                        }}
                      />
                      <span>
                        <strong>{t("form.accountPhone")}</strong>
                        {accountPhone || t("form.phoneUnavailable")}
                      </span>
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="delivery-phone"
                        checked={useAlternatePhone}
                        onChange={() => {
                          setUseAlternatePhone(true);
                          if (form.delivery_contact_no === accountPhone || form.delivery_contact_no === relativePhone) {
                            update("delivery_contact_no", "");
                          }
                        }}
                      />
                      <span>
                        <strong>{t("form.anotherPhone")}</strong>
                        {t("form.anotherPhoneCopy")}
                      </span>
                    </label>
                  </div>
                  {useAlternatePhone && (
                    <div className="address-field address-alternate-phone">
                      <label htmlFor="alternate-delivery-phone">{t("form.phoneNumber")}</label>
                      <input
                        id="alternate-delivery-phone"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        maxLength={10}
                        value={form.delivery_contact_no}
                        onChange={(event) => update(
                          "delivery_contact_no",
                          event.target.value.replace(/\D/g, "").slice(0, 10),
                        )}
                        placeholder={t("form.phonePlaceholder")}
                        {...inputProps("delivery_contact_no")}
                      />
                    </div>
                  )}
                  {errors.delivery_contact_no && (
                    <p id="delivery_contact_no-error" className="address-field-error">{errors.delivery_contact_no}</p>
                  )}
                </fieldset>
              </div>
            </section>

            <section className="address-form-section address-default-row">
              <div>
                <h2>{t("form.defaultAddress")}</h2>
                {isFirstAddress && <p>{t("form.firstDefault")}</p>}
                {defaultStatusUnknown && <p className="address-default-warning">{t("form.defaultStatusUnknown")}</p>}
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isFirstAddress || form.is_default === 1}
                disabled={isFirstAddress}
                className="address-switch"
                onClick={() => update("is_default", form.is_default ? 0 : 1)}
              >
                <span />
              </button>
            </section>

            <footer className="address-form-actions">
              <span><ShieldCheck aria-hidden="true" /> {t("form.privacyCopy")}</span>
              <div>
                <button type="button" className="address-secondary-button" disabled={saving} onClick={requestLeave}>
                  {t("form.cancel")}
                </button>
                <button type="submit" className="address-primary-button" disabled={saving}>
                  {saving && <Loader2 className="is-spinning" aria-hidden="true" />}
                  {t(saving ? "form.saving" : editingId === null ? "form.save" : "form.update")}
                </button>
              </div>
            </footer>
          </form>
        )}
      </div>

      {showDiscard && (
        <AccessibleDialog
          alert
          title={t("form.discardTitle")}
          copy={t("form.discardCopy")}
          onClose={() => setShowDiscard(false)}
          icon={<span className="address-dialog__icon is-danger"><AlertCircle aria-hidden="true" /></span>}
          actions={
            <>
              <button
                type="button"
                data-autofocus
                className="address-secondary-button"
                onClick={() => setShowDiscard(false)}
              >
                {t("form.keepEditing")}
              </button>
              <button type="button" className="address-danger-button" onClick={leaveForm}>
                {t("form.discard")}
              </button>
            </>
          }
        />
      )}
    </main>
  );
}
