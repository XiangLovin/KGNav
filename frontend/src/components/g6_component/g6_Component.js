import G6 from '@antv/g6';
import { clone, isString,isNumber, isArray } from '@antv/util';
import {getEntityInfo, getEntityImgUrl} from '../../request/api.js'
let graph = null;
let currentUnproccessedData = { nodes: [], edges: [] };
const CANVAS_WIDTH = window.innerWidth - 375-315;
const CANVAS_HEIGHT =window.innerHeight - 172;

const { uniqueId } = G6.Util;

const NODESIZEMAPPING = 'degree';
const SMALLGRAPHLABELMAXLENGTH = 13;
//最长标签
let labelMaxLength = SMALLGRAPHLABELMAXLENGTH;
const DEFAULTNODESIZE = 35;
const DEFAULTAGGREGATEDNODESIZE = 30;
// TODO: find a proper number for maximum node number on the canvas
const NODE_LIMIT = 15;
const EDGE_LIMIT = 15; 

let nodeMap = {};
let realNodeMap = {};
let aggregatedNodeMap = {};
let firstAggregatedData = { nodes: [], edges: [] };
let aggregatedData = { nodes: [], edges: [] };
let hiddenItemIds = [];
let currentNodeMap = {};
let largeGraphMode = true;
let cachePositions = {};
let manipulatePosition = undefined;
let LabelVisible = 1;

// 用于存储节点的双亲结点
let nodesParents;
// 初始化 类别边 数组
let clusterEdges = []
// 双亲栈
let parents = []

let descreteNodeCenter;
let layout = {
  type: '',
  instance: null,
  destroyed: true,
};
const global = {
  node: {
    style: {
      fill: '#2B384E',
    },
    labelCfg: {
      style: {
        fill: '#acaeaf',
        stroke: '#191b1c',
      },
    },
    stateStyles: {
      focus: {
        fill: '#2B384E',
      },
    },
  },
  edge: {
    style: {
      stroke: '#acaeaf',
      realEdgeStroke: '#acaeaf', //'#f00',
      realEdgeOpacity,
      strokeOpacity: realEdgeOpacity,
    },
    labelCfg: {
      style: {
        fill: '#acaeaf',
        realEdgeStroke: '#acaeaf', //'#f00',
        realEdgeOpacity,
        
      },
    },
  },
};
let opColotSets = {};
//全部入边出边
let allInOption = [];
let allOutOption = [];
//展开节点数组
let expandArray = [];
//是否按左键
let shiftKeydown = false;

const duration = 1000;
const animateOpacity = 0.8;
const animateBackOpacity = 0.2;
const virtualEdgeOpacity = 0.6;
const realEdgeOpacity = 0.6;
let selectedNum = 0;
let selectedNode1={},selectedNode2={};
let selectListIndex = -1;
const renameKey = 'updatable';
let inLabelId = 1;
let outLabelId = 1;

