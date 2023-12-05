// package-mine/hoom-manage/index.ts
/* eslint-disable */
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { homeBinding } from '../../store/index'
import Toast from '@vant/weapp/toast/toast'
import QQMapWX from '../../lib/qqmap-wx-jssdk'
import { storage } from '../../utils/storage'

ComponentWithComputed({
  options: {},
  behaviors: [BehaviorWithStore({ storeBindings: [homeBinding] }), pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    key: 'L7HBZ-UZ6EU-7J5VU-BR54O-3ZDG5-6CFIC',
    sig: 'W9RrPrVIxGPyuKEzzS76ktDxvN3zxxyJ',
    searchText: '',
    curLocation: '--',
    indicatorList: [{ name: '选择地区', isSelected: true, cidx: [] }],
    curIndicatorIndex: 0,
    areaList: [] as any[],
    provinceList: [] as any[],
    cityList: [] as any[],
    townList: [] as any[],
    curSearchResult: [] as string[],
    isShowPosition: false,
    curPosition: '',
  },

  computed: {},

  lifetimes: {
    attached: function () {
      this.updateCurLocation()
      this.initCityData()
    },
    moved: function () {},
    detached: function () {},
  },

  methods: {
    updateCurLocation() {
      const houseArea = homeBinding.store.currentHomeDetail.houseArea
      const position = storage.get('position_location', '') as string
      this.setData({
        curLocation: this.data.isShowPosition ? position : houseArea || position,
        curPosition: position,
      })
      if (!position) this.rePosition()
    },
    rePosition() {
      const myQQMapWX = new QQMapWX({
        key: this.data.key,
      })
      const that = this
      wx.getFuzzyLocation({
        type: 'wgs84',
        success(res) {
          const latitude = res.latitude
          const longitude = res.longitude
          myQQMapWX.reverseGeocoder({
            sig: that.data.sig,
            location: {
              latitude: latitude,
              longitude: longitude,
            },
            success: function (res: any) {
              const addr = res.result.address_component
              const result = addr.province + addr.city + addr.district
              that.setData({
                curPosition: result,
              })
              storage.set('position_location', result)
            },
            fail: function () {
              console.log('lmn>>>rePosition::获取地理位置失败')
            },
          })
        },
        fail() {
          console.log('lmn>>>rePosition::微信定位失败')
        },
      })
    },
    onPositionClick() {
      this.setData({
        isShowPosition: true,
      })
      this.updateCurLocation()
      this.changeHomeLocation()
    },
    initCityData() {
      const myQQMapWX = new QQMapWX({
        key: this.data.key,
      })
      const that = this
      myQQMapWX.getCityList({
        sig: this.data.sig,
        success: function (res: any) {
          that.setData({
            provinceList: res.result[0],
            cityList: res.result[1],
            townList: res.result[2],
          })
          that.setProvinceView()
        },
        fail: function (error: any) {
          console.log('lmn>>>getCityList()::error=' + JSON.stringify(error))
        },
      })
    },
    onInputConfirm(event: any) {
      if (event.detail == '') return
      const myQQMapWX = new QQMapWX({
        key: this.data.key,
      })
      const that = this
      myQQMapWX.getSuggestion({
        sig: this.data.sig,
        keyword: event.detail,
        region: event.detail,
        success: function (res: any) {
          //console.log('lmn>>>success=' + JSON.stringify(res));
          const data = res.data
          if (data.length > 0) {
            let result = [] as string[]
            let isFinded = false
            for (let i = 0; i < data.length; i++) {
              result = []
              if (data[i].province) {
                if (result.length > 0) {
                  if (result[result.length - 1] != data[i].province) result.push(data[i].province)
                } else result.push(data[i].province)
                if (data[i].province.indexOf(event.detail) != -1) {
                  isFinded = true
                  break
                }
              }
              if (data[i].city) {
                if (result.length > 0) {
                  if (result[result.length - 1] != data[i].city) result.push(data[i].city)
                } else result.push(data[i].city)
                if (data[i].city.indexOf(event.detail) != -1) {
                  isFinded = true
                  break
                }
              }
              if (data[i].district) {
                if (result.length > 0) {
                  if (result[result.length - 1] != data[i].district) result.push(data[i].district)
                } else result.push(data[i].district)
                if (data[i].district.indexOf(event.detail) != -1) {
                  isFinded = true
                  break
                }
              }
            }
            if (result.length == 0 || isFinded == false) {
              Toast('未找到地区')
              result = []
            }
            that.setData({ curSearchResult: result })
            console.log('lmn>>>' + JSON.stringify(that.data.curSearchResult))
            that.setViewAfterSearch()
          } else {
            Toast('未找到地区')
          }
        },
        fail: function () {
          Toast('搜索失败')
        },
      })
    },
    setViewAfterSearch() {
      const searchList = this.data.curSearchResult
      const list = this.createIndicatorItems()
      if (searchList.length == 1) {
        this.setProvinceView()
        this.setIndicatorItems(0, list)
        this.setCurIndicatorIndex(0)
      } else if (searchList.length == 2) {
        this.setCityView(list[1].cidx)
        this.setIndicatorItems(0, list)
        this.setCurIndicatorIndex(1)
      } else if (searchList.length == 3) {
        this.setTownView(list[2].cidx)
        this.setIndicatorItems(0, list)
        this.setCurIndicatorIndex(2)
      }
    },
    createIndicatorItems() {
      const searchList = this.data.curSearchResult
      if (searchList.length == 0) return []
      else {
        const list: any[] = []
        let cidxTemp = []
        let isEnd = true
        for (let i = 0; i < searchList.length; i++) {
          if (i == 0) {
            for (let j = 0; j < this.data.provinceList.length; j++) {
              if (this.data.provinceList[j].fullname.indexOf(searchList[0]) != -1) {
                list.push({ name: this.data.provinceList[j].fullname, isSelected: false, cidx: [] })
                if (this.data.provinceList[j].cidx) {
                  cidxTemp = this.data.provinceList[j].cidx
                  isEnd = false
                } else {
                  cidxTemp = []
                  isEnd = true
                }
                break
              }
            }
          } else if (i == 1) {
            if (cidxTemp.length == 0) break
            for (let j: number = cidxTemp[0]; j <= cidxTemp[1]; j++) {
              if (this.data.cityList[j].fullname.indexOf(searchList[1]) != -1) {
                list.push({ name: this.data.cityList[j].fullname, isSelected: false, cidx: cidxTemp })
                if (this.data.cityList[j].cidx) {
                  cidxTemp = this.data.cityList[j].cidx
                  isEnd = false
                } else {
                  cidxTemp = []
                  isEnd = true
                }
                break
              }
            }
          } else if (i == 2) {
            if (cidxTemp.length == 0) break
            for (let j: number = cidxTemp[0]; j <= cidxTemp[1]; j++) {
              if (this.data.townList[j].fullname.indexOf(searchList[2]) != -1) {
                list.push({ name: this.data.townList[j].fullname, isSelected: false, cidx: cidxTemp })
                if (this.data.townList[j].cidx) {
                  cidxTemp = this.data.townList[j].cidx
                  isEnd = false
                } else {
                  cidxTemp = []
                  isEnd = true
                }
                break
              }
            }
          }
        }
        if (!isEnd) {
          list.push({ name: '选择地区', isSelected: false, cidx: [] })
        }
        return list
      }
    },
    onIndexClick(data: any) {
      const index = data.currentTarget.dataset.index
      const item = data.currentTarget.dataset.item
      if (index != this.data.curIndicatorIndex) {
        if (index === 0) {
          this.setProvinceView()
        } else if (index === 1) {
          this.setCityView(item.cidx)
        } else if (index === 2) {
          this.setTownView(item.cidx)
        }
      }
      this.setCurIndicatorIndex(index)
    },
    setCurIndicatorIndex(index: number) {
      const list = this.data.indicatorList
      for (let i = 0; i < list.length; i++) {
        if (i === index) list[i].isSelected = true
        else list[i].isSelected = false
      }
      this.setData({
        indicatorList: list,
        curIndicatorIndex: index,
      })
    },
    setIndicatorItems(startIndex: number, itemList: any[]) {
      const list = this.data.indicatorList
      if (startIndex > 2 || itemList.length === 0) return
      const newList = list.slice(0, startIndex).concat(itemList).slice(0, 3)
      if (startIndex < newList.length && startIndex < list.length) newList[startIndex].cidx = list[startIndex].cidx
      this.setData({ indicatorList: newList })
    },
    setProvinceView() {
      this.setData({
        areaList: this.data.provinceList,
      })
    },
    setCityView(cidx: number[]) {
      this.setData({
        areaList: this.data.cityList.slice(cidx[0], cidx[1] + 1),
      })
    },
    setTownView(cidx: number[]) {
      this.setData({
        areaList: this.data.townList.slice(cidx[0], cidx[1] + 1),
      })
    },
    onAreaClick(data: any) {
      const item = data.currentTarget.dataset.item
      if (this.data.curIndicatorIndex === 0) {
        let list
        if (item.cidx !== undefined) {
          list = [
            { name: item.fullname, isSelected: false, cidx: [] },
            { name: '选择地区', isSelected: true, cidx: item.cidx },
          ]
          this.setCityView(item.cidx)
          this.setIndicatorItems(0, list)
          this.setCurIndicatorIndex(1)
        } else {
          list = [{ name: item.fullname, isSelected: false, cidx: [] }]
          this.setIndicatorItems(0, list)
          this.setCurIndicatorIndex(0)
          this.setData({
            isShowPosition: false,
          })
          this.changeHomeLocation()
        }
      } else if (this.data.curIndicatorIndex === 1) {
        let list
        if (item.cidx !== undefined) {
          list = [
            { name: item.fullname, isSelected: false, cidx: [] },
            { name: '选择地区', isSelected: true, cidx: item.cidx },
          ]
          this.setTownView(item.cidx)
          this.setIndicatorItems(1, list)
          this.setCurIndicatorIndex(2)
        } else {
          list = [{ name: item.fullname, isSelected: false, cidx: [] }]
          this.setIndicatorItems(1, list)
          this.setCurIndicatorIndex(1)
          this.setData({
            isShowPosition: false,
          })
          this.changeHomeLocation()
        }
      } else if (this.data.curIndicatorIndex === 2) {
        const list = [{ name: item.fullname, isSelected: false, cidx: [] }]
        this.setIndicatorItems(2, list)
        this.setCurIndicatorIndex(2)
        this.setData({
          isShowPosition: false,
        })
        this.changeHomeLocation()
      }
    },
    changeHomeLocation() {
      let location: string = ''
      if (this.data.isShowPosition) {
        location = this.data.curPosition
      } else {
        this.data.indicatorList.forEach((item) => {
          location += item.name
        })
      }
      if (location == '') return
      homeBinding.store.updateHomeNameOrLocation(undefined, location).then(() => {
        this.updateCurLocation()
      })
    },
  },
})
