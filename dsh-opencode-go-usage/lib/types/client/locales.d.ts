/**
 * dsh-ocgo-usage locale dictionaries (zh/en).
 * @module dsh-ocgo-usage/client/locales
 */
/** Dictionary namespace this package registers. */
export declare const NS = "ocgo";
/** Chinese copy. */
export declare const zh: {
    readonly 'ocgo.unavailable': "用量不可用";
    readonly 'ocgo.error': "查询失败：{code}";
    readonly 'ocgo.noconfig': "未配置：请在 Set 里填写 OpenCode Go API key（或控制台 token）";
    readonly 'ocgo.refresh': "刷新";
    readonly 'ocgo.fetchedAt': "upd {time}";
    readonly 'ocgo.rolling': "5h 滚动";
    readonly 'ocgo.weekly': "每周";
    readonly 'ocgo.monthly': "每月";
    readonly 'ocgo.rateLimited': "已限流";
    readonly 'ocgo.resetsIn': "剩余 {duration}";
    readonly 'ocgo.expand': "展开用量详情";
    readonly 'ocgo.collapse': "收起";
    readonly 'ocgo.sep': "·";
    readonly 'ocgo.set': "设置";
    readonly 'ocgo.save': "保存";
    readonly 'ocgo.workspaceID': "workspace id";
    readonly 'ocgo.token': "控制台 token";
    readonly 'ocgo.apiKey': "API key";
    readonly 'ocgo.setHint': "点击外部或按 Esc 保存";
    readonly 'ocgo.budget': "月度预算";
    readonly 'ocgo.spentOf': "已用 {spent} / {limit}";
    readonly 'ocgo.exceeded': "预算超支";
    readonly 'ocgo.requests': "请求";
    readonly 'ocgo.requestsChip': "req";
    readonly 'ocgo.inputTokens': "输入 tokens";
    readonly 'ocgo.outputTokens': "输出 tokens";
    readonly 'ocgo.cacheTokens': "缓存 tokens";
    readonly 'ocgo.cost': "费用";
    readonly 'ocgo.balance': "余额";
};
/** English copy. */
export declare const en: {
    readonly 'ocgo.unavailable': "usage unavailable";
    readonly 'ocgo.error': "Query failed: {code}";
    readonly 'ocgo.noconfig': "Not configured: set an OpenCode Go API key (or console token) in Set";
    readonly 'ocgo.refresh': "Refresh";
    readonly 'ocgo.fetchedAt': "upd {time}";
    readonly 'ocgo.rolling': "5h Rolling";
    readonly 'ocgo.weekly': "Weekly";
    readonly 'ocgo.monthly': "Monthly";
    readonly 'ocgo.rateLimited': "rate-limited";
    readonly 'ocgo.resetsIn': "resets in {duration}";
    readonly 'ocgo.expand': "Show usage details";
    readonly 'ocgo.collapse': "Collapse";
    readonly 'ocgo.sep': "·";
    readonly 'ocgo.set': "Set";
    readonly 'ocgo.save': "Save";
    readonly 'ocgo.workspaceID': "workspace id";
    readonly 'ocgo.token': "console token";
    readonly 'ocgo.apiKey': "API key";
    readonly 'ocgo.setHint': "click outside or press Esc to save";
    readonly 'ocgo.budget': "Monthly budget";
    readonly 'ocgo.spentOf': "{spent} / {limit} used";
    readonly 'ocgo.exceeded': "Budget exceeded";
    readonly 'ocgo.requests': "Requests";
    readonly 'ocgo.requestsChip': "req";
    readonly 'ocgo.inputTokens': "Input tokens";
    readonly 'ocgo.outputTokens': "Output tokens";
    readonly 'ocgo.cacheTokens': "Cache tokens";
    readonly 'ocgo.cost': "Cost";
    readonly 'ocgo.balance': "Balance";
};
/** Key type of the dictionary (for the LocaleNamespaceMap merge). */
export type OcgoKey = keyof typeof zh;
//# sourceMappingURL=locales.d.ts.map