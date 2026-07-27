/**
 * 访客模块
 * 数据中仅含总数（隐私限制无明细），渲染统计卡片与说明
 */
$(function() {
    const info = window.visitorInfo || { items: [], total: 0, totalPage: 0 };
    const $container = $('#visitors_html');

    // 数量千分位格式化
    const formatNum = (n) => (n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    const html = `
        <div class="visitors-summary text-center">
            <div class="visitors-total-card card border-0 shadow-sm">
                <div class="card-body py-5">
                    <div class="visitors-total-num text-primary">{0}</div>
                    <div class="visitors-total-label text-muted mt-2">累计访问量</div>
                </div>
            </div>
            <div class="visitors-tip text-muted mt-4">
                <i class="fa fa-info-circle mr-1"></i>
                由于 QQ 空间隐私限制，访客明细已不可获取，仅保留累计访问量统计。
            </div>
        </div>
    `.format(formatNum(info.total));

    $container.html(html);
});
