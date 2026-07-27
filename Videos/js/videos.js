$(function() {

    // 指定年份的页面
    if (targetYear !== 'ALL') {
        videos = videos.filter(item => new Date((item.uploadtime || item.uploadTime) * 1000).getFullYear() == targetYear);
    }

    // 图片懒加载
    lazyload();

    // 视频画廊（一次性实例化，使用 .lightbox 选择器与 lgHash 插件）
    API.Gallery.createMediaGallery(document.getElementById('lightgallery'), 'Videos', {
        plugins: [lgZoom, lgAutoplay, lgComment, lgFullscreen, lgHash, lgRotate, lgThumbnail, lgVideo],
        selector: '.lightbox',
        mousewheel: true,
        thumbnail: true
    });

    // 查看赞 / 查看评论
    $('.viewlikes').on('click', function() {
        API.Common.showLikeWin(this, videos);
    });
    $('.viewcomments').on('click', function() {
        API.Common.showCommentsWin(this, videos);
    });

    // 取消懒加载样式 / 初始化提示
    API.Common.registerImageLoadedEvent();
    $('[data-toggle="tooltip"]').tooltip();
});
