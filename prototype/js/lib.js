var autostart = true;

window.lib = (new class{

    constructor(){
        let _this = this;

       

        this.settings = {
            datasets: ["cars.csv", "wine.csv"],
            currentDataset: "wine.csv",
            blockOperator: "AND",
            selectorOperator: "OR",
            activeDomainFeedback: false,
            
            coverageFeedback: true,
            arrowsFeedback: true,
            tooltipFeedback: true,
            
            uniformSelector: true,
            boxplotSelector: true,
            uniformIntervalsNumber: 6,
            metrics: [],
            defaultMetricsLen: 4,
            slider: true,
            intervalsSelected: [],
            settingsIcon: true
        }

        this.values = [];

        this.constants = {
            selectorOffsets: {
                left: 20,
                right: 20,
                top: 0,
                bottom: 0
            },

            selectorBlockMaxWidth: 300,
           

            intervalHeight: 30,
            activeDomainHeight: 10,
            tickHeight: 5,
            valueHeight: 8,
            boxplotWiskerHeightRatio: 0.65,

            scatterplotPointSize: 3,
            activeDomainColors: colorbrewer.Greens[9].reverse(),
            
            outlierPointSize: 1

        }

        this.dataset = null;
        
        if(autostart){
            $(function(){
                _this.start();

            });
        }   
    }

    roundFloat(x){ //round 2 decimal points
        if(Number.isInteger(x)) return x;
        let y = Math.round(x*10)/10;
        //if(y >= 10) y = Math.round(y);
        return y;
    }

    start(settings, reloadDataset = true){
        let _this = this;
        
        if(settings != undefined) d3.entries(settings).forEach(function(s){
            _this.settings[s.key] = s.value;
        });

        

        $(function(){
       
        
        d3.select("#settings").style("display", function(){
            if(_this.settings.settingsIcon) return null;
            else return "none";
        })
        
        if(reloadDataset){
            
            d3.csv("dataset/" + _this.settings.currentDataset, function(values){
                console.log(_this.settings.currentDataset, values)
                _this.values = values;
                _this.dataset = new Dataset(JSON.parse(JSON.stringify(_this.values)));
                
                d3.select("#settings").on("click", function(){
                    _this.showSettings();
                });
        
                d3.select("#deselect-all").on("click", function(){
                    _this.dataset.deselectAll();
                    Stein.event = d3.event;
                });
    
                _this.createViews();
                if(Stein) Stein.systemLoaded();
            });
        }
        else{
            _this.dataset = new Dataset(JSON.parse(JSON.stringify(_this.values)));
                
            d3.select("#settings").on("click", function(){
                _this.showSettings();
            });
        
            d3.select("#deselect-all").on("click", function(){
                _this.dataset.deselectAll();
                Stein.event = d3.event;
            });
            _this.createViews();
        }
    });  
    }

    createViews(){
        let _this = this;

        d3.select("#selector-blocks-container").selectAll("*").remove();
        d3.select("#chart-panel").selectAll("*").remove();

        let w = parseInt(d3.select("#selector-blocks-container").node().getBoundingClientRect().width/_this.dataset.selectorBlocks.length) - 38;
        
        _this.dataset.selectorBlocks.forEach(function(b, i){
            let isLast = (i == _this.dataset.selectorBlocks.length -1);
            _this.createSelectorBlock(b, w - 20);
            if(!isLast) _this.appendBlocksOperatorLabel();
        });
        _this.createScatterplot();

        if(_this.settings.tooltipFeedback){
            
            $('[data-toggle="tooltip"]').tooltip({
                'delay': { show: 500, hide: 0 }
            });
            $('[data-toggle="tooltip"]').on('shown.bs.tooltip', function (event) {
                Stein.event = event;
                
              })
        }
    }


    createSelectorBlock(selectorBlock, width= 250){
        let _this = this;
        
        let block = d3.select("#selector-blocks-container")
            //.append("div").attr("class", "col-2")
            .append("div").attr("class", "selector-block")
            .attr("id", selectorBlock.id)
            .style("width", width + "px")
            //.style("float", "left")
        
        block.append("div").attr("class", "selector-block-title")
            .append("span").text(selectorBlock.property)
            .select(function(){ return this.parentNode})
            .append("span").attr("class", "undo")
            .html("&nbsp;&nbsp;<small><i class='fa fa-undo'></i></small>")
            .on("click", function(){
                if(!_this.settings.uniformSelector) return;
                _this.dataset.resetBargram(selectorBlock.selectors.bargram);
                _this.appendBargramSelector(blockBody, selectorBlock.selectors.bargram);
            })
            
            /*
            .select(function(){ return this.parentNode})
            .append("span").attr("class", "edit-block")
            .style("display", function(){ if(_this.config.showButtonRemovelock) return null; return "none"})
            .on("click", function(){ _this.editBlock(selectorBlock)})
            .append("i").attr("class", "fas fa-cog")
            */
            
        

        let blockBody = block.append("div").attr("class", "selector-block-body");
        
        

        if(_this.settings.uniformSelector) _this.appendBargramSelector(blockBody, selectorBlock.selectors.bargram);
        
        if(_this.settings.activeDomainFeedback) _this.appendActiveDomain(blockBody, selectorBlock);

        
        

        if(_this.settings.boxplotSelector)_this.appendBoxplotSelector(blockBody, selectorBlock.selectors.boxplot);

        
  
    }

    appendBlocksOperatorLabel(){
        let _this = this;

        d3.select("#selector-blocks-container")
        .append("div")//.attr("class", "badge badge-pill badge-primary")
        .style("font-size", "16px")
            .html( "&nbsp;" + _this.settings.blockOperator + "&nbsp;")
    }


    appendBlocksOperatorLabel_symbol(){
        let _this = this;

        d3.select("#selector-blocks-container")
        .append("div").attr("class", "badge badge-pill badge-primary")
        .style("font-size", "16px")
            .html( function(){
                if(_this.settings.blockOperator == "AND") return "&nbsp;\u22c0&nbsp;"; //22c2 //22c0
                if(_this.settings.blockOperator == "OR")  return "&nbsp;\u22c1&nbsp;"; //22c3 //22c1
            })
    }

    appendInsideBlockOperatorLabel(blockBody){
        let _this = this;

        blockBody.append("div").attr("class", "selector-block-operation")
        .append("div").attr("class", "badge badge-pill badge-primary")
        .style("background", "darkgray")
        .style("color", "black")
        .style("font-size", "16px")
            .html( function(){
                if(_this.settings.selectorOperator == "AND") return "&nbsp;\u22c0&nbsp;"; //22c2
                if(_this.settings.selectorOperator == "OR") return "&nbsp;\u22c1&nbsp;"; //22c3
            })
    }


    appendBargramSelector(selectorBlockBody, selector){
        let _this = this;
        
        let t = _this.constants.selectorOffsets.top;
        let l = _this.constants.selectorOffsets.left;
        let r = _this.constants.selectorOffsets.right;
        let w = selectorBlockBody.node().getBoundingClientRect().width - l - r;
        let xScale = d3.scaleLinear().domain(selector.domain).range([l, w + l]).interpolate(d3.interpolateRound);
        

        let intervals = selector.intervals;
        
        for(var i=0; i<intervals.length; i++){
            intervals[i].x = xScale(intervals[i].min);
            intervals[i].dx = xScale(intervals[i].max) - xScale(intervals[i].min) + 1;
        }

        let selectorDiv = selectorBlockBody.select("#" + selector.id);
        if(selectorDiv.empty()){
            selectorDiv = selectorBlockBody.append("div").attr("class", "selector bargram")
                .attr("id", selector.id)
                .classed("coverage-feedback", _this.settings.coverageFeedback)
                .on("change", function(){
                    d3.select(this).classed("coverage-feedback", _this.settings.coverageFeedback);
                });
        }
        else{
            selectorDiv.selectAll("*").remove();
        }

        /*
        let selectorDiv = selectorBlockBody.append("div").attr("class", "selector bargram")
            .attr("id", selector.id)
            .classed("coverage-feedback", _this.settings.coverageFeedback)
            .on("change", function(){
                d3.select(this).classed("coverage-feedback", _this.settings.coverageFeedback);
            });
        */

        selectorDiv.append("div").attr("class", "arrows-container")
            .style("display", function(){
                if(_this.settings.arrowsFeedback) return null;
                else return "none";
            })
            .style("height", 20 + "px")
            .selectAll(".arrow")
            .data(intervals)
            .enter()
            .append("div").attr("class", "arrow")
            .attr("id", function(d){ return "arrow-" + d.id})
            .classed("arrow-up", function(d){ return d.delta > 0;})
            .classed("arrow-down", function(d){ return d.delta < 0;})
            .classed("arrow-none", function(d){ return d.delta == 0;})
            .style("top", t + "px")
            .style("left", function(d, i){ return d.x + "px" })
            .style("width", function(d){ return d.dx + "px" }) //1 is the size of normal border
            .style("height", 20 + "px")
            .append("i")
            .attr("class", function(d){
                if(d.delta > 0) return "fas fa-caret-up";
                else return "fas fa-caret-down";
            });

        selectorDiv.append("div").attr("class", "intervals-container")
            .style("height", (t + _this.constants.intervalHeight) + "px")
            .selectAll(".interval")
            .data(intervals)
            .enter()
            .append("div").attr("class", "interval")
            .each(function(d){
                d3.select(this).classed("empty", d.empty);
                d3.select(this).classed("selected", d.selected);
                d3.select(this).classed("no-coverage", d.noCoverage);
                d3.select(this).classed("partial-coverage", d.partialCoverage);
                d3.select(this).classed("total-coverage", d.totalCoverage);
            })
            .attr("id", function(d){ return d.id;})
            .style("top", t + "px")
            .style("left", function(d, i){ return d.x + "px" })
            .style("width", function(d){ return d.dx + "px" }) //1 is the size of normal border
            .style("height", _this.constants.intervalHeight + "px")
            .on("click", function(d){
                //if(d.empty) return;
                if(!d.selected) _this.dataset.selectInterval(d);
                else _this.dataset.deselectInterval(d);
                Stein.event = d3.event;
            })
            .on("tooltip", function(d){
                Stein.event = d3.event;
            })
            .on("update", function(d){
                d3.select(this).classed("empty", d.empty);
                d3.select(this).classed("selected", d.selected);
                d3.select(this).classed("no-coverage", d.noCoverage);
                d3.select(this).classed("partial-coverage", d.partialCoverage);
                d3.select(this).classed("total-coverage", d.totalCoverage);

                if(_this.settings.tooltipFeedback) d3.select(this).attr("data-original-title", function(d){
                    if(d.delta > 0) return "+" + d.delta;
                    if(d.delta == 0) return "\u00B1" + d.delta;
                    return d.delta;
                });

                selectorDiv.select("#arrow-" + d.id)
                    .classed("arrow-up", function(d){ return d.delta > 0;})
                    .classed("arrow-down", function(d){ return d.delta < 0;})
                    .classed("arrow-none", function(d){ return d.delta == 0;})
                    .selectAll("*").remove();
                selectorDiv.select("#arrow-" + d.id).append("i")
                    .attr("class", function(d){
                        if(d.delta > 0) return "fas fa-caret-up";
                        else return "fas fa-caret-down";
                    });
            })
            .each(function(d){
                if(!_this.settings.tooltipFeedback) return;
                d3.select(this).attr("data-toggle", "tooltip")
                .attr("data-placement", "top")
                .attr("title", function(d){ 
                    if(d.delta > 0) return "+" + d.delta;
                    if(d.delta == 0) return "\u00B1" + d.delta;
                    return d.delta
                });
            });

           

        selectorDiv.append("div").attr("class", "ticks-container")
            .style("height", _this.constants.tickHeight + "px")
            .selectAll(".tick")
            .data(intervals.concat({min: intervals[intervals.length-1].max}))
            .enter()
            .append("div").attr("class", "tick")
            .style("left", function(d, i){ return xScale(d.min) + "px" })
            .style("width", "1px")
            .style("height", _this.constants.tickHeight + "px");

        selectorDiv.append("div").attr("class", "values-container")
            .style("height", _this.constants.valueHeight + "px")
            .selectAll(".value")
            .data(intervals.concat({min: intervals[intervals.length-1].max}))
            .enter()
            .append("div").attr("class", "value")
            .classed("slider", _this.settings.slider)
            .style("font-size", _this.constants.valueHeight + "px")
            .style("top", function(d, i){ return ((i%2)*_this.constants.valueHeight) + "px" })
            .style("left", function(d, i){ return xScale(d.min) + "px" })
            //.style("width", function(d){ return (xScale(d.max) - xScale(d.min)) + "px" })
            .style("height", _this.constants.valueHeight + "px")
            .text(function(d){ return _this.roundFloat(d.min);})
            .each(function(d, i){
                let el = d3.select(this);
                let w = xScale(d.min) - parseInt(el.node().getBoundingClientRect().width/2);
                el.style("left", w + "px");

                


            })
            .each(function(d, i){
                if(i== 0 || i == intervals.length) return;

                let el = d3.select(this);

                let leftInterval = intervals[d.index - 1];
                let rightInterval = d;
                let leftIntervalElement = d3.select("#" + leftInterval.id);
                let rightIntervalElement = d3.select("#" + d.id);

                let minDistance = 10;
                
                
                var drag = d3.drag()
                    .on("drag", function() {
                        let z = d3.event.dx;

                        let ldx = leftInterval.dx + z;
                        let rdx = rightInterval.dx - z;
                        if(ldx <= minDistance || rdx <= minDistance) return;

                        leftInterval.dx += z;
                        rightInterval.x += z;
                        rightInterval.dx -= z;

                        leftInterval.max =  rightInterval.min = xScale.invert(rightInterval.x);
                        
                        el.style("left", d.x + "px")
                            .text(_this.roundFloat(xScale.invert(d.x)));
                        leftIntervalElement
                            .style("left", function(a){ return a.x + "px"})
                            .style("width", function(a){ return a.dx + "px"});
                        rightIntervalElement
                            .style("left", function(a){ return a.x + "px"})
                            .style("width", function(a){ return a.dx + "px"});

                        _this.appendBargramSelector(selectorBlockBody, selector);
                        if(_this.settings.tooltipFeedback){
                            $('[data-toggle="tooltip"]').tooltip({
                                'delay': { show: 500, hide: 0 }
                            });
                            $('[data-toggle="tooltip"]').on('shown.bs.tooltip', function (event) {
                                Stein.event = d3.event;
                              })
                        } 
                        _this.dataset.intervalChanged(selector);

                        
                    })
                    .on("end", function(d){
                        /*_this.appendBargramSelector(selectorBlockBody, selector);
                        if(_this.settings.tooltipFeedback) $('[data-toggle="tooltip"]').tooltip();
                        _this.dataset.intervalChanged(selector);*/
                        Stein.event = d3.event;
                    })
                    

                el.call(drag)
            })

        return selectorDiv;
        
    }


    appendBoxplotSelector(selectorBlockBody, selector){
        let _this = this;
        let t = _this.constants.selectorOffsets.top;
        let l = _this.constants.selectorOffsets.left;
        let r = _this.constants.selectorOffsets.right;
        let w = selectorBlockBody.node().getBoundingClientRect().width - l - r;
        let xScale = d3.scaleLinear().domain(selector.domain).range([l, w + l]).interpolate(d3.interpolateRound);

        let wiskerHeight = parseInt(_this.constants.boxplotWiskerHeightRatio * _this.constants.intervalHeight);

        let intervals = selector.intervals;


        let selectorDiv = selectorBlockBody.append("div").attr("class", "selector boxplot")
            .attr("id", selector.id)
            .classed("coverage-feedback", _this.settings.coverageFeedback)
            .on("change", function(){
                d3.select(this).classed("coverage-feedback", _this.settings.coverageFeedback);
            });

        
        selectorDiv.append("div").attr("class", "arrows-container")
            .style("display", function(){
                if(_this.settings.arrowsFeedback) return null;
                else return "none";
            })
            .style("height", 20 + "px")
            .selectAll(".arrow")
            .data(intervals)
            .enter()
            .append("div").attr("class", "arrow")
            .attr("id", function(d){ return "arrow-" + d.id})
            .classed("arrow-up", function(d){ return d.delta > 0;})
            .classed("arrow-down", function(d){ return d.delta < 0;})
            .classed("arrow-none", function(d){ return d.delta == 0;})
            .style("top", t + "px")
            .style("left", function(d, i){ return xScale(d.min) + "px" })
            .style("width", function(d){ return (xScale(d.max) - xScale(d.min) + 1) + "px" }) //1 is the size of normal border
            .style("height", 20 + "px")
            .append("i")
            .attr("class", function(d){
                if(d.delta > 0) return "fas fa-caret-up";
                else return "fas fa-caret-down";
            });

        let intervalsContainer = selectorDiv.append("div").attr("class", "intervals-container")
            .style("height", (t + _this.constants.intervalHeight) + "px");
  

        //quartile-box
        intervalsContainer.selectAll(".quartile-box")
            .data(intervals)
            .enter()
            .filter(function(d,i){ return [2,3].includes(i)})
            .append("div").attr("class", "quartile-box")
            .style("top", t + "px")
            .style("left", function(d, i){ return xScale(d.min) + "px" })
            .style("width", function(d){ return (xScale(d.max) - xScale(d.min) + 1) + "px" }) //1 is the size of normal border
            .style("height", _this.constants.intervalHeight + "px");

        //outliers
        intervalsContainer.selectAll(".outlier-svg")
            .data(intervals)
            .enter()
            .filter(function(d,i){ return [0,5].includes(i)})
            .append("svg").attr("class", "outlier-svg")
            .style("top", t + "px")
            .style("left", function(d, i){ return xScale(d.min) + "px" })
            .style("width", function(d){ return (xScale(d.max) - xScale(d.min) + 1) + "px" }) //1 is the size of normal border
            .style("height", _this.constants.intervalHeight + "px")
            .each(function(interval){
                let w = d3.select(this).style("width").replace("px", "") - _this.constants.outlierPointSize;
                let xScaleSvg = d3.scaleLinear().domain([interval.min,interval.max]).range([0, w]);
                let yScaleSvg = d3.scaleLinear().domain([0,1]).range([(_this.constants.intervalHeight - wiskerHeight)/2, (_this.constants.intervalHeight - wiskerHeight)/2 + wiskerHeight]);
                d3.select(this).selectAll(".outlier")
                    .data(interval.values)
                    .enter()
                    .append("circle")
                    .attr("class", "outlier")
                    .attr("cx", function(d){
                        return parseInt(xScaleSvg(d[interval.property]));
                    })
                    .attr("cy", function(d){
                        return parseInt(yScaleSvg(Math.random()))
                    })
                    .attr("r", function(d){
                        return _this.constants.outlierPointSize;
                    })
            })
        

        

        intervalsContainer.selectAll(".interval")
            .data(intervals)
            .enter()
            .append("div")
            .attr("class", function(d,i){
                return "interval boxplot-interval b" + i;
            })
            .each(function(d){
                d3.select(this).classed("empty", d.empty);
                d3.select(this).classed("selected", d.selected);
                d3.select(this).classed("no-coverage", d.noCoverage);
                d3.select(this).classed("partial-coverage", d.partialCoverage);
                d3.select(this).classed("total-coverage", d.totalCoverage);
            })
            .attr("id", function(d){ return d.id})
            .style("top", t + "px")
            .style("left", function(d){ return xScale(d.min) + "px" })
            .style("width", function(d){ return (xScale(d.max) - xScale(d.min) + 1) + "px" }) //1 is the size of normal border
            .style("height", _this.constants.intervalHeight + "px")
            .on("click", function(d){
                //if(d.empty) return;
                if(!d.selected) _this.dataset.selectInterval(d);
                else _this.dataset.deselectInterval(d); 
                Stein.event = d3.event;
            })
            .on("update", function(d){
                d3.select(this).classed("empty", d.empty);
                d3.select(this).classed("selected", d.selected);
                d3.select(this).classed("no-coverage", d.noCoverage);
                d3.select(this).classed("partial-coverage", d.partialCoverage);
                d3.select(this).classed("total-coverage", d.totalCoverage);

                if(_this.settings.tooltipFeedback) d3.select(this).attr("data-original-title", function(d){
                    if(d.delta > 0) return "+" + d.delta;
                    if(d.delta == 0) return "\u00B1" + d.delta;
                    return d.delta;
                });

                selectorDiv.select("#arrow-" + d.id)
                    .classed("arrow-up", function(d){ return d.delta > 0;})
                    .classed("arrow-down", function(d){ return d.delta < 0;})
                    .classed("arrow-none", function(d){ return d.delta == 0;})
                    .selectAll("*").remove();
                selectorDiv.select("#arrow-" + d.id).append("i")
                    .attr("class", function(d){
                        if(d.delta > 0) return "fas fa-caret-up";
                        else return "fas fa-caret-down";
                    });
            })
            .each(function(d){
                if(!_this.settings.tooltipFeedback) return;
                d3.select(this).attr("data-toggle", "tooltip")
                .attr("data-placement", "top")
                .attr("title", function(d){ 
                    if(d.delta > 0) return "+" + d.delta;
                    if(d.delta == 0) return "\u00B1" + d.delta;
                    return d.delta
                });
            });

        //wiskers
        intervalsContainer.selectAll(".wisker")
            .data(intervals.concat({min: intervals[intervals.length-1].max}))
            .enter()
            .filter(function(d,i){ return [1,5].includes(i)})
            .append("div").attr("class", "wisker")
            .style("top", function(d){
                return parseInt((_this.constants.intervalHeight - wiskerHeight)/2)+ "px";
            })
            .style("left", function(d){ return xScale(d.min) + "px" })
            .style("height", wiskerHeight + "px");
        
        //hline
        intervalsContainer.selectAll(".hline")
            .data(intervals)
            .enter()
            .filter(function(d,i){ return [1,4].includes(i)})
            .append("div").attr("class", "hline")
            .style("left", function(d){ return xScale(d.min) + "px" })
            .style("width", function(d, i){return (xScale(d.max) - xScale(d.min)) + "px";})
            .each(function(d){
                let el = d3.select(this);
                let h = parseInt((_this.constants.intervalHeight - el.node().getBoundingClientRect().height)/2);
                el.style("top", h + "px");
            });

        //median
        intervalsContainer.selectAll(".median")
            .data(intervals)
            .enter()
            .filter(function(d,i){ return [3].includes(i)})
            .append("div").attr("class", "median")
            .style("top", t + "px")
            .style("left", function(d){ return xScale(d.min) + "px" })
            .style("height", _this.constants.intervalHeight + "px")
            //.style("width", function(d, i){return (xScale(d.max) - xScale(d.min)) + "px";})
            .each(function(d){
                let el = d3.select(this);
                let h = xScale(d.min) - parseInt(el.node().getBoundingClientRect().width/2);
                el.style("left", h + "px");
            });

        //ticks
        selectorDiv.append("div").attr("class", "ticks-container")
            .style("height", _this.constants.tickHeight + "px")
            .selectAll(".tick")
            .data(intervals.concat({min: intervals[intervals.length-1].max}))
            .enter()
            .append("div").attr("class", "tick")
            .style("left", function(d, i){ return xScale(d.min) + "px" })
            .style("width", "1px")
            .style("height", _this.constants.tickHeight + "px");
        
            //values
        selectorDiv.append("div").attr("class", "values-container")
            .style("height", _this.constants.valueHeight + "px")
            .selectAll(".value")
            .data(intervals.concat({min: intervals[intervals.length-1].max}))
            .enter()
            .append("div").attr("class", "value")
            .style("font-size", _this.constants.valueHeight + "px")
            .style("left", function(d, i){ return xScale(d.min) + "px" })
            .style("top", function(d, i){ return ((i%2)*_this.constants.valueHeight) + "px" })
            //.style("width", function(d){ return (xScale(d.max) - xScale(d.min)) + "px" })
            .style("height", _this.constants.valueHeight + "px")
            .text(function(d,i){ 
                if(d.empty != undefined){
                    if(i == 0 && d.empty) return "";
                    else if(i == 5 && d.empty) return "";
                    else return _this.roundFloat(d.min);
                }
                if(i == 6 && intervals[5].empty) return "aaa";
                else return _this.roundFloat(d.min);
            })
            .each(function(d){
                let el = d3.select(this);
                let w = xScale(d.min) - parseInt(el.node().getBoundingClientRect().width/2);
                el.style("left", w + "px");
            });

        return selectorDiv;
        
    }

    appendActiveDomain(selectorBlockBody, selectorBlock){
        let _this = this;
        let t = _this.constants.selectorOffsets.top;
        let l = _this.constants.selectorOffsets.left;
        let r = _this.constants.selectorOffsets.right;
        let w = selectorBlockBody.node().getBoundingClientRect().width - l - r;
        let xScale = d3.scaleLinear().domain(selectorBlock.domain).range([l, w + l]).interpolate(d3.interpolateRound);

        let values = {};

        
        selectorBlock.datasetValues.forEach(function(v){
            let x = xScale(v[selectorBlock.property]);
            if(!(values.hasOwnProperty(x))){
                values[x] = {
                    x: x,
                    elements: 0
                };
            }
            values[x].elements++;
        });
        
        values = d3.values(values);

        let colorScale = d3.scaleQuantize()
            .domain(d3.extent(values, function(v){ return v.elements;}))
            .range(_this.constants.activeDomainColors);
        
        let svg = selectorBlockBody.append("div").attr("class", "active-domain")
            .append("svg")
            .attr("height", (t + _this.constants.activeDomainHeight) + "px")
            .attr("width", (selectorBlockBody.node().getBoundingClientRect().width) + "px")
            .selectAll("rect")
            .data(values)
            .enter()
            .append("rect")
            .attr("x", function(d, i){ return d.x})
            .attr("y", t)
            .attr("width", 1)
            .attr("height", _this.constants.activeDomainHeight)
            .attr("fill", function(d){ return colorScale(d.elements)});
    }


    createScatterplot(){
        let _this = this;
        
        d3.select("#chart-panel").selectAll("*").remove();
        let div = d3.select("#chart-panel");

        var margin = {top: 50, right: 50, bottom: 50, left: 50}
        , width = div.node().getBoundingClientRect().width - margin.left - margin.right
        , height = div.node().getBoundingClientRect().height - margin.top - margin.bottom;

        var x = d3.scaleLinear()
            .domain(d3.extent(_this.dataset.values, function(d) { return d.x; }))
            .range([0, width]);

        var y = d3.scaleLinear()
            .domain(d3.extent(_this.dataset.values, function(d) { return d.y; }))
            .range([height, 0]);

        console.log("Extent x", d3.extent(_this.dataset.values, function(d) { return d.x; }))
        console.log("Extent y", d3.extent(_this.dataset.values, function(d) { return d.y; }))

        // append the svg obgect to the body of the page
        // appends a 'group' element to 'svg'
        // moves the 'group' element to the top left margin
        var svg = div.append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");


        // Add the scatterplot
        svg.selectAll("scatter-point")
            .data(_this.dataset.values)
            .enter()
            .append("circle")
            .attr("id", function(d) { return d._id; })
            .attr("class", "scatter-point")
            .classed("selected", function(d){ return d._selected})
            .attr("r", _this.constants.scatterplotPointSize)
            .attr("cx", function(d) { return x(d.x); })
            .attr("cy", function(d) { return y(d.y); })
            .each(function(d){
                let v = d3.entries(d).filter(el => {
                    return !el.key.startsWith("_") //|| el.key != "x" || el.key != "y"
                }).map(el => `<small><b>${el.key}</b>: ${el.value}</small>`).join("<br>")
                tippy(this, {
                    content: v,
                    allowHTML: true,
                })
            })
            /*.on("change", function(d){
                d3.select(this).classed("selected", function(d){ return d._selected})
            });*/

        // Add the X Axis
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .attr("class", "axis")
            .call(d3.axisBottom(x));
            
        svg.append("text")
    	    .attr("class","axis-label" )         
            .attr("transform",
                "translate(" + (width/2) + " ," + 
                           (height + 20) + ")")
        .style("text-anchor", "middle")
        .text("X");

        // Add the Y Axis
        svg.append("g")
        .attr("class", "axis")
            .call(d3.axisLeft(y));
            
            svg.append("text")
            .attr("class","axis-label" )   
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x",0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Y");
    }


    createScatterplotBrush(){
        let _this = this;
        
        d3.select("#chart-panel").selectAll("*").remove();
        let div = d3.select("#chart-panel");

        var margin = {top: 50, right: 50, bottom: 50, left: 50}
        , width = div.node().getBoundingClientRect().width - margin.left - margin.right
        , height = div.node().getBoundingClientRect().height - margin.top - margin.bottom;

        var x = d3.scaleLinear()
            .domain(d3.extent(_this.dataset.values, function(d) { return d.x; }))
            .range([0, width]);

        
        
        var y = d3.scaleLinear()
            .domain(d3.extent(_this.dataset.values, function(d) { return d.y; }))
            .range([height, 0]);


        // append the svg obgect to the body of the page
        // appends a 'group' element to 'svg'
        // moves the 'group' element to the top left margin
        var svg = div.append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");


        // Add the scatterplot
        svg.selectAll("scatter-point")
            .data(_this.dataset.values)
            .enter()
            .append("circle")
            .attr("id", function(d) { return d._id; })
            .attr("class", "scatter-point")
            .classed("selected", function(d){ return d._selected})
            .attr("r", _this.constants.scatterplotPointSize)
            .attr("cx", function(d) { return x(d.x); })
            .attr("cy", function(d) { return y(d.y); })
            /*.on("change", function(d){
                d3.select(this).classed("selected", function(d){ return d._selected})
            });*/

        // Add the X Axis
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));

        // Add the Y Axis
        svg.append("g")
            .call(d3.axisLeft(y));


        // We initially generate a SVG group to keep our brushes' DOM elements in:
        var gBrushes = svg.append('g')
        .attr("class", "brushes");

        // We also keep the actual d3-brush functions and their IDs in a list:
        var brushes = [];

        /* CREATE NEW BRUSH
        *
        * This creates a new brush. A brush is both a function (in our array) and a set of predefined DOM elements
        * Brushes also have selections. While the selection are empty (i.e. a suer hasn't yet dragged)
        * the brushes are invisible. We will add an initial brush when this viz starts. (see end of file)
        * Now imagine the user clicked, moved the mouse, and let go. They just gave a selection to the initial brush.
        * We now want to create a new brush.
        * However, imagine the user had simply dragged an existing brush--in that case we would not want to create a new one.
        * We will use the selection of a brush in brushend() to differentiate these cases.
        */
        function newBrush() {
        var brush = d3.brush()
            .on("start", brushstart)
            .on("brush", brushed)
            .on("end", brushend);

        brushes.push({id: brushes.length, brush: brush});

        function brushstart(d) {
            // your stuff here
        };

        function brushed(d) {
            // your stuff here
            let x0 =  x.invert(d3.event.selection[0][0]);
            let x1 = x.invert(d3.event.selection[1][0]);
            let y0 = y.invert(d3.event.selection[0][1]);
            let y1 = y.invert(d3.event.selection[1][1]);

            _this.dataset.addBrushInterval(d.id, x0, x1, y0, y1);
        }

        function brushend() {

            // Figure out if our latest brush has a selection
            var lastBrushID = brushes[brushes.length - 1].id;
            var lastBrush = document.getElementById('brush-' + lastBrushID);
            var selection = d3.brushSelection(lastBrush);

            // If it does, that means we need another one
            if (selection && selection[0] !== selection[1]) {
            newBrush();
            }

            // Always draw brushes
            drawBrushes();
        }
        }

        function drawBrushes() {

        var brushSelection = gBrushes
            .selectAll('.brush')
            .data(brushes, function (d){return d.id});

            // Set up new brushes
        brushSelection.enter()
            .insert("g", '.brush')
            .attr('class', 'brush')
            .attr('id', function(brush){ return "brush-" + brush.id; })
            .each(function(brushObject) {
            //call the brush
            brushObject.brush(d3.select(this));
            });

            /* REMOVE POINTER EVENTS ON BRUSH OVERLAYS
            *
            * This part is abbit tricky and requires knowledge of how brushes are implemented.
            * They register pointer events on a .overlay rectangle within them.
            * For existing brushes, make sure we disable their pointer events on their overlay.
            * This frees the overlay for the most current (as of yet with an empty selection) brush to listen for click and drag events
            * The moving and resizing is done with other parts of the brush, so that will still work.
            */
        brushSelection
            .each(function (brushObject){
            d3.select(this)
                .attr('class', 'brush')
                .selectAll('.overlay')
                .style('pointer-events', function() {
                var brush = brushObject.brush;
                if (brushObject.id === brushes.length-1 && brush !== undefined) {
                    return 'all';
                } else {
                    return 'none';
                }
                });
            })

        brushSelection.exit()
            .remove();
        }

        newBrush();
        drawBrushes();

    }

    updateScatterplot(){
        let _this = this;
        d3.selectAll(".scatter-point").classed("selected", function(d){ return d._selected});
    }

    editBlock(block){
        let newOperation = block.operation;
        
        let modal = d3.select("#modal-selector-block-settings");
        modal.select(".modal-title").text(block.property);
        
        modal.select("#innerBlockOperationAnd").property("checked", block.operation == "AND");
        modal.select("#innerBlockOperationOr").property("checked", block.operation == "OR");
        
        modal.selectAll("input[name='innerBlockOperation']").on("change", function(){
            newOperation = this.value;
        });

        modal.select("#save-button").on("click", function(){
            block.operation = newOperation;
            
        });

        $('#modal-selector-block-settings').modal('show');
    }

    showSettings(){
        let _this = this;
        let modal = d3.select("#modal-settings");
        let newSettings = JSON.parse(JSON.stringify(_this.settings));
        let datasetChanged = false;


        modal.select("#blockOperationAnd").property("checked", _this.settings.blockOperator == "AND");
        modal.select("#blockOperationOr").property("checked", _this.settings.blockOperator == "OR");
        modal.selectAll("input[name='blockOperation']").on("change", function(){
            newSettings.blockOperator = this.value;
        });

        modal.select("#selectorOperationAnd").property("checked", _this.settings.selectorOperator == "AND");
        modal.select("#selectorOperationOr").property("checked", _this.settings.selectorOperator == "OR");
        modal.selectAll("input[name='selectorOperation']").on("change", function(){
            newSettings.selectorOperator = this.value;
        });

        modal.select("#feedback-domain")
            .property("checked", _this.settings.activeDomainFeedback)
            .on("change", function(){
                newSettings.activeDomainFeedback = d3.select(this).property("checked")
            });

        modal.select("#feedback-coverage")
            .property("checked", _this.settings.coverageFeedback)
            .on("change", function(){
                newSettings.coverageFeedback = d3.select(this).property("checked")
            });

        modal.select("#feedback-arrows")
            .property("checked", _this.settings.arrowsFeedback)
            .on("change", function(){
                newSettings.arrowsFeedback = d3.select(this).property("checked")
            });

        modal.select("#feedback-tooltip")
            .property("checked", _this.settings.tooltipFeedback)
            .on("change", function(){
                newSettings.tooltipFeedback = d3.select(this).property("checked")
            });

        modal.select("#uniform-selector")
            .property("checked", _this.settings.uniformSelector)
            .on("change", function(){
                newSettings.uniformSelector = d3.select(this).property("checked")
            });

        modal.select("#boxplot-selector")
            .property("checked", _this.settings.boxplotSelector)
            .on("change", function(){
                newSettings.boxplotSelector = d3.select(this).property("checked")
            });

        //metrics
        modal.select("#metrics-list").selectAll("*").remove();
        modal.select("#metrics-list")
            .selectAll("div")
            .data(_this.dataset.allNumericProperties)
            .enter()
            .append("div").attr("class", "form-check")
            .append("input").attr("class", "form-check-input")
            .attr("type", "checkbox")
            .property("checked", function(d){
                return _this.dataset.numericProperties.includes(d)
            })
            .on("change", function(){
                newSettings.metrics = [];
                modal.select("#metrics-list").selectAll("input")
                    .each(function(d){
                        if(d3.select(this).property("checked")) newSettings.metrics.push(d);
                    })
            })
            .select(function(){ return this.parentNode})
            .append("label").attr("class", "form-check")
            .attr("class", "form-check-label")
            .text(function(d){ return d;})

        modal.select("#dataset")
            .selectAll("option")
            .data(_this.settings.datasets)
            .enter()
            .append("option")
            .property("value", function(d){ return d})
            .property("text", function(d){ return d})
            .property("selected", function(d){
                return d == _this.currentDataset;
            })
            
            
        modal.select("#dataset").on("change", function(){
                newSettings.currentDataset = d3.select(this).property("value");
                console.log(newSettings)
                datasetChanged = true;

            })



        modal.select("#save-button").on("click", function(){
            _this.settings = newSettings;
            _this.start(undefined, datasetChanged);
            
            /*
            _this.dataset.deselectAll();
            _this.settings = newSettings;
            _this.createViews();
            */

        });

        $('#modal-settings').modal('show');
    }
});



