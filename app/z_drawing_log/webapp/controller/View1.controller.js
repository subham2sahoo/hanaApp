sap.ui.define([
    "sap/ui/core/mvc/Controller"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller) {
        "use strict";

        var that;
        return Controller.extend("zdrawinglog.controller.View1", {
            onInit: function () {
                that = this;
                var oModel = that.getOwnerComponent().getModel();
                oModel.callFunction("/srv", {
                    method: "GET",
                    urlParameters: {
                        FLAG: "getData",
                    },
                    success: function (res) {
                        that.allData = JSON.parse(res.srv);
                        that.bindData();
                    },
                    error: function () {
                        console.log(error);
                        sap.m.MessageToast.show("Failed To Fetch Data");
                    },
                });


            },

            bindData() {
                var data = that.allData,
                    Keys1 = ["OVAS", "Engineering", "QA"],
                    Keys2 = ["Eng", "Quality", "Mis"],
                    flexBox = that.byId("flexBox"),
                    flexBoxArray = [],
                    panel = that.byId("panelBox"),
                    boxArray = [];
                that.TrackerData = data.TrackerData;
                that.data = data;
                Keys1.forEach(key => {
                    let array, arrayData = [];
                    array = data[key]
                    Object.keys(array).forEach(ele => {
                        const percent = Number(((array[ele] / array.Total) * 100).toFixed(2));
                        arrayData.push({
                            STATUS: ele,
                            VALUE: array[ele],
                            PERCENT: percent ? percent : 0
                        })
                    });
                    flexBoxArray.push({
                        heading: key + " Document Status",
                        child: arrayData
                    })

                })
                flexBox.setModel(new sap.ui.model.json.JSONModel(flexBoxArray));
                flexBox.getItems().forEach(table => {
                    table.getItems()[table.getItems().length - 1].addStyleClass("lastRow");
                })

                Keys2.forEach(key => {
                    let array, filter, filarr = [];
                    array = data[key];
                    filter = array.filter((a) => !a.DOCUMENT_NAME.includes("R-"));
                    filter = filter.sort((a, b) => a.REVISION >b.REVISION ? -1 : 1);
                    for (var k = 0; k < filter.length; k++) {
                        if (filarr.filter(f => f.DOCUMENT_NAME === filter[k].DOCUMENT_NAME).length === 0) {
                            filarr.push(filter[k])
                        }

                    }
                    array = filarr;
                    that.key = key;
                    array = that.defineTable(array);
                    boxArray.push({
                        headerText: key,
                        child: array,
                        data: data[key]
                    })
                })
                panel.setModel(new sap.ui.model.json.JSONModel(boxArray));
                panel.getItems()[0].getContent()[0].getItems()
                panel.getItems().forEach(panel => {
                    panel.getContent()[0].getItems().forEach(item => {
                        const cssClass = item.getBindingContext().getObject().ICONCLASS;
                        if (cssClass) {
                            item.getCells()[8].addStyleClass(cssClass);
                        }
                    })
                })
            },

            defineTable: function (array) {
                for (let i = 0; i < array.length; i++) {
                    let TrackerDataObject = that.TrackerData.find(obj =>
                        obj.PROJECT === array[i].PROJECT && obj.TRANSMITTAL_ID === array[i].TRANSMITTAL_ID && obj.DOC_NAME === array[i].DOCUMENT_NAME &&
                        (obj.STATUS === "Complete" || obj.STATUS === "Open")
                    )
                    if (TrackerDataObject) {
                        array[i].RETURN_DATE = new Date(TrackerDataObject.ST_UPDATED)
                    } else {
                        array[i].RETURN_DATE = null;
                    }
                    const expected_Return_Date = array[i].EXPECTED_RETURN_DATE;
                    if (expected_Return_Date && array[i].RETURN_DATE) {
                        array[i].DUEDATE = that.dateDiff(expected_Return_Date, array[i].RETURN_DATE)
                    } else {
                        array[i].DUEDATE = that.dateDiff(expected_Return_Date, new Date())
                    }
                    if (array[i].DUEDATE < 0) {
                        array[i].SYMBOL = "sap-icon://circle-task-2" //red
                        array[i].ICONCLASS = "red"
                    } else if (array[i].DUEDATE >= 0 && array[i].DUEDATE <= 3) {
                        array[i].SYMBOL = "sap-icon://circle-task-2" //yellow
                        array[i].ICONCLASS = "yellow"
                    } else if (array[i].DUEDATE > 3) {
                        array[i].SYMBOL = "sap-icon://circle-task-2" //green
                        array[i].ICONCLASS = "green"
                    }
                    if (array[i].STATUS === "Approved" || array[i].STATUS === "Returned with Comments" || array[i].STATUS === "For Information" ||
                        array[i].STATUS === "") {
                        array[i].SYMBOL = "sap-icon://sys-enter-2" //green
                        array[i].ICONCLASS = "green"
                    }
                    array[i].EXPECTED_RETURN_DATE = new Date(expected_Return_Date)
                    array[i].CREATED_DATETIME = new Date(array[i].CREATED_DATETIME)

                }
                return array;

            },
            dateDiff: function (date1, date2) {
                let dateDiff = new Date(date1).getTime() - new Date(date2).getTime();
                return Math.ceil(dateDiff / (1000 * 3600 * 24));
            },

            onPressRow: function (oEvent) {

                if (!this._nameFragment) {
                    this._nameFragment = sap.ui.xmlfragment(
                        "zdrawinglog.view.details",
                        this
                    );
                    this.getView().addDependent(this._nameFragment);
                }

                this._nameFragment.open();
                var object = oEvent.getParameter('listItem').getBindingContext().getObject(),
                    DOCUMENT_NAME = object.DOCUMENT_NAME,
                    allData = oEvent.getParameter('listItem').getParent().getBindingContext().getObject().data,
                    allDocData = allData.filter(o => o.DOCUMENT_NAME === DOCUMENT_NAME),
                    parent = oEvent.getParameter('listItems')[0].getParent();
                allDocData = allDocData.sort((a, b) => new Date(a.CREATED_DATETIME) - new Date(b.CREATED_DATETIME));
                const array = that.defineTable(allDocData),
                    table = sap.ui.getCore().byId("detailsTable");
                const items = {
                    items: array,
                    parentTable: parent
                };
                table.setModel(new sap.ui.model.json.JSONModel(items));
                table.getItems().forEach(item => {
                    const cssClass = item.getBindingContext().getObject().ICONCLASS;
                    if (cssClass) {
                        item.getCells()[8].addStyleClass(cssClass);
                    }
                })

            },

            onCloseOption: function () {
                const table = sap.ui.getCore().byId("detailsTable");
                const parentTable = table.getModel().getData().parentTable;
                parentTable.removeSelections();
                table.setModel(new sap.ui.model.json.JSONModel({}));
                sap.ui.getCore().byId("dialog").close();
            },

        });
    });