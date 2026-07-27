$(function() {

    // 获取相册ID
    albumId = albumId !== '<%:=(albumId)%>' ? albumId : API.Utils.getUrlParam('albumId');
    // 获取指定相册数据
    const albumIndex = albums.getIndex(albumId, 'id');
    window.album = albums[albumIndex];

    // 渲染导航相册名称
    $(".breadcrumb-item.active").text(album.name);

    // 渲染相片列表
    const photos_tpl = document.getElementById('photos_tpl').innerHTML;
    const photos_html = template(photos_tpl, { album: album || {} });
    $("#lightgallery").html(photos_html);

    // 图片懒加载
    lazyload();

    // 相册画廊（一次性实例化，使用 .lightbox 选择器与 lgHash 插件）
    API.Gallery.createMediaGallery(document.getElementById('lightgallery'), 'Albums', {
        plugins: [lgZoom, lgAutoplay, lgComment, lgFullscreen, lgHash, lgRotate, lgThumbnail, lgVideo],
        selector: '.lightbox',
        mousewheel: true,
        thumbnail: true
    });

    // 查看赞 / 查看评论
    $('.viewlikes').on('click', function() {
        API.Common.showLikeWin(this, album.photoList);
    });
    $('.viewcomments').on('click', function() {
        API.Common.showCommentsWin(this, album.photoList);
    });

    // 取消懒加载样式 / 初始化提示
    API.Common.registerImageLoadedEvent();
    $('[data-toggle="tooltip"]').tooltip();
});
