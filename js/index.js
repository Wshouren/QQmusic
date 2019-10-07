let musicRender = (function () {
    let $main = $('main'),
        $header = $('header'),
        $section = $('section'),
        $wrapper = $section.find('.wrapper'),
        wrapperHeight = null,
        $ricList = null,
        $footer = $('footer'),
        $progress = $footer.find('.progress'),
        progressWidth = $progress[0].offsetWidth,
        $currentProgress = $footer.find('.currentProgress'),
        $cTime = $footer.find('.currentTime'),
        $tTime = $footer.find('.totalTime'),
        $mark = $footer.find('.mark'),
        $playBtn = $header.find('a'),
        music = $('.mainBox').find('audio')[0],
        ricAry = [],
        playTimer = null,
        totalTime = null,
        ricHeight = null,
        point = null;

    let computedSection = function () {
        let winH = document.documentElement.clientHeight,
            headerH = $header[0].offsetHeight,
            footerH = $footer[0].offsetHeight;
        sH = winH - headerH - footerH - parseFloat($section.css('margin')) * 2;
        $section.css({
            height: sH
        });
    };

    let queryData = function () {
        return new Promise(resolve => {
            $.ajax({
                url: 'json/lyric.json',
                dataType: 'json',
                success: resolve
            });
        })
    };

    let bindHtml = function (result) {
        let {lyric} = result,
            symbolReg = /&#(\d{2});/g,
            obj = {'32': ' ', '40': '(', '41': ')', '45': '-', '10': '\n'};

        lyric = lyric.replace(symbolReg, (...arg) => {
            let [a, b] = arg;
            return obj[b] || a;
        });

        let timeReg = /\[(\d+)&#58;(\d+)&#46;\d+\]([^\[&#]+)/g;
        lyric.replace(timeReg, (...arg) => {
            let [, minutes, seconds, ric] = arg;
            ricAry.push({
                minutes,
                seconds,
                ric
            });
        });
        let str = ``;
        ricAry.forEach(item => {
            let {minutes, seconds, ric} = item;
            str += `<p data-min="${minutes}" data-sec="${seconds}">${ric}</p>`;
        });
        $wrapper.html(str);
        $ricList = $wrapper.find('p');
        ricHeight = $ricList[0].offsetHeight;
        wrapperHeight = $wrapper[0].offsetHeight;
    };

    let currentTime = null, transform = 0, index = null;
    let srcActive = function () {
        currentTime = music.currentTime;
        currentTime > 0 && currentTime < 1 ? ($wrapper.css({
            transform: `translateY(0px)`
        }),transform = 0) : null;
        if (currentTime >= totalTime) {
            stopPlay();
            $currentProgress.css('width', "100%");
            $mark.css('transform', `translateX(${progressWidth}px)`);
            $cTime.html(formatTime(totalTime)[0]);
            return;
        }
        $currentProgress.css('width', `${currentTime / totalTime * 100}%`);
        $mark.css('transform', `translateX(${currentTime / totalTime * progressWidth}px)`);
        let [cTime, cMin, cSec] = formatTime(currentTime);
        $cTime.html(cTime);

        //=>ric
        let $curRic = $ricList.filter(`[data-min="${cMin}"]`).filter(`[data-sec="${cSec}"]`);
        if ($curRic.hasClass('active') || $curRic.length === 0 || !$curRic.html().trim()) return;
        index = $curRic.index();
        $curRic.addClass('active').siblings().removeClass('active');

        let m = $curRic[0].offsetTop - $section[0].offsetHeight / 2;
        if (index >= 4 && m > 0) {
            /*transform -= ricHeight;*/
            transform = -m;
            transform = Math.abs(transform) >= wrapperHeight ? -wrapperHeight + 400 : transform;
            $wrapper.css({
                transform: `translateY(${transform + 'px'})`
            });
        }
    };

    let formatTime = function (time) {
        let minutes = Math.floor(time / 60),
            seconds = Math.floor(time - minutes * 60);
        minutes = minutes > 9 ? minutes : '0' + minutes;
        seconds = seconds > 9 ? seconds : '0' + seconds;
        return [`${minutes}:${seconds}`, minutes, seconds];
    };

    let stopPlay = function () {
        music.pause();
        $playBtn.removeClass('active');
        clearInterval(playTimer);
        playTimer = 0;
    };

    let startPlay = function () {
        music.play();
        $playBtn.addClass('active');
        playTimer = setInterval(srcActive, 1000);
    };

    let touchStart = function (e) {
        let parents = $(e.target).parents();
        point = e.changedTouches[0];
        this.startY = point.clientY;
        this.startX = point.clientX;
        this.changeY = 0;
        this.target = e.target;
    };

    let touchMove = function (e) {
        let parents = $(e.target).parents();
        point = e.changedTouches[0];

        this.changeY = point.clientY-this.startY;
    };

    let touchEnd = function (e) {
        let parents = $(e.target).parents();

        if (parents.indexOf($wrapper[0]) >= 0) {
            transform += this.changeY * 3;
            transform = Math.abs(transform) >= wrapperHeight ? -wrapperHeight + 400 : transform;
            transform = transform > 0 ? 0 : transform;
            $wrapper.css({
                transform: `translateY(${transform + 'px'})`
            });
            return;
        }
    };

    return {
        init: function () {
            computedSection();
            let promise = queryData();
            promise.then(bindHtml)
                .then(music.addEventListener('canplay', () => {
                    totalTime = music.duration;
                    $tTime.html(formatTime(totalTime)[0]);
                    $playBtn.css('display', 'block');
                    startPlay();
                }));
            $playBtn.tap(() => {
                if (playTimer) {
                    stopPlay();
                } else {
                    startPlay();
                }
            });
            $main[0].addEventListener('touchstart', touchStart);
            $main[0].addEventListener('touchmove', touchMove);
            $main[0].addEventListener('touchend', touchEnd);
        }
    }
})();
musicRender.init();