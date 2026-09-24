/**
 * 应用版本号单一真源。
 * 与 package.json 的 version 保持同步；版本 bump 时两处一起改。
 * UI 侧统一从本模块读 APP_VERSION，禁止在组件里写死版本号。
 */
export const APP_VERSION = "0.2.2";