class Interval{
    constructor(datasetValues, type, property, index, min, max, includeMin, includeMax, active = true, parent = true){
        
        this.id = type + "-" + "interval-" + property.replace(/[^\w]|_/g, "") + "-" + index;
        this.property = property;
        this.index = index;
        
        this.min = min;
        this.initialMin = min;
        this.max = max;
        this.initialMax = max;
        this.includeMin = includeMin;
        this.includeMax = includeMax;
        this.selected = lib.settings.intervalsSelected.includes(this.id);
        
        this.active = active;
        this.parent = parent;
        
        this.noCoverage = true;
        this.partialCoverage = false;
        this.totalCoverage = false;
        
        this.empty = true;
        this.delta = 0;

        this.values = [];
        this.datasetValues = datasetValues;

        for(let i=0; i<datasetValues.length; i++){
            let x = datasetValues[i][property];
            let c1 = includeMin ? x >= min : x > min;
            let c2 = includeMax ? x <= max : x < max;
            if(c1 && c2) this.values.push(datasetValues[i]);
        }


        this.empty = this.values.length == 0;
    }

    

    updateView(){
        d3.select("#" + this.id).dispatch("update");
    }


    updateCoverage(){
        let _this = this;
        let count = d3.sum(_this.values, function(v){
            if(v._selected) return 1;
            else return 0;
        });
        if(_this.values.length == 0 || count == 0){
            _this.setNoCoverage();
        }
        else if(count > 0 && _this.values.length != count){
            _this.setPartialCoverage();
        }
        else _this.setTotalCoverage();
    }

