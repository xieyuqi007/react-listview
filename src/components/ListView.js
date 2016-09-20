/* eslint-env browser */
import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { transition, listenTransition } from '../utils/transition';
import styles from './ListView.css';

const SCROLLER_CHECK_DURATION = 50;
const TOUCHMOVE_CHECK_DURATION = 500;
const PULL_MAX_DURATION = 200;
const PULLED_DOWN = 1;
const STATUS_DEFAULT = 11;
const STATUS_PREPARE = 12;
const STATUS_LOAD = 13;

export default class ListView extends React.Component {
    static propTypes = {
        threshold: PropTypes.number, // 拖拽阈值
        pullUpThreshold: PropTypes.number, // 上拉补偿值
        onLoaderStatusChange: PropTypes.oneOfType([
            PropTypes.bool,
            PropTypes.func
        ]), // 下拉样式处理函数
        showNoContent: PropTypes.bool,
        content: PropTypes.string,
        wrapperClassName: PropTypes.string,
        scrollerClassName: PropTypes.string,
        compatSlider: PropTypes.bool,
        onPullDown: PropTypes.func, // 刷新事件
        onPullUp: PropTypes.func // 加载事件
    };

    static defaultProps = {
        threshold: 40,
        pullUpThreshold: 40,
        onLoaderStatusChange: false,
        wrapperClassName: '' || styles['wrapper'],
        scrollerClassName: '' || styles['scroller'],
        showNoContent: false,
        compatSlider: false,
        onPullDown: function() {},
        onPullUp: function() {}
    };

    componentDidMount = () => {
        this._draggable = true;
        this._canTouchMove = false;

        this.scrollCheckTimer = null;
        this.touchMoveTriggerTimer = null;

        this.wrapper = ReactDOM.findDOMNode(this.refs.wrapper);
        this.scroller = ReactDOM.findDOMNode(this.refs.list);
        this.createPullUpRegion();
    }

    componentDidUpdate = () => {
        this.createPullUpRegion();
    }

    createPullDownRegion = () => {
        this.removePullDownRegion();
        this.header = document.createElement('div');
        this.header.className = styles['latest'];
        this._touchCoords.status = this.processLoaderStatus(PULLED_DOWN, 0, null, true);
        this.wrapper.insertBefore(this.header, this.scroller);
        return this.header;
    }

    removePullDownRegion = () => {
        if (this.header) {
            this.wrapper.removeChild(this.header);
            this.header = null;
        }
    }

    createPullUpRegion = () => {
        if (!this.footer) {
            this.footer = document.createElement('div');
            this.wrapper.appendChild(this.footer);
        }

        if (this.wrapper.clientHeight >= this.scroller.offsetHeight ||
            this.props.showNoContent
        ) {
            this.disablePullUp(true);
            this.footer.className = styles['loader'];
            this.footer.innerHTML = `<p class='${styles['non_cont']}'>${this.props.content}</p>`;
            this.footer.style.height = this.props.threshold * 1.25 + 'px';
        } else {
            this.disablePullUp(false);
            this.footer.className = styles['loader'];
            this.footer.innerHTML = '' +
                '<div class=' + styles["loader"] + '>' +
                    '<em class=' + styles["pull-loading"] + '></em>' +
                    '<span>加载中...</span>' +
                '</div>';
            this.footer.style.height = this.props.threshold + 'px';
        }
    }

    handleLoaderStatusChange = status => {
        let helper = this.props.onLoaderStatusChange || function(status) {
            if (status === STATUS_DEFAULT) {
                return '<div class="' + styles["loader"] + '">' +
                  '<em class="' + styles["pull-down"] + '"></em>' +
                  '<span>下拉刷新</span>' +
                '</div>';
            } else if (status === STATUS_PREPARE) {
                return '<div class="' + styles["loader"] + '"">' +
                  '<em class="' + styles["pull-up"] + '"></em>' +
                  '<span>释放更新</span>' +
            '</div>';
            } else if (status === STATUS_LOAD) {
                return '<div class="' + styles["loader"] + '">'+
                  '<em class="' + styles["pull-loading"] + '"></em>'+
                  '<span>加载中...</span>'+
                '</div>';
            }
        };

        if (this.header && helper && typeof helper === 'function') {
            this.header.innerHTML = helper.call(this, status);
        }
    }

    processLoaderStatus = (orient, offsetY, currentStatus, moved) => {
        let overflow, nextStatus = currentStatus;
        if (orient === PULLED_DOWN) {
            overflow = offsetY > this.props.threshold * 2;
            if (!overflow && currentStatus !== STATUS_DEFAULT) {
                this.handleLoaderStatusChange(STATUS_DEFAULT);
                nextStatus = STATUS_DEFAULT;
            } else if (moved && overflow && currentStatus !== STATUS_PREPARE) {
                this.handleLoaderStatusChange(STATUS_PREPARE);
                nextStatus = STATUS_PREPARE;
            } else if (!moved && overflow && currentStatus !== STATUS_LOAD) {
                this.handleLoaderStatusChange(STATUS_LOAD);
                this.props.onPullDown(this.reset);
                nextStatus = STATUS_LOAD;
            }
        }

        return nextStatus;
    }

    handleTouchStart = e => {
        this._canTouchMove = false;
        let startScrollY =  this.wrapper.scrollTop;

        if (this._draggable && 
                (this.isPullDownDisabled !== true || 
                    this.isPullUpDisabled !== true)
        ) {
            this._draggable = false;
            this._canTouchMove = true;

            let point = e.touches && e.touches[0];

            this._pointX = point.pageX;
            this._pointY = point.pageY;
            this._startMove = true;

            this._touchCoords = {};
            this._touchCoords.startY = e.touches[0].screenY;
            this._touchCoords.startScrollY = startScrollY;
        }
    }

