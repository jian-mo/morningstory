"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDate = exports.getYesterday = exports.getEndOfDay = exports.getStartOfDay = void 0;
const getStartOfDay = (date = new Date()) => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    return start;
};
exports.getStartOfDay = getStartOfDay;
const getEndOfDay = (date = new Date()) => {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return end;
};
exports.getEndOfDay = getEndOfDay;
const getYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
};
exports.getYesterday = getYesterday;
const formatDate = (date, format = 'short') => {
    if (format === 'short') {
        return date.toISOString().split('T')[0] || '';
    }
    return date.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};
exports.formatDate = formatDate;
//# sourceMappingURL=index.js.map