    updateValues(){
        let _this = this;
        _this.values = [];
        for(let i=0; i<_this.datasetValues.length; i++){
            let x = _this.datasetValues[i][_this.property];
            let c1 = _this.includeMin ? x >= _this.min : x >_this. min;
            let c2 = _this.includeMax ? x <= _this.max : x < _this.max;
            if(c1 && c2) _this.values.push(_this.datasetValues[i]);
        }
    }

    setNoCoverage(){
        this.noCoverage = true;
        this.partialCoverage = false;
        this.totalCoverage = false;
        this.updateView();
    }

    setPartialCoverage(){
        this.noCoverage = false;
        this.partialCoverage = true;
        this.totalCoverage = false;
        this.updateView();
    }

    setTotalCoverage(){
        this.noCoverage = false;
        this.partialCoverage = false;
        this.totalCoverage = true;
        this.updateView();
    }

    reset(){
        this.min = this.initialMin;
        this.max = this.initialMax;
    }

    /**
     * Check if a dataset value is included in this interval
     */
    includes(v){
        if(!this.selected){
            return false;
        }
        for(let i=0; i<this.values.length; i++){
            if(this.values[i]._id == v._id) return true;
        }
        return false;
    }

}

class Selector{
    constructor(datasetValues, type, property, distribution){
        this.id = type + "-selector-" + property.replace(/[^\w]|_/g, "");
        this.datasetValues = datasetValues;
        this.type = type;
        this.property = property;
        this.distribution = distribution;
        this.domain = [distribution.min, distribution.max];
        this.ticks = [];
        this.intervals = [];
        this.coverageFeedback = true;
    }

