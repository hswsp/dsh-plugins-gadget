import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * The composer tool-row entry: the OpenCode Go usage readout, mounted in the
 * composer tool row (`conversation.input.right`) next to the model selector.
 * The chip polls the host `/api/ocgo-usage` snapshot (cumulative usage totals
 * from the console JSON API, plus the org monthly budget window and prepaid
 * balance when a console session token is configured); clicking reveals the
 * detail panel, a Set editor (masked workspace/token/api-key) and a manual
 * refresh. In the error state, clicking the chip opens the Set editor
 * directly so a stale credential can be replaced in place.
 * @module dsh-ocgo-usage/client/OcgoDockEntry
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { isOpenCodeGo } from "../provider.js";
import css from './ocgo.module.css';
/** Poll interval for the host snapshot and the live model provider. */
const POLL_MS = 10_000;
/** The masked-prefix shown before the last-4 tail of a secret. */
const MASK = '••••';
/** Same-origin JSON fetch helper. */
async function ocgoFetch(path, init) {
    const response = await fetch(path, init);
    if (!response.ok) {
        throw new Error(`ocgo-usage ${path} failed: ${response.status}`);
    }
    return (await response.json());
}
/** The host usage API as the browser sees it (same-origin JSON endpoints). */
const ocgoApi = {
    view: () => ocgoFetch('/api/ocgo-usage'),
    refresh: () => ocgoFetch('/api/ocgo-usage/refresh'),
    config: () => ocgoFetch('/api/ocgo-usage/config'),
    writeConfig: (partial) => ocgoFetch('/api/ocgo-usage/config', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(partial),
    }),
};
/**
 * Format a duration (seconds) compactly: 45s / 23m / 5h 23m / 4d 6h.
 */