export default {
  name: "G6Componanet",
  components: {},
  data() {
    return{
      labelCol: { span: 8 },
      wrapperCol: { span: 14 },
      current: ['fuzzy'],
      collapsed: false,
      mapVisible: false,
      eyeVisible:false,
      FilterWidth:300,

      searchStr:"",
      openKeys: [],
      curSel: '',
      searchDataList:[],
      seletedTool:['search'],

      region: 'none',
      conditionLevel:'strong',
      rename:'',
      conditionIntro:"Satisfy all the inedge and outedge labels",
      nodeCates: [],
      conditiondata:[],
      // inOprator: '',
      // outOprator: '',

      //conditionValueInStr:[""],
      //conditionValueOutStr:[""],
      //选了哪些
      IndegreeItems: [{
        label:undefined,
        op:undefined,
        value:undefined
      }],
      OutdegreeItems: [{
        label:undefined,
        op:undefined,
        value:undefined
      }],
      //每次可选的
      InOption : [],
      OutOption: [],
      //每条一个列表
      InOptionList : [],
      OutOptionList: [],
      

      unionUrl: 'unable',
      interUrl: 'unable',
      compUrl: 'unable',
      isDisable: true,

      oridata:{},
      
      //
      entityInfoShow: 0,
      entityInfo: {
        name: '',
        imgUrl: '',
        link: '',
        properties:[],
      },

    }
  },

  watch: {
    openKeys(val) {
      //console.log('展开列表', val);
      //console.log(this.openKeys)
    },
  },
  //label
  beforeCreate() {
    this.inform = this.$form.createForm(this, { name: 'Condition_form_in' });
    this.inform.getFieldDecorator('inKeys', { initialValue: [0], preserve: true });

    this.outform = this.$form.createForm(this, { name: 'Condition_form_out' });
    this.outform.getFieldDecorator('outKeys', { initialValue: [0], preserve: true });
  },
  methods:{

    async NodeClick(e) {
      // 设置加载中
      this.entityInfoShow = 0
      // 隐藏其他部分
      let infoEle = document.getElementById('infomations');
      let meumEle = document.getElementById('meum');

      meumEle.style.display='none';
      infoEle.style.display='block';

      const entityImgUrl = await getEntityImgUrl(e.value).then((res)=>{
        if(res.data.hasOwnProperty('image')){
          return res.data.image
        } else {
          return 'Image Not Found'
        }
      }).catch((err)=>{
        return err.data
      })

      const entityData = await getEntityInfo(e.value).then((res) => {
        this.entityInfo = res.data
        this.entityInfo.imgUrl = entityImgUrl
        this.entityInfoShow = 1
        return res.data
      }).catch((err)=>{
        this.entityInfoShow = 2
        return err.data
      })
      
        
      
      // 展示数据    
      let listEle = document.getElementById('infolist');
      // listEle.innerHTML =`
      // 这是节点:${entityInfo.name}
      // // `
      // this.entityInfo = entityData
      // this.entityInfo.imgUrl = entityImgUrl
    },
    //非叶子节点处理
    ComboClick(e) {
      console.log(e)
      let curMixedGraphData;
      if(this.openKeys.indexOf(e.id)==-1){
        let curmodel;
        graph.getNodes().forEach((node) => {
          let model = node.getModel();
          if(e.id == model.id)curmodel = model;
        });
        if(e.level>1){
          this.openKeys.push(curmodel.id);
          curMixedGraphData = this.exbandNode(curmodel);
        }
      }else{
        if(e.level>1){
          const node = aggregatedNodeMap[e.id];
          console.log("collapse",node)
          //delete parent in openKey
          for (let i = 0; i < this.openKeys.length; i++)
            if (this.openKeys[i] === e.id){
              console.log("sliceP",node.value)
              this.openKeys.splice(i, 1);
              }
          //delete brothers in openKey    
          node.nodes.forEach((bro)=>{
            for (let i = 0; i < this.openKeys.length; i++)
              if (this.openKeys[i] === bro.id){
                this.openKeys.splice(i, 1);
                }
          })
          manipulatePosition = { x: node.x, y: node.y };
          this.deleteChild(node);
          for (let i = 0; i < expandArray.length; i++) {
            if (expandArray[i].id === e.id) {
              expandArray.splice(i, 1);
              break;
            }
          }
          aggregatedData.nodes.push(node);
          curMixedGraphData = this.getMixedGraph(
            aggregatedData,
            this.oridata,
            nodeMap,
            aggregatedNodeMap,
            expandArray,
          );
          
        }
        
      }
      if (curMixedGraphData) {
        cachePositions = this.cacheNodePositions(graph.getNodes());
        aggregatedData =  curMixedGraphData;
        this.handleRefreshGraph(
          graph,
          aggregatedData,
          CANVAS_WIDTH,
          CANVAS_HEIGHT,
          largeGraphMode,
          true,
          false,
        );
      }
      this.updateLabel();
      //console.log('点击'+e.value,this.openKeys, e);
    },
    closeInfo(){
      let infoEle = document.getElementById('infomations');
      let meumEle = document.getElementById('meum');

      if(this.current[0] == "fuzzy"){
        meumEle.style.display='block'
        infoEle.style.display='none';
      }
      else if(this.current[0] == "conditional"){
        infoEle.style.display='none';
      }
    },
    onSearch() {
      this.searchDataList=[];
      this.openKeys=[];
      if(this.searchStr == ''){
        this.curSel = '';
        return;
      }
      if(this.searchStr=="")return;
      this.oridata.nodes.forEach((node)=>{
        if(node.value == this.searchStr){
          node.parents.forEach((e)=>{
            this.openKeys.push(e);
          })
          this.curSel = node.id;
        }
      });
    },
    searchByNodes(value){
      this.searchStr= value;
      console.log(value)
      this.onSearch();
    },
    keyDownEvent(event) {
      var listArry = document.getElementsByClassName('searchListItem');
      if (event.keyCode == 13) {//Enter
        document.getElementById("forhide").style.visibility = "hidden"
        //this.onSearch();
      } 
      else if (event.keyCode == 38) {//up arrow
        selectListIndex--;
        if (selectListIndex >= 0 && selectListIndex < listArry.length) {
          for (var i = 0; i < listArry.length; i++) {
            listArry[i].classList.remove('selected');// 清除选中样式
            if (i === selectListIndex) {
              listArry[i].classList.add('selected');// 添加选中样式
              this.searchStr = listArry[i].textContent;// 将选中项的文本赋值给输入框
            }
          }
        } 
        else if (selectListIndex < 0) {// 第0项跳转到最后一项
          selectListIndex = listArry.length - 1;
          listArry[0].classList.remove('selected');
          listArry[selectListIndex].classList.add('selected');
          this.searchStr = listArry[selectListIndex].textContent;
        }
      } 
      else if (event.keyCode == 40) {//down arrow
        selectListIndex++;
        if (selectListIndex >= 0 && selectListIndex < listArry.length) {
          for (var i = 0; i < listArry.length; i++) {
            listArry[i].classList.remove('selected');
            if (i === selectListIndex) {
              listArry[i].classList.add('selected');
              this.searchStr = listArry[i].textContent;
            }
          }
        } 
        else if (selectListIndex >= listArry.length) {// 最后一项跳转到第0项
          selectListIndex = 0;
          listArry[listArry.length - 1].classList.remove('selected');
          listArry[selectListIndex].classList.add('selected');
          this.searchStr = listArry[selectListIndex].textContent;
        }
      }
    },
    candidate() {
      this.searchDataList = []
      this.oridata.nodes.forEach((node)=>{
        let str = ['',...this.searchStr,''].join('.*');
        let reg = new RegExp(str,'ig');
        if(reg.test(node.value)){
          this.searchDataList.push(node.value);
        }
      })
      document.getElementById("forhide").style.visibility = "visible"
      // });
    },
    timeflash() {
      var timer = null;
      clearTimeout(timer);
      timer = setTimeout(() => {
        this.candidate()
      }, 500);
      document.getElementById("forhide").style.visibility = "visible"// 显示列表
    },
    closeSearch () {// 关闭联想词列表
      this.searchDataList = [];
      document.getElementById("forhide").style.visibility = "hidden";
    },
    showSearch () {
      this.searchStr = "";
      document.getElementById("forhide").style.visibility = "visible";
    },
    enterKeyEvent(d) {
      this.searchStr = d;
      this.onSearch();
    },

    //条件筛选处理
    handleTypeChange(selectedItems) {
      
      this.InOption = [];
      this.OutOption = [];
      graph.getEdges().forEach((edge) => {
        let model = edge.getModel();
        const sourceNode = aggregatedNodeMap[model.source];
        const targetNode = aggregatedNodeMap[model.target];
        if(selectedItems == "none"){
          this.OutOption=allOutOption;
          this.InOption=allInOption;
        }
        if(sourceNode.id == selectedItems){
          model.value.forEach((label)=>{
            this.OutOption.push(label)
          })
        }
        if(targetNode.id == selectedItems){
          model.value.forEach((label)=>{
            this.InOption.push(label)
          })
        }
      });
      this.InOption = Array.from(new Set(this.InOption));
      this.OutOption = Array.from(new Set(this.OutOption));
      this.InOptionList = [];
      this.OutOptionList = [];
      this.IndegreeItems =[];
      this.OutdegreeItems = [];
      for(let i=0;i<this.inform.getFieldValue('inKeys').length;i++){
        this.InOptionList = [...this.InOptionList,this.InOption];
        this.IndegreeItems.push({
          label:undefined,
          op:undefined,
          value:undefined
        })
      }
      for(let i=0;i<this.outform.getFieldValue('outKeys').length;i++){
        this.OutOptionList = [...this.OutOptionList,this.OutOption];
        this.OutdegreeItems.push({
          label:undefined,
          op:undefined,
          value:undefined
        })
      }
    },
    addInCond() {
      const { inform } = this;
      const inKeys = inform.getFieldValue('inKeys');
      const nextKeys = inKeys.concat(inLabelId++);
      inform.setFieldsValue({
        inKeys: nextKeys,
      });
      this.InOptionList = [...this.InOptionList,this.InOption]
      this.IndegreeItems.push({
          label:undefined,
          op:undefined,
          value:undefined
        })
      console.log(this.InOptionList)
      console.log(inform.getFieldValue('inKeys'))
    },

    removeInCond(index) {
      const { inform } = this;
      const inKeys = inform.getFieldValue('inKeys');
      if (inKeys.length === 1) {return;}

      inform.setFieldsValue({
        inKeys: inKeys.filter((key,k) => index !== k),
      });
      this.IndegreeItems.splice(index,1)
      this.InOptionList.splice(index,1)
      console.log(this.IndegreeItems,inform.getFieldValue('inKeys'))
    },

    addOutCond() {
      const { outform } = this;
      const outKeys = outform.getFieldValue('outKeys');
      const nextKeys = outKeys.concat(outLabelId++);
      outform.setFieldsValue({
        outKeys: nextKeys,
      });
      this.OutOptionList = [...this.OutOptionList,this.OutOption]
      this.OutdegreeItems.push({
        label:undefined,
        op:undefined,
        value:undefined
      })
      console.log(this.OutOptionList)
      console.log(outform.getFieldValue('outKeys'))
    },
    removeOutCond(index) {
      const { outform } = this;
      const outKeys = outform.getFieldValue('outKeys');
      if (outKeys.length === 1) {
        return;
      }
      this.OutdegreeItems.splice(index,1)
      this.OutOptionList.splice(index,1)

      outform.setFieldsValue({
        outKeys: outKeys.filter((key,k) => index !== k),
      });
      console.log(outform.getFieldValue('outKeys'))
    },
    handleInChange(selectedItems) {
      //this.IndegreeItems.label = selectedItems;
      console.log(this.IndegreeItems)
    },
    // handleOutChange(selectedItems) {
    //   this.OutdegreeItems = selectedItems;
    // },
    // handleInOprator(index,selectedItems) {
    //   this.IndegreeItems.op = selectedItems;
    // },
    // handleOutOprator(selectedItems) {
    //   this.outOprator = selectedItems;
    // },
    changeIntro(){
      this.conditionIntro = (this.conditionLevel == 'strong')?
      "Satisfy all the inedge and outedge labels":
      "Satisfy at least one of inedge and outedge labels"
    },
    updateCate(){
      this.nodeCates=[];
      graph.getNodes().forEach((node) => {
        let model = node.getModel();
        //console.log(model)
        this.nodeCates.push(model)
      });
    },
    updateLabel(){
      this.updateCate();
      graph.getEdges().forEach((edge) => {
        let model = edge.getModel();
        model.value.forEach((label)=>{
          allOutOption.push(label);
          allInOption.push(label);
        })
      });
      allInOption = Array.from(new Set(allInOption));
      allOutOption = Array.from(new Set(allOutOption));
      this.InOption = allInOption;
      this.OutOption = allOutOption;
      this.InOptionList = [allInOption];
      this.OutOptionList = [allInOption];
    },

    openNotificationWithIcon(type) {
      if(type == 'success'){
        this.$notification[type]({
          message: 'Search successful!',
          description:
            this.conditiondata.length +' results were successfully returned.',
        });
      }
      else{
        this.$notification[type]({
          message: 'Search failed!',
          description:
            'There are no nodes that meet the query conditions here.',
        });
      }
    },
    onSubmit() {
      document.getElementById('searchList-2').style.display='block';
      this.conditiondata=[];
      //console.log("oridata",this.oridata.nodes,"aggregatedData",aggregatedData.nodes,"cateNode",this.nodeCates);
      let temparray1=[];
      let type = this.region;
      let level = this.conditionLevel;
      if(type == 'none')
        temparray1 = this.oridata.nodes;
      else{
        this.oridata.nodes.forEach((node,i)=>{
          if(node.parents && node.parents.indexOf(type)!=-1 )temparray1.push(node)
        });
      }
      temparray1.forEach((node)=>{
        let ins = [...node.inLabel].filter(obj => this.IndegreeItems.indexOf(obj)!=-1);
        let outs = [...node.outLabel].filter(obj => this.OutdegreeItems.indexOf(obj)!=-1);
        if(level == 'strong' && ins.length == this.IndegreeItems.length && outs.length == this.OutdegreeItems.length){
          this.conditiondata.push(node);
          //console.log("强加入",node.value,node.inLabel,node.outLabel,"满足的标签",ins,outs)
        }
        else if(level == 'weak'&& (ins.length > 0 || this.IndegreeItems.length == 0)&& (outs.length > 0||this.OutdegreeItems.length == 0)){
          this.conditiondata.push(node);
          //console.log("弱加入",node.value,node.inLabel,node.outLabel,"满足的标签",ins,outs)
        }
      });
      //console.log(type,ins,outs,level);
      if(this.conditiondata.length == 0){
        this.openNotificationWithIcon('error');
      }
      else
        this.openNotificationWithIcon('success');
    },

    onClean(){
      console.log("clean")
      this.region='none';
      this.OutOption=allOutOption;
      this.InOption=allInOption;
      this.InOptionList = [allInOption];
      this.OutOptionList = [allInOption];
      //document.getElementById('typesection').style.display='none';
      document.getElementById('searchList-2').style.display='none';
      this.IndegreeItems=[{
        label:undefined,
        op:undefined,
        value:undefined
      }];
      this.OutdegreeItems=[{
        label:undefined,
        op:undefined,
        value:undefined
      }];
      inLabelId = 1;
      outLabelId = 1;
      this.inform.setFieldsValue({
        inKeys: [0],
      });
      this.outform.setFieldsValue({
        outKeys:[0],
      })
    },

    //通用函数
    //toolbar函数
    zoomOut(){
      graph.zoom(0.9, { x: CANVAS_WIDTH/2, y: CANVAS_HEIGHT/2 })
    },
    restore(){
      graph.zoomTo(1, { x: CANVAS_WIDTH/2, y: CANVAS_HEIGHT/2 })
    },
    fitView(){
      graph.fitView([20]);
    },
    zoomIn(){
      graph.zoom(1.1, { x: CANVAS_WIDTH/2, y: CANVAS_HEIGHT/2 })
    },
    undo() {
      const undoStack = graph.getUndoStack();
      if (!undoStack || undoStack.length === 1) {
        return;
      }
  
      const currentData = undoStack.pop();
      if (currentData) {
        const { action } = currentData;
        graph.pushStack(action, clone(currentData.data), 'redo');
        let data = currentData.data.before;
  
        if (action === 'add') {
          data = currentData.data.after;
        }
  
        if (!data) return;
  
        switch (action) {
          case 'visible': {
            Object.keys(data).forEach((key) => {
              const array = data[key];
              if (!array) return;
              array.forEach((model) => {
                const item = graph.findById(model.id);
                if (model.visible) {
                  graph.showItem(item, false);
                } else {
                  graph.hideItem(item, false);
                }
              });
            });
            break;
          }
          case 'render':
          case 'update':
            Object.keys(data).forEach((key) => {
              const array = data[key];
              if (!array) return;
              array.forEach((model) => {
                const item = graph.findById(model.id);
                delete model.id;
                graph.updateItem(item, model, false);

              });
            });
            break;
          case 'changedata':
            graph.changeData(data, false);
            break;
          case 'delete': {
            Object.keys(data).forEach((key) => {
              const array = data[key];
              if (!array) return;
              array.forEach((model) => {
                const itemType = model.itemType;
                delete model.itemType;
                graph.addItem(itemType, model, false);
              });
            });
            break;
          }
          case 'add':
            Object.keys(data).forEach((key) => {
              const array = data[key];
              if (!array) return;
              array.forEach((model) => {
                graph.removeItem(model.id, false);
              });
            });
            break;
          case 'updateComboTree':
            Object.keys(data).forEach((key) => {
              const array = data[key];
              if (!array) return;
              array.forEach((model) => {
                graph.updateComboTree(model.id, model.parentId, false);
              });
            });
            break;
          case 'layout':
            graph.updateLayout(data, undefined, undefined, false);
            break;
          default:
        }
      }
    },
    redo() {
      const redoStack = graph.getRedoStack();
  
      if (!redoStack || redoStack.length === 0) {
        return;
      }
  
      const currentData = redoStack.pop();
      if (currentData) {
        const { action } = currentData;
        let data = currentData.data.after;
        graph.pushStack(action, clone(currentData.data));
        if (action === 'delete') {
          data = currentData.data.before;
        }
  
        if (!data) return;
  
        switch (action) {
          case 'visible': {
            Object.keys(data).forEach((key) => {
              const array = data[key];
              if (!array) return;
              array.forEach((model) => {
                const item = graph.findById(model.id);
                if (model.visible) {
                  graph.showItem(item, false);
                } else {
                  graph.hideItem(item, false);
                }
              });
            });
            break;
          }
          case 'render':
          case 'update':
            Object.keys(data).forEach((key) => {
              const array = data[key];
              if (!array) return;
              array.forEach((model) => {
                const item = graph.findById(model.id);
                delete model.id;
                graph.updateItem(item, model, false);

              });
            });
            break;
          case 'changedata':
            graph.changeData(data, false);
            break;
          case 'delete':
            if (data.edges) {
              data.edges.forEach((model) => {
                graph.removeItem(model.id, false);
              });
            }
            if (data.nodes) {
              data.nodes.forEach((model) => {
                graph.removeItem(model.id, false);
              });
            }
            if (data.combos) {
              data.combos.forEach((model) => {
                graph.removeItem(model.id, false);
              });
            }
            break;
          case 'add': {
            Object.keys(data).forEach((key) => {
              const array = data[key];
              if (!array) return;
              array.forEach((model) => {
                const itemType = model.itemType;
                delete model.itemType;
                graph.addItem(itemType, model, false);
              });
            });
            break;
          }
          case 'updateComboTree':
            Object.keys(data).forEach((key) => {
              const array = data[key];
              if (!array) return;
              array.forEach((model) => {
                graph.updateComboTree(model.id, model.parentId, false);
              });
            });
            break;
          case 'layout':
            graph.updateLayout(data, undefined, undefined, false);
            break;
          default:
        }
      }
    },
    showMinimap(){
      let mapEle = document.getElementById('minimap');
      if(this.mapVisible == false){
        console.log('in')
        this.seletedTool.push('minimap');
        mapEle.style.display = 'block'
      }else{
        console.log('out')
        mapEle.style.display = 'none';
        for (let i = 0; i < this.seletedTool.length; i++) {
          if (this.seletedTool[i]=='minimap') {
            this.seletedTool.splice(i, 1);
            break;
          }
        }
      }
      this.mapVisible = !this.mapVisible;
      
    },
    showFisheye(){
      let eyeEle = document.getElementById('fisheye');
      if(this.eyeVisible == false){
        console.log('in')
        this.seletedTool.push('fisheye');
        eyeEle.style.display = 'block'
      }else{
        console.log('out')
        eyeEle.style.display = 'none';
        for (let i = 0; i < this.seletedTool.length; i++) {
          if (this.seletedTool[i]=='fisheye') {
            this.seletedTool.splice(i, 1);
            break;
          }
        }
      }
      this.eyeVisible = !this.eyeVisible;
      
    },
    showFilter(){
      let filterEle = document.getElementById('filter');
      const searchList2 = document.getElementById("searchList-2");
      this.FilterWidth = 300;
      if(this.collapsed == true){
        this.seletedTool.push('search');
        this.collapsed = false;
        graph.changeSize(CANVAS_WIDTH, CANVAS_HEIGHT)
        setTimeout(() => {
          filterEle.style.display = 'block';
          searchList2.style.display = 'block';
        }, 200);
        
      }else{
        this.closeFilter();
      }
      
    },
    closeFilter(){
      let filterEle = document.getElementById('filter');
      const searchList2 = document.getElementById("searchList-2");
      this.FilterWidth = 0;
      this.collapsed = true;
      for (let i = 0; i < this.seletedTool.length; i++) {
        if (this.seletedTool[i]=='search') {
          this.seletedTool.splice(i, 1);
          break;
        }
      }
      filterEle.style.display = 'none';
      searchList2.style.display = 'none';
      graph.changeSize(CANVAS_WIDTH+300, CANVAS_HEIGHT)
    },
    findRealData(hyperNode){
      let hypernodes = [];
      let realnodes = [];
      hyperNode.nodes.forEach((node)=>{
        if(node.level==0)realnodes.push(node)
        else hypernodes.push(node);
      })
      while(hypernodes.length != 0){
        let cur = hypernodes.pop();
        cur.nodes.forEach((node)=>{
          if(node.level==0)realnodes.push(node)
          else hypernodes.push(node);
        });
      }
      return realnodes;

    },
    getRecursiveName(node1,node2,symbol){
      let reId = '',reLabel='';
      if(node1.id.indexOf('|') != -1 ||node1.id.indexOf('&') != -1||node1.id.indexOf('_') != -1){
        reId+='('+node1.id+')';
        reLabel+='('+node1.value+')';
      }else{
        reId+=node1.id;
        reLabel+=node1.value;
      }
      reId+=symbol;
      if(symbol=='|')reLabel+=' or ';
      else if(symbol=='&')reLabel+=' and ';
      else if(symbol=='_')reLabel+=' but not ';
      if(node2.id.indexOf('|') != -1 ||node2.id.indexOf('&') != -1||node2.id.indexOf('_') != -1){
        reId+='('+node2.id+')';
        reLabel+='('+node2.value+')';
      }else{
        reId+=node2.id;
        reLabel+=node2.value;
      }
      reLabel = 'Query1'
      return{reId,reLabel}
    },


    unionNode(node1,node2){
      let unionNodes = [];
      let tempNodeMap = {};
      const {reId,reLabel } = this.getRecursiveName(node1,node2,'|');
      this.findRealData(node1).forEach((node)=>{
        if(!tempNodeMap[node.id]){
          const newnode = {
            ...node,
            clusterId:reId,
          };
          unionNodes.push(newnode);
          tempNodeMap[node.id]=newnode;
        }
      })
      this.findRealData(node2).forEach((node)=>{
        if(!tempNodeMap[node.id]){
          const newnode = {
            ...node,
            clusterId:reId,
          };
          unionNodes.push(newnode);
        }
      })
      let maxlevel=0;
      unionNodes.forEach((node)=>{
        if(node.level>maxlevel)maxlevel = node.level;
      })
      const cnode = {
        id:reId,
        value:reLabel,
        level:maxlevel+1,
        type: 'aggregated-node',
        nodes:unionNodes,
        count: unionNodes.length,
        colorSet: opColotSets[0],
        isResult:true,
        isTop:true,
      };
      return cnode;
    },
    interNode(node1,node2){
      let interNodes = [];
      let node1real = this.findRealData(node1);
      let node2real = this.findRealData(node2);
      const {reId,reLabel } = this.getRecursiveName(node1,node2,'&');
      node1real.forEach((node)=>{
        node2real.forEach((n)=>{
          if(n.id == node.id){
            const newnode = {
              ...node,
              clusterId:reId,
              //id:'s-'+node.id,
            };
            interNodes.push(newnode)
          }
        })
      })
      let maxlevel=0;
      interNodes.forEach((node)=>{
        if(node.level>maxlevel)maxlevel = node.level;
      })
      const cnode = {
        id:reId,
        value:reLabel,
        level:maxlevel+1,
        type: 'aggregated-node',
        nodes:interNodes,
        count: interNodes.length,
        colorSet: opColotSets[0],
        isResult:true,
        isTop:true,
      };
      return cnode;
    },
    diffNode(node1,node2){
      let diffNodes = [];
      let tempNodeMap = {};
      const {reId,reLabel } = this.getRecursiveName(node1,node2,'_');
      this.findRealData(node2).forEach((node)=>{
        tempNodeMap[node.id]=+node.id;
      })
      this.findRealData(node1).forEach((node)=>{
        if(!tempNodeMap[node.id]){
          const newnode = {
            ...node,
            clusterId:reId,
            //id:'s-'+node.id,
          };
          diffNodes.push(newnode)
        }
      })
      let maxlevel=0;
      diffNodes.forEach((node)=>{
        if(node.level>maxlevel)maxlevel = node.level;
      })
      const cnode = {
        id:reId,
        value:reLabel,
        level:maxlevel+1,
        type: 'aggregated-node',
        nodes:diffNodes,
        count: diffNodes.length,
        colorSet: opColotSets[0],
        isResult:true,
        isTop:true,
      };
      return cnode;
    },
    clickOp(e){
      let node1 = selectedNode1;
      let node2 = selectedNode2;
      let cnode = {};
      if(e.target.id == 'union'){
        cnode = this.unionNode(node1,node2);
      }else if(e.target.id == 'inter'){
        cnode = this.interNode(node1,node2);
      }else if(e.target.id == 'comp'){
        cnode = this.diffNode(node1,node2);
      }
      aggregatedNodeMap[cnode.id] = cnode;
      aggregatedData.nodes.push(cnode);
      this.oridata.clusters.push(cnode);

      this.findParents(this.oridata.clusters);
      this.genClusterEdges(this.oridata.edges)
      this.oridata.clusterEdges = clusterEdges;
      let mixedGraphData = this.getMixedGraph(
        aggregatedData,
        this.oridata,
        nodeMap,
        aggregatedNodeMap,
        expandArray,
      );
      this.handleRefreshGraph(
        graph,
        mixedGraphData,
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
        largeGraphMode,
        true,
        false,
      );
    },
    hoverInOp(e){
      if(e.target.id == 'union'&& this.unionUrl != 'unable'){
          this.unionUrl = 'highlight';
      }else if(e.target.id == 'inter'&& this.interUrl != 'unable'){
        this.interUrl = 'highlight';
      }else if(e.target.id == 'comp'&& this.compUrl != 'unable'){
        this.compUrl = 'highlight';
      }
    },
    hoverOutOp(){
      this.unionUrl = 'default';
      this.interUrl = 'default';
      this.compUrl = 'default';
    },
    getClass: function () {
      return { unabled: this.isDisable, abled: !this.isDisable};
    },
    descendCompare(p){
      // 这是比较函数
      return function (m, n) {
        const a = m[p];
        const b = n[p];
        return b - a; // 降序
      };
    },
    
    clearFocusItemState(graph){
      if (!graph) return;
      selectedNum = 0;
      selectedNode1 = {};
      selectedNode2 = {};
      this.isDisable = true;
      this.unionUrl = 'unable';
      this.interUrl = 'unable';
      this.compUrl = 'unable';
      this.clearFocusNodeState(graph);
      this.clearFocusEdgeState(graph);
    },
    
    // 清除图上所有节点的 focus 状态及相应样式
    clearFocusNodeState(graph){
      const focusNodes = graph.findAllByState('node', 'focus');
      focusNodes.forEach((fnode) => {
        graph.setItemState(fnode, 'focus', false); // false
      });
    },
    
    // 清除图上所有边的 focus 状态及相应样式
    clearFocusEdgeState(graph){
      const focusEdges = graph.findAllByState('edge', 'focus');
      focusEdges.forEach((fedge) => {
        graph.setItemState(fedge, 'focus', false);
        fedge.update({
          //label: model.oriLabel,
          state:'',
          labelCfg :{
            autoRotate: true,
            refY:7,
            style: {
              fill: global.edge.labelCfg.style.fill,
              ineWidth: 4,
              fontSize: 12,
              fontWeight:400,
              opacity: LabelVisible,
            },
          }
        });
      });
    },
    
    // 截断长文本。length 为文本截断后长度，elipsis 是后缀
    formatText(text, length = 5, elipsis = '...'){
      if (!text) return '';
      if (text.length > length) {
        return `${text.substr(0, length)}${elipsis}`;
      }
      return text;
    },
    
    labelFormatter(text, minLength = 10){
      if (text && text.split('').length > minLength) return `${text.substr(0, minLength)}...`;
      return text;
    },
    
    processNodesEdges(
      nodes,
      edges,
      width,
      height,
      largeGraphMode,
      edgeLabelVisible,
      isNewGraph = false,
    ){
      if (!nodes || nodes.length === 0) return {};
      currentNodeMap = {};
      let maxNodeCount = -Infinity;
      // const paddingRatio = 0.3;
      // const paddingLeft = paddingRatio * width;
      // const paddingTop = paddingRatio * height;
      nodes.forEach((node) => {
        node.type = 'aggregated-node';
        node.size = DEFAULTNODESIZE;
        node.isReal = node.level === 0 ? true : false;
        //node.labelLineNum = undefined;
        node.value = node.value;
        const num = (node.count>1) ? '('+node.count+')':'';
        node.oriLabel = node.value+num;
        node.label = (node.level> 0 ? this.formatText(node.value, labelMaxLength-3, '...') + num:this.formatText(node.value, labelMaxLength, '...'));
        node.degree = 0;
        node.inDegree = 0;
        node.outDegree = 0;
        if (currentNodeMap[node.id]) {
          console.warn('node exists already!', node.id);
          node.id = `${node.id}${Math.random()}`;
        }
        currentNodeMap[node.id] = node;
        if (node.count > maxNodeCount) maxNodeCount = node.count;
        const cachePosition = cachePositions ? cachePositions[node.id] : undefined;
        if (cachePosition) {
          node.x = cachePosition.x;
          node.y = cachePosition.y;
          node.new = false;
        } else {
          node.new = isNewGraph ? false : true;
          if (manipulatePosition && !node.x && !node.y) {
            node.x = manipulatePosition.x + 30 * Math.cos(Math.random() * Math.PI * 2);
            node.y = manipulatePosition.y + 30 * Math.sin(Math.random() * Math.PI * 2);
          }
        }
      });
    
      let maxCount = -Infinity;
      let minCount = Infinity;
      // let maxCount = 0;
      edges.forEach((edge) => {
        // to avoid the dulplicated id to nodes
        if (!edge.id) edge.id = `edge-${uniqueId()}`;
        else if (edge.id.split('-')[0] !== 'edge') edge.id = `edge-${edge.id}`;
        //edge.label = edge.oriLabel;
        if (!currentNodeMap[edge.source] || !currentNodeMap[edge.target]) {
          console.warn('edge source target does not exist', edge.source, edge.target, edge.id);
          return;
        }
        const sourceNode = currentNodeMap[edge.source];
        const targetNode = currentNodeMap[edge.target];
        // calculate the degree
        sourceNode.degree++;
        targetNode.degree++;
        sourceNode.outDegree++;
        targetNode.inDegree++;
    
        if (edge.count > maxCount) maxCount = edge.count;
        if (edge.count < minCount) minCount = edge.count;
      });
    
      nodes.sort(this.descendCompare(NODESIZEMAPPING));
      const maxDegree = nodes[0].degree || 1;
    
      // const descreteNodes = [];
      // nodes.forEach((node, i) => {
      //   // assign the size mapping to the outDegree
      //   const countRatio = node.count / maxNodeCount;
      //   node.size = DEFAULTNODESIZE;
      //   node.isReal = node.level === 0;
      //   node.labelCfg = {
      //     position: 'bottom',
      //     offset: 50,
      //     style: {
      //       fill: global.node.labelCfg.style.fill,
      //       fontSize: 6 + countRatio * 6 || 12,
      //       stroke: global.node.labelCfg.style.stroke,
      //       lineWidth: 3,
      //     },
      //   };
    
      //   if (!node.degree) {
      //     descreteNodes.push(node);
      //   }
      // });
      if(edges.length > EDGE_LIMIT)LabelVisible=0
      else LabelVisible=1;
      const countRange = maxCount - minCount;
      const minEdgeSize = 1;
      const maxEdgeSize = 7;
      const edgeSizeRange = maxEdgeSize - minEdgeSize;
      edges.forEach((edge) => {
        // set edges' style
        const targetNode = currentNodeMap[edge.target];
        const sourceNode = currentNodeMap[edge.source];

        const size = ((edge.count - minCount) / countRange) * edgeSizeRange + minEdgeSize || 1;
        edge.size = size;
    
        const arrowWidth = Math.max(size / 2 + 2, 2);
        const arrowLength = 4;
        const arrowBeging = targetNode.size + arrowLength;
        let arrowPath = `M ${arrowBeging},0 L ${arrowBeging + arrowLength},-${arrowWidth} L ${
          arrowBeging + arrowLength
        },${arrowWidth} Z`;
        let d = targetNode.size / 2 + arrowLength;
        if (edge.source === edge.target) {
          edge.type = 'loop';
          arrowPath = undefined;
        }

        const isRealEdge = targetNode.isReal && sourceNode.isReal;
        edge.isReal = isRealEdge;
        const stroke = isRealEdge ? global.edge.style.realEdgeStroke : global.edge.style.stroke;
        const opacity = isRealEdge? global.edge.style.realEdgeOpacity: global.edge.style.strokeOpacity;
        const lineDash = isRealEdge ? undefined : [6, 2];
        edge.style = {
          stroke,
          strokeOpacity: opacity,
          cursor: 'pointer',
          lineAppendWidth: Math.max(edge.size || 5, 5),
          fillOpacity: opacity,
          lineDash,
          endArrow: arrowPath
            ? {
                path: arrowPath,
                d,
                fill: stroke,
                strokeOpacity: 0,
              }
            : false,
        };
        edge.labelCfg = {
          autoRotate: true,
          refY:7,
          style: {
            stroke: global.edge.labelCfg.style.stroke,
            fill: global.edge.labelCfg.style.fill,
            lineWidth: 4,
            fontSize: 12,
            fontWeight:400,
            lineAppendWidth: 10,
            opacity: LabelVisible,
          },
        };
        edge.label = edge.label;
        if (!edge.oriLabel) edge.oriLabel = edge.label;
        // if (largeGraphMode || !edgeLabelVisible) edge.label = '';
        // else {
        //   edge.label = this.labelFormatter(edge.label, labelMaxLength);
        // }
    
        // arrange the other nodes around the hub
        const sourceDis = sourceNode.size / 2 + 50;
        const targetDis = targetNode.size / 2 + 50;
        if (sourceNode.x && !targetNode.x) {
          targetNode.x = sourceNode.x + sourceDis * Math.cos(Math.random() * Math.PI * 2);
        }
        if (sourceNode.y && !targetNode.y) {
          targetNode.y = sourceNode.y + sourceDis * Math.sin(Math.random() * Math.PI * 2);
        }
        if (targetNode.x && !sourceNode.x) {
          sourceNode.x = targetNode.x + targetDis * Math.cos(Math.random() * Math.PI * 2);
        }
        if (targetNode.y && !sourceNode.y) {
          sourceNode.y = targetNode.y + targetDis * Math.sin(Math.random() * Math.PI * 2);
        }
    
        if (!sourceNode.x && !sourceNode.y && manipulatePosition) {
          sourceNode.x = manipulatePosition.x + 30 * Math.cos(Math.random() * Math.PI * 2);
          sourceNode.y = manipulatePosition.y + 30 * Math.sin(Math.random() * Math.PI * 2);
        }
        if (!targetNode.x && !targetNode.y && manipulatePosition) {
          targetNode.x = manipulatePosition.x + 30 * Math.cos(Math.random() * Math.PI * 2);
          targetNode.y = manipulatePosition.y + 30 * Math.sin(Math.random() * Math.PI * 2);
        }
      });
    
      G6.Util.processParallelEdges(edges, 20, 'custom-quadratic', 'custom-line');
      return {
        maxDegree,
        edges,
      };
    },
    
    getForceLayoutConfig(graph, largeGraphMode, configSettings){
      let {
        linkDistance,
        edgeStrength,
        nodeStrength,
        nodeSpacing,
        preventOverlap,
        nodeSize,
        collideStrength,
        alpha,
        alphaDecay,
        alphaMin,
      } = configSettings || { preventOverlap: true };
    
      if (!linkDistance && linkDistance !== 0) linkDistance = 225;
      if (!edgeStrength && edgeStrength !== 0) edgeStrength = 50;
      if (!nodeStrength && nodeStrength !== 0) nodeStrength = 400;
      if (!nodeSpacing && nodeSpacing !== 0) nodeSpacing = 5;
    
      const config = {
        type: 'gForce',
        minMovement: 0.01,
        maxIteration: 5000,
        preventOverlap,
        damping: 0.99,
        linkDistance: (d) => {
          //let dist = linkDistance;
          const sourceNode = nodeMap[d.source] || aggregatedNodeMap[d.source];
          const targetNode = nodeMap[d.target] || aggregatedNodeMap[d.target];
          // 两端都是聚合点
          // if (sourceNode.level !== 1 && targetNode.level !== 1) dist = linkDistance * 1.2;
          // // 两端不是同一层
          // else dist = linkDistance// * 0.3;
          return (sourceNode.level !== 1 && targetNode.level !== 1)?linkDistance * 1.2 : linkDistance;
        },
        edgeStrength: (d) => {
          const sourceNode = nodeMap[d.source] || aggregatedNodeMap[d.source];
          const targetNode = nodeMap[d.target] || aggregatedNodeMap[d.target];
          // 聚合节点之间的引力小
          if (sourceNode.clusterId === targetNode.clusterId) return edgeStrength/ 2;
          return edgeStrength;
        },
        nodeStrength: (d) => {
          // 给离散点引力，让它们聚集
          if (d.degree === 0) return 100;
          return nodeStrength;
        },
        nodeSize: (d) => {
          if (!nodeSize && d.size) return d.size;
          return 50;
        },
        nodeSpacing: (d) => {
          if (d.degree === 0) return nodeSpacing * 2;
          if (d.level) return nodeSpacing;
          return nodeSpacing;
        },
        onLayoutEnd: () => {
          if (largeGraphMode) {
            graph.getEdges().forEach((edge) => {
              if (!edge.oriLabel) return;
              edge.update({
                label: this.labelFormatter(edge.oriLabel, labelMaxLength),
              });
            });
          }
        },
        tick: () => {
          graph.refreshPositions();
        },
      };
    
      if (nodeSize) config['nodeSize'] = nodeSize;
      if (collideStrength) config['collideStrength'] = collideStrength;
      if (alpha) config['alpha'] = alpha;
      if (alphaDecay) config['alphaDecay'] = alphaDecay;
      if (alphaMin) config['alphaMin'] = alphaMin;
    
      return config;
    },
    
    hideItems(graph){
      hiddenItemIds.forEach((id) => {
        graph.hideItem(id);
      });
    },
    
    showItems(graph){
      graph.getNodes().forEach((node) => {
        if (!node.isVisible()) graph.showItem(node);
      });
      graph.getEdges().forEach((edge) => {
        if (!edge.isVisible()) edge.showItem(edge);
      });
      hiddenItemIds = [];
    },
    judgeName(name){
      if(name == ''){
        this.$message.warning('Do not input anything');
      }else{
        this.$message.loading({ content: 'Wait a moment...'});
        setTimeout(() => {
          this.$message.success({ content: 'Successful!', duration: 2 });
        }, 500);
      }
    },
    renameNode(model){
      console.log(model)
      let that = this;
      this.$confirm({
        title: 'RENAME',
        content: () => <a-input id="renameInput" allow-clear placeholder="Input the new name of the node" />,
        centered:true,
        okText: 'OK',
        cancelText: 'Cancel',
        onOk() {
          let name = document.getElementById('renameInput').value;
          if(name == ''){
            that.$message.warning('Do not input anything');
          }else{
            that.$message.loading({ content: 'Wait a moment...', renameKey,duration: 1});
            setTimeout(() => {
              that.$message.success({ content: 'Successful!',renameKey, duration: 2 });
            }, 1000);
            console.log(name);
          }
          return new Promise((resolve, reject) => {
            setTimeout(Math.random() > 0.5 ? resolve : reject, 1000);
          }).catch(() => {});
        },
        onCancel() {},
      });
      
    },
    
    handleRefreshGraph(
      graph,
      graphData,
      width,
      height,
      largeGraphMode,
      edgeLabelVisible,
      isNewGraph,
    ){
      if (!graphData || !graph) return;
      this.clearFocusItemState(graph);
      // reset the filtering
      graph.getNodes().forEach((node) => {
        if (!node.isVisible()) node.show();
      });
      graph.getEdges().forEach((edge) => {
        if (!edge.isVisible()) edge.show();
      });
    
      let nodes = [],edges = [];
    
      nodes = graphData.nodes;
      const processRes = this.processNodesEdges(
        nodes,
        graphData.edges || [],
        width,
        height,
        largeGraphMode,
        edgeLabelVisible,
        isNewGraph,
      );
      edges = processRes.edges;
      graph.changeData({ nodes, edges });
      this.hideItems(graph);
      graph.getNodes().forEach((node) => {
        node.toFront();
      });
    
      layout.instance.init({
        nodes: graphData.nodes,
        edges,
      });
    
      layout.instance.minMovement = 0.0001;
      layout.instance.getCenter = d => {
      	const cachePosition = cachePositions[d.id];
      	if (!cachePosition && (d.x || d.y)) return [d.x, d.y, 10];
      	else if (cachePosition) return [cachePosition.x, cachePosition.y, 10];
      	return [width / 2, height / 2, 10];
      }
      layout.instance.getMass = (d) => {
        const cachePosition = cachePositions[d.id];
        if (cachePosition) return 5;
        return 1;
      };
      layout.instance.execute();
      return { nodes, edges };
    },
    
    getMixedGraph(
      aggregatedData,
      originData,
      nodeMap,
      aggregatedNodeMap,
      expandArray,
    ){
      let nodes = [],
        edges = [];
    
      const expandMap = {};

      const curNodeMap = {};
      expandArray.forEach((expandModel) => {
        expandMap[expandModel.id] = true;
      });

      aggregatedData.nodes.forEach((oricluster, i) => {
        if(oricluster.level==0)return;
        if (expandMap[oricluster.id]) {
          oricluster.nodes.forEach((cluster) => {
            //cluster.nodes = cluster.nodes?cluster.nodes:[];
            if(cluster.level == 0)return;
            cluster.nodes.forEach((node) => {
              node.label = node.value;
              node.type = '';
              node.count = node.nodes?node.nodes.length:0;
              node.clusterId = cluster.id;
              node.colorSet = cluster.colorSet;
              nodeMap[node.id] = node;
            });
            const cnode = {
              ...cluster,
              type: 'aggregated-node',
              count: cluster.nodes.length,
              colorSet: oricluster.colorSet,
            };
            curNodeMap[cluster.id]=cnode;
            aggregatedNodeMap[cluster.id] = cnode;
            nodes.push(cnode);
          });
          aggregatedNodeMap[oricluster.id].expanded = true;
        } else {
          curNodeMap[oricluster.id]=oricluster;
          nodes.push(aggregatedNodeMap[oricluster.id]);
          aggregatedNodeMap[oricluster.id].expanded = false;
        }
      });
      originData.clusterEdges.forEach((edge) => {
        let count = edge.value.length;
        const cedge = {
          ...edge,
          //size: Math.log(clusterEdge.count),
          labelCount : count,
          label : edge.value[0] + (count == 1? '': ' ( ' + count + ' )'),
          id: `edge-${uniqueId()}`,
        };
        if (cedge.source === cedge.target) {
          cedge.type = 'loop';
          cedge.loopCfg = {
            dist: 20,
          };
        } else cedge.type = 'line';
        if(curNodeMap[edge.source] && curNodeMap[edge.target])
          edges.push(cedge);
      });
      //console.log("mixed",nodes,edges)
      return { nodes, edges };
    },
    
    examAncestors(model, expandedArray, length, keepTags){
      for (let i = 0; i < length; i++) {
        const expandedNode = expandedArray[i];
        if (!keepTags[i] && model.parentId === expandedNode.id) {
          keepTags[i] = true; // 需要被保留
          this.examAncestors(expandedNode, expandedArray, length, keepTags);
          break;
        }
      }
    },
    
    manageExpandCollapseArray(nodeNumber, model, expandArray){
      manipulatePosition = { x: model.x, y: model.y };
    
      // 维护 expandArray，若当前画布节点数高于上限，移出 expandedArray 中非 model 祖先的节点)
      // if (nodeNumber > NODE_LIMIT) {
      //   console.log("进入节点保留阶段")
      //   // 若 keepTags[i] 为 true，则 expandedArray 的第 i 个节点需要被保留
      //   const keepTags = {};
      //   const expandLen = expandArray.length;
      //   // 检查 X 的所有祖先并标记 keepTags
      //   this.examAncestors(model, expandArray, expandLen, keepTags);
      //   // 寻找 expandedArray 中第一个 keepTags 不为 true 的点
      //   let shiftNodeIdx = -1;
      //   for (let i = 0; i < expandLen; i++) {
      //     if (!keepTags[i]) {
      //       shiftNodeIdx = i;
      //       break;
      //     }
      //   }
      //   // 如果有符合条件的节点，将其从 expandedArray 中移除
      //   if (shiftNodeIdx !== -1) {
      //     let foundNode = expandArray[shiftNodeIdx];
      //     if (foundNode.level === 2) {
      //       let foundLevel1 = false;
      //       // 找到 expandedArray 中 parentId = foundNode.id 且 level = 1 的第一个节点
      //       for (let i = 0; i < expandLen; i++) {
      //         const eNode = expandArray[i];
      //         if (eNode.parentId === foundNode.id && eNode.level === 1) {
      //           foundLevel1 = true;
      //           foundNode = eNode;
      //           expandArray.splice(i, 1);
      //           break;
      //         }
      //       }
      //       // 若未找到，则 foundNode 不变, 直接删去 foundNode
      //       if (!foundLevel1) expandArray.splice(shiftNodeIdx, 1);
      //     } else {
      //       // 直接删去 foundNode
      //       expandArray.splice(shiftNodeIdx, 1);
      //     }
      //     // const removedNode = expandedArray.splice(shiftNodeIdx, 1); // splice returns an array
      //     const idSplits = foundNode.id.split('-');
      //     let collapseNodeId;
      //     // 去掉最后一个后缀
      //     for (let i = 0; i < idSplits.length - 1; i++) {
      //       const str = idSplits[i];
      //       if (collapseNodeId) collapseNodeId = `${collapseNodeId}-${str}`;
      //       else collapseNodeId = str;
      //     }
      //     const collapseNode = {
      //       id: collapseNodeId,
      //       parentId: foundNode.id,
      //       level: foundNode.level - 1,
      //     };
      //     //collapseArray.push(collapseNode);
      //   }
      // }
    
      const currentNode = {
        id: model.id,
        level: model.level,
        parentId: model.clusterId,
      };
    
      // 加入当前需要展开的节点
      expandArray.push(currentNode);
      graph.get('canvas').setCursor('default');
      return expandArray;
    },
    
    cacheNodePositions(nodes){
      const positionMap = {};
      const nodeLength = nodes.length;
      for (let i = 0; i < nodeLength; i++) {
        const node = nodes[i].getModel();
        positionMap[node.id] = {
          x: node.x,
          y: node.y,
          level: node.level,
        };
      }
      return positionMap;
    },
    
    stopLayout(){
      layout.instance.stop();
    },

    //G6相关功能
    bindListener(graph){
      graph.on('keydown', (evt) => {
        const code = evt.key;
        if (!code) {
          return;
        }
        if (code.toLowerCase() === 'shift') {
          shiftKeydown = true;
        } else {
          shiftKeydown = false;
        }
      });
      graph.on('keyup', (evt) => {
        const code = evt.key;
        if (!code) {
          return;
        }
        if (code.toLowerCase() === 'shift') {
          shiftKeydown = false;
        }
      });
      graph.on('node:mouseenter', (evt) => {
        const { item } = evt;
        const model = item.getModel();
        const currentLabel = model.label;   
        item.update({
          label: model.oriLabel,
        });
        model.oriLabel = currentLabel;

        graph.setItemState(item, 'hover', true);
        item.toFront();
      });
    
      graph.on('node:mouseleave', (evt) => {
        const { item } = evt;
        const model = item.getModel();
        const currentLabel = model.label;
        item.update({
          label: model.oriLabel,
        });
        model.oriLabel = currentLabel;
        graph.setItemState(item, 'hover', false);
      });
    
      graph.on('edge:mouseenter', (evt) => {
        graph.setItemState(evt.item, 'hover', true);
        
        const { item } = evt;
        const model = item.getModel();
        if(model.state != 'click'){
          item.update({
            //label: model.oriLabel,
            labelCfg :{
              autoRotate: true,
              refY:7,
              style: {
                fill:'#363b40',
                fontSize: 16,
                fontWeight:600,
                opacity: 1,
              },
            }
          });
        }
        //model.oriLabel = currentLabel;
        item.toFront();
        item.getSource().toFront();
        item.getTarget().toFront();
      });
    
      graph.on('edge:mouseleave', (evt) => {
        graph.setItemState(evt.item, 'hover', false);
        const { item } = evt;
        const model = item.getModel();
        const currentLabel = model.label;
        if(model.state != 'click'){
          item.update({
            //label: model.oriLabel,
            state:'',
            labelCfg : {
              autoRotate: true,
              refY:7,
              style: {
                fill:global.edge.labelCfg.style.fill,
                fontSize: 12,
                fontWeight:400,
                opacity: LabelVisible,
              },
            },
          });
        }

      });
      // click node to show the detail drawer
      graph.on('node:click', (evt) => {
        this.stopLayout();
        
        if (!shiftKeydown || selectedNum>=2)
          this.clearFocusItemState(graph);
        else {
          this.clearFocusEdgeState(graph);
        }
        const { item } = evt;
        let model = item.getModel();
        this.findRealData(model)
        if(model.new == true)model.new = false;
        // highlight the clicked node, it is down by click-select
        graph.setItemState(item, 'focus', true);
        if(!selectedNode1.id){
          selectedNode1 = model;
        }else selectedNode2 = model;
        selectedNum++;
        if (selectedNum == 1) {
          // 将相关边也高亮
          const relatedEdges = item.getEdges();
          relatedEdges.forEach((edge) => {
            graph.setItemState(edge, 'focus', true);
          });
        }else if(selectedNum == 2){
          this.isDisable = false;
          this.unionUrl = 'default';
          this.interUrl = 'default';
          this.compUrl = 'default';
        };
      });
    
      // click edge to show the detail of integrated edge drawer
      graph.on('edge:click', (evt) => {
        this.stopLayout();
        this.clearFocusEdgeState(graph);
        const { item } = evt;
        // highlight the clicked edge
        graph.setItemState(item, 'focus', true);
        item.update({
          //label: model.oriLabel,
          state:'click',
          labelCfg: {
            autoRotate: true,
            refY:7,
            style: {
              fill: '#5F95FF',
              fontSize: 16,
              opacity: 1,
            },
          },
        });
        item.toFront();
        item.getSource().toFront();
        item.getTarget().toFront();
      });
    
      // click canvas to cancel all the focus state
      graph.on('canvas:click', (evt) => {
        this.clearFocusItemState(graph);
      });
    },
    G6registor(){
      // Custom super node
      G6.registerNode(
        'aggregated-node',
        {
          draw(cfg, group) {
            //console.log(cfg)
            let width = 140,
              height = 35;
            const style = cfg.style || {};
            const colorSet = cfg.colorSet || colorSets[0];

            // focus stroke for hover
            group.addShape('rect', {
              attrs: {
                x: -width * 0.54,
                y: -height * 0.65,
                width: width * 1.08,
                height: height * 1.3,
                shadowOffsetX: 0,
                shadowOffsetY: 0,
                shadowColor: colorSet.mainStroke,
                shadowBlur: 4,
                fill: colorSet.mainFill, // '#3B4043',
                stroke: colorSet.mainStroke,//'#AAB7C4',
                lineWidth: 3,
                lineOpacty: 0.6,
                radius: (height / 2) * 1.3,
              },
              name: 'hover-shape',
              visible: false,
            });

            group.addShape('rect', {
              attrs: {
                x: -width * 0.54,
                y: -height * 0.65,
                width: width * 1.08,
                height: height * 1.3,
                shadowOffsetX: 2,
                shadowOffsetY: 3,
                shadowColor: '#888',
                shadowBlur: 4,
                fill: colorSet.mainStroke, // || '#3B4043',

                stroke: colorSet.mainFill,
                lineWidth: 5,
                cursor: 'pointer',
                radius: (height / 2) * 1.3,
                //lineDash: [10, 2],
              },
              name: 'selected-shape',
              visible: false,
              draggable: true,
            });

            const keyShape = group.addShape('rect', {
              attrs: {
                ...style,
                x: -width / 2,
                y: -height / 2,
                width,
                height,
                shadowOffsetX: 0,
                shadowOffsetY: 0,
                shadowColor: colorSet.mainStroke,
                shadowBlur: 4,
                fill: colorSet.mainFill, // || '#3B4043',
                stroke: colorSet.mainStroke,
                lineWidth: 3,
                cursor: 'pointer',
                radius: height / 2 || 13,
                //lineDash: [2, 2],
              },
              name: 'aggregated-node-keyShape',
            });

            let labelStyle = {};
            if (cfg.labelCfg) {
              labelStyle = Object.assign(labelStyle, cfg.labelCfg.style);
            }
            // if(cfg.level>0)
            //   cfg.label = cfg.oriLabel;
            group.addShape('text', {
              attrs: {
                text: cfg.label||`${cfg.count}`,
                x: 0,
                y: 2,
                textAlign: 'center',
                textBaseline: 'middle',
                cursor: 'pointer',
                fontSize: 14,
                fill: colorSet.mainStroke,
                opacity: 0.85,
                fontWeight: 550,
              },
              name: 'count-shape',
              className: 'count-shape',
              draggable: true,
            });

            group.addShape('text', {
              attrs: {
                text: cfg.label||`${cfg.count}`,
                x: 0,
                y: 2,
                textAlign: 'center',
                textBaseline: 'middle',
                cursor: 'pointer',
                fontSize: 18,
                stroke:'white',
                lineWidth:3,
                shadowOffsetX: 1,
                shadowOffsetY: 1,
                shadowColor: colorSet.mainStroke,
                shadowBlur: 3,
                fill: colorSet.mainStroke,
                opacity: 0.85,
                fontWeight: 550,
              },
              name: 'hover-text',
              className: 'hover-text',
              visible:false,
              draggable: true,
            });
            group.addShape('text', {
              attrs: {
                text: cfg.label||`${cfg.count}`,
                x: 0,
                y: 2,
                textAlign: 'center',
                textBaseline: 'middle',
                cursor: 'pointer',
                fontSize: 18,
                lineWidth:3,
                shadowOffsetX: 2,
                shadowOffsetY: 2,
                shadowColor: '#666',
                shadowBlur: 4,
                fill: colorSet.mainFill,
                opacity: 0.85,
                fontWeight: 550,
              },
              name: 'selected-text',
              className: 'selected-text',
              visible:false,
              draggable: true,
            });
            // tag for new node
            if (cfg.new) {
              // group.addShape('circle', {
              //   attrs: {
              //     x: width / 2 - 3,
              //     y: -height / 2 + 3,
              //     r: 4,
              //     fill: 'rgb(233, 73, 73)',
              //     lineWidth: 0.5,
              //     //stroke: '#FFFFFF',
              //   },
              //   name: 'typeNode-tag-circle',
              // });
              group.addShape('text', {
                attrs: {
                  text: `NEW`,
                  x: width / 2 - 30,
                  y: -height / 2 + 13,
                  fontSize: 9,
                  fill: 'rgb(233, 73, 73)',
                  opacity: 0.85,
                  fontWeight: 800,
                  //stroke: '#FFFFFF',
                },
                name: 'typeNode-tag-circle',
              });
            }
            return keyShape;
          },
          setState: (name, value, item) => {
            const group = item.get('group');
            if (name === 'layoutEnd' && value) {
              const labelShape = group.find((e) => e.get('name') === 'text-shape');
              if (labelShape) labelShape.set('visible', true);
            } 
            else if (name === 'hover') {
              if (item.hasState('focus')) {
                return;
              }
              const text = group.find((e) => e.get('name') === 'count-shape');
              const halo = group.find((e) => e.get('name') === 'hover-shape');//'halo-shape');
              const htext = group.find((e) => e.get('name') === 'hover-text');
              const keyShape = item.getKeyShape();
              const colorSet = item.getModel().colorSet || colorSets[0];
              if (value) {
                halo && halo.show();
                text && text.hide();
                htext && htext.show();
                keyShape.attr('fill', colorSet.activeFill);
              } else {
                halo && halo.hide();
                text && text.show();
                htext && htext.hide();
                keyShape.attr('fill', colorSet.mainFill);
              }
            } 
            else if (name === 'focus') {
              const text = group.find((e) => e.get('name') === 'count-shape');
              const htext = group.find((e) => e.get('name') === 'selected-text');
              const stroke = group.find((e) => e.get('name') === 'selected-shape');
              const keyShape = item.getKeyShape();
              const colorSet = item.getModel().colorSet || colorSets[0];
              if (value) {
                stroke && stroke.show();
                text && text.hide();
                htext && htext.show();
                keyShape.hide();
                keyShape.attr('fill', colorSet.selectedFill);
              } else {
                stroke && stroke.hide();
                text && text.show();
                htext && htext.hide();
                keyShape.show();
                keyShape.attr('fill', colorSet.mainFill);
              }
            }
          },
          update: undefined,
        },
        'single-node',
      );

      G6.registerEdge(
        'custom-quadratic',
        {
          setState: (name, value, item) => {
            const group = item.get('group');
            const model = item.getModel();
            if (name === 'focus') {
              const back = group.find((ele) => ele.get('name') === 'back-line');
              if (back) {
                back.stopAnimate();
                back.remove();
                back.destroy();
              }
              const keyShape = group.find((ele) => ele.get('name') === 'edge-shape');
              const arrow = model.style.endArrow; 
              if (value) {
                if (keyShape.cfg.animation) {
                  keyShape.stopAnimate(true);
                }
                keyShape.attr({
                  strokeOpacity: animateOpacity,
                  opacity: animateOpacity,
                  stroke: '#5F95FF',
                  endArrow: {
                    ...arrow,
                    stroke: '#5F95FF',
                    fill: '#5F95FF',
                  },
                });
                if (model.isReal) {
                  const { lineWidth, path, endArrow, stroke } = keyShape.attr();
                  const back = group.addShape('path', {
                    attrs: {
                      lineWidth,
                      path,
                      stroke,
                      endArrow,
                      opacity: animateBackOpacity,
                    },
                    name: 'back-line',
                  });
                  back.toBack();
                  const length = keyShape.getTotalLength();
                  keyShape.animate(
                    (ratio) => {
                      // the operations in each frame. Ratio ranges from 0 to 1 indicating the prograss of the animation. Returns the modified configurations
                      const startLen = ratio * length;
                      // Calculate the lineDash
                      const cfg = {
                        lineDash: [startLen, length - startLen],
                      };
                      return cfg;
                    },
                    {
                      repeat: true, // Whether executes the animation repeatly
                      duration, // the duration for executing once
                    },
                  );
                } else {
                  let index = 0;
                  const lineDash = keyShape.attr('lineDash');
                  const totalLength = lineDash[0] + lineDash[1];
                  keyShape.animate(
                    () => {
                      index++;
                      if (index > totalLength) {
                        index = 0;
                      }
                      const res = {
                        lineDash,
                        lineDashOffset: -index,
                      };
                      // returns the modified configurations here, lineDash and lineDashOffset here
                      return res;
                    },
                    {
                      repeat: true, // whether executes the animation repeatly
                      duration, // the duration for executing once
                    },
                  );
                }
              } else {
                keyShape.stopAnimate();
                const stroke = '#acaeaf';
                const opacity = model.isReal ? realEdgeOpacity : virtualEdgeOpacity;
                keyShape.attr({
                  stroke,
                  strokeOpacity: opacity,
                  opacity:realEdgeOpacity,
                  endArrow: {
                    ...arrow,
                    stroke,
                    fill: stroke,
                  },
                });
              }
            }
            else if (name === 'hover') {
              if (item.hasState('focus')) {
                return;
              }
              const back = group.find((ele) => ele.get('name') === 'back-line');
              if (back) {
                back.stopAnimate();
                back.remove();
                back.destroy();
              }
              const keyShape = group.find((ele) => ele.get('name') === 'edge-shape');
              const arrow = model.style.endArrow;
              if (value) {
                if (keyShape.cfg.animation) {
                  keyShape.stopAnimate(true);
                }
                keyShape.attr({
                  strokeOpacity: animateOpacity,
                  opacity: animateOpacity,
                  stroke: '#000',
                  //lineWidth:3,
                  endArrow: {
                    ...arrow,
                    stroke: '#000',
                    fill: '#000',
                  },
                });
                if (model.isReal) {
                  const { lineWidth, path, endArrow, stroke } = keyShape.attr();
                  const back = group.addShape('path', {
                    attrs: {
                      lineWidth,
                      path,
                      stroke,
                      endArrow,
                      opacity: animateBackOpacity,
                    },
                    name: 'back-line',
                  });
                  back.toBack();
                  const length = keyShape.getTotalLength();
                  keyShape.animate(
                    (ratio) => {
                      // the operations in each frame. Ratio ranges from 0 to 1 indicating the prograss of the animation. Returns the modified configurations
                      const startLen = ratio * length;
                      // Calculate the lineDash
                      const cfg = {
                        lineDash: [startLen, length - startLen],
                      };
                      return cfg;
                    },
                    {
                      repeat: true, // Whether executes the animation repeatly
                      duration, // the duration for executing once
                    },
                  );
                } else {
                  let index = 0;
                  const lineDash = keyShape.attr('lineDash');
                  const totalLength = lineDash[0] + lineDash[1];
                  keyShape.animate(
                    () => {
                      index++;
                      if (index > totalLength) {
                        index = 0;
                      }
                      const res = {
                        lineDash,
                        lineDashOffset: -index,
                      };
                      // returns the modified configurations here, lineDash and lineDashOffset here
                      return res;
                    },
                    {
                      repeat: true, // whether executes the animation repeatly
                      duration, // the duration for executing once
                    },
                  );
                }
              } else {
                keyShape.stopAnimate();
                const stroke = '#acaeaf';
                const opacity = model.isReal ? realEdgeOpacity : virtualEdgeOpacity;
                keyShape.attr({
                  stroke,
                  strokeOpacity: opacity,
                  opacity:realEdgeOpacity,
                  endArrow: {
                    ...arrow,
                    stroke,
                    fill: stroke,
                  },
                });
              }
            }
          },
        },
        'quadratic',
      );
      
      // Custom the line edge for single edge between one node pair
      G6.registerEdge(
        'custom-line',
        {
          setState: (name, value, item) => {
            const group = item.get('group');
            const model = item.getModel();
            if (name === 'focus') {
              const keyShape = group.find((ele) => ele.get('name') === 'edge-shape');
              const back = group.find((ele) => ele.get('name') === 'back-line');
              if (back) {
                back.stopAnimate();
                back.remove();
                back.destroy();
              }
              const arrow = model.style.endArrow;
              if (value) {
                if (keyShape.cfg.animation) {
                  keyShape.stopAnimate(true);
                }
                keyShape.attr({
                  strokeOpacity: animateOpacity,
                  opacity: animateOpacity,
                  stroke: '#5F95FF',
                  endArrow: {
                    ...arrow,
                    stroke: '#5F95FF',
                    fill: '#5F95FF',
                  },
                });
                if (model.isReal) {
                  const { path, stroke, lineWidth } = keyShape.attr();
                  const back = group.addShape('path', {
                    attrs: {
                      path,
                      stroke,
                      lineWidth,
                      opacity: animateBackOpacity,
                    },
                    name: 'back-line',
                  });
                  back.toBack();
                  const length = keyShape.getTotalLength();
                  keyShape.animate(
                    (ratio) => {
                      // the operations in each frame. Ratio ranges from 0 to 1 indicating the prograss of the animation. Returns the modified configurations
                      const startLen = ratio * length;
                      // Calculate the lineDash
                      const cfg = {
                        lineDash: [startLen, length - startLen],
                      };
                      return cfg;
                    },
                    {
                      repeat: true, // Whether executes the animation repeatly
                      duration, // the duration for executing once
                    },
                  );
                } else {
                  const lineDash = keyShape.attr('lineDash');
                  const totalLength = lineDash[0] + lineDash[1];
                  let index = 0;
                  keyShape.animate(
                    () => {
                      index++;
                      if (index > totalLength) {
                        index = 0;
                      }
                      const res = {
                        lineDash,
                        lineDashOffset: -index,
                      };
                      // returns the modified configurations here, lineDash and lineDashOffset here
                      return res;
                    },
                    {
                      repeat: true, // whether executes the animation repeatly
                      duration, // the duration for executing once
                    },
                  );
                }
              } else {
                keyShape.stopAnimate();
                const stroke = '#acaeaf';
                const opacity = model.isReal ? realEdgeOpacity : virtualEdgeOpacity;
                keyShape.attr({
                  stroke,
                  strokeOpacity: opacity,
                  opacity: opacity,
                  endArrow: {
                    ...arrow,
                    stroke,
                    fill: stroke,
                  },
                });
              }
            }
            else if (name === 'hover') {
              if (item.hasState('focus')) {
                return;
              }
              const keyShape = group.find((ele) => ele.get('name') === 'edge-shape');
              const back = group.find((ele) => ele.get('name') === 'back-line');
              if (back) {
                back.stopAnimate();
                back.remove();
                back.destroy();
              }
              const arrow = model.style.endArrow;
              if (value) {
                if (keyShape.cfg.animation) {
                  keyShape.stopAnimate(true);
                }
                keyShape.attr({
                  strokeOpacity: animateOpacity,
                  opacity: animateOpacity,
                  stroke: '#000',
                  endArrow: {
                    ...arrow,
                    stroke: '#000',
                    fill: '#000',
                  },
                });
                if (model.isReal) {
                  const { path, stroke, lineWidth } = keyShape.attr();
                  const back = group.addShape('path', {
                    attrs: {
                      path,
                      stroke,
                      lineWidth,
                      opacity: animateBackOpacity,
                    },
                    name: 'back-line',
                  });
                  back.toBack();
                  const length = keyShape.getTotalLength();
                  keyShape.animate(
                    (ratio) => {
                      // the operations in each frame. Ratio ranges from 0 to 1 indicating the prograss of the animation. Returns the modified configurations
                      const startLen = ratio * length;
                      // Calculate the lineDash
                      const cfg = {
                        lineDash: [startLen, length - startLen],
                      };
                      return cfg;
                    },
                    {
                      repeat: true, // Whether executes the animation repeatly
                      duration, // the duration for executing once
                    },
                  );
                } else {
                  const lineDash = keyShape.attr('lineDash');
                  const totalLength = lineDash[0] + lineDash[1];
                  let index = 0;
                  keyShape.animate(
                    () => {
                      index++;
                      if (index > totalLength) {
                        index = 0;
                      }
                      const res = {
                        lineDash,
                        lineDashOffset: -index,
                      };
                      // returns the modified configurations here, lineDash and lineDashOffset here
                      return res;
                    },
                    {
                      repeat: true, // whether executes the animation repeatly
                      duration, // the duration for executing once
                    },
                  );
                }
              } else {
                keyShape.stopAnimate();
                const stroke = '#acaeaf';
                const opacity = model.isReal ? realEdgeOpacity : virtualEdgeOpacity;
                keyShape.attr({
                  stroke,
                  strokeOpacity: opacity,
                  opacity: opacity,
                  endArrow: {
                    ...arrow,
                    stroke,
                    fill: stroke,
                  },
                });
              }
            }
          },
        },
        'single-edge',
      );

    },
    findParents(nodes){
      nodes.forEach(node => {
        if (node.hasOwnProperty("nodes")) {
          // 用栈来存储双亲，在递归调用时入栈
          parents.push(node.id)
          this.findParents(node.nodes)
        } else {
          // 当节点不含 nodes 属性时即为最底层节点
          nodesParents.forEach(children=>{
            // 找到该节点，增加 parents 属性
            if (children.id === node.id){
              // 没有 parents 属性时初始化一下
              if (!children.hasOwnProperty("parents")){ 
                children["parents"] = [];
              }
              // 有的话查看是否已经存在了，存在就忽略，不存在加进去
              parents.forEach(p =>{
                let notIn = true;
                children.parents.forEach(f =>{
                  if (f === p){
                    notIn = false;
                  }
                })
                if (notIn){
                  children.parents.push(p)
                }
              })
            }
          })   
        }
      });
      // 递归结束出栈
      parents.pop()
    },
    
    // 增加类别之间的连线
    genClusterEdges(edges){
      clusterEdges = [];
      edges.forEach(edge =>{
        let sourceParents, targetParents;
        let value = edge.value
        // 找到该节点的起点及终点的双亲信息
        nodesParents.forEach(node=>{
          if (node.id === edge.source){
            sourceParents = node.parents;
          } else if(node.id === edge.target){
            targetParents = node.parents;
          }
        })
        if (sourceParents != undefined && targetParents != undefined){
          // 双循环遍历双亲
          sourceParents.forEach(sourceClaster =>{
            targetParents.forEach(targetCluster=>{
              // 有了这条边就增加 value
              let notIn = true;
              clusterEdges.forEach(clusterEdge=>{
                if (clusterEdge.source === sourceClaster && 
                    clusterEdge.target === targetCluster) 
                {   
                  notIn = false;
                  // 是否已经存在这个 value
                  let notHave = true;
                  clusterEdge.value.forEach(v=>{
                    if (v === value){
                      notHave = false;
                    }
                  })
                  if (notHave){ 
                    clusterEdge.value.push(value)
                  }
                }
              })
              // 没有这条边就增加这条边
              if (notIn) {
                let newEdge = {
                  "source": sourceClaster,
                  "target": targetCluster,
                  "value": [value]
                }
                clusterEdges.push(newEdge)
              }
            })
          })
        }
          
        })
    },
    getData(){
      //fetch('https://gw.alipayobjects.com/os/antvdemo/assets/data/relations.json')
      let data = require('../../assets/data.json')
      //   .then((res) => res.json())
      //   .then((data) =>{
      nodesParents = data.nodes;
      this.findParents(data.clusters);
      this.genClusterEdges(data.edges)
      data.clusterEdges = clusterEdges;
      this.oridata=data;
      this.drawGraph(data);
      //   });
    },
    deleteChild(parentNode){
      let isExpand = false;
      for (let i = 0; i < expandArray.length; i++) {
        if (expandArray[i].id === parentNode.id) {
          isExpand = true;
          break;
        }
      }
      if(isExpand){
        parentNode.nodes.forEach((node)=>{this.deleteChild(node)});
      }else{
        for (let i = 0; i < aggregatedData.nodes.length; i++) {
          if (aggregatedData.nodes[i].id === parentNode.id) {
            aggregatedData.nodes.splice(i, 1);
            break;
          }
        }
      }
      return;
    },
    exbandNode(node){
      const newArray = this.manageExpandCollapseArray(
        graph.getNodes().length,
        node,
        expandArray,
      );
      expandArray = newArray;
      let mixedGraphData = this.getMixedGraph(
        aggregatedData,
        this.oridata,
        nodeMap,
        aggregatedNodeMap,
        expandArray,
      );
      return mixedGraphData;
    },
    collpseNode(parentid){
      //the parent node
      const aggregatedNode = aggregatedNodeMap[parentid];
      console.log("collapse",aggregatedNode)
      //delete parent in openKey
      for (let i = 0; i < this.openKeys.length; i++)
        if (this.openKeys[i] === aggregatedNode.id){
          console.log("sliceP",aggregatedNode.value)
          this.openKeys.splice(i, 1);
          }
      //delete brothers in openKey    
      aggregatedNode.nodes.forEach((bro)=>{
        for (let i = 0; i < this.openKeys.length; i++)
          if (this.openKeys[i] === bro.id){
            this.openKeys.splice(i, 1);
            }
      })
      manipulatePosition = { x: aggregatedNode.x, y: aggregatedNode.y };
      this.deleteChild(aggregatedNode);
      for (let i = 0; i < expandArray.length; i++) {
        if (expandArray[i].id === parentid) {
          expandArray.splice(i, 1);
          break;
        }
      }
      aggregatedData.nodes.push(aggregatedNode);
      let mixedGraphData = this.getMixedGraph(
        aggregatedData,
        this.oridata,
        nodeMap,
        aggregatedNodeMap,
        expandArray,
      );
      return mixedGraphData;
    },
    //主要绘制函数
    drawGraph(data){
      //const darkBackColor = 'rgb(43, 47, 51)';
      const darkBackColor = '#fff';
      const disableColor = '#777';
      const theme = 'default';
      const subjectColors = [
        '#5F95FF', // blue
        '#61DDAA',
        '#65789B',
        '#F6BD16',
        '#7262FD',
        '#78D3F8',
        '#9661BC',
        '#F6903D',
        '#008685',
        '#F08BB4',

      ];

      const colorSets = G6.Util.getColorSetsBySubjectColors(
        subjectColors,
        darkBackColor,
        theme,
        disableColor,
      );
      opColotSets = G6.Util.getColorSetsBySubjectColors(
        ['#00bc12'],
        darkBackColor,
        theme,
        disableColor,
      );
      const container = document.getElementById('container');
      nodeMap = {};
      //const clusteredData = louvain(data, false, 'weight');
      const clusteredData = {clusters:[],clusterEdges:[]};
      clusteredData.clusters = data.clusters;
      clusteredData.clusterEdges = data.clusterEdges;
      aggregatedData = { nodes: [], edges: [] };
      //处理聚类数据
      clusteredData.clusters.forEach((cluster, i) => {
        //cluster.nodes = cluster.nodes?cluster.nodes:[];
        if(cluster.level == 0)return;
        cluster.nodes.forEach((node) => {
          node.label = node.value;
          node.type = '';
          node.count = node.nodes?node.nodes.length:0;
          node.clusterId = cluster.id;
          node.colorSet = colorSets[i%10];
          nodeMap[node.id] = node;
        });
        const cnode = {
          ...cluster,
          type: 'aggregated-node',
          count: cluster.nodes.length,
          isTop:true,
          colorSet: colorSets[i%10],
          idx: i,
        };
        aggregatedNodeMap[cluster.id] = cnode;
        aggregatedData.nodes.push(cnode);
      });

      clusteredData.clusterEdges.forEach((clusterEdge) => {
        let count = clusterEdge.value.length;
        const cedge = {
          ...clusterEdge,
          //size: Math.log(clusterEdge.count),
          labelCount : count,
          label : clusterEdge.value[0] + (count == 1? '': ' ( ' + count + ' )'),
          id: `edge-${uniqueId()}`,
        };
        if (cedge.source === cedge.target) {
          cedge.type = 'loop';
          cedge.loopCfg = {
            dist: 20,
          };
        } else cedge.type = 'line';
        if(aggregatedNodeMap[cedge.source]&&aggregatedNodeMap[cedge.target])
          aggregatedData.edges.push(cedge);
      });

      data.nodes.forEach((node) => {
        node.inLabel=new Set();
        node.outLabel = new Set();
        node.level = 0;
        realNodeMap[node.id] = node;
      });

      data.edges.forEach((edge) => {
        edge.label = edge.value;
        edge.id = `edge-${uniqueId()}`;
        realNodeMap[edge.source].outLabel.add(edge.value);
        realNodeMap[edge.target].inLabel.add(edge.value);
      });

      //console.log(realNodeMap)
      firstAggregatedData = aggregatedData;
      currentUnproccessedData = aggregatedData;

      const { edges: processedEdges } = this.processNodesEdges(
        currentUnproccessedData.nodes,
        currentUnproccessedData.edges,
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
        largeGraphMode,
        true,
        true,
      );
      const nodeToolTip = new G6.Tooltip({
        className:'G6tooltip',
        offsetX: 0,
        offsetY: 50,
        itemTypes: ['node'],
        getContent: (e)=>{
          const model = e.item.getModel();
          let innerhtml=`<div class="tooltip-content">
                            <div class = "tooltip-title" style="position:fixed;">This node includes:
                              <h3 style="font-size: 6px;color: #1890ff;margin: -5px 0 0 0;">(Blue: non-data nodes)</h3>
                            </div>`;
          const outDiv = document.createElement('div');
          model.nodes.forEach((node) => {
            if(node.level == 0){
              innerhtml+= `<p style="cursor:pointer" on-click="searchByNodes(${node.value})"> ${node.value}</p>`;
            }else
            innerhtml+= `<p style="font-weight: bold;color:#1890ff">${node.value}</p>`;
          });
          outDiv.innerHTML=innerhtml+`</div>`;
          return outDiv
        }
      })

      const tooltip = new G6.Tooltip({
        className:'G6tooltip',
        trigger:'click',
        offsetX: 26,
        offsetY: 0,
        // 允许出现 tooltip 的 item 类型
        itemTypes: [ 'edge'],
        getContent: (e) => {
          const model = e.item.getModel();
          let innerhtml=`<div class="tooltip-content">`;
          const outDiv = document.createElement('div');
          model.value.forEach((label) => {
            innerhtml+= `<p>${label}</p>`;
          });
          outDiv.innerHTML=innerhtml+`</div>`;
          return outDiv;
        },
        shouldBegin: (e) => {
          const model = e.item.getModel();
          let res = true;
          if(model.value.length == 1){
            res = false;
          }
          return res;
        },
      });

      const contextMenu = new G6.Menu({
        className:'G6Meum',
        shouldBegin(evt) {
          if (evt.target && evt.target.isCanvas && evt.target.isCanvas()) return true;
          if (evt.item) return true;
          return false;
        },
        getContent(evt) {
          const { item } = evt;
          if (evt.target && evt.target.isCanvas && evt.target.isCanvas()) {
            return `<ul>
            <li id='show'>Show all Hidden Items</li>
            <li id='collapseAll'>Collapse all Items</li>
          </ul>`;
          } else if (!item) return;
          const itemType = item.getType();
          const model = item.getModel();
          if (itemType && model) {
            if (itemType === 'node') {
              if (model.level > 1) {
                if(model.isTop){
                  return `<ul>
                    <li id='expand'>Expand</li>
                    <li id='hide'>Hide the Node</li>
                  </ul>`;
                }
                else{
                  return `<ul>
                    <li id='expand'>Expand</li>
                    <li id='collapse'>Collapse</li>
                    <li id='hide'>Hide the Node</li>
                  </ul>`;
                }
              } else {
                if(model.isTop){
                  return `<ul>
                    <li id='hide'>Hide the Node</li>
                  </ul>`;
                }
                else{
                  return `<ul>
                    <li id='collapse'>Collapse</li>
                    <li id='hide'>Hide the Node</li>
                  </ul>`;
                }
              }
            } else {
              return `<ul>
              <li id='hide'>Hide the Edge</li>
            </ul>`;
            }
          }
        },
        handleMenuClick: (target, item) => {
          const model = item && item.getModel();
          //console.log("点了：",model)
          const liIdStrs = target.id.split('-');
          let mixedGraphData;
          switch (liIdStrs[0]) {
            case 'hide':
              graph.hideItem(item);
              hiddenItemIds.push(model.id);
              break;
            case 'expand':
              this.openKeys.push(model.id)
              mixedGraphData = this.exbandNode(model);
              break;
            case 'collapse':
              mixedGraphData = this.collpseNode(model.clusterId);
              break;
            case 'collapseAll':
              expandArray = [];
              this.openKeys=[];
              mixedGraphData = this.getMixedGraph(
                firstAggregatedData,
                this.oridata,
                nodeMap,
                aggregatedNodeMap,
                expandArray,
              );
              break;
            case 'show':
              this.showItems(graph);
              break;
            case 'rename':
              this.renameNode(model);
              break;
            default:
              break;
          }
          if (mixedGraphData) {
            cachePositions = this.cacheNodePositions(graph.getNodes());
            aggregatedData =  mixedGraphData;
            currentUnproccessedData = mixedGraphData;
            this.handleRefreshGraph(
              graph,
              currentUnproccessedData,
              CANVAS_WIDTH,
              CANVAS_HEIGHT,
              largeGraphMode,
              true,
              false,
            );
          }
          this.updateLabel();
        },
        // offsetX and offsetY include the padding of the parent container
        // 需要加上父级容器的 padding-left 16 与自身偏移量 10
        offsetX: 16 + 10,
        // 需要加上父级容器的 padding-top 24 、画布兄弟元素高度、与自身偏移量 10
        offsetY: 0,
        // the types of items that allow the menu show up
        // 在哪些类型的元素上响应
        itemTypes: ['node', 'edge', 'canvas'],
      });
      const minimap = new G6.Minimap({
        container:'minimap',
        size: [200, 100],
      });
      let fisheye = new G6.Fisheye({
        r: 200,
        showLabel: true,
      });
      graph = new G6.Graph({
        container: 'container',
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        linkCenter: true,
        minZoom: 0.1,
        groupByTypes: false,
        preventOverlap:true,
        //fitViewPadding: 20,
        //fitView:true,
        modes: {
          default: [
            {
              type: 'drag-canvas',
              enableOptimize: true,
            },
            {
              type: 'zoom-canvas',
              enableOptimize: true,
              optimizeZoom: 0.01,
            },
            'drag-node',
            'shortcuts-call',
          ],
        },
        defaultNode: {
          type: 'aggregated-node',
          size: DEFAULTNODESIZE,
        }, 
        defaultEdge: {
          style: {
            stroke: '#acaeaf',
          },
        },
        plugins: [contextMenu,nodeToolTip, tooltip,minimap],
        enabledStack: true,
      });
      graph.get('canvas').set('localRefresh', false);

      const layoutConfig = this.getForceLayoutConfig(graph, largeGraphMode);
      layoutConfig.center = [CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2];
      layout.instance = new G6.Layout['gForce'](layoutConfig);
      layout.instance.init({
        nodes: currentUnproccessedData.nodes,
        edges: processedEdges,
      });
      layout.instance.execute();
      this.bindListener(graph);

      graph.data({
        nodes: aggregatedData.nodes,
        edges: processedEdges
      });
      graph.render();
      this.updateLabel();
      if (typeof window !== 'undefined')
        window.onresize = () => {
          if (!graph || graph.get('destroyed')) return;
          if (!container || !container.scrollWidth || !container.scrollHeight) return;
          graph.changeSize(CANVAS_WIDTH, CANVAS_HEIGHT);
        };
    },
    
  },
  mounted() {
    const searchList1 = document.getElementById("searchList-1");
    const infoEle = document.getElementById("infolist");
    const filterEle = document.getElementById("filterContent");
    searchList1.style.height = CANVAS_HEIGHT-80+"px";
    infoEle.style.height = CANVAS_HEIGHT-60+"px";
    filterEle.style.height = CANVAS_HEIGHT-60+"px";
    this.$notification.config({
      placement: 'bottomLeft',
      bottom: '65px',
      duration: 3,
    });
    // const tool= document.getElementById('toolbarAll');
    // let toolH = tool.scrollHeight;
    // console.log("toolH",toolH)
    //tool.style.marginTop = CANVAS_HEIGHT/2-toolH/2+"px";
    this.G6registor();
    this.getData();
    
  }
}