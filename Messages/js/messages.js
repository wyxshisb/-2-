/**
 * 说说列表 - 客户端分页渲染 + 按年份异步加载
 *
 * 数据加载策略：
 * - 年份页面（targetYear = 'YYYY'）：仅加载 messages_YYYY.js，直接渲染
 * - 全部页面（targetYear = 'ALL'）：
 *   1. 首屏只加载最新年份的 JS（由 HTML 静态引入）
 *   2. 渲染首屏后，后台异步加载其余年份（$.getScript）
 *   3. 每加载完一个年份，把数据合并到 allData 并按需追加渲染
 *   4. 那年今日功能在全部年份加载完成后才启用
 */
$(function() {

    'use strict';

    const PAGE_SIZE = 20;
    const $container = $('#messages_html');
    const targetYear = window.targetYear || 'ALL';

    // ===== 数据准备 =====
    // 从按年份的全局变量中读取已加载的数据
    function readYearData(year) {
        return window['messages_' + year] || [];
    }

    // 已加载的所有数据（按时间倒序排列）
    let allData = [];
    // 已加载的年份集合
    const loadedYears = {};
    // 全部年份是否加载完毕（决定那年今日是否可用）
    let allYearsLoaded = false;

    /**
     * 初始化已加载的年份数据
     */
    function initLoadedYears() {
        if (targetYear !== 'ALL') {
            // 年份页面：只读对应年份
            const data = readYearData(targetYear);
            if (data.length) {
                loadedYears[targetYear] = true;
                allData = data.slice();
            }
            allYearsLoaded = true; // 年份页面视为全部加载完
        } else {
            // 全部页面：检查哪些年份已加载（HTML 静态引入的）
            const years = window.messages_years || [];
            years.forEach(function(y) {
                const data = readYearData(y);
                if (data.length) {
                    loadedYears[y] = true;
                    allData = allData.concat(data);
                }
            });
            // 全部年份都已加载？
            allYearsLoaded = Object.keys(loadedYears).length === years.length;
        }
        // 按时间倒序
        allData.sort(function(a, b) {
            return (b.created_time || 0) - (a.created_time || 0);
        });
    }

    initLoadedYears();

    // ===== 分页状态 =====
    let cursor = 0;
    let loading = false;
    let finished = false;
    let lastYear = null;
    let lastMonth = null;
    // 侧边栏是否已预渲染（true 时 injectGroupHeader 跳过，避免重复）
    let sidebarPrerendered = false;

    // ===== 渲染哨兵与提示 =====
    $container.after(
        '<div id="messages-sentinel" style="height:1px;"></div>' +
        '<div id="messages-loader" class="text-center text-muted py-4" style="display:none;">' +
        '<i class="fa fa-spinner fa-spin mr-2"></i>正在加载…' +
        '</div>' +
        '<div id="messages-end" class="text-center text-black-50 py-4" style="display:none;">' +
        '<i class="fa fa-heart text-danger m-2"></i>回忆有底线，未来无限量' +
        '</div>'
    );

    /**
     * 预渲染侧边栏总表（首屏即可显示全部年份/月份的目录，不依赖分页渲染）
     * 把分组标题放在隐藏容器中，让 initSidebar() 能扫描到，但不影响实际说说渲染
     * - targetYear='ALL'：显示所有年份
     * - targetYear='YYYY'：仅显示该年份
     */
    function prerenderSidebar() {
        const groups = window.messages_groups || [];
        if (!groups.length) return;

        const html = [];
        if (targetYear === 'ALL') {
            // 全部页面：显示所有年份和月份
            groups.forEach(function(g) {
                html.push(
                    '<span class="sidebar-h1" data-tag="h1" data-sidebar=\'' +
                    g.year + '年<span class="badge badge-primary badge-pill itemSize">' + g.count + '<span>\'></span>'
                );
                g.months.forEach(function(m) {
                    html.push(
                        '<span class="sidebar-h2" data-tag="h2" data-sidebar=\'' +
                        m.month + '月<span class="badge badge-secondary badge-pill itemSize">' + m.count + '<span>\'></span>'
                    );
                });
            });
        } else {
            // 年份页面：只显示该年份的月份
            const y = parseInt(targetYear, 10);
            const g = groups.find(function(x) { return x.year === y; });
            if (g) {
                html.push(
                    '<span class="sidebar-h1" data-tag="h1" data-sidebar=\'' +
                    g.year + '年<span class="badge badge-primary badge-pill itemSize">' + g.count + '<span>\'></span>'
                );
                g.months.forEach(function(m) {
                    html.push(
                        '<span class="sidebar-h2" data-tag="h2" data-sidebar=\'' +
                        m.month + '月<span class="badge badge-secondary badge-pill itemSize">' + m.count + '<span>\'></span>'
                    );
                });
            }
        }
        if (html.length) {
            // 放入隐藏容器，initSidebar 可扫描到但不影响说说列表渲染
            $container.before('<div id="messages-sidebar-pre" style="display:none;">' + html.join('') + '</div>');
            sidebarPrerendered = true;
        }
    }

    /**
     * 删除预渲染的侧边栏分组标题（实际渲染时由 injectGroupHeader 重新生成）
     */
    function removePrerenderedSidebar() {
        $('#messages-sidebar-pre').remove();
        sidebarPrerendered = false;
    }

    /**
     * 跨年/跨月时插入侧边栏分组标题
     * 注：若已通过 prerenderSidebar 预渲染，则跳过（避免重复）
     */
    function injectGroupHeader(message) {
        const dt = new Date((message.created_time || 0) * 1000);
        const y = dt.getFullYear();
        const m = dt.getMonth() + 1;
        if (y !== lastYear) {
            if (!sidebarPrerendered) {
                const yearCount = allData.filter(function(x) {
                    return x.created_time && new Date(x.created_time * 1000).getFullYear() === y;
                }).length;
                $container.append(
                    '<span class="sidebar-h1" data-tag="h1" data-sidebar=\'' + y + '年<span class="badge badge-primary badge-pill itemSize">' + yearCount + '<span>\'></span>'
                );
            }
            lastYear = y;
            lastMonth = null;
        }
        if (m !== lastMonth) {
            if (!sidebarPrerendered) {
                const monthCount = allData.filter(function(x) {
                    if (!x.created_time) return false;
                    const d = new Date(x.created_time * 1000);
                    return d.getFullYear() === y && (d.getMonth() + 1) === m;
                }).length;
                $container.append(
                    '<span class="sidebar-h2" data-tag="h2" data-sidebar=\'' + m + '月<span class="badge badge-secondary badge-pill itemSize">' + monthCount + '<span>\'></span>'
                );
            }
            lastMonth = m;
        }
    }

    /**
     * 渲染一页（最多 PAGE_SIZE 条）
     */
    function renderPage() {
        if (loading || finished) return Promise.resolve();
        loading = true;
        $('#messages-loader').show();

        return new Promise(function(resolve) {
            requestAnimationFrame(function() {
                const end = Math.min(cursor + PAGE_SIZE, allData.length);
                const frag = [];
                for (; cursor < end; cursor++) {
                    const message = allData[cursor];
                    injectGroupHeader(message);
                    frag.push(template(TPL.MESSAGES_ITEM, { message: message }));
                }
                $container.append(frag.join(''));

                afterRender();

                loading = false;
                $('#messages-loader').hide();

                if (cursor >= allData.length) {
                    // 全部数据已渲染完
                    if (allYearsLoaded) {
                        finished = true;
                        $('#messages-end').show();
                    } else {
                        // 还有年份未加载完，等待异步加载后继续
                        // loader 保持显示状态由异步加载控制
                    }
                }
                resolve();
            });
        });
    }

    /**
     * 每页渲染后的统一处理
     */
    let galleryDelegated = false;
    function afterRender() {
        // 仅对新插入的 lazyload 图片初始化懒加载，避免重复创建 IntersectionObserver
        if (window.lazyload) {
            try {
                const newImages = $container[0].querySelectorAll('img.lazyload[data-src]:not([data-lazy-observed])');
                if (newImages.length) {
                    newImages.forEach(function(img) { img.setAttribute('data-lazy-observed', '1'); });
                    lazyload(newImages);
                }
            } catch (e) {}
        }

        if (!galleryDelegated) {
            $(document).on('click', '.lightgallery .message-lightbox', function() {
                const galleryDom = $(this).parent().get(0);
                const imgIdx = $(this).attr('data-idx');
                const ins = API.Gallery.createMediaGallery(galleryDom, 'Messages');
                ins.openGallery(imgIdx * 1);
            });
            $(document).on('click', '.comment-img-lightbox', function() {
                const galleryDom = $(this).parent().parent().get(0);
                const imgIdx = $(this).attr('data-idx');
                const ins = API.Gallery.createCommentGallery(galleryDom, '.comment-img-lightbox');
                ins.openGallery(imgIdx * 1);
            });
            galleryDelegated = true;
        }

        $container.find('[data-toggle="tooltip"]:not(.tooltip-initialized)').each(function() {
            $(this).addClass('tooltip-initialized').tooltip();
        });

        API.Common.registerImageLoadedEvent();
        initSidebar();
    }

    // ===== 事件委托 =====
    $(document).on('click', '.viewvisitors', function() {
        const tid = $(this).attr('data-tid');
        const item = allData.find(function(m) { return String(m.tid) === String(tid); });
        if (item) API.Common.showVisitorsWin(this, [item]);
    });
    $(document).on('click', '.viewlikes', function() {
        const tid = $(this).attr('data-tid');
        const item = allData.find(function(m) { return String(m.tid) === String(tid); });
        if (item) API.Common.showLikeWin(this, [item]);
    });
    $(document).on('click', '.more-btn', function() {
        const $pre = $(this).siblings('pre.content');
        $pre.removeClass('more');
        $(this).remove();
    });

    // ===== 异步加载剩余年份（仅 targetYear='ALL' 时） =====
    // 使用动态 <script> 标签加载，兼容 file:// 和 http:// 协议
    function loadScript(src, onSuccess, onError) {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = function() {
            script.onload = script.onerror = null;
            onSuccess && onSuccess();
        };
        script.onerror = function() {
            script.onload = script.onerror = null;
            onError && onError();
        };
        document.head.appendChild(script);
    }

    function loadRemainingYears() {
        if (targetYear !== 'ALL' || allYearsLoaded) {
            return;
        }
        const years = window.messages_years || [];
        const remaining = years.filter(function(y) { return !loadedYears[y]; });
        if (remaining.length === 0) {
            allYearsLoaded = true;
            onAllYearsLoaded();
            return;
        }

        // 显示加载提示
        $('#messages-loader').show();

        // 串行加载，避免并发请求过多
        function loadNext(idx) {
            if (idx >= remaining.length) {
                allYearsLoaded = true;
                $('#messages-loader').hide();
                onAllYearsLoaded();
                return;
            }
            const y = remaining[idx];
            loadScript('json/messages_' + y + '.js',
                function() {
                    loadedYears[y] = true;
                    const newData = readYearData(y);
                    if (newData.length) {
                        allData = allData.concat(newData);
                        // 重新排序
                        allData.sort(function(a, b) {
                            return (b.created_time || 0) - (a.created_time || 0);
                        });

                        // 重新构建侧边栏总表（包含新加载的年份）
                        window.messages_groups = (function() {
                            const groups = [];
                            const allYears = window.messages_years || [];
                            for (const yy of allYears) {
                                const d = window['messages_' + yy] || [];
                                if (!d.length) continue;
                                const monthMap = {};
                                for (const item of d) {
                                    if (!item.created_time) continue;
                                    const dt = new Date(item.created_time * 1000);
                                    const m = dt.getMonth() + 1;
                                    monthMap[m] = (monthMap[m] || 0) + 1;
                                }
                                const yearNum = parseInt(yy, 10);
                                const months = Object.keys(monthMap)
                                    .map(function(m) { return parseInt(m, 10); })
                                    .sort(function(a, b) { return b - a; })
                                    .map(function(m) { return { month: m, count: monthMap[m] }; });
                                groups.push({ year: yearNum, count: d.length, months: months });
                            }
                            groups.sort(function(a, b) { return b.year - a.year; });
                            return groups;
                        })();

                        // 更新预渲染的侧边栏
                        removePrerenderedSidebar();
                        prerenderSidebar();
                        initSidebar();

                        // 如果当前已渲染完，继续渲染新加载的数据
                        if (cursor >= allData.length - newData.length && !finished) {
                            renderPage();
                        }
                    }
                    loadNext(idx + 1);
                },
                function() {
                    // 加载失败，跳过该年份
                    console.warn('加载 messages_' + y + '.js 失败');
                    loadNext(idx + 1);
                }
            );
        }
        loadNext(0);
    }

    /**
     * 全部年份加载完成后：
     * - 启用那年今日功能
     * - 如果当前数据已全部渲染，显示结尾
     */
    function onAllYearsLoaded() {
        // 那年今日
        if (QZone_Config.Messages && QZone_Config.Messages.hasThatYearToday) {
            const yearMaps = API.Common.getOldYearData(allData, 'created_time');
            const itemsHtml = template(TPL.MESSAGES_YEAR_ITEMS, { yearMaps: yearMaps });
            $container.prepend(itemsHtml);
            initSidebar();
        }

        // 如果所有数据已渲染完，显示结尾
        if (cursor >= allData.length) {
            finished = true;
            $('#messages-end').show();
            $('#messages-loader').hide();
        } else {
            // 还有未渲染的数据，继续渲染
            renderPage();
        }
    }

    // ===== IntersectionObserver 监听哨兵 =====
    if ('IntersectionObserver' in window) {
        const sentinel = document.getElementById('messages-sentinel');
        const observer = new IntersectionObserver(function(entries) {
            if (entries[0].isIntersecting) {
                renderPage();
            }
        }, { rootMargin: '300px 0px' });
        observer.observe(sentinel);
    } else {
        $(window).on('scroll', function() {
            if ($(window).scrollTop() + $(window).height() > $(document).height() - 800) {
                renderPage();
            }
        });
    }

    // ===== 首屏渲染 + 异步加载其他年份 =====
    // 先预渲染侧边栏总表（首屏即可显示完整目录）
    prerenderSidebar();

    renderPage().then(function() {
        initSidebar();
        if (targetYear === 'ALL') {
            if (!allYearsLoaded) {
                // 还有年份未加载：异步加载剩余年份，那年今日在 onAllYearsLoaded 中启用
                loadRemainingYears();
            } else {
                // 全部年份已加载（只有 1 个年份或全部已静态引入）：
                // 启用那年今日并显示结尾
                if (QZone_Config.Messages && QZone_Config.Messages.hasThatYearToday) {
                    const yearMaps = API.Common.getOldYearData(allData, 'created_time');
                    const itemsHtml = template(TPL.MESSAGES_YEAR_ITEMS, { yearMaps: yearMaps });
                    $container.prepend(itemsHtml);
                    initSidebar();
                }
                if (cursor >= allData.length) {
                    finished = true;
                    $('#messages-end').show();
                }
            }
        } else {
            // 年份页面：数据已全部加载，启用那年今日并显示结尾
            if (QZone_Config.Messages && QZone_Config.Messages.hasThatYearToday) {
                const yearMaps = API.Common.getOldYearData(allData, 'created_time');
                const itemsHtml = template(TPL.MESSAGES_YEAR_ITEMS, { yearMaps: yearMaps });
                $container.prepend(itemsHtml);
                initSidebar();
            }
            if (cursor >= allData.length) {
                finished = true;
                $('#messages-end').show();
            }
        }
    });

});
