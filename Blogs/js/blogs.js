/**
 * 日志列表页（基于 API.BlogLike 工厂，保留对 API.Blogs.showList/showTableList 的兼容入口）
 */
API.Blogs.showList = function() {
    API.BlogLike.showList(blogs);
};

API.Blogs.showTableList = function() {
    API.BlogLike.showTableList(blogs, 'blogs-table');
};

$(function() {
    API.BlogLike.initList('blogs', 'Blogs', 'blogs-table');
});
