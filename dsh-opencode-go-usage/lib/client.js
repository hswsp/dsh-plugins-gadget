window.__ModuleLoader__.load({
	id: "dsh-ocgo-usage",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/provider.ts
		/**
		* Provider matching for dsh-ocgo-usage: decide when the chip should show.
		* Pure and shared so the client logic is unit-testable without a browser.
		* @module dsh-ocgo-usage/provider
		*/
		/** The provider whose model selection shows the chip. */
		const OCGO_PROVIDER = "opencode-go";
		/** True when a provider/model means "show OpenCode Go usage". */
		function isOpenCodeGo(provider) {
			return provider === "opencode-go" || provider?.startsWith(`opencode-go/`) === true;
		}
		//#endregion
		//#region \0dsh-css:/Users/wu000376/Github/dsh-plugins-gadget/dsh-opencode-go-usage/src/client/ocgo.module.css.mjs
		const css = ".OhHKqG_wrap{display:inline-flex;position:relative}.OhHKqG_chip{height:24px;color:var(--dsw-alias-label-primary,#0f1115);cursor:pointer;white-space:nowrap;user-select:none;background:0 0;border:0;border-radius:999px;align-items:center;gap:6px;padding:0 6px 0 8px;font-size:12px;line-height:1;transition:background-color .12s;display:inline-flex}.OhHKqG_chip:hover,.OhHKqG_chipOpen{background:var(--dsw-alias-interactive-bg-hover,#2631480f)}.OhHKqG_seg{align-items:baseline;gap:3px;display:inline-flex}.OhHKqG_segSep{opacity:.45}.OhHKqG_logo{flex:none;display:inline-flex}.OhHKqG_chevron{color:var(--dsw-alias-label-caption,#81858c);flex:none;transition:transform .12s;display:inline-flex}.OhHKqG_chevronOpen{transform:rotate(180deg)}.OhHKqG_segWarn50{color:var(--dsw-static-amber-400,#f7ad31)}.OhHKqG_segWarn60{color:var(--dsw-static-amber-500,#f59e0b)}.OhHKqG_segWarn70{color:var(--dsw-static-amber-600,#dd8629)}.OhHKqG_segErr80{color:var(--dsw-alias-state-error-primary,#dc2626)}.OhHKqG_segCrit90{color:var(--dsw-alias-state-error-primary,#dc2626);font-weight:600}.OhHKqG_details{z-index:40;border:1px solid var(--dsw-alias-border-l2,#0000001a);background:var(--dsw-specific-menu,#fff);min-width:220px;color:var(--dsw-alias-label-primary,#0f1115);box-shadow:var(--dsw-shadow-lv3,0 4px 12px #00000014);border-radius:8px;flex-direction:column;gap:6px;padding:8px 10px;font-size:12px;display:flex;position:absolute;bottom:calc(100% + 6px);left:50%;transform:translate(-50%)}.OhHKqG_window{justify-content:space-between;align-items:center;gap:12px;display:flex}.OhHKqG_windowLabel{color:var(--dsw-alias-label-secondary,#61666b);opacity:.9;align-items:center;gap:6px;display:inline-flex}.OhHKqG_windowValue{font-variant-numeric:tabular-nums;align-items:baseline;gap:6px;display:inline-flex}.OhHKqG_windowReset{opacity:.65;font-variant-numeric:tabular-nums;font-size:11px}.OhHKqG_foot{border-top:1px solid var(--dsw-alias-border-l1,#0000000a);justify-content:space-between;align-items:center;gap:8px;padding-top:6px;font-size:11px;display:flex}.OhHKqG_footRight{align-items:center;gap:8px;margin-left:auto;display:inline-flex}.OhHKqG_setBtn{color:var(--dsw-alias-state-business-primary,#3964fe);cursor:pointer;background:0 0;border:0;padding:0;font-size:11px}.OhHKqG_setBtn:hover{text-decoration:underline}.OhHKqG_fetchedAt{opacity:.6}.OhHKqG_refreshBtn{color:var(--dsw-alias-state-business-primary,#3964fe);cursor:pointer;background:0 0;border:0;padding:0;font-size:11px}.OhHKqG_refreshBtn:hover{text-decoration:underline}.OhHKqG_setPanel{flex-direction:column;gap:8px;min-width:260px;display:flex}.OhHKqG_field{flex-direction:column;gap:3px;display:flex}.OhHKqG_fieldLabel{color:var(--dsw-alias-label-secondary,#61666b);opacity:.75;font-variant-numeric:tabular-nums;font-size:11px}.OhHKqG_fieldInput{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,#0000001a);background:var(--dsw-alias-bg-layer-1,#fff);width:100%;color:var(--dsw-alias-label-primary,#0f1115);font-variant-numeric:tabular-nums;border-radius:6px;outline:none;height:26px;padding:0 8px;font-size:12px}.OhHKqG_fieldInput:focus{border-color:var(--dsw-alias-state-business-primary,#3964fe)}.OhHKqG_setHint{opacity:.55;font-size:11px}.OhHKqG_errorText{color:var(--dsw-alias-state-error-primary,#dc2626);white-space:normal;max-width:240px;font-size:11px}";
		const tagId = "dsh-ocgo-usage/ocgo.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-ocgo-usage";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var ocgo_module_css_default = {
			"chevron": "OhHKqG_chevron",
			"chevronOpen": "OhHKqG_chevronOpen",
			"chip": "OhHKqG_chip",
			"chipOpen": "OhHKqG_chipOpen",
			"details": "OhHKqG_details",
			"errorText": "OhHKqG_errorText",
			"fetchedAt": "OhHKqG_fetchedAt",
			"field": "OhHKqG_field",
			"fieldInput": "OhHKqG_fieldInput",
			"fieldLabel": "OhHKqG_fieldLabel",
			"foot": "OhHKqG_foot",
			"footRight": "OhHKqG_footRight",
			"logo": "OhHKqG_logo",
			"refreshBtn": "OhHKqG_refreshBtn",
			"seg": "OhHKqG_seg",
			"segCrit90": "OhHKqG_segCrit90",
			"segErr80": "OhHKqG_segErr80",
			"segSep": "OhHKqG_segSep",
			"segWarn50": "OhHKqG_segWarn50",
			"segWarn60": "OhHKqG_segWarn60",
			"segWarn70": "OhHKqG_segWarn70",
			"setBtn": "OhHKqG_setBtn",
			"setHint": "OhHKqG_setHint",
			"setPanel": "OhHKqG_setPanel",
			"window": "OhHKqG_window",
			"windowLabel": "OhHKqG_windowLabel",
			"windowReset": "OhHKqG_windowReset",
			"windowValue": "OhHKqG_windowValue",
			"wrap": "OhHKqG_wrap"
		};
		//#endregion
		//#region src/client/OcgoDockEntry.tsx
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
		/** Poll interval for the host snapshot and the live model provider. */
		const POLL_MS = 1e4;
		/** The masked-prefix shown before the last-4 tail of a secret. */
		const MASK = "••••";
		/** Same-origin JSON fetch helper. */
		async function ocgoFetch(path, init) {
			const response = await fetch(path, init);
			if (!response.ok) throw new Error(`ocgo-usage ${path} failed: ${response.status}`);
			return await response.json();
		}
		/** The host usage API as the browser sees it (same-origin JSON endpoints). */
		const ocgoApi = {
			view: () => ocgoFetch("/api/ocgo-usage"),
			refresh: () => ocgoFetch("/api/ocgo-usage/refresh"),
			config: () => ocgoFetch("/api/ocgo-usage/config"),
			writeConfig: (partial) => ocgoFetch("/api/ocgo-usage/config", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(partial)
			})
		};
		/**
		* Format a duration (seconds) compactly: 45s / 23m / 5h 23m / 4d 6h.
		*/
		function formatDuration(totalSec) {
			if (totalSec < 60) return `${Math.max(0, Math.floor(totalSec))}s`;
			if (totalSec < 3600) return `${Math.floor(totalSec / 60)}m`;
			if (totalSec < 86400) {
				const h = Math.floor(totalSec / 3600);
				const m = Math.floor(totalSec % 3600 / 60);
				return m > 0 ? `${h}h ${m}m` : `${h}h`;
			}
			const d = Math.floor(totalSec / 86400);
			const h = Math.floor(totalSec % 86400 / 3600);
			return h > 0 ? `${d}d ${h}h` : `${d}d`;
		}
		/** Format an epoch-ms time as HH:MM. */
		function formatClock(epochMs) {
			const d = new Date(epochMs);
			return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
		}
		/** Micro-cents (10⁻⁸ USD) → a compact currency string, e.g. `$4.44` / `$4438.21`. */
		function formatUsd(microCents) {
			const value = Number.parseInt(microCents ?? "0", 10) / 1e8;
			if (!Number.isFinite(value)) return "$0";
			if (Math.abs(value) >= 1e3) return `$${value.toFixed(0)}`;
			return `$${value.toFixed(2)}`;
		}
		/** Token / request counts → compact units, e.g. `7.0M` / `2.1k`. */
		function formatCount(raw) {
			const value = Number.parseInt(raw ?? "0", 10);
			if (!Number.isFinite(value)) return "0";
			if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
			if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
			if (value >= 1e3) return `${(value / 1e3).toFixed(1)}k`;
			return String(value);
		}
		/** The severity class of the budget window (muted → escalating warn → err). */
		function budgetSeverity(budget) {
			if (budget === void 0) return void 0;
			if (budget.exceeded || budget.percent >= 90) return ocgo_module_css_default.segCrit90;
			if (budget.percent >= 80) return ocgo_module_css_default.segErr80;
			if (budget.percent >= 70) return ocgo_module_css_default.segWarn70;
			if (budget.percent >= 60) return ocgo_module_css_default.segWarn60;
			if (budget.percent >= 50) return ocgo_module_css_default.segWarn50;
		}
		/** Detect dark mode via DSH body attribute. */
		function useDarkMode() {
			const [dark, setDark] = (0, react.useState)(() => {
				if (typeof document === "undefined") return false;
				return document.body.hasAttribute("data-ds-dark-theme");
			});
			(0, react.useEffect)(() => {
				const el = document.body;
				if (!el) return;
				const observer = new MutationObserver(() => {
					setDark(el.hasAttribute("data-ds-dark-theme"));
				});
				observer.observe(el, {
					attributes: true,
					attributeFilter: ["data-ds-dark-theme"]
				});
				return () => observer.disconnect();
			}, []);
			return dark;
		}
		/** The official OpenCode Go logo mark, inlined to avoid extra asset requests. */
		function OcgoLogo() {
			if (useDarkMode()) return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				className: ocgo_module_css_default.logo,
				width: "22",
				height: "12",
				viewBox: "0 0 54 30",
				fill: "none",
				xmlns: "http://www.w3.org/2000/svg",
				"aria-hidden": "true",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
						width: "100%",
						height: "100%",
						fill: "#2c2c2e"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: "M24 30H0V0H24V6H6V24H18V18H12V12H24V30Z",
						fill: "#e6edf3"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: "M12 18H18V24H6V12H12V18Z",
						fill: "#646464"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: "M48 12V24H36V12H48Z",
						fill: "#646464"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: "M54 30H30V0H54V30ZM36 24H48V6H36V24Z",
						fill: "#e6edf3"
					})
				]
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				className: ocgo_module_css_default.logo,
				width: "22",
				height: "12",
				viewBox: "0 0 54 30",
				fill: "none",
				xmlns: "http://www.w3.org/2000/svg",
				"aria-hidden": "true",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: "M24 30H0V0H24V6H6V24H18V18H12V12H24V30Z",
						fill: "#211E1E"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: "M12 18H18V24H6V12H12V18Z",
						fill: "#CFCECD"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: "M48 12V24H36V12H48Z",
						fill: "#CFCECD"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: "M54 30H30V0H54V30ZM36 24H48V6H36V24Z",
						fill: "#211E1E"
					})
				]
			});
		}
		/** The masked display text for one secret field: `••••abcd`. */
		function maskedText(secret) {
			if (secret === void 0 || !secret.set || secret.tail.length === 0) return "";
			return `${MASK}${secret.tail}`;
		}
		/** One compact segment: `· 预算 0%` (or a plain metric). */
		function Seg(props) {
			const { sep, className, children } = props;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
				className: ocgo_module_css_default.seg,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: ocgo_module_css_default.segSep,
					children: sep
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: className ?? void 0,
					children
				})]
			});
		}
		/** One full panel row: label + value (+ sub). */
		function MetricRow(props) {
			const { label, value, sub, valueClass } = props;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
				className: ocgo_module_css_default.window,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: ocgo_module_css_default.windowLabel,
					children: label
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
					className: ocgo_module_css_default.windowValue,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: valueClass ?? void 0,
						children: value
					}), sub !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: ocgo_module_css_default.windowReset,
						children: sub
					})]
				})]
			});
		}
		/**
		* The OpenCode Go usage chip: polls the host snapshot, renders the budget
		* window + key totals inline, and expands into a detail panel on click.
		* @param props - the composed dock entry props.
		*/
		function OcgoDockEntry(props) {
			const [view, setView] = (0, react.useState)(null);
			const [open, setOpen] = (0, react.useState)(false);
			const [visible, setVisible] = (0, react.useState)(true);
			const [mode, setMode] = (0, react.useState)("view");
			const [config, setConfig] = (0, react.useState)(null);
			const [wsDraft, setWsDraft] = (0, react.useState)("");
			const [tokenDraft, setTokenDraft] = (0, react.useState)("");
			const [apiKeyDraft, setApiKeyDraft] = (0, react.useState)("");
			const wrapRef = (0, react.useRef)(null);
			const modeRef = (0, react.useRef)("view");
			modeRef.current = mode;
			const draftsRef = (0, react.useRef)({
				ws: "",
				token: "",
				apiKey: ""
			});
			draftsRef.current = {
				ws: wsDraft,
				token: tokenDraft,
				apiKey: apiKeyDraft
			};
			const configRef = (0, react.useRef)(null);
			configRef.current = config;
			const pollNow = (0, react.useCallback)(() => {
				let live = true;
				const provider = props.provider;
				(provider !== void 0 ? Promise.resolve(provider()).then((p) => p ?? void 0, () => void 0) : Promise.resolve(void 0)).then((p) => {
					if (!live) return;
					const shown = isOpenCodeGo(p);
					setVisible(shown);
					if (!shown) setOpen(false);
					if (shown) ocgoApi.view().then((snapshot) => {
						if (live) setView(snapshot);
					}, () => {
						if (live) setView(null);
					});
				}, () => {
					if (live) setVisible(false);
				});
				return () => {
					live = false;
				};
			}, [props.provider]);
			(0, react.useEffect)(() => {
				const cleanup = pollNow();
				const timer = window.setInterval(pollNow, POLL_MS);
				const onVisibility = () => {
					if (document.visibilityState === "visible") pollNow();
				};
				document.addEventListener("visibilitychange", onVisibility);
				return () => {
					cleanup();
					window.clearInterval(timer);
					document.removeEventListener("visibilitychange", onVisibility);
				};
			}, [pollNow]);
			/** Load the masked config into the editor drafts. */
			const loadConfig = (0, react.useCallback)(() => {
				ocgoApi.config().then((snapshot) => {
					setConfig(snapshot);
					setWsDraft(maskedText(snapshot.workspaceID));
					setTokenDraft(maskedText(snapshot.token));
					setApiKeyDraft(maskedText(snapshot.apiKey));
				}, () => {
					setConfig(null);
					setWsDraft("");
					setTokenDraft("");
					setApiKeyDraft("");
				});
			}, []);
			/** Submit any edited field; returns the write promise (fire-and-forget on blur). */
			const saveConfig = (0, react.useCallback)(() => {
				const current = configRef.current;
				const partial = {};
				if (current !== null) {
					const ws = draftsRef.current.ws.trim();
					if (ws.length > 0 && ws !== maskedText(current.workspaceID)) partial.workspaceID = ws;
					const token = draftsRef.current.token.trim();
					if (token.length > 0 && token !== maskedText(current.token)) partial.token = token;
					const apiKey = draftsRef.current.apiKey.trim();
					if (apiKey.length > 0 && apiKey !== maskedText(current.apiKey)) partial.apiKey = apiKey;
				} else {
					if (draftsRef.current.ws.trim().length > 0) partial.workspaceID = draftsRef.current.ws.trim();
					if (draftsRef.current.token.trim().length > 0) partial.token = draftsRef.current.token.trim();
					if (draftsRef.current.apiKey.trim().length > 0) partial.apiKey = draftsRef.current.apiKey.trim();
				}
				if (Object.keys(partial).length === 0) return;
				ocgoApi.writeConfig(partial).then((snapshot) => {
					setConfig(snapshot);
					setWsDraft(maskedText(snapshot.workspaceID));
					setTokenDraft(maskedText(snapshot.token));
					setApiKeyDraft(maskedText(snapshot.apiKey));
					pollNow();
				}, () => {});
			}, [pollNow]);
			/** Close the panel; in set mode a blur/close acts as confirm (save). */
			const closePanel = (0, react.useCallback)(() => {
				if (modeRef.current === "set") saveConfig();
				setOpen(false);
				setMode("view");
			}, [saveConfig]);
			/** Open the editor (used by the Set button and the error chip). */
			const openSet = (0, react.useCallback)(() => {
				setMode("set");
				setOpen(true);
				loadConfig();
			}, [loadConfig]);
			(0, react.useEffect)(() => {
				if (!open) return;
				const onPointerDown = (event) => {
					const target = event.target;
					if (target !== null && wrapRef.current !== null && !wrapRef.current.contains(target)) closePanel();
				};
				const onKeyDown = (event) => {
					if (event.key === "Escape") closePanel();
				};
				document.addEventListener("pointerdown", onPointerDown);
				document.addEventListener("keydown", onKeyDown);
				return () => {
					document.removeEventListener("pointerdown", onPointerDown);
					document.removeEventListener("keydown", onKeyDown);
				};
			}, [open, closePanel]);
			const refresh = () => {
				ocgoApi.refresh().then((snapshot) => {
					setView(snapshot);
				}, () => {});
			};
			const t = props.t;
			const sep = ` ${t("ocgo.sep")} `;
			if (!visible) return null;
			const error = view === null ? {
				code: "fetch",
				message: t("ocgo.error", { code: "fetch" })
			} : view.error !== void 0 ? {
				code: view.error,
				message: view.message ?? t("ocgo.error", { code: view.error })
			} : null;
			if (error !== null) return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
				className: ocgo_module_css_default.wrap,
				ref: wrapRef,
				"data-testid": "ocgo-chip-error",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: open ? `${ocgo_module_css_default.chip} ${ocgo_module_css_default.chipOpen}` : ocgo_module_css_default.chip,
					onClick: () => {
						if (open) closePanel();
						else openSet();
					},
					title: `${error.message}\n${t("ocgo.set")}`,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(OcgoLogo, {}),
						" <err:",
						error.code,
						">"
					]
				}), open && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: ocgo_module_css_default.details,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: ocgo_module_css_default.setPanel,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
								className: ocgo_module_css_default.field,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: ocgo_module_css_default.fieldLabel,
									children: t("ocgo.workspaceID")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									className: ocgo_module_css_default.fieldInput,
									value: wsDraft,
									placeholder: "wrk_…",
									spellCheck: false,
									autoComplete: "off",
									onChange: (e) => {
										setWsDraft(e.target.value);
									},
									onFocus: (e) => {
										if (e.target.value === maskedText(config?.workspaceID)) e.target.select();
									}
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
								className: ocgo_module_css_default.field,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: ocgo_module_css_default.fieldLabel,
									children: t("ocgo.token")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									className: ocgo_module_css_default.fieldInput,
									value: tokenDraft,
									placeholder: "st_…",
									spellCheck: false,
									autoComplete: "off",
									onChange: (e) => {
										setTokenDraft(e.target.value);
									},
									onFocus: (e) => {
										if (e.target.value === maskedText(config?.token)) e.target.select();
									}
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
								className: ocgo_module_css_default.field,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: ocgo_module_css_default.fieldLabel,
									children: t("ocgo.apiKey")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									className: ocgo_module_css_default.fieldInput,
									value: apiKeyDraft,
									placeholder: "（可选）仅累计用量",
									spellCheck: false,
									autoComplete: "off",
									onChange: (e) => {
										setApiKeyDraft(e.target.value);
									},
									onFocus: (e) => {
										if (e.target.value === maskedText(config?.apiKey)) e.target.select();
									}
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: ocgo_module_css_default.foot,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: ocgo_module_css_default.setHint,
									children: t("ocgo.setHint")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: ocgo_module_css_default.refreshBtn,
									onClick: closePanel,
									children: t("ocgo.save")
								})]
							})
						]
					})
				})]
			});
			const snapshot = view;
			const budget = snapshot.budget;
			const usage = snapshot.usage;
			const billing = snapshot.billing;
			if (budget === void 0 && usage === void 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				className: ocgo_module_css_default.chip,
				onClick: refresh,
				title: t("ocgo.refresh"),
				"data-testid": "ocgo-chip-empty",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(OcgoLogo, {}),
					" ",
					t("ocgo.unavailable")
				]
			});
			const budgetCls = budgetSeverity(budget);
			const chipSegs = [];
			if (budget !== void 0) {
				chipSegs.push(/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Seg, {
					sep,
					className: budgetCls,
					children: [
						t("ocgo.budget"),
						" ",
						budget.percent,
						"%"
					]
				}, "budget"));
				chipSegs.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Seg, {
					sep,
					children: formatUsd(usage?.costMicroCents)
				}, "cost"));
			} else {
				chipSegs.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Seg, {
					sep,
					children: formatUsd(usage?.costMicroCents)
				}, "cost"));
				chipSegs.push(/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Seg, {
					sep,
					children: [
						formatCount(usage?.requests),
						" ",
						t("ocgo.requestsChip")
					]
				}, "req"));
			}
			chipSegs.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Seg, {
				sep,
				children: t("ocgo.fetchedAt", { time: formatClock(snapshot.updatedAt ?? Date.now()) })
			}, "upd"));
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
				className: ocgo_module_css_default.wrap,
				ref: wrapRef,
				"data-testid": "ocgo-chip",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: open ? `${ocgo_module_css_default.chip} ${ocgo_module_css_default.chipOpen}` : ocgo_module_css_default.chip,
					onClick: () => {
						if (open) closePanel();
						else setOpen(true);
					},
					title: open ? t("ocgo.collapse") : t("ocgo.expand"),
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(OcgoLogo, {}),
						chipSegs,
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: open ? `${ocgo_module_css_default.chevron} ${ocgo_module_css_default.chevronOpen}` : ocgo_module_css_default.chevron,
							"aria-hidden": "true",
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
								width: "12",
								height: "12",
								viewBox: "0 0 12 12",
								fill: "none",
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
									d: "M3 4.5L6 7.5L9 4.5",
									stroke: "currentColor",
									strokeWidth: "1.5",
									strokeLinecap: "round",
									strokeLinejoin: "round"
								})
							})
						})
					]
				}), open && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: ocgo_module_css_default.details,
					children: mode === "set" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: ocgo_module_css_default.setPanel,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
								className: ocgo_module_css_default.field,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: ocgo_module_css_default.fieldLabel,
									children: t("ocgo.workspaceID")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									className: ocgo_module_css_default.fieldInput,
									value: wsDraft,
									placeholder: "wrk_…",
									spellCheck: false,
									autoComplete: "off",
									onChange: (e) => {
										setWsDraft(e.target.value);
									},
									onFocus: (e) => {
										if (e.target.value === maskedText(config?.workspaceID)) e.target.select();
									}
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
								className: ocgo_module_css_default.field,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: ocgo_module_css_default.fieldLabel,
									children: t("ocgo.token")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									className: ocgo_module_css_default.fieldInput,
									value: tokenDraft,
									placeholder: "st_…",
									spellCheck: false,
									autoComplete: "off",
									onChange: (e) => {
										setTokenDraft(e.target.value);
									},
									onFocus: (e) => {
										if (e.target.value === maskedText(config?.token)) e.target.select();
									}
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
								className: ocgo_module_css_default.field,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: ocgo_module_css_default.fieldLabel,
									children: t("ocgo.apiKey")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									className: ocgo_module_css_default.fieldInput,
									value: apiKeyDraft,
									placeholder: "（可选）仅累计用量",
									spellCheck: false,
									autoComplete: "off",
									onChange: (e) => {
										setApiKeyDraft(e.target.value);
									},
									onFocus: (e) => {
										if (e.target.value === maskedText(config?.apiKey)) e.target.select();
									}
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: ocgo_module_css_default.foot,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: ocgo_module_css_default.setHint,
									children: t("ocgo.setHint")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: ocgo_module_css_default.refreshBtn,
									onClick: closePanel,
									children: t("ocgo.save")
								})]
							})
						]
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
						budget !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MetricRow, {
							label: budget.exceeded ? t("ocgo.exceeded") : t("ocgo.budget"),
							value: `${budget.percent}%`,
							sub: `${t("ocgo.spentOf", {
								spent: formatUsd(budget.spentMicroCents),
								limit: formatUsd(budget.limitMicroCents)
							})} · ${t("ocgo.resetsIn", { duration: formatDuration(budget.resetInSec) })}`,
							valueClass: budgetSeverity(budget)
						}),
						usage !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(MetricRow, {
								label: t("ocgo.requests"),
								value: formatCount(usage.requests)
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(MetricRow, {
								label: t("ocgo.inputTokens"),
								value: formatCount(usage.inputTokens)
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(MetricRow, {
								label: t("ocgo.outputTokens"),
								value: formatCount(usage.outputTokens)
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(MetricRow, {
								label: t("ocgo.cacheTokens"),
								value: formatCount(usage.cacheTokens)
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(MetricRow, {
								label: t("ocgo.cost"),
								value: formatUsd(usage.costMicroCents)
							})
						] }),
						billing !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MetricRow, {
							label: t("ocgo.balance"),
							value: formatUsd(billing.balanceMicroCents)
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: ocgo_module_css_default.foot,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: ocgo_module_css_default.setBtn,
								onClick: openSet,
								children: t("ocgo.set")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: ocgo_module_css_default.footRight,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: ocgo_module_css_default.refreshBtn,
									onClick: refresh,
									children: t("ocgo.refresh")
								}), snapshot.updatedAt !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: ocgo_module_css_default.fetchedAt,
									children: t("ocgo.fetchedAt", { time: formatClock(snapshot.updatedAt) })
								})]
							})]
						})
					] })
				})]
			});
		}
		//#endregion
		//#region src/client/locales.ts
		/** Chinese copy. */
		const zh = {
			"ocgo.unavailable": "用量不可用",
			"ocgo.error": "查询失败：{code}",
			"ocgo.noconfig": "未配置：请在 Set 里填写 workspace id 与控制台 token（或 API key）",
			"ocgo.refresh": "刷新",
			"ocgo.fetchedAt": "upd {time}",
			"ocgo.expand": "展开用量详情",
			"ocgo.collapse": "收起",
			"ocgo.sep": "·",
			"ocgo.set": "设置",
			"ocgo.save": "保存",
			"ocgo.workspaceID": "workspace id",
			"ocgo.token": "控制台 token",
			"ocgo.apiKey": "API key",
			"ocgo.setHint": "点击外部或按 Esc 保存",
			"ocgo.budget": "月度预算",
			"ocgo.spentOf": "已用 {spent} / {limit}",
			"ocgo.resetsIn": "剩余 {duration}",
			"ocgo.exceeded": "预算超支",
			"ocgo.rateLimited": "已限流",
			"ocgo.requests": "请求",
			"ocgo.requestsChip": "req",
			"ocgo.inputTokens": "输入 tokens",
			"ocgo.outputTokens": "输出 tokens",
			"ocgo.cacheTokens": "缓存 tokens",
			"ocgo.cost": "费用",
			"ocgo.balance": "余额"
		};
		/** English copy. */
		const en = {
			"ocgo.unavailable": "usage unavailable",
			"ocgo.error": "Query failed: {code}",
			"ocgo.noconfig": "Not configured: set workspace id and a console token (or API key) in Set",
			"ocgo.refresh": "Refresh",
			"ocgo.fetchedAt": "upd {time}",
			"ocgo.expand": "Show usage details",
			"ocgo.collapse": "Collapse",
			"ocgo.sep": "·",
			"ocgo.set": "Set",
			"ocgo.save": "Save",
			"ocgo.workspaceID": "workspace id",
			"ocgo.token": "console token",
			"ocgo.apiKey": "API key",
			"ocgo.setHint": "click outside or press Esc to save",
			"ocgo.budget": "Monthly budget",
			"ocgo.spentOf": "{spent} / {limit} used",
			"ocgo.resetsIn": "resets in {duration}",
			"ocgo.exceeded": "Budget exceeded",
			"ocgo.rateLimited": "rate-limited",
			"ocgo.requests": "Requests",
			"ocgo.requestsChip": "req",
			"ocgo.inputTokens": "Input tokens",
			"ocgo.outputTokens": "Output tokens",
			"ocgo.cacheTokens": "Cache tokens",
			"ocgo.cost": "Cost",
			"ocgo.balance": "Balance"
		};
		//#endregion
		//#region src/client/index.ts
		/** Dictionary namespace owned by this plugin. */
		const NS = "ocgo";
		/** Required services: slots for the composer tool-row entry, locale for the copy. */
		const inject = ["slots", "locale"];
		/** The pending selection wins; fall back to the last used one. */
		function providerOf(view) {
			return view?.next?.provider ?? view?.lastUsed?.provider;
		}
		/** Read a service by its dotted name without declaring it as a hard dependency. */
		function service(scope, name) {
			try {
				return scope.get(name);
			} catch {
				return;
			}
		}
		/**
		* Resolve the CURRENT model provider of a session: the warm in-memory durable
		* projection first, the `session.projections` Remote as a fallback. Undefined
		* when neither path knows the session's selection yet.
		*/
		async function readProvider(scope, sessionId) {
			try {
				const view = service(scope, "sessions")?.binding?.(sessionId)?.session?.projections?.faceOf?.("modelSelection")?.getSnapshot?.();
				const provider = providerOf(view);
				if (provider !== void 0) return provider;
			} catch {}
			try {
				const result = await service(scope, "remote.session")?.projections?.({ sessionId });
				if (result === void 0 || !result.ok) return void 0;
				return providerOf(result.value?.values?.modelSelection);
			} catch {
				return;
			}
		}
		/**
		* Register the usage chip into the composer tool row next to the model selector.
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "dsh-ocgo-usage: dictionaries");
			ctx.inject(["slots", "conversation"], (scope) => {
				scope.effect(() => scope.slots.register({
					name: "conversation.input.right",
					id: "ocgo-usage",
					order: 110,
					locale: NS,
					inject: (sessionId) => ({
						dockSessionId: sessionId,
						provider: async () => await readProvider(scope, sessionId)
					})
				}, OcgoDockEntry), "dsh-ocgo-usage: chip registration");
			});
		}
		//#endregion
		exports.OCGO_PROVIDER = OCGO_PROVIDER;
		exports.OcgoDockEntry = OcgoDockEntry;
		exports.apply = apply;
		exports.formatDuration = formatDuration;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map