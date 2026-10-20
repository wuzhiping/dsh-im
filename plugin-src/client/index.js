import { callManagementRpc } from '../management-rpc.mjs';
import * as React from 'react';
import manifest from '../../package.json' with { type: 'json' };

import {
  DingtalkLogoGlyph,
  DiscordLogoGlyph,
  FeishuLogoGlyph,
  QqLogoGlyph,
  SlackLogoGlyph,
  TelegramLogoGlyph,
  WecomLogoGlyph,
  WeixinLogoGlyph,
  WhatsappLogoGlyph,
  IMessageLogoGlyph,
  EmailLogoGlyph,
} from './channel-logos.js';
import { DINGTALK_RPC_CHANNEL } from './channels/dingtalk/api.js';
import { DingtalkSettingsTab } from './channels/dingtalk/index.js';
import { DISCORD_RPC_CHANNEL } from './channels/discord/api.js';
import { DiscordSettingsTab } from './channels/discord/index.js';
import { installDiscordStyles } from './channels/discord/styles.js';
import { FeishuSettingsTab } from './channels/feishu/index.js';
import { FEISHU_RPC_CHANNEL } from './channels/feishu/api.js';
import { installFeishuStyles } from './channels/feishu/styles.js';
import { QQ_RPC_CHANNEL } from './channels/qq/api.js';
import { QqSettingsTab } from './channels/qq/index.js';
import { installQqStyles } from './channels/qq/styles.js';
import { SLACK_RPC_CHANNEL } from './channels/slack/api.js';
import { SlackSettingsTab } from './channels/slack/index.js';
import { installSlackStyles } from './channels/slack/styles.js';
import { TELEGRAM_RPC_CHANNEL } from './channels/telegram/api.js';
import { TelegramSettingsTab } from './channels/telegram/index.js';
import { installTelegramStyles } from './channels/telegram/styles.js';
import { WECOM_RPC_CHANNEL } from './channels/wecom/api.js';
import { WecomSettingsTab } from './channels/wecom/index.js';
import { installWecomStyles } from './channels/wecom/styles.js';
import { WeixinSettingsTab } from './channels/weixin/index.js';
import { WEIXIN_RPC_CHANNEL } from './channels/weixin/api.js';
import { installWeixinStyles } from './channels/weixin/styles.js';
import { WHATSAPP_RPC_CHANNEL } from './channels/whatsapp/api.js';
import { WhatsappSettingsTab } from './channels/whatsapp/index.js';
import { installWhatsappStyles } from './channels/whatsapp/styles.js';
import { IMESSAGE_RPC_CHANNEL } from './channels/imessage/api.js';
import { EMAIL_RPC_CHANNEL } from './channels/email/api.js';
import { IMessageSettingsTab } from './channels/imessage/index.js';
import { EmailSettingsTab, useEmailChannelEnabled } from './channels/email/index.js';
import { installIMessageStyles } from './channels/imessage/styles.js';
import { installEmailStyles } from './channels/email/styles.js';
import { en, h, IM_LOCALE_NAMESPACE, setImTranslator, zh } from './i18n.js';
import { vi } from './i18n-vi.js';
import {
  HOST_LANGUAGE_RPC_CHANNEL,
  installInterfaceLanguageMirror,
} from './interface-language.js';
import { BotSettingsContext } from './channel-card-meta.js';
import {
  DELIVERY_RPC_CHANNEL,
  DeliveryTargetSettingsPage,
} from './delivery-settings.js';
import {
  GLOBAL_SETTINGS_RPC_CHANNEL,
  GLOBAL_SETTINGS_TAB_ID,
  GlobalSettingsLogoGlyph,
  GlobalSettingsPanel,
} from './global-settings.js';
import {
  createLoopbackAwareRpcCalls,
  replacePageLocation,
} from './loopback-recovery.js';
import { installImStyles } from './styles.js';
import { installSessionChannelLogos } from './session-channel-logos.js';
import { WorkspaceDirectoryPickerContext } from './workspace-editor.js';
import { IMPanelErrorBoundary } from './panel-error-boundary.js';
import { installImPluginPage } from './plugin-page.js';

export const name = 'im-settings';
export const inject = ['slots', 'connection', 'locale', 'workspaces'];
export const IM_PLUGIN_VERSION = manifest.version;

