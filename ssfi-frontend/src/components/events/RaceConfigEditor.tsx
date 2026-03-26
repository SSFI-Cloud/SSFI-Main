'use client';

import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Settings2, Zap } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RaceCategory {
  name: string;
  label: string;
  ageGroups: string[];
  races: string[];
  minRaces: number;
  maxRaces: number;
  mandatoryRaces: string[];
}

export interface RaceConfig {
  categories: RaceCategory[];
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const ALL_AGE_GROUPS = ['U-4', 'U-6', 'U-8', 'U-10', 'U-12', 'U-14', 'U-16', 'ABOVE_16', 'MASTERS_30'];

const DEFAULT_RACE_CONFIG: RaceConfig = {
  categories: [
    {
      name: 'BEGINNER', label: 'Beginner',
      ageGroups: [...ALL_AGE_GROUPS],
      races: ['200M', '400M'],
      minRaces: 2, maxRaces: 2,
      mandatoryRaces: ['200M', '400M'],
    },
    {
      name: 'RECREATIONAL', label: 'Recreational',
      ageGroups: [...ALL_AGE_GROUPS],
      races: ['200M', '400M', '1000M'],
      minRaces: 2, maxRaces: 2,
      mandatoryRaces: [],
    },
    {
      name: 'QUAD_JUNIOR', label: 'Quad (Junior)',
      ageGroups: ['U-4', 'U-6', 'U-8'],
      races: ['200M', '400M', '1000M', 'Road 100M'],
      minRaces: 2, maxRaces: 2,
      mandatoryRaces: [],
    },
    {
      name: 'QUAD_SENIOR', label: 'Quad (Senior)',
      ageGroups: ['U-10', 'U-12', 'U-14', 'U-16', 'ABOVE_16', 'MASTERS_30'],
      races: ['200M', '400M', '1000M', 'Road 100M', 'Road 2000M', 'Point to Point'],
      minRaces: 3, maxRaces: 3,
      mandatoryRaces: [],
    },
    {
      name: 'PRO_INLINE_JUNIOR', label: 'Pro Inline (Junior)',
      ageGroups: ['U-4', 'U-6', 'U-8'],
      races: ['200M', '400M', '1000M', 'Road 100M'],
      minRaces: 2, maxRaces: 2,
      mandatoryRaces: [],
    },
    {
      name: 'PRO_INLINE_SENIOR', label: 'Pro Inline (Senior)',
      ageGroups: ['U-10', 'U-12', 'U-14', 'U-16', 'ABOVE_16', 'MASTERS_30'],
      races: ['200M', '400M', '1000M', 'Road 100M', 'Road 2000M', 'Point to Point'],
      minRaces: 3, maxRaces: 3,
      mandatoryRaces: [],
    },
  ],
};

const EMPTY_CATEGORY: RaceCategory = {
  name: '', label: '', ageGroups: [...ALL_AGE_GROUPS],
  races: [], minRaces: 1, maxRaces: 3, mandatoryRaces: [],
};

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  value: RaceConfig | null;
  onChange: (config: RaceConfig | null) => void;
}

