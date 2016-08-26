'use strict';

import React from 'react';

export default class Content extends React.Component {
    render() {
        return (
             <div className="main_content">
                <div className="art_talk voice_part">
                    <p className="groupmsg_time" style={{width:"auto"}}>06-15 11:22</p>
                    <ul className="art_card_style bg_active">
                      <li>
                        <a href="javascript:;" className="cover_part"></a>
                        <div className="top_pic_wrap">
                            <a href="javascript:;">
                                <img src={this.props.src}/>
                            </a>
                        </div>
                      </li>
                    </ul>
                </div>
            </div>
        );
    }
}