function callWorkspaceDirectoryApi(ctx, method, ...args) {
  // Current DSH owns directory operations on uiWorkspace; legacy Hosts keep them on workspaces.
  const uiWorkspace = typeof ctx.get === 'function' ? ctx.get('uiWorkspace') : undefined;
  const service = typeof uiWorkspace?.[method] === 'function' ? uiWorkspace : ctx.workspaces;
  if (typeof service?.[method] !== 'function') {
    throw new Error('无法读取目录，请重试。');
  }
  return service[method](...args);
}

const CHANNELS = Object.freeze([
  { id: 'telegram', label: 'Telegram' },
  { id: 'discord', label: 'Discord' },
  { id: 'slack', label: 'Slack' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'weixin', label: '微信' },
  { id: 'feishu', label: '飞书' },
  { id: 'dingtalk', label: '钉钉' },
  { id: 'wecom', label: '企业微信' },
  { id: 'qq', label: 'QQ' },
  { id: 'imessage', label: 'iMessage', note: '（实验功能）' },
  { id: 'email', label: '邮箱', note: '（实验功能）' },
]);

function WeixinLogo() {
  return h('span', { className: 'dim-logo dim-logoWeixin', 'aria-hidden': 'true' },
    h(WeixinLogoGlyph));
}

function FeishuLogo() {
  return h('span', { className: 'dim-logo dim-logoFeishu', 'aria-hidden': 'true' },
    h(FeishuLogoGlyph));
}

function DingtalkLogo() {
  return h('span', { className: 'dim-logo dim-logoDingtalk', 'aria-hidden': 'true' },
    h(DingtalkLogoGlyph));
}

function QqLogo() {
  return h('span', { className: 'dim-logo dim-logoQq', 'aria-hidden': 'true' }, h(QqLogoGlyph));
}

function WecomLogo() {
  return h('span', { className: 'dim-logo dim-logoWecom', 'aria-hidden': 'true' }, h(WecomLogoGlyph));
}

function TelegramLogo() {
  return h('span', { className: 'dim-logo dim-logoTelegram', 'aria-hidden': 'true' },
    h(TelegramLogoGlyph));
}

function SlackLogo() {
  return h('span', { className: 'dim-logo dim-logoSlack', 'aria-hidden': 'true' },
    h(SlackLogoGlyph));
}

function DiscordLogo() {
  return h('span', { className: 'dim-logo dim-logoDiscord', 'aria-hidden': 'true' },
    h(DiscordLogoGlyph));
}

function WhatsappLogo() {
  return h('span', { className: 'dim-logo dim-logoWhatsapp', 'aria-hidden': 'true' },
    h(WhatsappLogoGlyph));
}

function IMessageLogo() {
  return h('span', { className: 'dim-logo dim-logoIMessage', 'aria-hidden': 'true' },
    h(IMessageLogoGlyph));
}

function EmailLogo() {
  return h('span', { className: 'dim-logo dim-logoEmail', 'aria-hidden': 'true' },
    h(EmailLogoGlyph));
}

function ChannelLogo({ channel }) {
  if (channel === 'weixin') return h(WeixinLogo);
  if (channel === 'feishu') return h(FeishuLogo);
  if (channel === 'dingtalk') return h(DingtalkLogo);
  if (channel === 'wecom') return h(WecomLogo);
  if (channel === 'qq') return h(QqLogo);
  if (channel === 'slack') return h(SlackLogo);
  if (channel === 'telegram') return h(TelegramLogo);
  if (channel === 'discord') return h(DiscordLogo);
  if (channel === 'whatsapp') return h(WhatsappLogo);
  if (channel === 'imessage') return h(IMessageLogo);
  return h(EmailLogo);
}

export function LoopbackRecoveryNotice({ recovery, onNavigate = replacePageLocation }) {
  return h('div', {
    className: 'dim-loopbackRecovery',
    role: 'alert',
  },
  h('div', { className: 'dim-loopbackRecoveryCopy' },
    h('strong', null, '请改用 localhost 重新打开'),
    h('p', null, '页面会在当前端口重新打开，机器人配置不会改变。'),
    h('code', null, recovery.origin)),
  h('button', {
    type: 'button',
    className: 'dim-loopbackRecoveryAction',
    onClick: () => onNavigate(recovery.url),
  }, '使用 localhost 重新打开'));
}

