<template>
  <div id="main">
    <a-layout id="components-layout-demo-top" class="layout">
      <a-layout-header id="layout-header-container">
        <div class="logo">KGNav</div>
        <a-menu
          id="toolmeum"
          theme="dark"
          mode="horizontal"
          :selectedKeys="seletedTool"
          :style="{ lineHeight: '64px' }"
        >
          <a-sub-menu class="meumFont">
            <span slot="title" class="submenu-title-wrapper">
              <a-icon type="wallet" />Database</span>
            <a-menu-item class="meumFont" key="db1">
              <div @click="showConfirm('db1')"><a-icon  type="book" />Database 1</div>
            </a-menu-item>
            <a-menu-item class="meumFont"  key="db2">
              <div @click="showConfirm('db2')"><a-icon  type="book" />Database 2</div>
            </a-menu-item>
            <!-- <a-menu-item class="meumFont" key="db3">
              <div @click="showConfirm('db3')"><a-icon type="book" />Database 3</div>
            </a-menu-item> -->
          </a-sub-menu>
          <!-- <a-sub-menu class="meumFont">
            <span slot="title" class="submenu-title-wrapper">
            <a-icon type="setting" />Operation</span>
            <a-menu-item key="1">
              <div @click="undo"><a-icon  type="undo" />Undo</div>
            </a-menu-item>
            <a-menu-item key="2">
              <div @click="redo"><a-icon  type="redo" />Redo</div>
            </a-menu-item>
          </a-sub-menu> -->
          <a-sub-menu class="meumFont">
            <span slot="title" class="submenu-title-wrapper">
              <a-icon type="gateway" />View</span>
            <a-menu-item class="meumFont" key="3">
              <div @click="zoomOut"><a-icon  type="zoom-out" />Zoom Out</div>
            </a-menu-item>
            <a-menu-item class="meumFont"  key="4">
              <div @click="zoomIn"><a-icon  type="zoom-in" />Zoom In</div>
            </a-menu-item>
            <a-menu-item class="meumFont" key="5">
              <div @click="restore"><a-icon type="fullscreen-exit" />Restore</div>
            </a-menu-item>
            <a-menu-item class="meumFont" key="6">
              <div @click="fitView"><a-icon  type="fullscreen" />Fitview</div>
            </a-menu-item>
          </a-sub-menu>
          <a-menu-item class="meumFont" key="minimap">
            <div @click="showMinimap"><a-icon  type="picture"/>MiniMap</div>
          </a-menu-item>
          <a-menu-item class="meumFont" key="fisheye">
            <div @click="showFisheye"><a-icon  type="eye"/>Fisheye</div>
          </a-menu-item>
          <!-- <a-menu-item class="meumFont" key="fisheye" >
            <div @click="showFisheye">
              <a-icon  type="eye" />Fisheye
            </div>
          </a-menu-item> -->
          <a-menu-item class="meumFont" key="search" >
            <div @click="showFilter">
              <a-icon type="search" />Search
            </div>
          </a-menu-item>
          <!-- <a-button @click="modeChange" shape="circle" icon="bulb" style="margin-left: 20px;"></a-button> -->
        </a-menu>
        </a-layout-header>
      <a-layout id="layout-main-container">
        <!--左侧条件搜索-->
        <a-layout-sider id="SearchPage" :width="FilterWidth"  theme="light">
          <div class="InfoMeum" id="filter">
            <p class="filterTitle">Conditional Search
              <a-icon type="close" @click="closeFilter" style="float:right;position: relative;margin: 7px 7px 0 0;font-size: 15px;;" />
            </p>
            <!--条件处理部分-->
            <div id="filterContent" style="overflow:auto;">
              <!--Category-->
              <div id="filterSelector">
                <a-form layout="vertical">
                  <a-form-item label="Node category" lable="select the category of nodes">
                    <a-select v-model="region" @change="handleTypeChange">
                      <a-select-option value="none">
                        All
                      </a-select-option>
                      <a-select-option v-for="item in nodeCates" :key="item.id" :value="item.id">
                        {{ item.value }}
                      </a-select-option>
                    </a-select>
                  </a-form-item>

                  <!--label处理-->
                  <div id="typesection">
                    <!--Inlabel选择-->
                    <div id="inCondPanel">
                      <a-form-item class="labelControl" id="inlabels" label="Incoming Edges" style="height:29px;">
                        <a-tooltip class="labelIcon labelAdd" placement="top" title="
                        Only the label or the complete triplet (label, oprator, value) is considered valid, and the rest are not processed.">
                          <a-icon type="question-circle" style="color:rgb(255,123,0);padding-left: 10px;"/>
                        </a-tooltip>
                        <a-icon class="labelIcon labelAdd" type="plus-circle" @click="addInCond"/>
                      </a-form-item>
                      <a-form-item
                        v-for="(k, index) in inform.getFieldValue('inKeys')"
                        :key="index"                     
                        :required="false"
                      >
                        <a-input-group
                        v-decorator="[`IndegreeItems[${index}]`,{}]"
                        compact style="width:244px;">
                        <div style="width: 50%">
                          <a-select
                          style="width: 100%"
                          placeholder="Label"
                          v-model="IndegreeItems[index].label">
                            <a-select-option v-for="(initem, inindex) in InOptionList[index]" :key="inindex" :value="initem">
                              {{ initem }}
                            </a-select-option>
                          </a-select>
                        </div>
                          
                          
                          <a-select class="condOp" :showArrow="false" placeholder="op" v-model="IndegreeItems[index].op" style="width: 19%;">
                            <a-select-option value="equal">=</a-select-option>
                            <a-select-option value="not equal">≠</a-select-option>
                          </a-select>
                          <div class="valueDropdownItem" style="width: 31%;">
                            <a-select
                              show-search 
                              :showArrow="false" 
                              placeholder="Value" 
                              v-model="IndegreeItems[index].value"
                              v-decorator="[`valueInList[${index}]`,{}]"
                              style="width: 100%;"
                              :dropdown-match-select-width="false"
                              :default-active-first-option="false"
                              :not-found-content="null"
                              @search="(val)=>timeflashCond(val,index,'in')"
                              @change="(val)=>timeflashCond(val,index,'in')"
                              @blur="(val)=>timeflashCond(val,index,'in')"
                              >
                                <a-select-option v-for="(inItem, inIndex) in valueInList[index]" 
                                :key="inIndex" :value="inItem">
                                  <a-tooltip placement="topLeft">
                                    <template slot="title">
                                      <span>{{ inItem }}</span>
                                    </template>
                                    {{ inItem }}
                                  </a-tooltip>
                              </a-select-option> 
                            </a-select>
                          </div>
                        
                          <!-- <a-input v-model="IndegreeItems[index].value" placeholder="Value" style="width: 31%;"/> -->
                        </a-input-group>
                        <a-icon 
                          class="dynamic-delete-button labelIcon labelIn"
                          type="minus-circle-o"
                          :disabled="inform.getFieldValue('inKeys').length === 1"
                          @click="() => removeInCond(index)"
                          @mouseenter="changeCondDisable"
                        />
                      </a-form-item>
                    </div>
                    <!--Outlabel选择-->
                    <div id="outCondPanel">
                      <a-form-item class="labelControl" id="outlabels" label="Outgoing Edges" style="height:29px;">
                        <a-tooltip class="labelIcon labelAdd" placement="top" title="
                        Only the label or the complete triplet (label, oprator, value) is considered valid, and the rest are not processed.">
                          <a-icon type="question-circle" style="color:rgb(255,123,0);padding-left: 10px;"/>
                        </a-tooltip>
                        <a-icon class="labelIcon labelAdd" type="plus-circle" @click="addOutCond"/>
                      </a-form-item>
                      <a-form-item
                        v-for="(k, index) in outform.getFieldValue('outKeys')"
                        :key="index"                     
                        :required="false">
                        <a-input-group
                        v-decorator="[`OutdegreeItems[${index}]`,{}]"
                        compact style="width:244px;">
                          <a-select
                          style="width: 50%"
                          placeholder="Label"
                          v-model="OutdegreeItems[index].label">
          <!-- <a-select-option value="birthyear">
          birthYear
        </a-select-option> -->
                            <a-select-option v-for="(outItem, outIndex) in OutOptionList[index]" :key="outIndex" :value="outItem">
                              {{ outItem }}
                            </a-select-option>
                          </a-select>
                          
                          <a-select class="condOp" :showArrow="false" placeholder="op" v-model="OutdegreeItems[index].op" style="width: 19%;">
                            <a-select-option value="equal">=</a-select-option>
                            <a-select-option value="not equal">≠</a-select-option>
                            <!-- <a-select-option value="big">＞</a-select-option>
                            <a-select-option value="big or equal">≥</a-select-option>
                            <a-select-option value="small">＜</a-select-option>
                            <a-select-option value="small or equal">≤</a-select-option> -->
                          </a-select>
                          <div class="valueDropdownItem" style="width: 31%;">
                            <a-select
                              show-search 
                              :showArrow="false" 
                              placeholder="Value" 
                              v-model="OutdegreeItems[index].value"
                              v-decorator="[`valueInList[${index}]`,{}]"
                              style="width: 100%;"
                              :dropdown-match-select-width="false"
                              :default-active-first-option="false"
                              :not-found-content="null"
                              @search="(val)=>timeflashCond(val,index,'out')"
                              @change="(val)=>timeflashCond(val,index,'out')"
                              @blur="(val)=>timeflashCond(val,index,'out')"
                              >
                                <a-select-option v-for="(outItem, outIndex) in valueOutList[index]" 
                                :key="outIndex" :value="outItem" >
                                  <a-tooltip placement="topLeft">
                                    <template slot="title">
                                      <span>{{ outItem }}</span>
                                    </template>
                                    {{ outItem }}
                                  </a-tooltip>
                              </a-select-option> 
                            </a-select>
                          </div>
                          <!-- <a-input v-model="OutdegreeItems[index].value" placeholder="Value" style="width: 31%;"/> -->
                        </a-input-group>
                        <a-icon
                          class="dynamic-delete-button labelIcon labelOut"
                          type="minus-circle-o"
                          :disabled="outform.getFieldValue('outKeys').length === 1"
                          @click="() => removeOutCond(index)"
                          @mouseenter="changeCondDisable"
                        />
                      </a-form-item>
                    </div>
                  </div>
                  <!--条件强度选择-->
                  <a-form-item label="Combination" class="intensity">
                    <div>
                      <a-radio-group v-model="conditionLevel" @change="changeIntro">
                        <a-radio-button value="strong">
                          Strong
                        </a-radio-button>
                        <a-radio-button value="weak">
                          Weak
                        </a-radio-button>
                      </a-radio-group>
                    </div>
                  </a-form-item>
                  <a-alert :message="conditionIntro" type="info" show-icon />
                  <a-form-item :wrapper-col="{ span: 16, offset: 4 }" style="margin-top:10px;">
                    <a-button type="primary" @click="onSubmit"><a-icon type="search" />Search</a-button>
                    <a-button style="margin-left: 10px;" @click="onClean">Clean</a-button>
                  </a-form-item>
                </a-form>
              </div>

              <a-divider style="margin:0px;">Result</a-divider>
              <!--查找结果列表（5级）-->
              <div id="searchList-2" style="display:none">
                <a-menu id="searchList-2-ul"
                  mode="inline"
                >
                  <template v-for="item1 in conditiondata" >
                    <!-- 一级菜单 -->
                    <a-sub-menu v-if="item1.level != 0" :key="item1.id+'-l2'" @titleClick="ComboClick(item1)">
                      <span slot="title">
                        <a-icon type="golden" theme="filled" />
                        <!-- {{item1.value}} -->
                        <a-tooltip placement="topLeft">
                          <template slot="title">
                            <span>{{item1.value}}</span>
                          </template>
                          {{item1.value}}
                        </a-tooltip>
                      </span>

                      <template v-for="item2 in item1.nodes" >
                        <!-- 二级菜单 -->
                        <a-sub-menu v-if="item2.level != 0" :key="item2.id+'-l2'" @titleClick="ComboClick(item2)">
                          <span slot="title">
                            <a-icon type="golden" theme="filled" />
                            <!-- {{item2.value}} -->
                            <a-tooltip placement="topLeft">
                              <template slot="title">
                                <span>{{item2.value}}</span>
                              </template>
                              {{item2.value}}
                            </a-tooltip>
                          </span>
                          <template v-for="item3 in item2.nodes" >
                            <!-- 三级菜单 -->
                            <a-sub-menu v-if="item3.level != 0" :key="item3.id+'-l2'" @titleClick="ComboClick(item3)">
                              <span slot="title">
                                <a-icon type="golden" theme="filled" />
                                <!-- {{item3.value}} -->
                                <a-tooltip placement="topLeft">
                                    <template slot="title">
                                      <span>{{item3.value}}</span>
                                    </template>
                                    {{item3.value}}
                                  </a-tooltip>
                              </span>
                              <template v-for="item4 in item3.nodes" >
                                <!-- 四级菜单 -->
                                <a-sub-menu v-if="item4.level != 0" :key="item4.id+'-l2'" @titleClick="ComboClick(item4)">
                                  <span slot="title">
                                    <a-icon type="golden" theme="filled" />
                                    <!-- {{item4.value}} -->
                                    <a-tooltip placement="topLeft">
                                      <template slot="title">
                                        <span>{{item4.value}}</span>
                                      </template>
                                      {{item4.value}}
                                    </a-tooltip>
                                  </span>
                                  <template v-for="item5 in item4.nodes" >
                                    <!-- 五级菜单 -->
                                    <a-sub-menu v-if="item5.level != 0" :key="item5.id+'-l2'" @titleClick="ComboClick(item5)">
                                      <span slot="title">
                                        <a-icon type="golden" theme="filled" />
                                        <!-- {{item5.value}} -->
                                        <a-tooltip placement="topLeft">
                                          <template slot="title">
                                            <span>{{item5.value}}</span>
                                          </template>
                                          {{item5.value}}
                                        </a-tooltip>
                                      </span>
                                      <a-menu-item v-for="node in item5.nodes" :key="node.id+'-l2'" @click="NodeClick(node)">
                                        <!-- {{node.value}} -->
                                        <a-tooltip placement="topLeft">
                                          <template slot="title">
                                            <span>{{node.value}}</span>
                                          </template>
                                          {{node.value}}
                                        </a-tooltip>
                                      </a-menu-item>
                                    </a-sub-menu>
                                    <a-menu-item v-if="item5.level == 0" :key="item5.id+'-l2'" @click="NodeClick(item5)">
                                      <!-- {{item5.value}} -->
                                      <a-tooltip placement="topLeft">
                                          <template slot="title">
                                            <span>{{item5.value}}</span>
                                          </template>
                                          {{item5.value}}
                                        </a-tooltip>
                                    </a-menu-item>
                                  </template>
                                </a-sub-menu>
                                <a-menu-item v-if="item4.level == 0" :key="item4.id+'-l2'" @click="NodeClick(item4)">
                                  <!-- {{item4.value}} -->
                                  <a-tooltip placement="topLeft">
                                    <template slot="title">
                                      <span>{{item4.value}}</span>
                                    </template>
                                    {{item4.value}}
                                  </a-tooltip>
                                </a-menu-item>
                              </template>
                            </a-sub-menu>
                            <a-menu-item v-if="item3.level == 0" :key="item3.id+'-l2'" @click="NodeClick(item3)">
                              <!-- {{item3.value}} -->
                              <a-tooltip placement="topLeft">
                                <template slot="title">
                                  <span>{{item3.value}}</span>
                                </template>
                                {{item3.value}}
                              </a-tooltip>
                            </a-menu-item>
                          </template>
                        </a-sub-menu>
                        <a-menu-item v-if="item2.level == 0" :key="item2.id+'-l2'" @click="NodeClick(item2)">
                          <!-- {{item2.value}} -->
                          <a-tooltip placement="topLeft">
                            <template slot="title">
                              <span>{{item2.value}}</span>
                            </template>
                            {{item2.value}}
                          </a-tooltip>
                        </a-menu-item>
                      </template>
                    </a-sub-menu>
                    <a-menu-item v-if="item1.level == 0" :key="item1.id+'-l2'" @click="NodeClick(item1)">
                      <!-- {{item1.value}} -->
                      <a-tooltip placement="topLeft">
                        <template slot="title">
                          <span>{{item1.value}}</span>
                        </template>
                        {{item1.value}}
                      </a-tooltip>
                    </a-menu-item>
                  </template>
                </a-menu>
              </div>
            </div>
           
          </div>
        </a-layout-sider>
        <!-- 操作按钮 -->
        <a-layout-content id="containerBox" style="padding:30px 15px 0 15px;float: left;">
          <div id="toolbar">
            <button class="opBtn" :class="getClass()"  :disabled="isDisable"
                    @click="clickOp($event)" @mouseover="hoverInOp($event)" @mouseleave="hoverOutOp()" >
              <img  id="union" :src="require('./pic/union-'+unionUrl+'.png')" title="Union" alt=""  />
            </button>
            <button class="opBtn" :class="getClass()"  :disabled="isDisable"
                    @click="clickOp($event)" @mouseover="hoverInOp($event)" @mouseleave="hoverOutOp()" >
              <img  id="inter" :src="require('./pic/inter-'+interUrl+'.png')" title="Intersection" alt=""/>
            </button>
            <button class="opBtn" :class="getClass()"  :disabled="isDisable"
                    @click="clickOp($event)" @mouseover="hoverInOp($event)" @mouseleave="hoverOutOp()" >
              <img  id="comp" :src="require('./pic/comp-'+compUrl+'.png')" title="Difference" alt=""/>
            </button>
          </div>
          <p id="tips">Tips : Press 'shift' to select multiple nodes.</p>
          <div id="container"></div>
          <div id="minimap" style="display:none"></div>
        </a-layout-content>
        <!--右侧搜索框-->
        <a-layout-sider id="SearchTree" width="300" theme="light">
          
          <!-- <a-menu id="InfoTitle"
            v-model="current"
            mode="horizontal"
            @click="ChangeSearchType"
            >
            <a-menu-item class="InfoTitle-item" key="fuzzy"> <a-icon type="search" />Fuzzy Search</a-menu-item>
            <a-menu-item class="InfoTitle-item" key="conditional"> <a-icon type="search" />Conditional</a-menu-item>
          </a-menu> -->
          <div class="InfoMeum" id="meum">
            <div id="searchNode">
              <a-input-search v-model="searchStr" placeholder="input search text" size="large"
                              @search="onSearch" @keydown="keyDownEvent($event)" @input="timeflash()" @blur="closeSearch()" @focus="showSearch()">
                <a-button id='searchtree-button' slot="enterButton">
                  Search
                </a-button>
              </a-input-search>
              <span class="search-list" id="forhide">
                <template v-for="d in searchDataList">
                  <div class="searchListItem"  @mousedown='enterKeyEvent(d)'>{{d}}</div>
                </template>
              </span>
            </div>
            <div id="searchList-1">
              <a-menu
                id="searchList-1-ul"
                :open-keys.sync="openKeys"
                mode="inline"
                :selected-keys="[curSel]"
              >
                <template v-for="item1 in oridata.clusters" >
                  <!-- 一级菜单 -->
                  <a-sub-menu class="listTitle" v-if="item1.level != 0" :key="item1.id" @titleClick="ComboClick(item1)" :style="getBackColor(item1)">
                    <span v-if="!item1.isResult" slot="title">
                      <a-icon  type="golden" theme="filled" :style="{color: getNodeColor(item1)}"/>
                      <a-tooltip placement="topLeft" :style="getTextColor(item1)">
                          <template slot="title">
                            <span>{{item1.value}}</span>
                          </template>
                          {{item1.value}}
                        </a-tooltip>
                    </span>
                    <span v-else slot="title">
                      <a-icon type="tags" theme="filled" :style="{color: getNodeColor(item1)}"/>
                      <a-tooltip placement="topLeft" :style="getTextColor(item1)">
                          <template slot="title">
                            <span>{{item1.value}}</span>
                          </template>
                          {{item1.value}}
                        </a-tooltip>
                    </span>

                    <template v-for="item2 in item1.nodes" >
                      <!-- 二级菜单 -->
                      <a-sub-menu v-if="item2.level != 0" :key="item2.id" @titleClick="ComboClick(item2)" :style="getBackColor(item2)">
                        <span slot="title">
                          <a-icon type="golden" theme="filled" :style="{color: getNodeColor(item2)}"/>
                          <!-- {{item2.value}} -->
                          <a-tooltip placement="topLeft" :style="getTextColor(item2)">
                            <template slot="title">
                              <span>{{item2.value}}</span>
                            </template>
                            {{item2.value}}
                          </a-tooltip>
                        </span>
                        <template v-for="item3 in item2.nodes" >
                          <!-- 三级菜单 -->
                          <a-sub-menu v-if="item3.level != 0" :key="item3.id" @titleClick="ComboClick(item3)" :style="getBackColor(item3)">
                            <span slot="title">
                              <a-icon type="golden" theme="filled" :style="{color: getNodeColor(item3)}"/>
                              <!-- {{item3.value}} -->
                              <a-tooltip placement="topLeft" :style="getTextColor(item3)">
                                  <template slot="title">
                                    <span>{{item3.value}}</span>
                                  </template>
                                  {{item3.value}}
                                </a-tooltip>
                            </span>
                            <template v-for="item4 in item3.nodes" >
                              <!-- 四级菜单 -->
                              <a-sub-menu v-if="item4.level != 0" :key="item4.id" @titleClick="ComboClick(item4)" :style="getBackColor(item4)">
                                <span slot="title">
                                  <a-icon type="golden" theme="filled" :style="{color: getNodeColor(item4)}"/>
                                  <!-- {{item4.value}} -->
                                  <a-tooltip placement="topLeft" :style="getTextColor(item4)">
                                    <template slot="title">
                                      <span>{{item4.value}}</span>
                                    </template>
                                    {{item4.value}}
                                  </a-tooltip>
                                </span>
                                <template v-for="item5 in item4.nodes" >
                                  <!-- 五级菜单 -->
                                  <a-sub-menu v-if="item5.level != 0" :key="item5.id" @titleClick="ComboClick(item5)" :style="getBackColor(item5)">
                                    <span slot="title">
                                      <a-icon type="golden" theme="filled" :style="{color: getNodeColor(item5)}"/>
                                      <!-- {{item5.value}} -->
                                      <a-tooltip placement="topLeft">
                                        <template slot="title">
                                          <span>{{item5.value}}</span>
                                        </template>
                                        {{item5.value}}
                                      </a-tooltip>
                                    </span>
                                    <a-menu-item v-for="node in item5.nodes" :key="node.id" @click="NodeClick(node)"  :style="getBackColor(node)">
                                      <!-- {{node.value}} -->
                                      <a-tooltip placement="topLeft">
                                        <template slot="title">
                                          <span>{{node.value}}</span>
                                        </template>
                                        {{node.value}}
                                      </a-tooltip>
                                    </a-menu-item>
                                  </a-sub-menu>
                                  <a-menu-item v-if="item5.level == 0" :key="item5.id" @click="NodeClick(item5)" :style="getBackColor(item5)">
                                    <!-- {{item5.value}} -->
                                    <a-tooltip placement="topLeft">
                                        <template slot="title">
                                          <span>{{item5.value}}</span>
                                        </template>
                                        {{item5.value}}
                                      </a-tooltip>
                                  </a-menu-item>
                                </template>
                              </a-sub-menu>
                              <a-menu-item v-if="item4.level == 0" :key="item4.id" @click="NodeClick(item4)" :style="getBackColor(item4)">
                                <!-- {{item4.value}} -->
                                <a-tooltip placement="topLeft">
                                  <template slot="title">
                                    <span>{{item4.value}}</span>
                                  </template>
                                  {{item4.value}}
                                </a-tooltip>
                              </a-menu-item>
                            </template>
                          </a-sub-menu>
                          <a-menu-item v-if="item3.level == 0" :key="item3.id" @click="NodeClick(item3)" :style="getBackColor(item3)">
                            <!-- {{item3.value}} -->
                            <a-tooltip placement="topLeft">
                              <template slot="title">
                                <span>{{item3.value}}</span>
                              </template>
                              {{item3.value}}
                            </a-tooltip>
                          </a-menu-item>
                        </template>
                      </a-sub-menu>
                      <a-menu-item v-if="item2.level == 0" :key="item2.id" @click="NodeClick(item2)" :style="getBackColor(item2)">
                        <!-- {{item2.value}} -->
                        <a-tooltip placement="topLeft">
                          <template slot="title">
                            <span>{{item2.value}}</span>
                          </template>
                          {{item2.value}}
                        </a-tooltip>
                      </a-menu-item>
                    </template>
                  </a-sub-menu>
                  <a-menu-item v-if="item1.level == 0" :key="item1.id" @click="NodeClick(item1)" :style="getBackColor(item1)">
                    <a-tooltip placement="topLeft" >
                      <template slot="title">
                        <span>{{item1.value}}</span>
                      </template>
                      {{item1.value}}
                    </a-tooltip>
                  </a-menu-item>
                </template>
              </a-menu>
            </div>

          </div>

          <div class="InfoMeum" id="infomations">
            <div id="backBtn" >
              <a-button v-on:click="closeInfo" type="link" icon="left" style="font-size:large;">Back</a-button>
            </div>

            <div id="infolist" style="clear: both;overflow-y: auto;">
              <div class="infoLoading" v-if="entityInfoShow == 0">
                <img class="infoLoadingImg" src='../../assets/loading.gif' alt="">
                Querying related information
              </div>
              <div class="infoError" v-if="entityInfoShow == 2">
                <img class="infoErrorImg" src='../../assets/notFound.png' alt="">
                Related entity not found
              </div>
              <div class="infoDetails" v-if="entityInfoShow == 1">
                <div class="infoName">{{ entityInfo.name }}</div>
                <div class="infoImgContainer">
                  <img class="infoImg" :src='entityInfo.imgUrl' alt="">
                </div>
                <div class="infoLink">
                  <a :href='entityInfo.link'>Wikidata Link</a>
                </div>
                <div class="infoProps">
                  Entity Properties
                  <a-list item-layout="horizontal" :data-source="entityInfo.properties">
                    <a-list-item class="infoPropItemContainer" slot="renderItem" slot-scope="propValue, propKey">
                      <div class="infoPropItem" v-for="value, key in propValue" >
                        <span class="infoPropItemProp">{{key}}: &nbsp; </span>
                        <a-tooltip placement="left">
                            <template slot="title">
                              <span class="infoPropItemValue">{{value}}</span>
                            </template>
                            {{value}}
                          </a-tooltip>
                        <!-- <span class="infoPropItemValue">{{value}}</span> -->
                      </div>
                    </a-list-item>
                  </a-list>
                </div>
                <div id="tripleINfo" style="margin:20px -7px 0px -7px;" >
                  <a-table :data-source="tripleData" :columns="columns" 
                  bordered size="small"
                  :pagination="{ pageSize: 5 }"
                  :customRow="tripleSelection"
                  >
                    <div
                      slot="filterDropdown"
                      slot-scope="{ setSelectedKeys, selectedKeys, confirm, clearFilters, column }"
                      style="padding: 8px"
                    >
                      <a-input
                        v-ant-ref="c => (searchTripleInput = c)"
                        :placeholder="`Search ${column.dataIndex}`"
                        :value="selectedKeys[0]"
                        style="width: 188px; margin-bottom: 8px; display: block;"
                        @change="e => setSelectedKeys(e.target.value ? [e.target.value] : [])"
                        @pressEnter="() => handleSearch(selectedKeys, confirm, column.dataIndex)"
                      />
                      <a-button
                        type="primary"
                        icon="search"
                        size="small"
                        style="width: 90px; margin-right: 8px"
                        @click="() => handleSearch(selectedKeys, confirm, column.dataIndex)"
                      >
                        Search
                      </a-button>
                      <a-button size="small" style="width: 90px" @click="() => handleReset(clearFilters)">
                        Reset
                      </a-button>
                    </div>
                    <a-icon
                      slot="filterIcon"
                      slot-scope="filtered"
                      type="search"
                      :style="{ color: filtered ? '#108ee9' : undefined }"
                    />
                    <template slot="customRender" slot-scope="text, record, index, column">
                      <span v-if="searchTripleText && tripleColumn === column.dataIndex">
                        <template
                          v-for="(fragment, i) in text
                            .toString()
                            .split(new RegExp(`(?<=${searchTripleText})|(?=${searchTripleText})`, 'i'))"
                        >
                          <mark
                            v-if="fragment.toLowerCase() === searchTripleText.toLowerCase()"
                            :key="i"
                            class="highlight"
                            >{{ fragment }}</mark
                          >
                          <template v-else>{{ fragment }}</template>
                        </template>
                      </span>
                      <template v-else>
                        {{ text }}
                      </template>
                    </template>
                  </a-table>

                </div>
              </div>
              
            </div>

          </div>
        </a-layout-sider>
      </a-layout>
      <a-layout-footer id="layout-footer-container">
        Copyright ©2022 TJUDB Group
      </a-layout-footer>
    </a-layout>
  </div>

</template>

<script>
import login from "./g6_Component.js";
export default login;
</script>

<style lang="css">
@import './g6_Component.css'
</style>
