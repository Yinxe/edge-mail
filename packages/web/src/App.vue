<script setup lang="ts">
import { NConfigProvider, NMessageProvider, zhCN, dateZhCN } from 'naive-ui'
import type { GlobalThemeOverrides } from 'naive-ui'

/**
 * Design tokens from DESIGN.md:
 * Warm pink primary + sky blue info + grass green success + warm orange warning
 */
const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#E85D75',
    primaryColorHover: '#D94D65',
    primaryColorPressed: '#C43D55',
    primaryColorSuppl: '#F0788A',
    infoColor: '#4A9FE5',
    successColor: '#5BB98A',
    warningColor: '#F5A623',
    errorColor: '#E55959',
    bodyColor: '#F8F6F7',
    cardColor: '#FFFFFF',
    modalColor: '#FFFFFF',
    borderColor: '#EAE5E8',
    textColor1: '#2D2327',
    textColor2: '#6B5E63',
    textColor3: '#9E9196',
    borderRadius: '12px',
    fontSize: '14px',
    fontSizeSmall: '12px',
    fontSizeLarge: '16px',
  },
  Button: {
    borderRadius: '10px',
    fontWeight: '600',
  },
  Input: {
    borderRadius: '10px',
  },
  Card: {
    borderRadius: '12px',
    paddingMedium: '20px 24px',
  },
  Tag: {
    borderRadius: '6px',
  },
  Pagination: {
    borderRadius: '8px',
  },
}
</script>

<template>
  <NConfigProvider :theme-overrides="themeOverrides" :locale="zhCN" :date-locale="dateZhCN">
    <NMessageProvider>
      <router-view />
    </NMessageProvider>
  </NConfigProvider>
</template>
