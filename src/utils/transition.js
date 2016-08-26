/**
 * 监听transitionEnd
 */
let dummyStyle = document.createElement('div').style;
let vendor,
    vendors = 't,webkitT,MozT,msT,OT'.split(','),
    t,
    i = 0,
    l = vendors.length;

for (; i < l; i++) {
    t = vendors[i] + 'ransform';
    if (t in dummyStyle) {
        vendor = vendors[i].substr(0, vendors[i].length - 1);
    }
}

let prefixStyle = function(style) {
    if (vendor === '') return style;
    style = style.charAt(0).toUpperCase() + style.substr(1);
    return vendor + style;
};

let transitionEndEvent = 'transitionend';
if (vendor === 'webkit' || vendor === 'O') {
    transitionEndEvent = vendor.toLowerCase() + 'TransitionEnd';
}

export const transition = prefixStyle('transition');

export function listenTransition(target, duration, callbackFn) {
    var that = this, clear, handler;
    clear = function() {
        if (target.transitionTimer) clearTimeout(target.transitionTimer);
        target.transitionTimer = null;
        target.removeEventListener(transitionEndEvent, handler, false);
    };
    handler = function() {
        clear();
        if (callbackFn) callbackFn.call(that);
    };
    clear();
    target.addEventListener(transitionEndEvent, handler, false);
    target.transitionTimer = setTimeout(handler, duration + 100);
}

export function listenAnimationIteration(target, duration, callbackFn) {
    var that = this, transitionTimer, clear, handler;
        // event = transitionEndEvent === 'transitionend' ? 'animationiteration' :
        //     transitionEndEvent.replace('TransitionEnd', 'AnimationIteration'),
    clear = function() {
        if (transitionTimer) clearTimeout(transitionTimer);
        transitionTimer = null;
        // target.removeEventListener(event, handler, false);
        target.removeEventListener('animationiteration', handler, false);
        target.removeEventListener('webkitAnimationIteration', handler, false);
    };
    handler = function() {
        clear();
        if (callbackFn) callbackFn.call(that);
    };
    clear();
    target.addEventListener('animationiteration', handler, false);
    target.addEventListener('webkitAnimationIteration', handler, false);
    // target.addEventListener(event, handler, false);
    transitionTimer = setTimeout(handler, duration + 100);
}

export function listenAnimationEnd(target, duration, callbackFn) {
    var that = this, transitionTimer, clear, handler;
        // event = transitionEndEvent === 'transitionend' ? 'animationend' :
        //     transitionEndEvent.replace('TransitionEnd', 'AnimationEnd'),
    clear = function() {
        if (transitionTimer) clearTimeout(transitionTimer);
        transitionTimer = null;
        // target.removeEventListener(event, handler, false);
        target.removeEventListener('animationend', handler, false);
        target.removeEventListener('webkitAnimationEnd', handler, false);
    };
    handler = function() {
        clear();
        if (callbackFn) callbackFn.call(that);
    };
    clear();
    target.addEventListener('animationend', handler, false);
    target.addEventListener('webkitAnimationEnd', handler, false);
    transitionTimer = setTimeout(handler, duration + 100);
}

export default {
    transition,
    listenTransition
};

