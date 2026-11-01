'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';

export function CategoryTabs({ onSelect }: { onSelect?: (tab: string) => void }) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { key: 'all', label: t('home.tabs.all') },
    { key: 'new', label: t('home.tabs.new_arrivals') },
    { key: 'abayas', label: t('home.tabs.abayas') },
    { key: 'kaftans', label: t('home.tabs.kaftans') },
    { key: 'scarves', label: t('home.tabs.scarves') },
    { key: 'materials', label: t('home.tabs.materials') },
  ];

  const handleClick = (tabKey: string, label: string) => {
    setActiveTab(tabKey);
    if (onSelect) onSelect(label);
  };

  return (
    <nav
      aria-label="Quick Category Filters"
      className="px-gutter-mobile no-scrollbar flex w-full items-center gap-2 overflow-x-auto border-b border-black/15 bg-white py-3.5"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => handleClick(tab.key, tab.label)}
            className={`font-label-sm text-label-sm h-9 rounded-full px-4 tracking-wider whitespace-nowrap uppercase transition-all ${
              isActive
                ? 'bg-black font-semibold text-[#ffffff] shadow-sm'
                : 'bg-[#F3EFEA] text-black hover:bg-[#EFECE6]'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
