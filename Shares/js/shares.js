$(function() {

    // 那年今日
    if (QZone_Config.Shares.hasThatYearToday) {
        const _yearMaps = API.Common.getOldYearData(shares, "shareTime");
        const items_html = template(TPL.SHARES_YEAR_ITEMS, { yearMaps: _yearMaps });
        $('#shares_html').prepend(items_html);
    }

    // 重新渲染左侧目录
    initSidebar();

    // 图片懒加载
    lazyload();

    // 分享多媒体画廊
    API.Gallery.bindMediaGallery('.lightgallery', 'Shares');

    // 评论图片画廊
    API.Gallery.bindCommentGallery('.comment-img-lightbox');

    // 最近访问 / 点赞列表 / 取消懒加载样式
    API.Common.registerShowVisitorsWin(shares);
    API.Common.registerShowLikeWin(shares);
    API.Common.registerImageLoadedEvent();
});
