/**
 * 私密日记列表页（复用 API.BlogLike 工厂，仅数据源与表格 ID 不同）
 */
API.Diaries = API.Diaries || {};
API.Diaries.showList = function() {
    API.BlogLike.showList(diaries);
};

API.Diaries.showTableList = function() {
    API.BlogLike.showTableList(diaries, 'diaries-table');
};

$(function() {
    API.BlogLike.initList('diaries', 'Diaries', 'diaries-table');
});