    /*
    _dispatchChangeEvent(){
        d3.select("#" + this.id).dispatch("change");
    }
    */

    updateIntervals(){
        let _this = this;
        this.intervals = [];
        _this.ticks.forEach(function(t, i){
            if(i == _this.ticks.length -1) return;
            _this.intervals.push(new Interval(_this.datasetValues, _this.type, _this.property, i, t, _this.ticks[i+1], true, (_this.ticks[i+1] == _this.domain[1])));
        });
    }

    getAllIntervals(){
        return this.intervals;
    }

    getSelectedIntervals(){
        let _this = this;
        let result = [];
        _this.intervals.forEach(function(int){
            if(int.selected){
                result.push(int);
            }
        });
        return result;
    }

    includes(v){
        let result = false;
        this.intervals.forEach(function(int){ 
            result = result || int.includes(v);
        });
        return result;
    }
}

class BargramSelector extends Selector{
    constructor(datasetValues, property, distribution, intervalsNumber){
        super(datasetValues, "bargram", property, distribution)
        
        let _this = this;
        //compute intervals
        let delta = parseFloat(_this.domain[1] - _this.domain[0])/parseFloat(intervalsNumber);
        for(let i=0; i<=intervalsNumber; i++){
            if(i==0) _this.ticks.push(_this.domain[0]);
            else if(i==intervalsNumber) _this.ticks.push(_this.domain[1]);
            else _this.ticks.push(_this.domain[0] + i*delta);
        }
        this.updateIntervals();
    }
}


