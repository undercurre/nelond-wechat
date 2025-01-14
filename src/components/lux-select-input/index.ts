import Toast from '@vant/weapp/toast/toast'
import { VantComponent } from './component';

interface Column {
  values: any[];
  defaultIndex?: number;
}

VantComponent({
  classes: ['active-class', 'toolbar-class', 'column-class'],

  props: {
    title: String,
    loading: Boolean,
    showToolbar: Boolean,
    cancelButtonText: {
      type: String,
      value: '取消',
    },
    confirmButtonText: {
      type: String,
      value: '确认',
    },
    visibleItemCount: {
      type: Number,
      value: 3,
    },
    itemHeight: {
      type: Number,
      value: 44,
    },
    valueKey: {
      type: String,
      value: 'text',
    },
    toolbarPosition: {
      type: String,
      value: 'top',
    },
    defaultIndex: {
      type: Number,
      value: 2,
    },
    defaultInput: {
      type: String,
      value: '0',
      observer(value = '0') {
        this.setData({
          luxValue: value
        })
      },
    },
    columns: {
      type: Array,
      value: [],
      observer(columns = []) {
        this.simple = columns.length && !columns[0].values;

        if (Array.isArray(this.children) && this.children.length) {
          this.setColumns().catch(() => { });
        }
      },
    },
  },

  beforeCreate() {
    Object.defineProperty(this, 'children', {
      get: () => this.selectAllComponents('.lux_column') || [],
    });
  },

  data: {
    luxValue: '0'
  },

  methods: {
    noop() { },

    setColumns() {
      const { data } = this;
      const columns = this.simple ? [{ values: data.columns }] : data.columns;
      const stack = columns.map((column: Column, index: number) =>
        this.setColumnValues(index, column.values)
      );
      return Promise.all(stack);
    },

    emit(event: WechatMiniprogram.TouchEvent) {
      const { type } = event.currentTarget.dataset;
      if (this.simple) {
        this.$emit(type, {
          value: this.getColumnValue(0),
          index: this.getColumnIndex(0),
        });
      } else {
        this.$emit(type, {
          value: this.getValues(),
          index: this.getIndexes(),
        });
      }
    },

    onChange() {
      if (this.simple) {
        this.$emit('change', {
          value: this.data.luxValue,
          symbol: this.getValuesMap(),
        });
      } else {
        this.$emit('change', {
          value: this.data.luxValue,
          symbol: this.getValuesMap(),
        });
      }
    },

    onChangeLux(event: WechatMiniprogram.CustomEvent) {
      console.log(event.detail)
      const regex = /^(0|([1-9]\d{0,3})|([1-9][0-9]{0,3}|[1][01][0-9]{3}|12000))$/;
      if (regex.test(event.detail as any)) {
        console.log("符合要求");
      } else {
        console.log('不符合要求')
        Toast({ message: '请输入0-12000整数', zIndex: 9999 })
        if (Number(event.detail as any) > 1000) {
          (event.detail as any) = 12000
        } else {
          (event.detail as any) = 0
        }
      }
      if (this.simple) {
        this.$emit('change', {
          value: event.detail,
          symbol: this.getValuesMap(),
        });
      } else {
        this.$emit('change', {
          value: event.detail,
          symbol: this.getValuesMap(),
        });
      }
    },

    // get column instance by index
    getColumn(index: number) {
      return this.children[index];
    },

    // get column value by index
    getColumnValue(index: number) {
      const column = this.getColumn(index);
      return column && column.getValue();
    },

    // set column value by index
    setColumnValue(index: number, value: any) {
      const column = this.getColumn(index);
 
      if (column == null) {
        return Promise.reject(new Error('setColumnValue: 对应列不存在'));
      }

      return column.setValue(value);
    },

    // get column option index by column index
    getColumnIndex(columnIndex: number) {
      return (this.getColumn(columnIndex) || {}).data.currentIndex;
    },

    // set column option index by column index
    setColumnIndex(columnIndex: number, optionIndex: number) {
      const column = this.getColumn(columnIndex);

      if (column == null) {
        return Promise.reject(new Error('setColumnIndex: 对应列不存在'));
      }

      return column.setIndex(optionIndex);
    },

    // get options of column by index
    getColumnValues(index: number) {
      return (this.children[index] || {}).data.options;
    },

    // set options of column by index
    setColumnValues(index: number, options: any[], needReset = true) {
      const column = this.children[index];

      if (column == null) {
        return Promise.reject(new Error('setColumnValues: 对应列不存在'));
      }

      const isSame =
        JSON.stringify(column.data.options) === JSON.stringify(options);

      if (isSame) {
        return Promise.resolve();
      }

      return column.set({ options }).then(() => {
        if (needReset) {
          column.setIndex(0);
        }
      });
    },

    // get values of all columns
    getValues() {
      return this.children.map((child) => child.getValue());
    },

    getValuesMap() {
      const map :Record<string, string> = {
        '大于': 'greaterThan',
        '小于': 'lessThan',
        '大于等于': 'greaterThanOrEqualTo',
        '小于等于': 'lessThanOrEqualTo',
        '等于': 'equalTo'
      }
      return map[this.getColumnValue(0)]
    },

    // set values of all columns
    setValues(values: any[]) {
      const stack = values.map((value, index) =>
        this.setColumnValue(index, value)
      );
      return Promise.all(stack);
    },

    // get indexes of all columns
    getIndexes() {
      return this.children.map((child) => child.data.currentIndex);
    },

    // set indexes of all columns
    setIndexes(indexes: number[]) {
      const stack = indexes.map((optionIndex, columnIndex) =>
        this.setColumnIndex(columnIndex, optionIndex)
      );
      return Promise.all(stack);
    },
  },
});