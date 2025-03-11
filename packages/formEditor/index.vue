<script>
import { ClickOutside as vClickOutside, ElMessage } from "element-plus";
import {
  defineProps,
  ref,
  reactive,
  computed,
  provide,
  getCurrentInstance,
  nextTick,
  onMounted,
  watch,
} from "vue";
import FieldsPanel from "@ER/formEditor/components/Panels/Fields";
import CanvesPanel from "@ER/formEditor/components/Panels/Canves";
import ConfigPanel from "@ER/formEditor/components/Panels/Config/index.vue";
import DeviceSwitch from "@ER/formEditor/components/DeviceSwitch.vue";
import erFormPreview from "./preview.vue";
import Icon from "@ER/icon";
import hooks from "@ER/hooks";
import utils from "@ER/utils";
import _ from "lodash-es";
import defaultProps from "./defaultProps";
import generatorData from "./generatorData";
export default {
  name: "Everright-form-editor",
};
</script>
<script setup>
import { staticData } from "./testData";
import { Editor } from "./editor";
const emit = defineEmits(["listener"]);
const props = defineProps(
  _.merge(
    {
      fieldsPanelWidth: {
        type: String,
        default: "220px",
      },
      fieldsPanelDefaultOpeneds: {
        type: Array,
        default: () => ["defaultField", "field", "container"],
      },
      delHandle: {
        type: Function,
        default: () => { },
      },
      copyHandle: {
        type: Function,
        default: () => { },
      },
      inlineMax: {
        type: Number,
        default: 4,
      },
      isShowClear: {
        type: Boolean,
        default: true,
      },
      isShowI18n: {
        type: Boolean,
        default: true,
      },
      dragMode: {
        type: String,
        default: "icon",
        validator: (value) => ["full", "icon"].includes(value),
      },
      checkFieldsForNewBadge: {
        type: Function,
        default: () => { },
      },
    },
    defaultProps
  )
);
const layout = {
  pc: [],
  mobile: [],
};
const myEditor = new Editor(props);
myEditor.setData(JSON.parse( JSON.stringify(staticData)) );//
const form = ref("");
const previewPlatform = ref("pc");
const previewLoading = ref(true);//
const state = myEditor.state;
// const isFoldFields = ref(true);
// const isFoldConfig = ref(true);
const isFoldFields = myEditor.toSelfRef("isFoldFields");
const isFoldConfig = myEditor.toSelfRef("isFoldConfig");
const isShow = myEditor.toSelfRef("isShow");
const isShowConfig = myEditor.toSelfRef("isShowConfig");
state.validator = (target, fn) => {
  if (target) {
    const count = _.countBy(state.validateStates, "data.key");
    const newValue = target.key.trim();
    if (utils.isNull(newValue)) {
      _.find(state.validateStates, {
        data: { key: target.key },
      }).isWarning = true;
      fn && fn(0);
      return false;
    }
    state.validateStates.forEach((e) => {
      if (count[e.data.key] > 1) {
        e.isWarning = true;
      } else {
        e.isWarning = false;
      }
    });
    if (fn) {
      fn(!(count[newValue] > 1) ? 1 : 2);
    }
  } else {
    fn(state.validateStates.every((e) => !e.isWarning));
  }
};

const { t, lang } = hooks.useI18n(props);
const EReditorPreviewRef = ref("");
const setSelection = (node) => {
  myEditor.setSelection(node);
};
setSelection(state.config);
const addField = (node) => {
  // console.log('add Fields')//
  myEditor.addField(node);//
};
const delField = (node) => {
  myEditor.delField(node);
};
const addFieldData = (node, isCopy = false) => {
  myEditor.addFieldData(node, isCopy);
};
const wrapElement = (
  el,
  isWrap = true,
  isSetSelection = true,
  sourceBlock = true,
  resetWidth = true
) => {
  return myEditor.wrapElement(el, isWrap, isSetSelection, sourceBlock, resetWidth);
};


const switchPlatform = (platform) => {
  myEditor.switchPlatform(platform);
};
const canvesScrollRef = ref("");
const fireEvent = (type, data) => {
  emit("listener", {
    type,
    data,
  });
};
const ns=myEditor.useHook('useNamespace', 'Main', state.Namespace)
const getData1 = () => {
  return myEditor.getData(); //
};
const getData2 = () => { };//
const getData = () => {
  return myEditor.getData();
};
const setData = (data) => {
  myEditor.setData(data);
};
defineExpose({
  form,
  switchPlatform(platform) {
    switchPlatform(platform);
  },
  setData,
  getData,
});
const handleOperation = (type, val) => {
  switch (type) {
    case 1:
      break;
    case 2:
      // state.store = []
      myEditor.clearState();
      break;
    case 3:
      //预览

      break;
    case 4:
      break;
    case 7:
      //处理预览相关
      break;
  }
};
watch(
  () => state.selected,//这个是当前的选择的
  (newVal) => {
    fireEvent("changeParams", _.cloneDeep(newVal));
  },
  {
    deep: true,
    immediate: true,
  }
);
const onClickOutside = () => { };
let obj = {
  state,
  setSelection,
  props,
  wrapElement,
  delField,
  addField,
  switchPlatform,
  addFieldData,
  canvesScrollRef,
  fireEvent,
  getData,
  form,
}
provide("Everright", obj);
provide('editor', myEditor);
</script>
<template>
  <el-container :class="[ns.b()]" direction="vertical">
    <el-container>
      <FieldsPanel v-show="isFoldFields" />
      <el-container :class="[ns.e('container')]">
        <el-header :class="[ns.e('operation')]">
          <div>
            <Icon @click="handleOperation(4)" :class="[ns.e('icon')]" icon="save"></Icon>
            <Icon v-if="isShowClear" @click="handleOperation(2)" :class="[ns.e('icon')]" icon="clear0"></Icon>
            <slot name="operation-left"></slot>
          </div>
          <div>
            <DeviceSwitch :modelValue="state.platform" @update:modelValue="(val) => switchPlatform(val)"></DeviceSwitch>
          </div>
          <div>
            <slot name="operation-right"></slot>
            <el-dropdown v-if="isShowI18n" @command="(command) => fireEvent('lang', command)">
              <Icon :class="[ns.e('icon')]" icon="language"></Icon>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="zh-cn" :disabled="lang === 'zh-cn'">中文</el-dropdown-item>
                  <el-dropdown-item command="en" :disabled="lang === 'en'">English</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <Icon @click="handleOperation(3)" :class="[ns.e('icon')]" icon="preview"></Icon>
          </div>
        </el-header>
        <CanvesPanel v-click-outside="onClickOutside" v-if="isShow" :data="state.store"></CanvesPanel>
        <Icon @click="handleOperation(5)" :class="[ns.e('arrowLeft'), !isFoldFields && ns.is('close')]"
          icon="arrowLeft"></Icon>
        <Icon @click="handleOperation(6)" :class="[ns.e('arrowRight'), !isFoldConfig && ns.is('close')]"
          icon="arrowRight">
        </Icon>
      </el-container>
      <ConfigPanel v-show="isFoldConfig"></ConfigPanel>
    </el-container>
  </el-container>
</template>