class BoxplotSelector extends Selector{
    constructor(datasetValues, property, distribution){
        super(datasetValues, "boxplot", property, distribution)
        
        this.ticks = [
            distribution.min,
            distribution.wMin, 
            distribution.q1, 
            distribution.median, 
            distribution.q3, 
            distribution.wMax,
            distribution.max
        ];

        this.updateIntervals();
    }
  
}

class BrushSelector{
    constructor(datasetValues, id, property1, property2){
        //this.id = "brush-selector-" + properties[0].replace(/[^\w]|_/g, "") + "-" + properties[1].replace(/[^\w]|_/g, "");
        this.id = id;
        this.datasetValues = datasetValues;
        this.property1 = property1;
        this.property2 = property2;
        this.intervals = [
            new Interval(datasetValues, "brush", property1, 0, t, _this.ticks[i+1], true, (_this.ticks[i+1] == _this.domain[1]))
        ];

        this.intervals.push();
        
    }

    updateIntervals(){
        let _this = this;
        this.intervals = [];
        _this.ticks.forEach(function(t, i){
            if(i == _this.ticks.length -1) return;
            _this.intervals.push(new Interval(_this.datasetValues, _this.type, _this.property, i, t, _this.ticks[i+1], true, (_this.ticks[i+1] == _this.domain[1])));
        });
    }