    handleTouchMove = e => {
        this.touchMoveTriggerTimer && clearTimeout(this.touchMoveTriggerTimer);

        if (this._canTouchMove && this.props.compatSlider && this._startMove) {
            let point = e.touches && e.touches[0];
            let deltaX = point.pageX - this._pointX;
            let deltaY = point.pageY - this._pointY;

            this._startMove = false;
            this._canTouchMove = Math.abs(deltaX) > Math.abs(deltaY) ? false : true;
            this._draggable = !this._canTouchMove;
        }

        if (!this._canTouchMove) return;
        e.stopPropagation();

        let coords = this._touchCoords;
        let startScrollY = coords.startScrollY;
        let blockY = coords.blockY;
        let startY = coords.startY;
        let stopY = e.touches[0].screenY;
        let offsetY, overY;

        if (typeof coords.canPullDown === 'undefined') {
            coords.canPullDown = this.isPullDownDisabled !== true && 
                    startY < stopY && startScrollY <= 0;
        }
        if (coords.canPullDown && (coords.pullDown || startY - stopY + startScrollY < 0)) {
            e.preventDefault();
            coords.pullDown = true;
            if (!this.header) {
                this.header = this.createPullDownRegion();
            }
            if (typeof blockY === 'undefined') {
                coords.blockY = blockY = stopY;
            }
            offsetY = stopY - blockY;
            offsetY = offsetY > 0 ? offsetY : 0;

            // 阻尼
            let threshold = this.props.threshold;
            overY = offsetY - threshold;
            if (overY > 100) {
                offsetY = threshold + 75 + (overY - 100) * 0.25;
            } else if (overY > 50) {
                offsetY = threshold + 50 + (overY - 50) * 0.5;
            }
            this.header.style.height = offsetY + 'px';
            coords.status = this.processLoaderStatus(PULLED_DOWN, offsetY, coords.status, true);
        } else {
            coords.blockY = stopY;
        }

        this.touchMoveTriggerTimer = setTimeout(() => {
            this.handleTouchEnd();
            this.touchMoveTriggerTimer = null;
        }, TOUCHMOVE_CHECK_DURATION);
    }

    handleTouchEnd = e => {
        this.touchMoveTriggerTimer && clearTimeout(this.touchMoveTriggerTimer);
        this.touchMoveTriggerTimer = null;

        if (!this._canTouchMove) {
            return;
        } else {
            e && e.stopPropagation();
        }

        this._canTouchMove = false;
        this.doTransition();
    }

    checkScrollEnd = node => {
        if (node.offsetHeight + node.scrollTop >= 
            node.scrollHeight - this.props.pullUpThreshold
        ) {
            !this.isPullUpDisabled && this.props.onPullUp(this.reset);
        }
        this.scrollCheckTimer = null;
    }

    handleScroll = e => {
        this.scrollCheckTimer && clearTimeout(this.scrollCheckTimer);
        this.scrollCheckTimer = setTimeout(
            this.checkScrollEnd.bind(this, e.target), 
            SCROLLER_CHECK_DURATION
        );
    }

    handleTransitionEnd = (orient, targetHeight) => {
        let coords = this._touchCoords;
        coords.status = this.processLoaderStatus(orient, targetHeight, coords.status, false);
        if (!orient || coords.status !== STATUS_LOAD) {
            this.removePullDownRegion();
            this._touchCoords = null;
            this._draggable = true;
            this._canTouchMove = false;
        }
    }

    doTransition = () => {
        let coords = this._touchCoords;
        if (!coords) return;

        let orient = coords.pullDown ? PULLED_DOWN : null;
        if (orient === PULLED_DOWN) {
            let target = this.header;
            let targetHeight = target && target.offsetHeight || 0;
            let threshold = this.props.threshold;
            let adjustHeight = targetHeight > threshold ? threshold : 0;

            let duration = (targetHeight - adjustHeight) / 
                    threshold * PULL_MAX_DURATION;
            duration = duration > PULL_MAX_DURATION ? PULL_MAX_DURATION : 
                    Math.ceil(duration);

            let endHandler = () => this.handleTransitionEnd(orient, targetHeight);
            listenTransition(target, duration, endHandler);

            target.style[transition] = 'height ' + duration + 'ms';
            setTimeout(function() {
                target.style.height = adjustHeight + 'px';
            }, 0);
        } else {
            this.handleTransitionEnd(orient, 0);
        }
    }

    reset = () => {
        this.doTransition();
    }

    disablePullDown = disabled => {
        this.isPullDownDisabled = disabled;
    }

    disablePullUp = disabled => {
        this.isPullUpDisabled = disabled;
    }
    
    render() {
        return (
            <div ref='wrapper' id='listview' className={ this.props.wrapperClassName }
                onTouchStart={ this.handleTouchStart } 
                onTouchMove={ this.handleTouchMove } 
                onTouchEnd={ this.handleTouchEnd }
                onScroll={ this.handleScroll }
            >
                <div ref='list' className={ this.props.scrollerClassName }>
                    { this.props.children }
                </div>
            </div>
        );
    }
}

ListView.scrollTo = (scrollTop) => {
    document.getElementById('listview').scrollTop = scrollTop + 'px';
};