export default function RaceConfigEditor({ value, onChange }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [newRaceInputs, setNewRaceInputs] = useState<Record<number, string>>({});

  const categories = value?.categories || [];

  const updateCategory = (idx: number, updates: Partial<RaceCategory>) => {
    const updated = categories.map((c, i) => i === idx ? { ...c, ...updates } : c);
    onChange({ categories: updated });
  };

  const removeCategory = (idx: number) => {
    onChange({ categories: categories.filter((_, i) => i !== idx) });
    if (expanded === idx) setExpanded(null);
  };

  const addCategory = () => {
    onChange({ categories: [...categories, { ...EMPTY_CATEGORY }] });
    setExpanded(categories.length);
  };

  const toggleAgeGroup = (idx: number, ag: string) => {
    const cat = categories[idx];
    const ageGroups = cat.ageGroups.includes(ag)
      ? cat.ageGroups.filter(a => a !== ag)
      : [...cat.ageGroups, ag];
    updateCategory(idx, { ageGroups });
  };

  const removeRace = (idx: number, race: string) => {
    const cat = categories[idx];
    updateCategory(idx, {
      races: cat.races.filter(r => r !== race),
      mandatoryRaces: cat.mandatoryRaces.filter(r => r !== race),
    });
  };

  const addRace = (idx: number) => {
    const race = (newRaceInputs[idx] || '').trim();
    if (!race) return;
    const cat = categories[idx];
    if (!cat.races.includes(race)) {
      updateCategory(idx, { races: [...cat.races, race] });
    }
    setNewRaceInputs({ ...newRaceInputs, [idx]: '' });
  };

  const toggleMandatory = (idx: number, race: string) => {
    const cat = categories[idx];
    const mandatoryRaces = cat.mandatoryRaces.includes(race)
      ? cat.mandatoryRaces.filter(r => r !== race)
      : [...cat.mandatoryRaces, race];
    updateCategory(idx, { mandatoryRaces });
  };

  const inputCls = 'px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400';

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
        <Settings2 className="w-5 h-5 text-gray-900" />
        Race Configuration
      </h2>
      <p className="text-xs text-gray-500 mb-4">Configure which categories and races are available for this event. Leave empty to use SSFI default rules.</p>

      {/* Preset buttons */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => onChange({ ...DEFAULT_RACE_CONFIG })}
          className="px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
        >
          <Zap className="w-3 h-3 inline mr-1" />
          Load SSFI Defaults
        </button>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="px-3 py-1.5 text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Clear (Use Defaults)
        </button>
      </div>

      {/* Category cards */}
      {categories.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
          No custom race config. Default SSFI rules will apply.
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat, idx) => (
            <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
              {/* Header */}
              <button
                type="button"
                onClick={() => setExpanded(expanded === idx ? null : idx)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">{cat.label || cat.name || `Category ${idx + 1}`}</span>
                  <span className="text-xs text-gray-400">{cat.races.length} races</span>
                  <span className="text-xs text-gray-400">min: {cat.minRaces} / max: {cat.maxRaces}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeCategory(idx); }}
                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  {expanded === idx ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </button>

              {/* Expanded content */}
              {expanded === idx && (
                <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-4">
                  {/* Name & Label */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Category ID</label>
                      <input
                        type="text"
                        value={cat.name}
                        onChange={e => updateCategory(idx, { name: e.target.value.toUpperCase().replace(/\s/g, '_') })}
                        placeholder="e.g. QUAD_JUNIOR"
                        className={inputCls + ' w-full font-mono'}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Display Label</label>
                      <input
                        type="text"
                        value={cat.label}
                        onChange={e => updateCategory(idx, { label: e.target.value })}
                        placeholder="e.g. Quad (Junior)"
                        className={inputCls + ' w-full'}
                      />
                    </div>
                  </div>

                  {/* Age Groups */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Applicable Age Groups</label>
                    <div className="flex flex-wrap gap-1.5">
                      {ALL_AGE_GROUPS.map(ag => (
                        <button
                          key={ag}
                          type="button"
                          onClick={() => toggleAgeGroup(idx, ag)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                            cat.ageGroups.includes(ag)
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                              : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                          }`}
                        >
                          {ag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Races */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Available Races</label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {cat.races.map(race => (
                        <span key={race} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs font-medium">
                          {race}
                          <button type="button" onClick={() => removeRace(idx, race)} className="text-blue-400 hover:text-red-500">
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newRaceInputs[idx] || ''}
                        onChange={e => setNewRaceInputs({ ...newRaceInputs, [idx]: e.target.value })}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addRace(idx))}
                        placeholder="Type race name and press Enter"
                        className={inputCls + ' flex-1'}
                      />
                      <button type="button" onClick={() => addRace(idx)} className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 border border-blue-200">
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Min/Max */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Min Races</label>
                      <input
                        type="number" min={1} max={10}
                        value={cat.minRaces}
                        onChange={e => updateCategory(idx, { minRaces: Number(e.target.value) })}
                        className={inputCls + ' w-full'}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Max Races</label>
                      <input
                        type="number" min={1} max={10}
                        value={cat.maxRaces}
                        onChange={e => updateCategory(idx, { maxRaces: Number(e.target.value) })}
                        className={inputCls + ' w-full'}
                      />
                    </div>
                  </div>

                  {/* Mandatory Races */}
                  {cat.races.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Mandatory Races (must be selected by student)</label>
                      <div className="flex flex-wrap gap-1.5">
                        {cat.races.map(race => (
                          <button
                            key={race}
                            type="button"
                            onClick={() => toggleMandatory(idx, race)}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                              cat.mandatoryRaces.includes(race)
                                ? 'bg-amber-50 border-amber-300 text-amber-700'
                                : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                            }`}
                          >
                            {race}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add category button */}
      <button
        type="button"
        onClick={addCategory}
        className="mt-3 w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50/50 transition-all flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Add Category
      </button>
    </div>
  );
}