    getAllIntervals(){
        return this.intervals;
    }

    getSelectedIntervals(){
        let _this = this;
        let result = [];
        _this.intervals.forEach(function(int){
            if(int.selected){
                result.push(int);
            }
        });
        return result;
    }

    includes(v){
        let result = false;
        this.intervals.forEach(function(int){ 
            result = result || int.includes(v);
        });
        return result;
    }
}

class SelectorBlock{
    constructor(datasetValues, property, distributionValues, uniformIntervalsNumber){
        let _this = this;
        this.id = "selector-block-" + property.replace(/[^\w]|_/g, "");
        this.datasetValues = datasetValues;
        this.property = property;
        this.domain = [distributionValues.min, distributionValues.max];
        this.uniformIntervalsNumber = uniformIntervalsNumber;
        this.distributionValues = distributionValues;
        //this.operation = "AND";
        
        this.selectors = {
            bargram: new BargramSelector(datasetValues, property, distributionValues, uniformIntervalsNumber, [0]),
            boxplot: new BoxplotSelector(datasetValues, property, distributionValues)
        }
    }

    includes(v){        
        let c1 = this.selectors.bargram.includes(v);
        let c2 = this.selectors.boxplot.includes(v);

        let i1 = this.selectors.bargram.getSelectedIntervals().length;
        let i2 = this.selectors.boxplot.getSelectedIntervals().length;
        
        if(lib.settings.selectorOperator == "AND"){
            if(i1 == 0) c1 = true;
            if(i2 == 0) c2 = true;
            return (c1 && c2);
        }
        else if(lib.settings.selectorOperator == "OR"){
            if(i1 == 0) c1 = false;
            if(i2 == 0) c2 = false;
            return (c1 || c2);
        }
        else console.error("Undefined operator: " + lib.settings.selectorOperator);
    }

