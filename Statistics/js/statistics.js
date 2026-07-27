/**
 * QQ空间数据统计分析信息
 */
"use strict";

API.Statistics = API.Statistics || {};

/**
 * 获取所有带地理位置信息的条目
 * @param {Array} messages 说说列表
 * @param {Array} boards 留言列表
 * @returns {Array} 含 LBS 信息的条目集合
 */
API.Statistics.getAllLbs = function(messages, boards) {
    const result = [];
    const collect = (items, source) => {
        (items || []).forEach((item) => {
            const lbs = item && (item.lbs || (item.story_info && item.story_info.lbs));
            if (lbs && lbs.pos_x && lbs.pos_y) {
                result.push({ source, uin: item.uin, time: item.created_time || item.pubtime, lbs });
            }
        });
    };
    collect(messages, "Messages");
    collect(boards, "Boards");
    return result;
};