export function IMSettingsTab({
  dingtalkRpcCall,
  discordRpcCall,
  feishuRpcCall,
  imessageRpcCall,
  emailRpcCall,
  qqRpcCall,
  slackRpcCall,
  telegramRpcCall,
  wecomRpcCall,
  weixinRpcCall,
  whatsappRpcCall,
  deliveryRpcCall,
  globalSettingsRpcCall,
  workspaceDirectoryPicker,
  preferredSectionId,
  browserLocation = globalThis.location,
  navigateToRecoveryUrl = replacePageLocation,
}) {
  const [selected, setSelected] = React.useState(() => (
    preferredSectionId === GLOBAL_SETTINGS_TAB_ID
      || CHANNELS.some((channel) => channel.id === preferredSectionId)
      ? preferredSectionId : 'weixin'
  ));
  const [loopbackRecovery, setLoopbackRecovery] = React.useState(null);
  const [deliverySettings, setDeliverySettings] = React.useState(null);
  // The Host owns email availability and reports it over RPC. The
  // mailbox entry point is omitted entirely while it is closed, and the visible
  // channel list is what every later lookup (active tab, rail) reads from.
  const emailEnabled = useEmailChannelEnabled(emailRpcCall);
  const visibleChannels = React.useMemo(
    () => CHANNELS.filter((channel) => channel.id !== 'email' || emailEnabled),
    [emailEnabled],
  );
  const generalSettingsTooltipId = React.useId();
  const globalSettingsSelected = selected === GLOBAL_SETTINGS_TAB_ID;
  const active = visibleChannels.find((channel) => channel.id === selected) ?? visibleChannels[0];
  const activeTabId = globalSettingsSelected
    ? 'dim-general-settings-trigger'
    : `dim-tab-${active.id}`;
  const activePanelId = globalSettingsSelected
    ? `dim-panel-${GLOBAL_SETTINGS_TAB_ID}`
    : `dim-panel-${active.id}`;
  const reportLoopbackRecovery = React.useCallback((recovery) => {
    setLoopbackRecovery((current) => current?.url === recovery.url ? current : recovery);
  }, []);
  const rpcCalls = React.useMemo(() => createLoopbackAwareRpcCalls({
    dingtalkRpcCall,
    discordRpcCall,
    feishuRpcCall,
    qqRpcCall,
    slackRpcCall,
    telegramRpcCall,
    wecomRpcCall,
    weixinRpcCall,
    whatsappRpcCall,
    deliveryRpcCall,
    globalSettingsRpcCall,
    imessageRpcCall,
    emailRpcCall,
  }, {
    location: browserLocation,
    onRecovery: reportLoopbackRecovery,
  }), [
    browserLocation,
    dingtalkRpcCall,
    discordRpcCall,
    deliveryRpcCall,
    feishuRpcCall,
    globalSettingsRpcCall,
    imessageRpcCall,
    emailRpcCall,
    qqRpcCall,
    reportLoopbackRecovery,
    slackRpcCall,
    telegramRpcCall,
    wecomRpcCall,
    weixinRpcCall,
    whatsappRpcCall,
  ]);
  const botSettingsContext = React.useMemo(() => Object.freeze({
    openBotSettings: setDeliverySettings,
  }), []);
  return h(WorkspaceDirectoryPickerContext.Provider, { value: workspaceDirectoryPicker },
    h('section', { className: 'dim-page', 'aria-label': 'IM机器人设置' },
    h('header', { className: 'dim-title' },
      h('div', { className: 'dim-brand' },
        h('div', { className: 'dim-brandHeading' },
          h('strong', { className: 'dim-brandName' }, 'DSH-IM'),
          h('span', { className: 'dim-brandVersion' }, `v${IM_PLUGIN_VERSION}`))),
      h('div', { className: 'dim-titleActions' },
      h('span', { className: 'dim-generalSettingsAction' },
        h('button', {
          type: 'button',
          id: 'dim-general-settings-trigger',
          className: 'dim-generalSettingsButton',
          'aria-label': '通用设置',
          'aria-describedby': generalSettingsTooltipId,
          'aria-controls': `dim-panel-${GLOBAL_SETTINGS_TAB_ID}`,
          'aria-current': globalSettingsSelected ? 'page' : undefined,
          onClick: () => {
            setSelected(GLOBAL_SETTINGS_TAB_ID);
            setDeliverySettings(null);
          },
        }, h(GlobalSettingsLogoGlyph, { size: 17 })),
        h('span', {
          id: generalSettingsTooltipId,
          className: 'dim-generalSettingsTooltip',
          role: 'tooltip',
        }, '通用设置'))),
    ),
    h('div', { className: 'dim-layout' },
      h('nav', { className: 'dim-rail', role: 'tablist', 'aria-label': 'IM 设置导航' },
        visibleChannels.map((channel) => h('button', {
          key: channel.id,
          type: 'button',
          role: 'tab',
          id: `dim-tab-${channel.id}`,
          className: 'dim-channel',
          'aria-selected': !globalSettingsSelected && channel.id === active.id,
          'aria-controls': `dim-panel-${channel.id}`,
          onClick: () => {
            setSelected(channel.id);
            setDeliverySettings(null);
          },
        },
        h(ChannelLogo, { channel: channel.id }),
        h('span', { className: 'dim-channelCopy' },
          h('strong', null, channel.label),
          channel.note ? h('small', { className: 'dim-channelNote' }, channel.note) : null,
        )))),
      h('div', { className: 'dim-divider', 'aria-hidden': 'true' }),
      h('main', {
        className: 'dim-panel',
        role: 'tabpanel',
        id: activePanelId,
        'aria-labelledby': activeTabId,
      },
      loopbackRecovery
        ? h(LoopbackRecoveryNotice, {
            recovery: loopbackRecovery,
            onNavigate: navigateToRecoveryUrl,
          })
        : null,
      h(BotSettingsContext.Provider, { value: botSettingsContext },
        globalSettingsSelected
          ? h(GlobalSettingsPanel, { rpcCall: rpcCalls.globalSettingsRpcCall })
          : deliverySettings?.channel === active.id
          ? h(DeliveryTargetSettingsPage, {
              channel: active.id,
              account: deliverySettings,
              rpcCall: rpcCalls.deliveryRpcCall,
              accessRpcCall: rpcCalls[`${active.id}RpcCall`],
              onBack: () => setDeliverySettings(null),
            })
          : active.id === 'weixin'
            ? h(WeixinSettingsTab, { rpcCall: rpcCalls.weixinRpcCall })
            : active.id === 'feishu'
              ? h(FeishuSettingsTab, { rpcCall: rpcCalls.feishuRpcCall })
              : active.id === 'dingtalk'
                ? h(DingtalkSettingsTab, { rpcCall: rpcCalls.dingtalkRpcCall })
                : active.id === 'wecom'
                  ? h(WecomSettingsTab, { rpcCall: rpcCalls.wecomRpcCall })
                  : active.id === 'qq'
                    ? h(QqSettingsTab, { rpcCall: rpcCalls.qqRpcCall })
                    : active.id === 'slack'
                      ? h(SlackSettingsTab, { rpcCall: rpcCalls.slackRpcCall })
                    : active.id === 'telegram'
                      ? h(TelegramSettingsTab, { rpcCall: rpcCalls.telegramRpcCall })
                      : active.id === 'discord'
                        ? h(DiscordSettingsTab, { rpcCall: rpcCalls.discordRpcCall })
                        : active.id === 'whatsapp'
                          ? h(WhatsappSettingsTab, { rpcCall: rpcCalls.whatsappRpcCall })
                          : active.id === 'imessage'
                            ? h(IMessageSettingsTab, { rpcCall: rpcCalls.imessageRpcCall })
                          : h(EmailSettingsTab, { rpcCall: rpcCalls.emailRpcCall }))),
    ),
  ));
}

