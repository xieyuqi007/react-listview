'use strict';

import React from 'react';
import './example.css';
import Listview from '../src/components/ListView';
import Tabs from './tabs';
import Content from './Content';
import styles from './example.css';

var listData = [
            {
                src: "http://ww1.sinaimg.cn/bmiddle/81f937cegw1f6m9z2owkaj20j60q8k0p.jpg"
            },
            {
                src: "http://ww4.sinaimg.cn/bmiddle/6a4475c9jw1f72gncegd2j20jg0jgabh.jpg"
            },
            {
                src: "http://ww1.sinaimg.cn/bmiddle/9d793dbdgw1f74lcigmpij20dl097wgh.jpg"
            },
            {
                src: "http://ww4.sinaimg.cn/bmiddle/9486c0d8gw1f74k22ovjej20az09y40q.jpg"
            },
            {
                src: "http://ww1.sinaimg.cn/bmiddle/ab7e90fegw1f32dul3v1rj20mf0xc7c7.jpg"
            },
            {
                src: "http://ww1.sinaimg.cn/large/a8418203jw1f1wg91ljbmj21f02iotw5.jpg"
            },
            {
                src: "http://ww4.sinaimg.cn/bmiddle/9d9783aagw1f72l2387ifj20j60eemzz.jpg"
            }
        ];
export default class ListView extends React.Component {
    state = {
        listData: listData
    }

    handlePullDown = reset => {
        setTimeout(()=> {
            listData.splice(0, 0, {
            src: "http://ww2.sinaimg.cn/bmiddle/6a4475c9jw1f72gngepubj20jg0jgta2.jpg"
        })
            this.setState({listData:listData}, reset);
        }, 1000)
    }

    handlePullUp = reset => {
        setTimeout(()=> {
            listData.push({
                src: "http://ww1.sinaimg.cn/bmiddle/9d793dbdgw1f74lcigmpij20dl097wgh.jpg",
            })
            this.setState({listData:listData}, reset);
        }, 1000)
    }

    getListData = () => {
    
        return this.state.listData.map((item, index) => {
            let listItem = (
                <Content 
                    key={index} 
                    src={item['src']} />
            );

            return listItem;
        });
    }

    render = () => <div>
                        <Tabs/>
                        <div className="wrap">
                            <Listview content={ '没有更多内容了' }
                                onPullUp={ this.handlePullUp }
                                onPullDown={ this.handlePullDown }
                                >
                                { this.getListData() }
                            </Listview>
                        </div>
                    </div>;
}

