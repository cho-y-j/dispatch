import { useCallback, useEffect, useState } from 'react';

const KAKAO_JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY;

// Kakao Maps SDK 동적 로드
let kakaoLoaded = false;
let kakaoLoadPromise: Promise<void> | null = null;

function loadKakaoMapsSDK(): Promise<void> {
  if (kakaoLoaded) return Promise.resolve();
  if (kakaoLoadPromise) return kakaoLoadPromise;

  kakaoLoadPromise = new Promise((resolve, reject) => {
    if (!KAKAO_JS_KEY) {
      console.error('VITE_KAKAO_JS_KEY 환경변수가 설정되지 않았습니다.');
      reject(new Error('Kakao JS Key not found'));
      return;
    }

    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&libraries=services&autoload=false`;
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => {
        kakaoLoaded = true;
        resolve();
      });
    };
    script.onerror = () => reject(new Error('Failed to load Kakao Maps SDK'));
    document.head.appendChild(script);
  });

  return kakaoLoadPromise;
}

// Kakao Postcode 타입 선언
declare global {
  interface Window {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: DaumPostcodeResult) => void;
        onclose?: (state: string) => void;
        width?: string | number;
        height?: string | number;
      }) => {
        open: () => void;
        embed: (element: HTMLElement) => void;
      };
    };
    kakao: {
      maps: {
        load: (callback: () => void) => void;
        services: {
          Geocoder: new () => KakaoGeocoder;
          Status: {
            OK: string;
            ZERO_RESULT: string;
            ERROR: string;
          };
        };
        LatLng: new (lat: number, lng: number) => KakaoLatLng;
      };
    };
  }
}

interface DaumPostcodeResult {
  address: string;
  addressEnglish: string;
  addressType: string;
  apartment: string;
  autoJibunAddress: string;
  autoJibunAddressEnglish: string;
  autoRoadAddress: string;
  autoRoadAddressEnglish: string;
  bcode: string;
  bname: string;
  bname1: string;
  bname1English: string;
  bname2: string;
  bname2English: string;
  bnameEnglish: string;
  buildingCode: string;
  buildingName: string;
  hname: string;
  jibunAddress: string;
  jibunAddressEnglish: string;
  noSelected: string;
  plantable: string;
  postcode: string;
  postcode1: string;
  postcode2: string;
  postcodeSeq: string;
  query: string;
  roadAddress: string;
  roadAddressEnglish: string;
  roadname: string;
  roadnameCode: string;
  roadnameEnglish: string;
  sido: string;
  sidoEnglish: string;
  sigungu: string;
  sigunguCode: string;
  sigunguEnglish: string;
  userLanguageType: string;
  userSelectedType: string;
  zonecode: string;
}

interface KakaoGeocoder {
  addressSearch: (
    address: string,
    callback: (result: KakaoGeocoderResult[], status: string) => void
  ) => void;
  coord2Address: (
    lng: number,
    lat: number,
    callback: (result: KakaoReverseGeocoderResult[], status: string) => void
  ) => void;
}

interface KakaoGeocoderResult {
  address_name: string;
  address_type: string;
  x: string;
  y: string;
  address: {
    address_name: string;
    region_1depth_name: string;
    region_2depth_name: string;
    region_3depth_name: string;
    mountain_yn: string;
    main_address_no: string;
    sub_address_no: string;
  };
  road_address: {
    address_name: string;
    region_1depth_name: string;
    region_2depth_name: string;
    region_3depth_name: string;
    road_name: string;
    underground_yn: string;
    main_building_no: string;
    sub_building_no: string;
    building_name: string;
    zone_no: string;
  } | null;
}

interface KakaoReverseGeocoderResult {
  address: {
    address_name: string;
    region_1depth_name: string;
    region_2depth_name: string;
    region_3depth_name: string;
    mountain_yn: string;
    main_address_no: string;
    sub_address_no: string;
  };
  road_address: {
    address_name: string;
    region_1depth_name: string;
    region_2depth_name: string;
    region_3depth_name: string;
    road_name: string;
    underground_yn: string;
    main_building_no: string;
    sub_building_no: string;
    building_name: string;
    zone_no: string;
  } | null;
}

interface KakaoLatLng {
  getLat: () => number;
  getLng: () => number;
}

export interface AddressResult {
  address: string;
  roadAddress?: string;
  jibunAddress?: string;
  zonecode?: string;
  latitude?: number;
  longitude?: number;
  buildingName?: string;
}

export function useKakaoAddress() {
  const [isReady, setIsReady] = useState(kakaoLoaded);

  // SDK 로드
  useEffect(() => {
    loadKakaoMapsSDK()
      .then(() => setIsReady(true))
      .catch((err) => console.error('Kakao SDK 로드 실패:', err));
  }, []);

  // Daum Postcode 팝업으로 주소 검색
  const openAddressSearch = useCallback(
    (onComplete: (result: AddressResult) => void) => {
      if (!window.daum?.Postcode) {
        console.error('Daum Postcode API가 로드되지 않았습니다.');
        return;
      }

      new window.daum.Postcode({
        oncomplete: async (data: DaumPostcodeResult) => {
          const address = data.roadAddress || data.jibunAddress || data.address;
          const result: AddressResult = {
            address,
            roadAddress: data.roadAddress || undefined,
            jibunAddress: data.jibunAddress || undefined,
            zonecode: data.zonecode,
            buildingName: data.buildingName || undefined,
          };

          // Kakao Geocoder로 좌표 변환
          const coords = await geocodeAddress(address);
          if (coords) {
            result.latitude = coords.latitude;
            result.longitude = coords.longitude;
          }

          onComplete(result);
        },
      }).open();
    },
    []
  );

  // 주소 → 좌표 변환 (Geocoding)
  const geocodeAddress = useCallback(
    (address: string): Promise<{ latitude: number; longitude: number } | null> => {
      return new Promise((resolve) => {
        if (!window.kakao?.maps?.services) {
          console.error('Kakao Maps Services API가 로드되지 않았습니다.');
          resolve(null);
          return;
        }

        const geocoder = new window.kakao.maps.services.Geocoder();
        geocoder.addressSearch(address, (result, status) => {
          if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
            resolve({
              latitude: parseFloat(result[0].y),
              longitude: parseFloat(result[0].x),
            });
          } else {
            resolve(null);
          }
        });
      });
    },
    []
  );

  // 좌표 → 주소 변환 (Reverse Geocoding)
  const reverseGeocode = useCallback(
    (
      latitude: number,
      longitude: number
    ): Promise<{ address: string; roadAddress?: string } | null> => {
      return new Promise((resolve) => {
        if (!window.kakao?.maps?.services) {
          console.error('Kakao Maps Services API가 로드되지 않았습니다.');
          resolve(null);
          return;
        }

        const geocoder = new window.kakao.maps.services.Geocoder();
        geocoder.coord2Address(longitude, latitude, (result, status) => {
          if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
            resolve({
              address: result[0].address?.address_name || '',
              roadAddress: result[0].road_address?.address_name || undefined,
            });
          } else {
            resolve(null);
          }
        });
      });
    },
    []
  );

  return {
    isReady,
    openAddressSearch,
    geocodeAddress,
    reverseGeocode,
  };
}
