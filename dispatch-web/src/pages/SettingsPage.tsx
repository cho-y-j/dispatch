import { useState, useEffect } from 'react';
import { Settings, Save, Clock, AlertTriangle, Shield } from 'lucide-react';
import { SystemSetting } from '../types';
import { getAllSettings, updateSetting } from '../api/admin';

const SETTING_GROUPS = {
  grade: {
    title: '등급 설정',
    icon: <Shield className="w-5 h-5" />,
    settings: ['grade_2_delay_minutes', 'grade_3_delay_minutes'],
  },
  warning: {
    title: '경고/정지 설정',
    icon: <AlertTriangle className="w-5 h-5" />,
    settings: ['warning_threshold_1', 'suspension_days_1', 'warning_threshold_2', 'suspension_days_2'],
  },
  general: {
    title: '일반 설정',
    icon: <Settings className="w-5 h-5" />,
    settings: ['urgent_dispatch_exposure_minutes', 'chat_retention_days', 'default_dispatch_radius_km'],
  },
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await getAllSettings();
      if (response.success && response.data) {
        setSettings(response.data);
        const values: Record<string, string> = {};
        response.data.forEach(s => {
          values[s.settingKey] = s.settingValue;
        });
        setEditedValues(values);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key: string) => {
    setSaving(key);
    try {
      const response = await updateSetting(key, { settingValue: editedValues[key] });
      if (response.success) {
        loadSettings();
        alert('설정이 저장되었습니다.');
      }
    } catch (error) {
      console.error('Failed to save setting:', error);
      alert('설정 저장에 실패했습니다.');
    } finally {
      setSaving(null);
    }
  };

  const getSetting = (key: string) => settings.find(s => s.settingKey === key);
  const hasChanged = (key: string) => {
    const setting = getSetting(key);
    return setting && editedValues[key] !== setting.settingValue;
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">시스템 설정</h1>
        <p className="text-gray-600">배차 시스템의 주요 설정을 관리합니다</p>
      </div>

      <div className="space-y-6">
        {Object.entries(SETTING_GROUPS).map(([groupKey, group]) => (
          <div key={groupKey} className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
              {group.icon}
              <h2 className="text-lg font-semibold">{group.title}</h2>
            </div>
            <div className="p-6 space-y-4">
              {group.settings.map(key => {
                const setting = getSetting(key);
                if (!setting) return null;
                return (
                  <div key={key} className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700">
                        {setting.description || setting.settingKey}
                      </label>
                      <input
                        type="text"
                        value={editedValues[key] || ''}
                        onChange={(e) => setEditedValues({ ...editedValues, [key]: e.target.value })}
                        className="mt-1 w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={() => handleSave(key)}
                      disabled={!hasChanged(key) || saving === key}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                        hasChanged(key)
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Save className="w-4 h-4" />
                      {saving === key ? '저장 중...' : '저장'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Setting Descriptions */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold mb-4">설정 설명</h3>
        <div className="text-sm text-gray-600 space-y-2">
          <p><strong>등급 설정:</strong> 신규 배차 등록 시 등급별 노출 지연 시간을 설정합니다.</p>
          <p><strong>경고/정지 설정:</strong> 경고 누적 시 자동 정지 기준을 설정합니다.</p>
          <p><strong>일반 설정:</strong> 긴급 배차 노출 시간, 채팅 보관 기간, 기본 검색 반경 등을 설정합니다.</p>
        </div>
      </div>
    </div>
  );
}