/**
 * Register the namespace dictionaries.
 *
 * A hot-reloaded client can re-run `apply` against a locale service that still
 * holds the dictionaries of the previous module instance. `register` throws on
 * a duplicate locale, so a single bundled call would fail at `zh` and never add
 * a newly introduced locale (this is how vi-VN went missing after an in-place
 * reload). Fall back to per-locale registration and skip what is already there.
 */
function registerDictionaries(locale) {
  const pairs = [['vi-VN', vi], ['en', en], ['zh', zh]];
  const bundled = Object.fromEntries(pairs);
  try {
    return locale.register(IM_LOCALE_NAMESPACE, bundled);
  } catch (error) {
    if (!/already has locale/.test(String(error?.message ?? ''))) throw error;
    const disposers = [];
    for (const [id, dictionary] of pairs) {
      try {
        disposers.push(locale.register(IM_LOCALE_NAMESPACE, { [id]: dictionary }));
      } catch (inner) {
        if (!/already has locale/.test(String(inner?.message ?? ''))) throw inner;
      }
    }
    return () => { for (const dispose of disposers) dispose(); };
  }
}

export function apply(ctx) {
  ctx.effect(
    () => registerDictionaries(ctx.locale),
    'im-settings: bilingual dictionaries',
  );
  const baseTranslate = ctx.locale.bind(IM_LOCALE_NAMESPACE);
  // Translate the plugin's own UI from its own dictionary whenever Vietnamese is
  // active. The locale service only resolves vi-VN once the language pack has
  // entered the catalog fallback chain; before (or without) that, lookups slide
  // to `en` and the whole panel stays English even though the dictionary is
  // registered. Resolving locally keeps the panel correct in either state and
  // still defers every other locale to the service.
  const t = (key, params) => {
    const active = String(ctx.locale.getLocale?.()?.active ?? '').toLowerCase();
    if ((active === 'vi-vn' || active === 'vi') && typeof key === 'string' && key in vi) {
      const template = vi[key];
      if (!params) return template;
      return template.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match));
    }
    return baseTranslate(key, params);
  };
  setImTranslator(t);

  // The settings page is the only place that knows the locale the interface is
  // actually rendered in: DSH stores nothing when it came from the browser's
  // language list. Report it so bot messages follow the same language.
  ctx.effect(
    () => installInterfaceLanguageMirror(ctx, {
      rpcCall: (endpoint, payload, signal) =>
        callManagementRpc(ctx.connection, HOST_LANGUAGE_RPC_CHANNEL, endpoint, payload, signal),
    }),
    'im-settings: mirror the DSH interface language',
  );

  ctx.effect(() => installSessionChannelLogos(), 'im-settings: Session channel logos');

  ctx.effect(() => {
    const disposers = [
      installFeishuStyles(),
      installWeixinStyles(),
      installWecomStyles(),
      installQqStyles(),
      installSlackStyles(),
      installTelegramStyles(),
      installDiscordStyles(),
      installWhatsappStyles(),
      installIMessageStyles(),
      installEmailStyles(),
      installImStyles(),
    ];
    return () => {
      for (const dispose of disposers.reverse()) dispose();
    };
  }, 'im-settings: install combined channel styles');

  const feishuRpcCall = (endpoint, payload, signal) =>
    callManagementRpc(ctx.connection, FEISHU_RPC_CHANNEL, endpoint, payload, signal);
  const weixinRpcCall = (endpoint, payload, signal) =>
    callManagementRpc(ctx.connection, WEIXIN_RPC_CHANNEL, endpoint, payload, signal);
  const dingtalkRpcCall = (endpoint, payload, signal) =>
    callManagementRpc(ctx.connection, DINGTALK_RPC_CHANNEL, endpoint, payload, signal);
  const qqRpcCall = (endpoint, payload, signal) =>
    callManagementRpc(ctx.connection, QQ_RPC_CHANNEL, endpoint, payload, signal);
  const wecomRpcCall = (endpoint, payload, signal) =>
    callManagementRpc(ctx.connection, WECOM_RPC_CHANNEL, endpoint, payload, signal);
  const telegramRpcCall = (endpoint, payload, signal) =>
    callManagementRpc(ctx.connection, TELEGRAM_RPC_CHANNEL, endpoint, payload, signal);
  const discordRpcCall = (endpoint, payload, signal) =>
    callManagementRpc(ctx.connection, DISCORD_RPC_CHANNEL, endpoint, payload, signal);
  const whatsappRpcCall = (endpoint, payload, signal) =>
    callManagementRpc(ctx.connection, WHATSAPP_RPC_CHANNEL, endpoint, payload, signal);
  const imessageRpcCall = (endpoint, payload, signal) =>
    callManagementRpc(ctx.connection, IMESSAGE_RPC_CHANNEL, endpoint, payload, signal);
  const emailRpcCall = (endpoint, payload, signal) =>
    callManagementRpc(ctx.connection, EMAIL_RPC_CHANNEL, endpoint, payload, signal);
  const slackRpcCall = (endpoint, payload, signal) =>
    callManagementRpc(ctx.connection, SLACK_RPC_CHANNEL, endpoint, payload, signal);
  const deliveryRpcCall = (endpoint, payload, signal) =>
    callManagementRpc(ctx.connection, DELIVERY_RPC_CHANNEL, endpoint, payload, signal);
  const globalSettingsRpcCall = (endpoint, payload, signal) =>
    callManagementRpc(ctx.connection, GLOBAL_SETTINGS_RPC_CHANNEL, endpoint, payload, signal);
  const workspaceDirectoryPicker = Object.freeze({
    listDirectory: (path, signal) =>
      callWorkspaceDirectoryApi(ctx, 'listDirectory', path, signal),
    pickDirectory: () => callWorkspaceDirectoryApi(ctx, 'pickDirectory'),
  });

  const panelDependencies = {
    dingtalkRpcCall,
    discordRpcCall,
    feishuRpcCall,
    qqRpcCall,
    slackRpcCall,
    telegramRpcCall,
    wecomRpcCall,
    weixinRpcCall,
    whatsappRpcCall,
    imessageRpcCall,
    emailRpcCall,
    deliveryRpcCall,
    globalSettingsRpcCall,
    workspaceDirectoryPicker,
  };
  // Dictionary registration bumps the locale snapshot revision without
  // changing the active locale, so the snapshot key carries the revision too:
  // late-arriving locales (vi-VN) must repaint an already mounted panel.
  const subscribeLocale = (listener) => {
    const disposers = [];
    if (typeof ctx.locale.subscribe === 'function') disposers.push(ctx.locale.subscribe(listener));
    if (typeof ctx.on === 'function') disposers.push(ctx.on('locale/change', listener));
    return () => { for (const dispose of disposers) dispose(); };
  };
  const localeSnapshot = () => {
    const snapshot = ctx.locale.getLocale?.();
    const active = snapshot?.active ?? '';
    return Number.isFinite(snapshot?.revision) ? `${active}#${snapshot.revision}` : active;
  };

  // Stable for this plugin lifetime: creating an element must not create a
  // new component type and reset the reader's selected tab or unsaved input.
  function IMPanel({ preferredSectionId }) {
    React.useSyncExternalStore(subscribeLocale, localeSnapshot, localeSnapshot);
    return h(IMPanelErrorBoundary, null,
      h(IMSettingsTab, { ...panelDependencies, preferredSectionId }));
  }
  const buildPanelElement = (props = {}) => h(IMPanel, {
    preferredSectionId: props.preferredSectionId,
  });

  installImPluginPage(ctx, {
    packageName: manifest.name,
    renderPanel: buildPanelElement,
  });

  ctx.effect(() => {
    let disposed = false;
    let stopSettings = null;
    let registered = false;
    const setSettingsVisible = (visible) => {
      if (disposed) return;
      if (typeof visible !== 'boolean') throw new TypeError('visible must be a boolean');
      if (visible === (stopSettings !== null)) return;
      if (!visible) {
        const stop = stopSettings;
        stopSettings = null;
        stop();
        return;
      }
      // The existing slot controller owns late declarations, withdrawal and
      // re-declaration. Cancelling it also cancels a pending registration.
      stopSettings = ctx.slots.inject('settings.section', () => {
        const unregister = ctx.slots.register({
          name: 'settings.section',
          id: 'dsh-im',
          order: 21,
          label: () => t('IM机器人'),
          locale: IM_LOCALE_NAMESPACE,
          inject: () => panelDependencies,
        }, buildPanelElement);
        registered = true;
        return () => {
          registered = false;
          unregister();
        };
      });
    };

    // Publish only after the default registration is established, so a
    // consumer hiding it during service discovery cannot be overridden.
    setSettingsVisible(true);
    if (typeof ctx.provide === 'function') {
      ctx.provide('dshImClient', Object.freeze({
        version: 1,
        render: (props) => disposed ? null : buildPanelElement(props),
        setSettingsVisible,
        settingsVisible: () => !disposed && registered,
      }));
    }
    return () => {
      disposed = true;
      const stop = stopSettings;
      stopSettings = null;
      registered = false;
      stop?.();
    };
  }, 'im-settings: client panel service');
}
