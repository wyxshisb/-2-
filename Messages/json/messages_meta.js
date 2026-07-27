/**
 * 说说元数据
 * - messages_years: 所有年份列表（按时间倒序）
 * - messages_groups: 所有年份/月份的分组及数量（用于首屏侧边栏总表）
 *
 * groups 结构：[{ year: 2022, months: [{ month: 12, count: 3 }, ...] }, ...]
 */
(function() {
    // 所有年份（按时间倒序）
    const years = ["2019", "2020", "2021", "2022"];

    // 从对应全局变量读取并统计
    function buildGroups() {
        const groups = [];
        for (const y of years) {
            const data = window['messages_' + y] || [];
            if (!data.length) continue;
            const monthMap = {};
            for (const item of data) {
                if (!item.created_time) continue;
                const d = new Date(item.created_time * 1000);
                const m = d.getMonth() + 1;
                monthMap[m] = (monthMap[m] || 0) + 1;
            }
            const yearNum = parseInt(y, 10);
            const months = Object.keys(monthMap)
                .map(function(m) { return parseInt(m, 10); })
                .sort(function(a, b) { return b - a; }) // 月份倒序
                .map(function(m) { return { month: m, count: monthMap[m] }; });
            groups.push({ year: yearNum, count: data.length, months: months });
        }
        // 年份倒序
        groups.sort(function(a, b) { return b.year - a.year; });
        return groups;
    }

    window.messages_years = years;
    // 首屏时若数据已加载则构建分组，否则等待数据加载后由业务代码重建
    window.messages_groups = buildGroups();
})();
