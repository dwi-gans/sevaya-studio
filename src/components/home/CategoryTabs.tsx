'use client';

import React, { useState } from 'react';

import { useLanguage } from '@/context/LanguageContext';

export function CategoryTabs({ onSelect }: { onSelect?: (tab: string) => void }) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { key: 'all', label: t('tab.all') },
    { key: 'new', label: t('tab.new_arrivals') },
    { key: 'abayas', label: t('tab.abayas') },
    { key: 'kaftans', label: t('tab.kaftans') },
    { key: 'scarves', label: t('tab.scarves') },
    { key: 'materials', label: t('tab.materials') },
  ];

  const handleClick = (tabKey: string, label: string) => {
    setActiveTab(tabKey);
    if (onSelect) onSelect(label);
  };

  return (
    <nav
      aria-label="Quick Category Filters"
      className="px-gutter-mobile no-scrollbar flex w-full items-center gap-2 overflow-x-auto border-b border-[#E5DDD5]/50 bg-[#FAF8F5] py-3.5"
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
                ? 'bg-[#141312] font-semibold text-[#ffffff] shadow-sm'
                : 'bg-[#F3EFEA] text-[#1B1718] hover:bg-[#EFECE6]'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
