/* eslint-env browser */
import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { transition, listenTransition } from '../utils/transition';
import styles from './Listview.css';

const SCROLLER_CHECK_DURATION = 500;
const PULL_MAX_DURATION = 200;
const DRAG_UP = 1;
const DRAG_DOWN = 2;
const STATUS_DEFAULT = 11;
const STATUS_PREPARE = 12;
const STATUS_LOAD = 13;

export default class ListView extends React.Component {
    static propTypes = {
        threshold: PropTypes.number, // 拖拽阈值
        dragDownHelper: PropTypes.oneOfType([
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
    }

    static defaultProps = {
        threshold: 40,
        dragDownHelper: false,
        wrapperClassName: '',
        scrollerClassName: '',
        showNoContent: false,
        compatSlider: false,
        onPullDown: function() {},
        onPullUp: function() {}
    };

    componentDidMount = () => {
        this._draggable = true;
        this._canTouchMove = false;

        this.scrollUpCheckTimer = null;
        this.touchMoveTriggerTimer = null;

        this.wrapper = ReactDOM.findDOMNode(this.refs.wrapper);
        this.scroller = ReactDOM.findDOMNode(this.refs.list);
        this.mkDragUpPlace();
    }

    componentDidUpdate = () => {
        this.mkDragUpPlace();
    }

    mkDragDownPlace = () => {
        this.cleanDragDownPlace();
        this.header = document.createElement('div');
        this.header.className = styles['latest'];
        this._touchCoords.status = this.handleStatus('down', 0, null, true);
        this.wrapper.insertBefore(this.header, this.scroller);
        return this.header;
    }

    cleanDragDownPlace = () => {
        if (this.header) {
            this.wrapper.removeChild(this.header);
            this.header = null;
        }
    }

    mkDragUpPlace = () => {
        if (!this.footer) {
            this.footer = document.createElement('div');
            this.wrapper.appendChild(this.footer);
        }

        if (this.wrapper.clientHeight >= this.scroller.offsetHeight ||
            this.props.showNoContent
        ) {
            console.log(this.wrapper.clientHeight, this.scroller.offsetHeight)
            this.dragUpUnable(true);
            this.footer.className = styles['loader'];
            this.footer.innerHTML = `<p class='${styles['non_cont']}'>${this.props.content}</p>`;
            this.footer.style.height = this.props.threshold * 1.5 + 'px';
        } else {
            this.dragUpUnable(false);
            this.footer.className = styles['loader'];
            this.footer.innerHTML = '' +
                '<div class=' + styles["loader"] + '>' +
                    '<em class=' + styles["pull-loading"] + '></em>' +
                    '<span>加载中...</span>' +
                '</div>';
            this.footer.style.height = this.props.threshold + 'px';
        }
    }

    dragHandler = status => {
        let helper = this.props.dragDownHelper || function(status) {
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

    handleStatus = (orient, offsetY, currentStatus, moved) => {
        let overflow, nextStatus = currentStatus;
        if (orient === DRAG_DOWN) {
            overflow = offsetY > this.props.threshold * 2;
            if (!overflow && currentStatus !== STATUS_DEFAULT) {
                this.dragHandler(STATUS_DEFAULT);
                nextStatus = STATUS_DEFAULT;
            } else if (moved && overflow && currentStatus !== STATUS_PREPARE) {
                this.dragHandler(STATUS_PREPARE);
                nextStatus = STATUS_PREPARE;
            } else if (!moved && overflow && currentStatus !== STATUS_LOAD) {
                this.dragHandler(STATUS_LOAD);
                this.props.onPullDown(this.reset);
                nextStatus = STATUS_LOAD;
            }
        } else if (orient === DRAG_UP) {
            overflow = offsetY < this.props.threshold;

            if (moved && overflow) {
                if (currentStatus === undefined) {
                    this.props.onPullUp(this.reset);
                    nextStatus = STATUS_LOAD;
                } else if (currentStatus === STATUS_LOAD) {
                    nextStatus = STATUS_PREPARE;
                }
            }

            if (!moved && currentStatus === STATUS_LOAD) {
                nextStatus = STATUS_PREPARE;
            }
        }
        return nextStatus;
    }

    handleTouchStart = e => {
        this._canTouchMove = false;
        let startScrollY =  this.wrapper.scrollTop;

        if (this._draggable && 
                (this.disableDragDown !== true || 
                    this.disableDragUp !== true)
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
        this.scrollUpCheckTimer && clearTimeout(this.scrollUpCheckTimer);
        this.touchMoveTriggerTimer && clearTimeout(this.touchMoveTriggerTimer);

        if (this._canTouchMove && this.props.compatSlider && this._startMove) {
            let point = e.touches && e.touches[0];
            let deltaX = point.pageX - this._pointX;
            let deltaY = point.pageY - this._pointY;

            this._draggable = true;
            this._startMove = false;
            this._canTouchMove = Math.abs(deltaX) > Math.abs(deltaY) ? false : true;
        }

        if (!this._canTouchMove) return;

        let innerHeight = window.innerHeight;
        let ctHeight = this.wrapper.scrollHeight;
        let coords = this._touchCoords;
        let startScrollY = coords.startScrollY;
        let blockY = coords.blockY;
        let startY = coords.startY;
        let stopY = e.touches[0].screenY;
        let offsetY, overY;

        if (typeof coords.canDragDown === 'undefined') {
            coords.canDragDown = this.disableDragDown !== true && 
                    startY < stopY && startScrollY <= 0;
        }
        if (typeof coords.canDragUp === 'undefined') {
            coords.canDragUp = this.disableDragUp !== true && 
                    startY > stopY && startScrollY + innerHeight >= ctHeight;
        }

        if (coords.canDragDown && coords.dragUp !== true && 
            (coords.dragDown || startY - stopY + startScrollY < 0)
        ) {
            e.preventDefault();
            coords.dragDown = true;
            if (!this.header) {
                this.header = this.mkDragDownPlace();
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

            coords.status = this.handleStatus(DRAG_DOWN, offsetY, coords.status, true);
        } else if (coords.canDragUp && coords.dragDown !== true && 
            (coords.dragUp || startY - stopY + startScrollY + innerHeight > ctHeight)
        ) {
            e.preventDefault();
        } else {
            coords.blockY = stopY;
        }

        var that = this;
        this.touchMoveTriggerTimer = setTimeout(function() {
            that.handleTouchEnd();
            that.touchMoveTriggerTimer = null;
        }, SCROLLER_CHECK_DURATION);
    }

    handleTouchEnd = e => {
        this.touchMoveTriggerTimer && clearTimeout(this.touchMoveTriggerTimer);
        this.touchMoveTriggerTimer = null;

        if (!this._canTouchMove) return;

        this._canTouchMove = false;
        this.transPage();
    }

    endFn = (orient, targetHeight) => {
        let coords = this._touchCoords;
        coords.status = this.handleStatus(orient, targetHeight, coords.status, false);

        if (orient === null) {
            this.scrollUpCheckTimer && clearTimeout(this.scrollUpCheckTimer);
            this.scrollUpCheckTimer = setTimeout(() => {
                if (this.disableDragUp) {
                    this.cleanDragDownPlace();
                    this._touchCoords = null;
                    this._draggable = true;
                    this._canTouchMove = false;

                    return;
                }

                let target = this.wrapper;
                let offsetY = target.scrollHeight - target.clientHeight - 
                        target.scrollTop;
                coords.status = this.handleStatus(DRAG_UP, offsetY, coords.status, true);

                if (coords.status === undefined || coords.status === STATUS_PREPARE) {
                    this.cleanDragDownPlace();
                    this._touchCoords = null;
                    this._draggable = true;
                    this._canTouchMove = false;
                } else {
                    coords.dragUp = true;
                }
                this.scrollUpCheckTimer = null;
            }, SCROLLER_CHECK_DURATION);
        } else if (coords.status !== STATUS_LOAD) {
            this.cleanDragDownPlace();
            this._touchCoords = null;
            this._draggable = true;
            this._canTouchMove = false;
        }
    }

    transPage = () => {
        let coords = this._touchCoords;
        if (!coords) return;

        let orient = coords.dragDown ? DRAG_DOWN : (coords.dragUp ? DRAG_UP : null);
        
        if (orient === DRAG_DOWN) {
            let that = this;
            let target = this.header;
            let targetHeight = target && target.offsetHeight || 0;
            let threshold = this.props.threshold;
            let adjustHeight = targetHeight > threshold ? threshold : 0;

            let duration = (targetHeight - adjustHeight) / 
                    threshold * PULL_MAX_DURATION;
            duration = duration > PULL_MAX_DURATION ? PULL_MAX_DURATION : 
                    Math.ceil(duration);

            let endHandler = () => {
                that.endFn(orient, targetHeight);
            };

            listenTransition(target, duration, endHandler);

            target.style[transition] = 'height ' + duration + 'ms';
            setTimeout(function() {
                target.style.height = adjustHeight + 'px';
            }, 0);
        } else {
            this.endFn(orient, 0);
        }
    }

    reset = () => {
        this.transPage();
    }

    dragdownUnable = disabled => {
        this.disableDragDown = disabled;
    }

    dragUpUnable = disabled => {
        this.disableDragUp = disabled;
    }
    
    render() {
        return (
            <div ref='wrapper' id='listview' className={ styles['wrapper_list'] }
                onTouchStart={ this.handleTouchStart } 
                onTouchMove={ this.handleTouchMove } 
                onTouchEnd={ this.handleTouchEnd } 
            >
                <div ref='list' className={ styles['scroller_list'] }>
                    { this.props.children }
                </div>
            </div>
        );
    }
}

ListView.scrollTo = (scrollTop) => {
    document.getElementById('listview').scrollTop = scrollTop + 'px';
};