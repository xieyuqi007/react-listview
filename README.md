###react-listview

-------------------

##### List loading component based on browser native rolling.


*  Installation&Usage：

         > $ npm install
         > $ npm start

*  Navigate to：
>http://localhost:8080

####API

-------------------

* Arguments：
    

    >threshold`number`: 阈值
    >showNoContent`bool`:  是否无内容时显示提示
    >content`string`：无内容文案
    >compatSlider`bool`： 兼容横屏滑动
    >onPullDown`fun`: 下拉刷新操作调用的方法
    >onPullUp: `fun`：上拉加载操作调用方法


          


* Example：

          import Listview from './Listview';
          <Listview content={ 'no more content' }
              onPullUp={ this.handlePullUp }
              onPullDown={ this.handlePullDown }
              showNoContent={false}
                    { this.listContent() }
            ></Listview>
        
-------------------
* Using [webpack](http://webpack.github.io/), traverse the dependency tree.
* With the help of [babel](https://babeljs.io/), transpile any occurences of ECMAScript 2015 syntax.
* Output the result to the `build` directory and serve it.