    getAllIntervals(){
        let _this = this;
        let i1 = this.selectors.bargram.getAllIntervals();
        let i2 = this.selectors.boxplot.getAllIntervals();
        return i1.concat(i2);
    }

    getSelectedIntervals(){
        let _this = this;
        let i1 = this.selectors.bargram.getSelectedIntervals();
        let i2 = this.selectors.boxplot.getSelectedIntervals();
        return i1.concat(i2);
    }

}

class Dataset{
    constructor(values){
        let _this = this;
        this.values = values;
        //this.values = values.slice(0,100);
        this.values2 = [];
        this.allNumericProperties = [];
        this.numericProperties = [];
        this.textProperties = [];
        this.distributionValues = {}; //object for each numeric property
        this.selectorBlocks = [];
        this.selectorBlocks2 = []; //used for change values
        this.brushIntervals = {};
        this.brushIntervals2 = {};

        /*
        checks for each property if values are all numbers, 
        in this case converts elements into number (sometime the number is written as string for example)
        */
        d3.keys(_this.values[0]).forEach(function(p){
            let allNumbers = true;
            for(let i=0; i<_this.values.length; i++){
                if(isNaN(Number(_this.values[i][p]))){
                    allNumbers = false;
                    break;
                }
            }
            if(allNumbers){
                _this.numericProperties.push(p);
                _this.allNumericProperties.push(p);
                for(let i=0; i<_this.values.length; i++) _this.values[i][p] = Number(_this.values[i][p]);
            }
            else _this.textProperties.push(p);
        });

        if(lib.settings.metrics.length != 0){
            lib.settings.metrics.forEach(function(m){
                if(!_this.numericProperties.includes(m)) console.error("\""+ m + "\", defined in config, is not a metric of the dataset.")
            });
            _this.numericProperties = lib.settings.metrics;
        }
        else{
            _this.numericProperties = _this.numericProperties.slice(0,lib.settings.defaultMetricsLen);
        }

        /*
        compute distribution values
        */
        this.numericProperties.forEach(function(p){
            let list = [];
            _this.values.forEach(function(v){
                list.push(v[p]);
            });
            list = list.sort(function(a, b){return a-b});
            
            let dist = {
                min: d3.min(list),
                q1: d3.quantile(list, 0.25),
                median: d3.median(list),
                q3: d3.quantile(list, 0.75),
                max: d3.max(list),
                mean: d3.mean(list),
                iqr: 0,
                wMin: 0,
                wMax: 0
            };
            dist.iqr = dist.q3 - dist.q1;
            //dist.wMin = Math.max(dist.q1 - (1.5 * dist.iqr), dist.min);
            //dist.wMax = Math.min(dist.q3 + (1.5 * dist.iqr), dist.max);

            dist.wMin = d3.quantile(list, 0.02);
            dist.wMax = d3.quantile(list, 0.98);


            _this.distributionValues[p] = dist;
        });

        /*
        compute id for each value
        */
       for(let i=0; i<_this.values.length; i++) _this.values[i]["_id"] = "v-" + i;

        /*
        add _selected property for each value
        */
        for(let i=0; i<_this.values.length; i++) _this.values[i]["_selected"] = false;

        /*
        compute values for scatterplot
        */
       if(!_this.values[0].hasOwnProperty("x")){
        for(let i=0; i<_this.values.length; i++){
            _this.values[i]["x"] = _this.values[i][_this.allNumericProperties[0]];
            _this.values[i]["y"] = _this.values[i][_this.allNumericProperties[2]];
        }
       }
        
        this.values2 = JSON.parse(JSON.stringify(this.values));

        /*
        create selector blocks
        */
       this.numericProperties.forEach(function(p){
           _this.selectorBlocks.push(new SelectorBlock(_this.values, p, _this.distributionValues[p], lib.settings.uniformIntervalsNumber));
           _this.selectorBlocks2.push(new SelectorBlock(_this.values2, p, _this.distributionValues[p], lib.settings.uniformIntervalsNumber));
       });

       this.onIntervalSelectionChange();
    }

    addBrushInterval(id, x0, x1, y0, y1){
        let _this = this;
        if(id in this.brushIntervals){
            this.brushIntervals[id].x.min = x0;
            this.brushIntervals[id].x.max = x1;
            this.brushIntervals[id].y.min = y1;
            this.brushIntervals[id].y.max = y0;
        }
        else{
            this.brushIntervals[id] = {
                x: new Interval(_this.values, "brush", "x", id, x0, x1, true, true, true),
                y: new Interval(_this.values, "brush", "y", id, y1, y0, true, true, true),
            }
            this.brushIntervals[id].x.selected = true;
            this.brushIntervals[id].y.selected = true;

        }
    }