export function formatDuration(totalSec) {
    if (totalSec < 60)
        return `${Math.max(0, Math.floor(totalSec))}s`;
    if (totalSec < 3600)
        return `${Math.floor(totalSec / 60)}m`;
    if (totalSec < 86400) {
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
    const d = Math.floor(totalSec / 86400);
    const h = Math.floor((totalSec % 86400) / 3600);
    return h > 0 ? `${d}d ${h}h` : `${d}d`;
}
/** Format an epoch-ms time as HH:MM. */
function formatClock(epochMs) {
    const d = new Date(epochMs);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
}
/** Micro-cents (10⁻⁸ USD) → a compact currency string, e.g. `$4.44` / `$4438.21`. */
export function formatUsd(microCents) {
    const value = Number.parseInt(microCents ?? '0', 10) / 1e8;
    if (!Number.isFinite(value))
        return '$0';
    if (Math.abs(value) >= 1000)
        return `$${value.toFixed(0)}`;
    return `$${value.toFixed(2)}`;
}
/** Token / request counts → compact units, e.g. `7.0M` / `2.1k`. */
export function formatCount(raw) {
    const value = Number.parseInt(raw ?? '0', 10);
    if (!Number.isFinite(value))
        return '0';
    if (value >= 1e9)
        return `${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6)
        return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3)
        return `${(value / 1e3).toFixed(1)}k`;
    return String(value);
}
/** The severity class of the budget window (muted → escalating warn → err). */
function budgetSeverity(budget) {
    if (budget === undefined)
        return undefined;
    if (budget.exceeded || budget.percent >= 90)
        return css.segCrit90;
    if (budget.percent >= 80)
        return css.segErr80;
    if (budget.percent >= 70)
        return css.segWarn70;
    if (budget.percent >= 60)
        return css.segWarn60;
    if (budget.percent >= 50)
        return css.segWarn50;
    return undefined;
}
/** Detect dark mode via DSH body attribute. */
function useDarkMode() {
    const [dark, setDark] = useState(() => {
        if (typeof document === 'undefined')
            return false;
        return document.body.hasAttribute('data-ds-dark-theme');
    });
    useEffect(() => {
        const el = document.body;
        if (!el)
            return;
        const observer = new MutationObserver(() => {
            setDark(el.hasAttribute('data-ds-dark-theme'));
        });
        observer.observe(el, { attributes: true, attributeFilter: ['data-ds-dark-theme'] });
        return () => observer.disconnect();
    }, []);
    return dark;
}
/** The official OpenCode Go logo mark, inlined to avoid extra asset requests. */
function OcgoLogo() {
    const dark = useDarkMode();
    if (dark) {
        return (_jsxs("svg", { className: css.logo, width: "22", height: "12", viewBox: "0 0 54 30", fill: "none", xmlns: "http://www.w3.org/2000/svg", "aria-hidden": "true", children: [_jsx("rect", { width: "100%", height: "100%", fill: "#2c2c2e" }), _jsx("path", { d: "M24 30H0V0H24V6H6V24H18V18H12V12H24V30Z", fill: "#e6edf3" }), _jsx("path", { d: "M12 18H18V24H6V12H12V18Z", fill: "#646464" }), _jsx("path", { d: "M48 12V24H36V12H48Z", fill: "#646464" }), _jsx("path", { d: "M54 30H30V0H54V30ZM36 24H48V6H36V24Z", fill: "#e6edf3" })] }));
    }
    return (_jsxs("svg", { className: css.logo, width: "22", height: "12", viewBox: "0 0 54 30", fill: "none", xmlns: "http://www.w3.org/2000/svg", "aria-hidden": "true", children: [_jsx("path", { d: "M24 30H0V0H24V6H6V24H18V18H12V12H24V30Z", fill: "#211E1E" }), _jsx("path", { d: "M12 18H18V24H6V12H12V18Z", fill: "#CFCECD" }), _jsx("path", { d: "M48 12V24H36V12H48Z", fill: "#CFCECD" }), _jsx("path", { d: "M54 30H30V0H54V30ZM36 24H48V6H36V24Z", fill: "#211E1E" })] }));
}
/** The masked display text for one secret field: `••••abcd`. */
function maskedText(secret) {
    if (secret === undefined || !secret.set || secret.tail.length === 0)
        return '';
    return `${MASK}${secret.tail}`;
}
/** One compact segment: `· 预算 0%` (or a plain metric). */
function Seg(props) {
    const { sep, className, children } = props;
    return (_jsxs("span", { className: css.seg, children: [_jsx("span", { className: css.segSep, children: sep }), _jsx("span", { className: className ?? undefined, children: children })] }));
}
/** One full panel row: label + value (+ sub). */
function MetricRow(props) {
    const { label, value, sub, valueClass } = props;
    return (_jsxs("span", { className: css.window, children: [_jsx("span", { className: css.windowLabel, children: label }), _jsxs("span", { className: css.windowValue, children: [_jsx("span", { className: valueClass ?? undefined, children: value }), sub !== undefined && _jsx("span", { className: css.windowReset, children: sub })] })] }));
}
/**
 * The OpenCode Go usage chip: polls the host snapshot, renders the budget
 * window + key totals inline, and expands into a detail panel on click.
 * @param props - the composed dock entry props.
 */
export function OcgoDockEntry(props) {
    const [view, setView] = useState(null);
    const [open, setOpen] = useState(false);
    const [visible, setVisible] = useState(true);
    // Panel mode: 'view' = metrics + footer; 'set' = workspace/token/api-key editor.
    const [mode, setMode] = useState('view');
    const [config, setConfig] = useState(null);
    const [wsDraft, setWsDraft] = useState('');
    const [tokenDraft, setTokenDraft] = useState('');
    const [apiKeyDraft, setApiKeyDraft] = useState('');
    const wrapRef = useRef(null);
    const modeRef = useRef('view');
    modeRef.current = mode;
    const draftsRef = useRef({ ws: '', token: '', apiKey: '' });
    draftsRef.current = { ws: wsDraft, token: tokenDraft, apiKey: apiKeyDraft };
    const configRef = useRef(null);
    configRef.current = config;
    // One periodic tick:
    //   1. resolve the session's CURRENT provider from the live in-memory
    //      selection and toggle `visible`;
    //   2. only while visible, fetch the usage snapshot.
    const pollNow = useCallback(() => {
        let live = true;
        const provider = props.provider;
        const resolveProvider = provider !== undefined
            ? Promise.resolve(provider()).then((p) => p ?? undefined, () => undefined)
            : Promise.resolve(undefined);
        resolveProvider.then((p) => {
            if (!live)
                return;
            const shown = isOpenCodeGo(p);
            setVisible(shown);
            if (!shown)
                setOpen(false);
            if (shown) {
                ocgoApi.view().then((snapshot) => {
                    if (live)
                        setView(snapshot);
                }, () => {
                    if (live)
                        setView(null);
                });
            }
        }, () => {
            if (live)
                setVisible(false);
        });
        return () => { live = false; };
    }, [props.provider]);
    useEffect(() => {
        const cleanup = pollNow();
        const timer = window.setInterval(pollNow, POLL_MS);
        const onVisibility = () => {
            if (document.visibilityState === 'visible')
                pollNow();
        };
        document.addEventListener('visibilitychange', onVisibility);
        return () => {
            cleanup();
            window.clearInterval(timer);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [pollNow]);
    /** Load the masked config into the editor drafts. */
    const loadConfig = useCallback(() => {
        ocgoApi.config().then((snapshot) => {
            setConfig(snapshot);
            setWsDraft(maskedText(snapshot.workspaceID));
            setTokenDraft(maskedText(snapshot.token));
            setApiKeyDraft(maskedText(snapshot.apiKey));
        }, () => {
            // Editor still opens; drafts stay empty.
            setConfig(null);
            setWsDraft('');
            setTokenDraft('');
            setApiKeyDraft('');
        });
    }, []);
    /** Submit any edited field; returns the write promise (fire-and-forget on blur). */
    const saveConfig = useCallback(() => {
        const current = configRef.current;
        const partial = {};
        if (current !== null) {
            const ws = draftsRef.current.ws.trim();
            if (ws.length > 0 && ws !== maskedText(current.workspaceID))
                partial.workspaceID = ws;
            const token = draftsRef.current.token.trim();
            if (token.length > 0 && token !== maskedText(current.token))
                partial.token = token;
            const apiKey = draftsRef.current.apiKey.trim();
            if (apiKey.length > 0 && apiKey !== maskedText(current.apiKey))
                partial.apiKey = apiKey;
        }
        else {
            // No baseline loaded (fetch failed): send whatever was typed.
            if (draftsRef.current.ws.trim().length > 0)
                partial.workspaceID = draftsRef.current.ws.trim();
            if (draftsRef.current.token.trim().length > 0)
                partial.token = draftsRef.current.token.trim();
            if (draftsRef.current.apiKey.trim().length > 0)
                partial.apiKey = draftsRef.current.apiKey.trim();
        }
        if (Object.keys(partial).length === 0)
            return;
        ocgoApi.writeConfig(partial).then((snapshot) => {
            setConfig(snapshot);
            setWsDraft(maskedText(snapshot.workspaceID));
            setTokenDraft(maskedText(snapshot.token));
            setApiKeyDraft(maskedText(snapshot.apiKey));
            // New credentials are live now (host invalidated its cache): poll now.
            pollNow();
        }, () => {
            // Ignore; the next poll resyncs and the editor keeps the drafts.
        });
    }, [pollNow]);
    /** Close the panel; in set mode a blur/close acts as confirm (save). */
    const closePanel = useCallback(() => {
        if (modeRef.current === 'set')
            saveConfig();
        setOpen(false);
        setMode('view');
    }, [saveConfig]);
    /** Open the editor (used by the Set button and the error chip). */
    const openSet = useCallback(() => {
        setMode('set');
        setOpen(true);
        loadConfig();
    }, [loadConfig]);
    // Close the detail panel when focus leaves the chip: any pointer press
    // outside the wrapper, or Escape. In set mode this CONFIRMS (saves).
    useEffect(() => {
        if (!open)
            return;
        const onPointerDown = (event) => {
            const target = event.target;
            if (target !== null && wrapRef.current !== null && !wrapRef.current.contains(target)) {
                closePanel();
            }
        };
        const onKeyDown = (event) => {
            if (event.key === 'Escape')
                closePanel();
        };
        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('pointerdown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open, closePanel]);
    const refresh = () => {
        ocgoApi.refresh().then((snapshot) => {
            setView(snapshot);
        }, () => {
            // Ignore transport errors on manual refresh; the next poll resyncs.
        });
    };
    const t = props.t;
    const sep = ` ${t('ocgo.sep')} `;
    // Hidden whenever the live provider is not opencode-go — the pi-ocgo-usage
    // behaviour: switching to e.g. DeepSeek official hides the chip within one
    // poll interval, so no other provider's user sees OpenCode Go numbers.
    if (!visible)
        return null;
    const error = view === null ? { code: 'fetch', message: t('ocgo.error', { code: 'fetch' }) }
        : view.error !== undefined
            ? { code: view.error, message: view.message ?? t('ocgo.error', { code: view.error }) }
            : null;
    // Error state: the chip opens the Set editor directly so a stale credential
    // can be replaced in place; clicking outside (or Esc) confirms the write.
    if (error !== null) {
        return (_jsxs("span", { className: css.wrap, ref: wrapRef, "data-testid": "ocgo-chip-error", children: [_jsxs("button", { type: "button", className: open ? `${css.chip} ${css.chipOpen}` : css.chip, onClick: () => { if (open)
                        closePanel();
                    else
                        openSet(); }, title: `${error.message}\n${t('ocgo.set')}`, children: [_jsx(OcgoLogo, {}), " <err:", error.code, ">"] }), open && (_jsx("span", { className: css.details, children: _jsxs("span", { className: css.setPanel, children: [_jsxs("label", { className: css.field, children: [_jsx("span", { className: css.fieldLabel, children: t('ocgo.workspaceID') }), _jsx("input", { className: css.fieldInput, value: wsDraft, placeholder: "wrk_\u2026", spellCheck: false, autoComplete: "off", onChange: (e) => { setWsDraft(e.target.value); }, onFocus: (e) => { if (e.target.value === maskedText(config?.workspaceID))
                                            e.target.select(); } })] }), _jsxs("label", { className: css.field, children: [_jsx("span", { className: css.fieldLabel, children: t('ocgo.token') }), _jsx("input", { className: css.fieldInput, value: tokenDraft, placeholder: "st_\u2026", spellCheck: false, autoComplete: "off", onChange: (e) => { setTokenDraft(e.target.value); }, onFocus: (e) => { if (e.target.value === maskedText(config?.token))
                                            e.target.select(); } })] }), _jsxs("label", { className: css.field, children: [_jsx("span", { className: css.fieldLabel, children: t('ocgo.apiKey') }), _jsx("input", { className: css.fieldInput, value: apiKeyDraft, placeholder: "\uFF08\u53EF\u9009\uFF09\u4EC5\u7D2F\u8BA1\u7528\u91CF", spellCheck: false, autoComplete: "off", onChange: (e) => { setApiKeyDraft(e.target.value); }, onFocus: (e) => { if (e.target.value === maskedText(config?.apiKey))
                                            e.target.select(); } })] }), _jsxs("span", { className: css.foot, children: [_jsx("span", { className: css.setHint, children: t('ocgo.setHint') }), _jsx("button", { type: "button", className: css.refreshBtn, onClick: closePanel, children: t('ocgo.save') })] })] }) }))] }));
    }
    // TS: after the error early-return, `view` is a non-null success snapshot.
    const snapshot = view;
    const budget = snapshot.budget;
    const usage = snapshot.usage;
    const billing = snapshot.billing;
    // Nothing usable (e.g. brand-new account): show unavailable, refreshable.
    if (budget === undefined && usage === undefined) {
        return (_jsxs("button", { type: "button", className: css.chip, onClick: refresh, title: t('ocgo.refresh'), "data-testid": "ocgo-chip-empty", children: [_jsx(OcgoLogo, {}), " ", t('ocgo.unavailable')] }));
    }
    // Compact chip: budget % (+ cost when no budget) + freshness.
    const budgetCls = budgetSeverity(budget);
    const chipSegs = [];
    if (budget !== undefined) {
        chipSegs.push(_jsxs(Seg, { sep: sep, className: budgetCls, children: [t('ocgo.budget'), " ", budget.percent, "%"] }, "budget"));
        chipSegs.push(_jsx(Seg, { sep: sep, children: formatUsd(usage?.costMicroCents) }, "cost"));
    }
    else {
        chipSegs.push(_jsx(Seg, { sep: sep, children: formatUsd(usage?.costMicroCents) }, "cost"));
        chipSegs.push(_jsxs(Seg, { sep: sep, children: [formatCount(usage?.requests), " ", t('ocgo.requestsChip')] }, "req"));
    }
    chipSegs.push(_jsx(Seg, { sep: sep, children: t('ocgo.fetchedAt', { time: formatClock(snapshot.updatedAt ?? Date.now()) }) }, "upd"));
    return (_jsxs("span", { className: css.wrap, ref: wrapRef, "data-testid": "ocgo-chip", children: [_jsxs("button", { type: "button", className: open ? `${css.chip} ${css.chipOpen}` : css.chip, onClick: () => { if (open)
                    closePanel();
                else
                    setOpen(true); }, title: open ? t('ocgo.collapse') : t('ocgo.expand'), children: [_jsx(OcgoLogo, {}), chipSegs, _jsx("span", { className: open ? `${css.chevron} ${css.chevronOpen}` : css.chevron, "aria-hidden": "true", children: _jsx("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "none", children: _jsx("path", { d: "M3 4.5L6 7.5L9 4.5", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }) }) })] }), open && (_jsx("span", { className: css.details, children: mode === 'set' ? (_jsxs("span", { className: css.setPanel, children: [_jsxs("label", { className: css.field, children: [_jsx("span", { className: css.fieldLabel, children: t('ocgo.workspaceID') }), _jsx("input", { className: css.fieldInput, value: wsDraft, placeholder: "wrk_\u2026", spellCheck: false, autoComplete: "off", onChange: (e) => { setWsDraft(e.target.value); }, onFocus: (e) => { if (e.target.value === maskedText(config?.workspaceID))
                                        e.target.select(); } })] }), _jsxs("label", { className: css.field, children: [_jsx("span", { className: css.fieldLabel, children: t('ocgo.token') }), _jsx("input", { className: css.fieldInput, value: tokenDraft, placeholder: "st_\u2026", spellCheck: false, autoComplete: "off", onChange: (e) => { setTokenDraft(e.target.value); }, onFocus: (e) => { if (e.target.value === maskedText(config?.token))
                                        e.target.select(); } })] }), _jsxs("label", { className: css.field, children: [_jsx("span", { className: css.fieldLabel, children: t('ocgo.apiKey') }), _jsx("input", { className: css.fieldInput, value: apiKeyDraft, placeholder: "\uFF08\u53EF\u9009\uFF09\u4EC5\u7D2F\u8BA1\u7528\u91CF", spellCheck: false, autoComplete: "off", onChange: (e) => { setApiKeyDraft(e.target.value); }, onFocus: (e) => { if (e.target.value === maskedText(config?.apiKey))
                                        e.target.select(); } })] }), _jsxs("span", { className: css.foot, children: [_jsx("span", { className: css.setHint, children: t('ocgo.setHint') }), _jsx("button", { type: "button", className: css.refreshBtn, onClick: closePanel, children: t('ocgo.save') })] })] })) : (_jsxs(_Fragment, { children: [budget !== undefined && (_jsx(MetricRow, { label: budget.exceeded ? t('ocgo.exceeded') : t('ocgo.budget'), value: `${budget.percent}%`, sub: `${t('ocgo.spentOf', { spent: formatUsd(budget.spentMicroCents), limit: formatUsd(budget.limitMicroCents) })} · ${t('ocgo.resetsIn', { duration: formatDuration(budget.resetInSec) })}`, valueClass: budgetSeverity(budget) })), usage !== undefined && (_jsxs(_Fragment, { children: [_jsx(MetricRow, { label: t('ocgo.requests'), value: formatCount(usage.requests) }), _jsx(MetricRow, { label: t('ocgo.inputTokens'), value: formatCount(usage.inputTokens) }), _jsx(MetricRow, { label: t('ocgo.outputTokens'), value: formatCount(usage.outputTokens) }), _jsx(MetricRow, { label: t('ocgo.cacheTokens'), value: formatCount(usage.cacheTokens) }), _jsx(MetricRow, { label: t('ocgo.cost'), value: formatUsd(usage.costMicroCents) })] })), billing !== undefined && (_jsx(MetricRow, { label: t('ocgo.balance'), value: formatUsd(billing.balanceMicroCents) })), _jsxs("span", { className: css.foot, children: [_jsx("button", { type: "button", className: css.setBtn, onClick: openSet, children: t('ocgo.set') }), _jsxs("span", { className: css.footRight, children: [_jsx("button", { type: "button", className: css.refreshBtn, onClick: refresh, children: t('ocgo.refresh') }), snapshot.updatedAt !== undefined && (_jsx("span", { className: css.fetchedAt, children: t('ocgo.fetchedAt', { time: formatClock(snapshot.updatedAt) }) }))] })] })] })) }))] }));
}
