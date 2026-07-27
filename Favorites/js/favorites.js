$(function() {
    // 图片懒加载
    lazyload();

    // 收藏夹画廊（点击元素为 .message-lightbox 内的 img）
    $('.lightgallery .message-lightbox img').on('click', function() {
        const $galleryDom = $(this).parent().parent().get(0);
        const imgIdx = $(this).attr('data-idx');
        // 收藏夹画廊无评论侧栏
        const ins = API.Gallery.createMediaGallery($galleryDom, 'Favorites', {
            plugins: [lgZoom, lgAutoplay, lgFullscreen, lgRotate, lgThumbnail, lgVideo],
            commentBox: false
        });
        ins.openGallery(imgIdx * 1);
    });

    // 取消懒加载样式 / 初始化提示
    API.Common.registerImageLoadedEvent();
    $('[data-toggle="tooltip"]').tooltip();
});