    addBrushInterval2(id, x0, x1, y0, y1){
        let _this = this;
        if(id in this.brushIntervals2){
            this.brushIntervals2[id].x.min = x0;
            this.brushIntervals2[id].x.max = x1;
            this.brushIntervals2[id].y.min = y1;
            this.brushIntervals2[id].y.max = y0;
        }
        else{
            this.brushIntervals2[id] = {
                x: new Interval(_this.values2, "brush", "x", id, x0, x1, true, true, true),
                y: new Interval(_this.values2, "brush", "y", id, y1, y0, true, true, true),
            }
            this.brushIntervals2[id].x.selected = true;
            this.brushIntervals2[id].y.selected = true;

        }
        this.onIntervalSelectionChange();
    }

    getBrushIntervals(){
        let result = [];
        d3.entries(this.brushIntervals).forEach(function(d){
            d3.values(d.value).forEach(function(int){
                result.push(int);
            })
        })
        return result;
    }

    getBrushIntervals2(){
        let result = [];
        d3.entries(this.brushIntervals2).forEach(function(d){
            d3.values(d.value).forEach(function(int){
                result.push(int);
            })
        })
        return result;
    }

    getAllIntervals(){
        let result = [];
        this.selectorBlocks.forEach(function(b){
            result = result.concat(b.getAllIntervals());  
        });
        result = result.concat(this.getBrushIntervals());
        return result;
    }

    getAllIntervals2(){
        let result = [];
        this.selectorBlocks2.forEach(function(b){
            result = result.concat(b.getAllIntervals());  
        });
        result = result.concat(this.getBrushIntervals2());
        return result;
    }

    getInterval(id){
        let all = this.getAllIntervals();
        return all.filter(function(int){ return int.id == id; })[0];
    }

    getInterval2(id){
        let all = this.getAllIntervals2();
        return all.filter(function(int){ return int.id == id; })[0];
    }

    getSelectedIntervals(){
        let result = [];
        this.selectorBlocks.forEach(function(b){
            result = result.concat(b.getSelectedIntervals());  
        });
        result = result.concat(this.getBrushIntervals());
        return result;
    }

    getSelectedIntervals2(){
        let result = [];
        this.selectorBlocks2.forEach(function(b){
            result = result.concat(b.getSelectedIntervals());  
        });
        result = result.concat(this.getBrushIntervals());
        return result;
    }

    getSelectedBlocks(){
        let result = [];
        this.selectorBlocks.forEach(function(b){
            if(b.getSelectedIntervals().length != 0) result.push(b);
        });
        return result;
    }

    getSelectedBlocks2(){
        let result = [];
        this.selectorBlocks2.forEach(function(b){
            if(b.getSelectedIntervals().length != 0) result.push(b);
        });
        return result;
    }

    selectInterval(interval){
        interval.selected = true;
        this.getInterval2(interval.id).selected = true;
        this.onIntervalSelectionChange();
    }

    deselectInterval(interval){
        interval.selected = false;
        this.getInterval2(interval.id).selected = false;
        this.onIntervalSelectionChange();
    }

    onIntervalSelectionChange(){
        let _this = this;

        let selected = [];

        for(let i=0; i<_this.values.length; i++){
            let changed = _this.updateValueSelection(_this.values[i]);
            if(_this.values[i]._selected) selected.push(_this.values[i]);
            if(changed){
                d3.select("#" + _this.values[i]._id).classed("selected", function(d){ return d._selected});
            }
        }

        _this.computeDelta();

        d3.select(".selected-number").html(selected.length + " <small style='font-size:15px'>of " + _this.values.length + "</small>");
        let perc = _this.getSelectedPercentage();
        d3.select(".selected-percentage").html(perc + " <small style='font-size:15px'>%</small>");
        d3.select("#selected-progress").style("width", perc +"%");

        _this.getAllIntervals().forEach(function(int){
            int.updateCoverage();
            int.updateView();
        });

        return selected.length;
    }

    onIntervalSelectionChange2(){
        let _this = this;

        let selected = [];

        for(let i=0; i<_this.values2.length; i++){
            let changed = _this.updateValueSelection2(_this.values2[i]);
            if(_this.values2[i]._selected) selected.push(_this.values2[i]);
        }

        return selected.length;
    }

    updateValueSelection(v){
        let _this = this;

        let oldSelected = v._selected;
        let result = false;

        if(this.getSelectedIntervals().length == 0){
            v._selected = false;
        }
        else{
            let inclusion = [];
            this.getSelectedBlocks().forEach(function(b){
                inclusion.push(b.includes(v));
            });

            
            this.getBrushIntervals().forEach(function(int){
                inclusion.push(int.includes(v));
            });
            

            v._selected = inclusion[0];
            inclusion.forEach(function(c){
                if(lib.settings.blockOperator == "AND") v._selected = v._selected && c;
                else if(lib.settings.blockOperator == "OR") v._selected = v._selected || c;
                else console.error("Undefined operation: " + lib.settings.blockOperator);
            });
        }
        return oldSelected != v._selected;
    }

    updateValueSelection2(v){
        let _this = this;

        let oldSelected = v._selected;
        let result = false;

        if(this.getSelectedIntervals2().length == 0){
            v._selected = false;
        }
        else{
            let inclusion = [];
            this.getSelectedBlocks2().forEach(function(b){
                inclusion.push(b.includes(v));
            });

            
            this.getBrushIntervals2().forEach(function(int){
                inclusion.push(int.includes(v));
            });
            

            v._selected = inclusion[0];
            inclusion.forEach(function(c){
                if(lib.settings.blockOperator == "AND") v._selected = v._selected && c;
                else if(lib.settings.blockOperator == "OR") v._selected = v._selected || c;
                else console.error("Undefined operation: " + lib.settings.blockOperator);
            });
        }
        return oldSelected != v._selected;
    }

    
    deselectAll(){
        this.getAllIntervals().forEach(function(int){
            int.selected = false;
        });
        this.getAllIntervals2().forEach(function(int){
            int.selected = false;
        });
        this.onIntervalSelectionChange();
    }

    computeDelta(){
        let _this = this;
        let sel = this.values.filter(function(v){ return v._selected}).length;

        this.getAllIntervals2().forEach(function(int2){
            int2.selected = !int2.selected;
            let sel2 = _this.onIntervalSelectionChange2();
            _this.getInterval(int2.id).delta = sel2 - sel;
            int2.selected = !int2.selected;
            _this.onIntervalSelectionChange2();
        });
    }

    intervalChanged(selector){
        //update interval2
        let _this = this;
        selector.intervals.forEach(function(int){
            int.updateValues();
            let interval2 = _this.getInterval2(int.id);
            interval2.min = int.min;
            interval2.max = int.max;
            interval2.updateValues();
        });
        _this.onIntervalSelectionChange();
    }


    resetBargram(selector){
        let _this = this;
        selector.intervals.forEach(function(int){
            int.reset();
            int.updateValues();
            let interval2 = _this.getInterval2(int.id);
            interval2.reset();
            interval2.updateValues();
        });
        _this.onIntervalSelectionChange();
    }

    getSelectedElements(){
        return this.values.filter(function(v){
            return v._selected;
        });
    }

    getSelectedElementsId(){
        return this.getSelectedElements().map(function(d){ return d._id});
    }

    getSelectedNumber(){
        return this.getSelectedElements().length;
    }

    getSelectedPercentage(){
        let selected = this.getSelectedElements();
        return lib.roundFloat(selected.length/this.values.length*100);
    }
}



function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }