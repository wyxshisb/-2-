$(function() {

    // 那年今日
    if (QZone_Config.Boards.hasThatYearToday) {
        const _yearMaps = API.Common.getOldYearData(boardInfo.items, "pubtime");
        const items_html = template(TPL.BOARDS_YEAR_ITEMS, { yearMaps: _yearMaps });
        $('.boards-items').before(items_html);
    }

    // 重新渲染左侧目录
    initSidebar();

    // 图片懒加载
    lazyload();

    // 留言正文图片画廊（每个 .messageText 容器独立实例）
    $('.messageText img').on('click', function() {
        const $galleryDom = $(this).parents('.messageText').get(0);
        const imgIdx = $(this).attr('data-idx');
        const ins = API.Gallery.createCommentGallery($galleryDom, '.lightgallery', {
            selector: '.lightgallery'
        });
        ins.openGallery(imgIdx * 1);
    });

    // 初始化提示
    $('[data-toggle="tooltip"]').tooltip();
});
