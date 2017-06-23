/*
 *  The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 The Regents of the University of California
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated documentation files (the "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the
 * following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial
 * portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,  FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */

/**
 * Created by dat on 3/22/17.
 */
var hic = (function (hic) {

    hic.ChromosomeSelectorWidget = function (browser, $container) {

        var self = this,
            $label,
            $selector_container,
            $doit;

        this.browser = browser;

        this.$container = $('<div class="hic-chromosome-selector-widget-container">');
        $container.append(this.$container);

        $label = $('<div>');
        this.$container.append($label);
        $label.text('Chromosomes');

        $selector_container = $('<div>');
        this.$container.append($selector_container);

        this.$x_axis_selector = $('<select name="x-axis-selector">');
        $selector_container.append(this.$x_axis_selector);

        this.$y_axis_selector = $('<select name="y-axis-selector">');
        $selector_container.append(this.$y_axis_selector);

        $doit = $('<div class="hic-chromosome-selector-widget-button">');
        $selector_container.append($doit);

        $doit.on('click', function (e) {
            var chr1,
                chr2;

            chr1 = parseInt(self.$x_axis_selector.find('option:selected').val(), 10);
            chr2 = parseInt(self.$y_axis_selector.find('option:selected').val(), 10);

            self.browser.setChromosomes(chr1, chr2);
        });

        this.dataLoadConfig = {
            receiveEvent: function (event) {
                if (event.type === "MapLoad") {
                    self.respondToDataLoadWithDataset(event.data);
                }
            }
        };

        hic.GlobalEventBus.subscribe("MapLoad", this.dataLoadConfig);

        this.locusChangeConfig = {
            receiveEvent: function (event) {
                if (event.type === "LocusChange") {
                    self.respondToLocusChangeWithState(event.data);
                }
            }
        };
        hic.GlobalEventBus.subscribe("LocusChange", this.locusChangeConfig);

    };

    hic.ChromosomeSelectorWidget.prototype.respondToDataLoadWithDataset = function (dataset) {

        var elements,
            str,
            foundX,
            foundY;

        this.$x_axis_selector.empty();
        this.$y_axis_selector.empty();

        elements = _.map(dataset.chromosomes, function (chr, index) {
            return '<option value=' + index.toString() + '>' + chr.name + '</option>';
        });

        this.$x_axis_selector.append(elements.join(''));
        this.$y_axis_selector.append(elements.join(''));

        str = 'option[value=' + this.browser.state.chr1.toString() + ']';
        foundX = this.$x_axis_selector.find(str);
        foundX.attr('selected', 'selected');

        str = 'option[value=' + this.browser.state.chr2.toString() + ']';
        foundY = this.$y_axis_selector.find(str);
        foundY.attr('selected', 'selected');
    };

    hic.ChromosomeSelectorWidget.prototype.respondToLocusChangeWithState = function (state) {
        var self = this,
            str,
            findX,
            findY,
            chr1,
            chr2;


        findX = this.$x_axis_selector.find('option');
        findY = this.$y_axis_selector.find('option');

        // this happens when the first dataset is loaded.
        if (0 === _.size(findX) || 0 === _.size(findY)) {
            return;
        }

        findX = this.$x_axis_selector.find('option:selected');
        findY = this.$y_axis_selector.find('option:selected');

        chr1 = parseInt(findX.val(), 10);
        chr2 = parseInt(findY.val(), 10);

        // It is the pair of chromosomes that is important,  1-2 == 2-1,  so update only if the pair does not match

        if (!((chr1 === state.chr1 && chr2 === state.chr2) || (chr1 === state.chr2 && chr2 === state.chr1))) {

            str = 'option[value=' + state.chr1.toString() + ']';
            this.$x_axis_selector.find(str).attr('selected', 'selected');

            str = 'option[value=' + state.chr2.toString() + ']';
            this.$y_axis_selector.find(str).attr('selected', 'selected');

        }

    };

    return hic;

})(hic || {});


/*
 *  The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 The Regents of the University of California
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated documentation files (the "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the
 * following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial
 * portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,  FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */


/**
 * @author Jim Robinson
 */



var hic = (function (hic) {

    dragThreshold = 2;

    hic.ContactMatrixView = function (browser, $container) {

        this.browser = browser;

        this.scrollbarWidget = new hic.ScrollbarWidget(browser);

        this.$viewport = $('<div id="viewport">');
        $container.append(this.$viewport);

        //content canvas
        this.$canvas = $('<canvas>');
        this.$viewport.append(this.$canvas);

        // this.$canvas.attr('width', this.$viewport.width());
        // this.$canvas.attr('height', this.$viewport.height());
        // this.ctx = this.$canvas.get(0).getContext("2d");

        //spinner
        this.$spinner = $('<div id="viewport-spinner-container">');
        this.$viewport.append(this.$spinner);

        // throbber
        // size: see $hic-viewport-spinner-size in .scss files
        this.throbber = Throbber({color: 'rgb(64, 64, 64)', size: 120, padding: 40}).appendTo(this.$spinner.get(0));
        this.stopSpinner();

        // ruler sweeper widget surface
        this.sweepZoom = new hic.SweepZoom(this.browser);
        this.$viewport.append(this.sweepZoom.$rulerSweeper);


        // x - guide
        this.$x_guide = $('<div id="x-guide">');
        this.$viewport.append(this.$x_guide);

        // y - guide
        this.$y_guide = $('<div id="y-guide">');
        this.$viewport.append(this.$y_guide);


        $container.append(this.scrollbarWidget.$y_axis_scrollbar_container);


        addMouseHandlers.call(this, this.$viewport);

        this.imageTileCache = {};
        this.imageTileCacheKeys = [];

        this.colorScale = new hic.ColorScale(
            {
                low: 0,
                lowR: 255,
                lowG: 255,
                lowB: 255,
                high: 2000,
                highR: 255,
                highG: 0,
                highB: 0
            }
        );
        this.computeColorScale = true;

        hic.GlobalEventBus.subscribe("LocusChange", this);
        hic.GlobalEventBus.subscribe("NormalizationChange", this);

    };

    hic.ContactMatrixView.prototype.setDataset = function (dataset) {

        this.dataset = dataset;
        this.clearCaches();
        this.update();
    };

    hic.ContactMatrixView.prototype.clearCaches = function () {
        this.imageTileCache = {};
        this.imageTileCacheKeys = [];
    };

    hic.ContactMatrixView.prototype.getViewDimensions = function () {
        return {
            width: this.$viewport.width(),
            height: this.$viewport.height()
        }
    };

    hic.ContactMatrixView.prototype.receiveEvent = function (event) {
        // Perhaps in the future we'll do something special based on event type & properties

        if ("NormalizationChange" === event.type) {
            this.clearCaches();
        }

        this.update();

    };

    hic.ContactMatrixView.prototype.update = function () {

        var self = this,
            state = this.browser.state;

        if (!this.ctx) {
            this.ctx = this.$canvas.get(0).getContext("2d");
        }

        if (!this.dataset) return;

        this.updating = true;

        this.dataset.getMatrix(state.chr1, state.chr2)

            .then(function (matrix) {

                var widthInBins = self.$viewport.width() / state.pixelSize,
                    heightInBins = self.$viewport.height() / state.pixelSize,
                    zd = matrix.bpZoomData[state.zoom],
                    blockBinCount = zd.blockBinCount,
                    col1 = Math.floor(state.x / blockBinCount),
                    col2 = Math.floor((state.x + widthInBins) / blockBinCount),
                    row1 = Math.floor(state.y / blockBinCount),
                    row2 = Math.floor((state.y + heightInBins) / blockBinCount),
                    r, c, promises = [];

                self.checkColorScale(zd, row1, row2, col1, col2, state.normalization)

                    .then(function () {

                        for (r = row1; r <= row2; r++) {
                            for (c = col1; c <= col2; c++) {
                                promises.push(self.getImageTile(zd, r, c));
                            }
                        }

                        Promise.all(promises)
                            .then(function (imageTiles) {
                                self.draw(imageTiles, zd);
                                self.updating = false;
                            })
                            .catch(function (error) {
                                self.stopSpinner();
                                self.updating = false;
                                console.error(error);
                            })

                    })
                    .catch(function (error) {
                        self.stopSpinner(self);
                        self.updating = false;
                        console.error(error);
                    })
            })
            .catch(function (error) {
                self.stopSpinner();
                self.updating = false;
                console.error(error);
            })
    };

    hic.ContactMatrixView.prototype.checkColorScale = function (zd, row1, row2, col1, col2, normalization) {

        var self = this;

        if (!self.computeColorScale) {
            return Promise.resolve();
        }
        else {

            self.startSpinner();

            return new Promise(function (fulfill, reject) {

                var row, column, sameChr, blockNumber,
                    promises = [];

                sameChr = zd.chr1 === zd.chr2;

                for (row = row1; row <= row2; row++) {
                    for (column = col1; column <= col2; column++) {
                        if (sameChr && row < column) {
                            blockNumber = column * zd.blockColumnCount + row;
                        }
                        else {
                            blockNumber = row * zd.blockColumnCount + column;
                        }

                        promises.push(self.dataset.getNormalizedBlock(zd, blockNumber, normalization))
                    }
                }

                Promise.all(promises)
                    .then(function (blocks) {

                    var s = computePercentile(blocks, 95);
                    if (!isNaN(s)) {  // Can return NaN if all blocks are empty
                        self.colorScale.high = s;
                        self.computeColorScale = false;
                        hic.GlobalEventBus.post(hic.Event("ColorScale", self.colorScale));
                    }

                    self.stopSpinner();

                    fulfill();

                })
                    .catch(function(error) {
                        self.stopSpinner();
                        reject(error);
                    });
            })
        }
    }

    hic.ContactMatrixView.prototype.draw = function (imageTiles, zd) {

        var self = this,
            state = this.browser.state,
            blockBinCount = zd.blockBinCount,
            viewportWidth = self.$viewport.width(),
            viewportHeight = self.$viewport.height(),
            canvasWidth = this.$canvas.width(),
            canvasHeight = this.$canvas.height();

        if (canvasWidth !== viewportWidth || canvasHeight !== viewportHeight) {
            this.$canvas.width(viewportWidth);
            this.$canvas.height(viewportHeight);
            this.$canvas.attr('width', this.$viewport.width());
            this.$canvas.attr('height', this.$viewport.height());
        }

        self.ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        imageTiles.forEach(function (imageTile) {

            var image = imageTile.image;

            if (image != null) {
                var row = imageTile.row,
                    col = imageTile.column,
                    x0 = blockBinCount * col,
                    y0 = blockBinCount * row;
                var offsetX = (x0 - state.x) * state.pixelSize;
                var offsetY = (y0 - state.y) * state.pixelSize;
                if (offsetX <= viewportWidth && offsetX + image.width >= 0 &&
                    offsetY <= viewportHeight && offsetY + image.height >= 0) {
                    self.ctx.drawImage(image, offsetX, offsetY);
                }
            }
        })

    };

    hic.ContactMatrixView.prototype.getImageTile = function (zd, row, column, block) {

        var self = this,
            sameChr = zd.chr1 === zd.chr2,
            key = "" + zd.chr1.name + "_" + zd.chr2.name + "_" + zd.zoom.binSize + "_" + zd.zoom.unit + "_" + row + "_" + column;

        if (this.imageTileCache.hasOwnProperty(key)) {
            return Promise.resolve(this.imageTileCache[key]);
        } else {
            return new Promise(function (fulfill, reject) {

                var state = self.browser.state,
                    blockBinCount = zd.blockBinCount,
                    blockColumnCount = zd.blockColumnCount,
                    widthInBins = zd.blockBinCount,
                    imageSize = widthInBins * state.pixelSize,
                    transpose = sameChr && row < column,
                    blockNumber,
                    t;


                function setPixel(imageData, x, y, r, g, b, a) {
                    index = (x + y * imageData.width) * 4;
                    imageData.data[index + 0] = r;
                    imageData.data[index + 1] = g;
                    imageData.data[index + 2] = b;
                    imageData.data[index + 3] = a;
                }

                function drawBlock(block, transpose) {

                    var blockNumber,
                        row,
                        col,
                        x0,
                        y0,
                        image,
                        ctx,
                        id,
                        i,
                        rec,
                        x,
                        y,
                        color,
                        fudge;

                    blockNumber = block.blockNumber;
                    row = Math.floor(blockNumber / blockColumnCount);
                    col = blockNumber - row * blockColumnCount;
                    x0 = blockBinCount * col;
                    y0 = blockBinCount * row;

                    image = document.createElement('canvas');
                    image.width = imageSize;
                    image.height = imageSize;
                    ctx = image.getContext('2d');
                    ctx.clearRect(0, 0, image.width, image.height);

                    id = ctx.getImageData(0, 0, image.width, image.height);
                    fudge = 0.5;

                    // console.log('block records ' + _.size(block.records) + ' pixel size ' + state.pixelSize);

                    for (i = 0; i < block.records.length; i++) {
                        rec = block.records[i];
                        x = Math.floor((rec.bin1 - x0) * state.pixelSize);
                        y = Math.floor((rec.bin2 - y0) * state.pixelSize);

                        if (transpose) {
                            t = y;
                            y = x;
                            x = t;
                        }

                        color = self.colorScale.getColor(rec.counts);
                        ctx.fillStyle = color.rgb;

                        if (state.pixelSize === 1) {
                            // TODO -- verify that this bitblting is faster than fillRect
                            setPixel(id, x, y, color.red, color.green, color.blue, 255);
                            if (sameChr && row === col) {
                                setPixel(id, y, x, color.red, color.green, color.blue, 255);
                            }
                        }
                        else {
                            ctx.fillRect(x, y, fudge + state.pixelSize, fudge + state.pixelSize);
                            if (sameChr && row === col) {
                                ctx.fillRect(y, x, fudge + state.pixelSize, fudge + state.pixelSize);
                            }
                        }
                    }
                    if (state.pixelSize == 1) ctx.putImageData(id, 0, 0);
                    return image;
                }


                if (sameChr && row < column) {
                    blockNumber = column * blockColumnCount + row;
                }
                else {
                    blockNumber = row * blockColumnCount + column;
                }

                self.startSpinner();

                self.dataset.getNormalizedBlock(zd, blockNumber, state.normalization)

                    .then(function (block) {

                        var image;
                        if (block && block.records.length > 0) {
                            image = drawBlock(block, transpose);
                        }
                        else {
                            console.log("No block for " + blockNumber);
                        }

                        var imageTile = {row: row, column: column, image: image};

                        // Cache at most 20 image tiles
                        if (self.imageTileCacheKeys.length > 20) {
                            self.imageTileCache[self.imageTileCacheKeys[0]] = undefined;
                            self.imageTileCacheKeys.shift();
                        }

                        self.imageTileCache[key] = imageTile;

                        self.stopSpinner();
                        fulfill(imageTile);

                    })
                    .catch(function (error) {
                        self.stopSpinner();
                        reject(error);
                    })
            })
        }
    };

    function computePercentile(blockArray, p) {

        var array = [], i;

        blockArray.forEach(function (block) {
            if (block) {
                for (i = 0; i < block.records.length; i++) {
                    array.push(block.records[i].counts);
                }
            }
        });

        if (array.length === 0) {
            return Number.NaN;
        }
        else {
            var idx = Math.floor((p / 100.0) * array.length);
            array.sort(function (a, b) {
                return a - b;
            });
            return array[idx];
        }
    }

    hic.ContactMatrixView.prototype.startSpinner = function () {
       // console.log("Start spinner");
        this.$spinner.show();
        this.throbber.start();
    };

    hic.ContactMatrixView.prototype.stopSpinner = function () {
      //  console.log("Stop spinner");
        this.throbber.stop();
        this.$spinner.hide();
    };

    function addMouseHandlers($viewport) {

        var self = this,
            isMouseDown = false,
            isDragging = false,
            isSweepZooming = false,
            mouseDown = undefined,
            mouseLast = undefined,
            exe,
            wye;

        $(document).on({
            mousedown: function (e) {
                // do stuff
            },

            mousemove: function (e) {
                // do stuff
            },

            // for sweep-zoom allow user to sweep beyond viewport extent
            // sweep area clamps since viewport mouse handlers stop firing
            // when the viewport boundary is crossed.
            mouseup: function (e) {
                if (isSweepZooming) {
                    isSweepZooming = false;
                    self.sweepZoom.dismiss();
                }
            }
        });

        $viewport.on('mousedown', function (e) {

            var coords;

            isSweepZooming = (true === e.altKey);
            isMouseDown = true;

            coords = hic.translateMouseCoordinates(e, $viewport);

            mouseLast = coords;
            mouseDown = coords;

            if (isSweepZooming) {
                self.sweepZoom.reset();
            }

        });

        $viewport.on('mousemove', hic.throttle(function (e) {

            var coords;

            if (self.updating) {
                return;
            }

            e.preventDefault();

            coords = hic.translateMouseCoordinates(e, $viewport);

            self.browser.updateCrosshairs(coords);

            $(document).on('keydown', function (e) {
                if (16 === e.keyCode) {
                    self.browser.showCrosshairs();
                }
            });

            $(document).on('keyup', function (e) {
                if (16 === e.keyCode) {
                    self.browser.hideCrosshairs();
                }
            });

            if (isMouseDown) { // Possibly dragging

                if (mouseDown.x && Math.abs(coords.x - mouseDown.x) > dragThreshold) {

                    isDragging = true;

                    // if (self.updating) {
                    //     // Freeze frame during updates
                    //     return;
                    // }

                    if (isSweepZooming) {

                        self.sweepZoom.update(mouseDown, coords, {
                            min: {x: 0, y: 0},
                            max: {x: $viewport.width(), y: $viewport.height()}
                        });
                    } else {
                        self.browser.shiftPixels(mouseLast.x - coords.x, mouseLast.y - coords.y);
                    }

                }

                mouseLast = coords;
            }


        }, 10));

        $viewport.on('mouseup', panMouseUpOrMouseOut);

        $viewport.on('mouseleave', panMouseUpOrMouseOut);

        function panMouseUpOrMouseOut(e) {

            if (isDragging) {
                isDragging = false;
                hic.GlobalEventBus.post(hic.Event("DragStopped"));
            }

            isMouseDown = false;
            mouseDown = mouseLast = undefined;
        }

    }

    hic.ColorScale = function (scale) {

        this.low = scale.low;
        this.lowR = scale.lowR;
        this.lowG = scale.lowG;
        this.lowB = scale.lowB;
        this.high = scale.high;
        this.highR = scale.highR;
        this.highG = scale.highG;
        this.highB = scale.highB;


    };

    hic.ColorScale.prototype.getColor = function (value) {
        var scale = this, r, g, b, frac, diff;

        if (value <= scale.low) value = scale.low;
        else if (value >= scale.high) value = scale.high;

        diff = scale.high - scale.low;

        frac = (value - scale.low) / diff;
        r = Math.floor(scale.lowR + frac * (scale.highR - scale.lowR));
        g = Math.floor(scale.lowG + frac * (scale.highG - scale.lowG));
        b = Math.floor(scale.lowB + frac * (scale.highB - scale.lowB));

        return {
            red: r,
            green: g,
            blue: b,
            rgb: "rgb(" + r + "," + g + "," + b + ")"
        };
    };

    return hic;

})
(hic || {});

/*
 *  The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 The Regents of the University of California
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated documentation files (the "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the
 * following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial
 * portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,  FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */


/**
 * @author Jim Robinson
 */


/**
 * Barebones event bus.
 */

var hic = (function (hic) {


    hic.EventBus = function () {

        // Map eventType -> list of subscribers
        this.subscribers = {};
    };

    hic.EventBus.prototype.subscribe = function (eventType, object) {

        var subscriberList = this.subscribers[eventType];
        if (subscriberList == undefined) {
            subscriberList = [];
            this.subscribers[eventType] = subscriberList;
        }
        subscriberList.push(object);

    };

    hic.EventBus.prototype.post = function (event) {

        var eventType = event.type,
            subscriberList = this.subscribers[eventType];

        if(subscriberList) {
            subscriberList.forEach(function (subscriber) {

                if ("function" === typeof subscriber.receiveEvent) {
                    subscriber.receiveEvent(event);
                }
            });
        }

    };

    hic.Event = function(type, data) {
        return {
            type: type,
            data: data
        }
    };

    hic.GlobalEventBus = new hic.EventBus();


    return hic;

})
(hic || {});

/*
 *  The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 The Regents of the University of California
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated documentation files (the "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the
 * following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial
 * portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,  FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */


/**
 * @author Jim Robinson
 */


var hic = (function (hic) {


    hic.geneSearch = function (genomeId, featureName) {

        return new Promise(function (fulfill, reject) {

            // Hardcode this for now
            var searchServiceURL = "https://portals.broadinstitute.org/webservices/igv/locus?genome=" + genomeId + "&name=" + featureName;

            igvxhr.loadString(searchServiceURL)
                .then(function (data) {

                    var results = parseSearchResults(data);

                    if (results.length == 0) {
                        //alert('No feature found with name "' + feature + '"');
                        fulfill(undefined);
                    }
                    else {
                        // Just take first result for now
                        fulfill(results[0])

                    }
                })
                .catch(reject);
        });
    }

    function parseSearchResults(data) {

        var lines = data.splitLines(),
            linesTrimmed = [],
            results = [];

        lines.forEach(function (item) {
            if ("" === item) {
                // do nothing
            } else {
                linesTrimmed.push(item);
            }
        });

        linesTrimmed.forEach(function (line) {
            // Example result -  EGFR	chr7:55,086,724-55,275,031	refseq

            var tokens = line.split("\t");

            if (tokens.length >= 3) {
                results.push(tokens[1]);

            }

        });

        return results;

    }


    return hic;

})
(hic || {});

/*
 *  The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 The Regents of the University of California
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated documentation files (the "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the
 * following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial
 * portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,  FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */


/**
 * @author Jim Robinson
 */


var hic = (function (hic) {

    hic.Genome = function (id, chromosomes) {

        this.id = id;
        this.chromosomes = chromosomes;

        // Alias for size for igv compatibility
        this.chromosomes.forEach(function (c) {
            c.bpLength = c.size;
        })

        /**
         * Maps the official chromosome name to an alias.  Deals with
         * 1 <-> chr1,  chrM <-> MT,  IV <-> chr4, etc.
         * @param str
         */
        var chrAliasTable = {};

        // The standard mappings
        chromosomes.forEach(function (chromosome) {
            var name = chromosome.name,
                alias = name.startsWith("chr") ? name.substring(3) : "chr" + name;
            chrAliasTable[alias] = name;
            if (name === "chrM") chrAliasTable["MT"] = "chrM";
            if (name === "MT") chrAliasTable["chrmM"] = "MT";
        });

        constructWG(this);

        this.chrAliasTable = chrAliasTable;

    }

    hic.Genome.prototype.getChromosomeName = function (str) {
        var chr = this.chrAliasTable[str];
        return chr ? chr : str;
    }

    hic.Genome.prototype.getChromosome = function (chr) {
        chr = this.getChromosomeName(chr);
        return this.chromosomes[chr];
    }

    /**
     * Return the genome coordinate in kb for the give chromosome and position.
     */
    hic.Genome.prototype.getGenomeCoordinate = function (chr, bp) {
        return this.getCumulativeOffset(chr) + Math.floor(bp / 1000);
    }



    /**
     * Return the offset in genome coordinates (kb) of the start of the given chromosome
     */
    hic.Genome.prototype.getCumulativeOffset = function (chr) {

        var self = this,
            queryChr = this.getChromosomeName(chr);
        if (this.cumulativeOffsets === undefined) {
            computeCumulativeOffsets.call(this);
        }
        return this.cumulativeOffsets[queryChr];
    }

    function computeCumulativeOffsets() {
        var self = this,
            cumulativeOffsets = {},
            offset = 0;

        self.chromosomes.forEach(function (chromosome) {
            var name = chromosome.name;
            cumulativeOffsets[name] = Math.floor(offset);
            var chromosome = self.getChromosome(name);
            offset += (chromosome.size / 1000);   // Genome coordinates are in KB.  Beware 32-bit max value limit
        });
        self.cumulativeOffsets = cumulativeOffsets;

    }


    // this.sequence = sequence;
    // this.chromosomeNames = sequence.chromosomeNames;
    // this.chromosomes = sequence.chromosomes;  // An object (functions as a dictionary)
    // this.ideograms = ideograms;
    // this.wgChromosomeNames = wgChromosomeNames;

    function constructWG(genome) {

        var l;

        // Construct the whole-genome "chromosome"
        l = 0;
        _.each(genome.chromosomes, function (chromosome) {
            l += Math.floor((chromosome.size / 1000));  // wg length is in kb.  bp would overflow maximum number limit
        });


        genome.chromosomes["all"] = {
            name: "all",
            size: l
        };
    }

    return hic;

}) (hic || {});


/*
 *  The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 The Regents of the University of California
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated documentation files (the "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the
 * following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial
 * portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,  FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */

/**
 * @author Jim Robinson
 */


var hic = (function (hic) {

    var defaultPixelSize, defaultState;
    var maxPixelSize = 100;
    var DEFAULT_ANNOTATION_COLOR = "rgb(22, 129, 198)";

    // mock igv browser objects for igv.js compatibility
    function createIGV($hic_container) {
        igv.browser = {
            constants: {defaultColor: "rgb(0,0,150)"}
        }
        igv.trackMenuItemList = hic.trackMenuItemListReplacement;
        igv.trackMenuItem = hic.trackMenuItemReplacement;
        // Popover object -- singleton shared by all components
        igv.popover = new igv.Popover($hic_container);
        // igv.popover.presentTrackGearMenu = hic.popoverPresentTrackGearMenuReplacement;

        // ColorPicker object -- singleton shared by all components
        igv.colorPicker = new igv.ColorPicker($hic_container, undefined);
        igv.colorPicker.hide();

        // Dialog object -- singleton shared by all components
        igv.dialog = new igv.Dialog($hic_container, igv.Dialog.dialogConstructor);
        igv.dialog.hide();

        // Data Range Dialog object -- singleton shared by all components
        igv.dataRangeDialog = new igv.DataRangeDialog($hic_container);
        igv.dataRangeDialog.hide();
    }

    function destringifyTracks(trackString) {

        var trackTokens = trackString.split("|||"),
            configList = [];

        trackTokens.forEach(function (track) {
            var tokens = track.split("|"),
                url = tokens[0],
                name = tokens[1],
                dataRangeString = tokens[2],
                color = tokens[3],
                config = {url: url};

            if (name) config.name = name;
            if (dataRangeString) {
                var r = dataRangeString.split("-");
                config.min = parseFloat(r[0]);
                config.max = parseFloat(r[1])
            }
            if (color) config.color = color;

            configList.push(config);
        });
        return configList;

    }


    hic.createBrowser = function ($hic_container, config) {

        var browser;

        defaultPixelSize = 1;

        defaultState = new hic.State(1, 1, 0, 0, 0, defaultPixelSize, "NONE");

        var href = window.location.href,
            hicUrl = gup(href, "hicUrl"),
            name = gup(href, "name"),
            stateString = gup(href, "state"),
            colorScale = gup(href, "colorScale"),
            trackString = gup(href, "tracks"),
            selectedGene = gup(href, "selectedGene");

        if (hicUrl) {
            config.url = decodeURIComponent(hicUrl);
        }
        if(name) {
            config.name = decodeURIComponent(name);
        }
        if (stateString) {
            stateString = decodeURIComponent(stateString);
            config.state = hic.destringifyState(stateString);

        }
        if (colorScale) {
            config.colorScale = parseFloat(colorScale);
        }

        if (trackString) {
            trackString = decodeURIComponent(trackString);
            config.tracks = destringifyTracks(trackString);
        }

        if (selectedGene) {
            igv.FeatureTrack.selectedGene = selectedGene;
        }

        createIGV($hic_container);

        browser = new hic.Browser($hic_container, config);


        return browser;

    };

    hic.Browser = function ($app_container, config) {

        var $root;

        hic.browser = this;
        this.config = config;

        setDefaults(config);

        this.trackRenderers = [];

        $root = $('<div class="hic-root unselect">');
        $app_container.append($root);

        this.layoutController = new hic.LayoutController(this, $root);

        this.hideCrosshairs();

        this.state = config.state ? config.state : defaultState.clone();

        if (config.colorScale && !isNaN(config.colorScale)) {
            this.contactMatrixView.colorScale.high = config.colorScale;
            this.contactMatrixView.computeColorScale = false;
        }

        if (config.url) {
            this.loadHicFile(config);
        }

        hic.GlobalEventBus.subscribe("LocusChange", this);
        hic.GlobalEventBus.subscribe("DragStopped", this);
        hic.GlobalEventBus.subscribe("MapLoad", this);
        hic.GlobalEventBus.subscribe("ColorScale", this);
        hic.GlobalEventBus.subscribe("NormalizationChange", this);
    };


    hic.Browser.prototype.updateHref = function (event) {
        var location = window.location,
            href = location.href;

        var href = window.location.href;

        if (event && event.type === "MapLoad") {
            href = replaceURIParameter("hicUrl", this.url, href);
            if(this.name) {
                href = replaceURIParameter("name", this.name, href);
            }
        }

        href = replaceURIParameter("state", (this.state.stringify()), href);

        href = replaceURIParameter("colorScale", "" + this.contactMatrixView.colorScale.high, href);

        if (igv.FeatureTrack.selectedGene) {
            href = replaceURIParameter("selectedGene", igv.FeatureTrack.selectedGene, href);
        }

        if (this.trackRenderers && this.trackRenderers.length > 0) {
            var trackString = "";
            this.trackRenderers.forEach(function (trackRenderer) {
                var track = trackRenderer.x.track,
                    config = track.config,
                    url = config.url,
                    name = track.name,
                    dataRange = track.dataRange,
                    color = track.color;

                if (typeof url === "string") {
                    if (trackString.length > 0) trackString += "|||";
                    trackString += url;
                    trackString += "|" + (name ? name : "");
                    trackString += "|" + (dataRange ? (dataRange.min + "-" + dataRange.max) : "");
                    trackString += "|" + (color ? color : "");
                }
            });
            if (trackString.length > 0) {
                href = replaceURIParameter("tracks", trackString, href);
            }
        }

        window.history.replaceState("", "juicebox", href);
    };


    hic.Browser.prototype.updateCrosshairs = function (coords) {

        this.contactMatrixView.$x_guide.css({top: coords.y, left: 0});
        this.layoutController.$y_tracks.find('#x-track-guide').css({top: coords.y, left: 0});

        this.contactMatrixView.$y_guide.css({top: 0, left: coords.x});
        this.layoutController.$x_tracks.find('#y-track-guide').css({top: 0, left: coords.x});

    };

    hic.Browser.prototype.hideCrosshairs = function () {

        _.each([this.contactMatrixView.$x_guide, this.contactMatrixView.$y_guide, this.layoutController.$x_tracks.find('#y-track-guide'), this.layoutController.$y_tracks.find('#x-track-guide')], function ($e) {
            $e.hide();
        });

    };

    hic.Browser.prototype.showCrosshairs = function () {

        _.each([this.contactMatrixView.$x_guide, this.contactMatrixView.$y_guide, this.layoutController.$x_tracks.find('#y-track-guide'), this.layoutController.$y_tracks.find('#x-track-guide')], function ($e) {
            $e.show();
        });

    };

    hic.Browser.prototype.genomicState = function () {
        var gs,
            bpResolution;

        bpResolution = this.dataset.bpResolutions[this.state.zoom];

        gs = {};
        gs.bpp = bpResolution / this.state.pixelSize;

        gs.chromosome = {x: this.dataset.chromosomes[this.state.chr1], y: this.dataset.chromosomes[this.state.chr2]};

        gs.startBP = {x: this.state.x * bpResolution, y: this.state.y * bpResolution};
        gs.endBP = {
            x: gs.startBP.x + gs.bpp * this.contactMatrixView.getViewDimensions().width,
            y: gs.startBP.y + gs.bpp * this.contactMatrixView.getViewDimensions().height
        };

        return gs;
    };

    hic.Browser.prototype.getColorScale = function () {
        var cs = this.contactMatrixView.colorScale;
        return cs;
    };

    hic.Browser.prototype.updateColorScale = function (high) {
        this.contactMatrixView.colorScale.high = high;
        this.contactMatrixView.imageTileCache = {};
        this.contactMatrixView.update();
        this.updateHref();
    };

    hic.Browser.prototype.loadTrack = function (trackConfigurations) {
        var self = this,
            promises;

        promises = [];
        _.each(trackConfigurations, function (config) {

            igv.inferTrackTypes(config);

            if ("annotation" === config.type && config.color === undefined) {
                config.color = DEFAULT_ANNOTATION_COLOR;
            }

            config.height = self.layoutController.track_height;

            promises.push(loadIGVTrack(config));   // X track
            promises.push(loadIGVTrack(config));   // Y track

        });

        Promise
            .all(promises)
            .then(function (tracks) {
                var trackXYPairs = [],
                    index;

                for (index = 0; index < tracks.length; index += 2) {
                    trackXYPairs.push({x: tracks[index], y: tracks[index + 1]});
                }

                self.addTrackXYPairs(trackXYPairs);
            })
            .catch(function (error) {
                console.log(error.message);
                alert(error.message);
            });

    };

    function loadIGVTrack (config) {

        return new Promise(function (fulfill, reject) {

            var newTrack;

            newTrack = igv.createTrackWithConfiguration(config);

            if (undefined === newTrack) {
                reject(new Error('Could not create track'));
            } else if (typeof newTrack.getFileHeader === "function") {

                newTrack
                    .getFileHeader()
                    .then(function (header) {
                        fulfill(newTrack);
                    })
                    .catch(reject);

            } else {
                fulfill(newTrack);
            }
        });

    };

    hic.Browser.prototype.addTrackXYPairs = function (trackXYPairs) {
        hic.GlobalEventBus.post(hic.Event("TrackLoad", {trackXYPairs: trackXYPairs}));
    };

    hic.Browser.prototype.renderTracks = function (doSyncCanvas) {

        var list;

        if (_.size(this.trackRenderers) > 0) {

            // append each x-y track pair into a single list for Promise'ing
            list = [];
            _.each(this.trackRenderers, function (xy) {

                // sync canvas size with container div if needed
                _.each(xy, function (r) {
                    if (true === doSyncCanvas) {
                        r.syncCanvas();
                    }
                });

                // concatenate Promises
                list.push(xy.x.promiseToRepaint());
                list.push(xy.y.promiseToRepaint());
            });


            // Execute list of async Promises serially, waiting for
            // completion of one before executing the next.
            Promise
                .all(list)
                .then(function (strings) {
                    // console.log(strings.join('\n'));
                })
                .catch(function (error) {
                    console.log(error.message)
                });

        }

    };

    hic.Browser.prototype.renderTrackXY = function (trackXY) {
        var list;

        // append each x-y track pair into a single list for Promise'ing
        list = [];

        list.push(trackXY.x.promiseToRepaint());
        list.push(trackXY.y.promiseToRepaint());

        Promise
            .all(list)
            .then(function (strings) {
                // console.log(strings.join('\n'));
            })
            .catch(function (error) {
                console.log(error.message)
            });

    };

    hic.Browser.prototype.loadHicFile = function (config) {

        var self = this;

        if (!config.url) {
            console.log("No .hic url specified");
            return;
        }

        this.url = config.url;

        this.name = config.name;

        this.layoutController.removeAllTrackXYPairs();

        this.hicReader = new hic.HiCReader(config);

        self.contactMatrixView.clearCaches();

        self.contactMatrixView.startSpinner();

        self.hicReader
            .loadDataset()
            .then(function (dataset) {

                var previousGenomeId = self.genome ? self.genome.id : undefined;

                self.contactMatrixView.stopSpinner();

                self.dataset = dataset;

                self.genome = new hic.Genome(self.dataset.genomeId, self.dataset.chromosomes);

                igv.browser.genome = self.genome;

                if (config.state) {
                    self.setState(config.state);
                }
                else {
                    self.setState(defaultState.clone());
                    self.contactMatrixView.computeColorScale = true;
                }
                self.contactMatrixView.setDataset(dataset);

                if(self.genome.id !== previousGenomeId) {
                    hic.GlobalEventBus.post(hic.Event("GenomeChange", self.genome.id));
                }

                hic.GlobalEventBus.post(hic.Event("MapLoad", dataset));

                if (config.colorScale) {
                    self.getColorScale().high = config.colorScale;
                }

                if (config.tracks) {
                    // Tracks can be embedded when restored from a URL
                    self.loadTrack(config.tracks);
                }

            })
            .catch(function (error) {
                self.contactMatrixView.stopSpinner();
                console.log(error);
            });
    };

    function findDefaultZoom(bpResolutions, defaultPixelSize, chrLength) {

        var viewDimensions = this.contactMatrixView.getViewDimensions(),
            d = Math.max(viewDimensions.width, viewDimensions.height),
            nBins = d / defaultPixelSize,
            z;

        for (z = bpResolutions.length - 1; z >= 0; z--) {
            if (chrLength / bpResolutions[z] <= nBins) {
                return z;
            }
        }
        return 0;

    }

    hic.Browser.prototype.parseGotoInput = function (string) {

        var self = this,
            loci = string.split(' '),
            xLocus,
            yLocus;


        if (loci.length === 1) {
            xLocus = self.parseLocusString(loci[0]);
            yLocus = xLocus;
        } else {
            xLocus = self.parseLocusString(loci[0]);
            yLocus = self.parseLocusString(loci[1]);
            if (yLocus === undefined) yLocus = xLocus;
        }

        if (xLocus === undefined) {
            // Try a gene name search.
            hic.geneSearch(this.genome.id, loci[0].trim())

                .then(function (result) {
                    if (result) {
                        igv.FeatureTrack.selectedGene = loci[0].trim();
                        xLocus = self.parseLocusString(result);
                        yLocus = xLocus;
                        self.state.selectedGene = loci[0].trim();
                        self.goto(xLocus.chr, xLocus.start, xLocus.end, yLocus.chr, yLocus.start, yLocus.end, 5000);
                    }
                    else {
                        alert('No feature found with name "' + loci[0] + '"');
                    }
                })
                .catch(function (error) {
                    alert(error);
                    console.log(error);
                });
        } else {

            if (xLocus.wholeChr && yLocus.wholeChr) {
                self.setChromosomes(xLocus.chr, yLocus.chr);
            }
            else {
                self.goto(xLocus.chr, xLocus.start, xLocus.end, yLocus.chr, yLocus.start, yLocus.end, 200);
            }
        }

    }

    hic.Browser.prototype.findMatchingZoomIndex = function (targetResolution, resolutionArray) {
        var z;
        for (z = resolutionArray.length - 1; z > 0; z--) {
            if (resolutionArray[z] >= targetResolution) {
                return z;
            }
        }
        return 0;
    };

    hic.Browser.prototype.parseLocusString = function (locus) {

        var self = this,
            parts,
            chrName,
            extent,
            succeeded,
            chromosomeNames,
            locusObject = {},
            numeric;

        parts = locus.trim().split(':');

        chromosomeNames = _.map(self.dataset.chromosomes, function (chr) {
            return chr.name;
        });

        chrName = this.genome.getChromosomeName(parts[0]);

        if (!_.contains(chromosomeNames, chrName)) {
            return undefined;
        } else {
            locusObject.chr = _.indexOf(chromosomeNames, chrName);
        }


        if (parts.length === 1) {
            // Chromosome name only
            locusObject.start = 0;
            locusObject.end = this.dataset.chromosomes[locusObject.chr].size;
            locusObject.wholeChr = true;
        } else {
            extent = parts[1].split("-");
            if (extent.length !== 2) {
                return undefined;
            }
            else {
                numeric = extent[0].replace(/\,/g, '');
                locusObject.start = isNaN(numeric) ? undefined : parseInt(numeric, 10) - 1;

                numeric = extent[1].replace(/\,/g, '');
                locusObject.end = isNaN(numeric) ? undefined : parseInt(numeric, 10);
            }
        }
        return locusObject;
    };

    hic.Browser.prototype.setZoom = function (zoom) {

        this.contactMatrixView.clearCaches();
        this.contactMatrixView.computeColorScale = true;

        // Shift x,y to maintain center, if possible
        var bpResolutions = this.dataset.bpResolutions,
            currentResolution = bpResolutions[this.state.zoom],
            viewDimensions = this.contactMatrixView.getViewDimensions(),
            xCenter = this.state.x + viewDimensions.width / (2 * this.state.pixelSize),    // center in bins
            yCenter = this.state.y + viewDimensions.height / (2 * this.state.pixelSize),    // center in bins
            newResolution = bpResolutions[zoom],
            newXCenter = xCenter * (currentResolution / newResolution),
            newYCenter = yCenter * (currentResolution / newResolution),
            newPixelSize = Math.max(defaultPixelSize, minPixelSize.call(this, this.state.chr1, this.state.chr2, zoom));


        this.state.zoom = zoom;
        this.state.x = Math.max(0, newXCenter - viewDimensions.width / (2 * newPixelSize));
        this.state.y = Math.max(0, newYCenter - viewDimensions.height / (2 * newPixelSize));
        this.state.pixelSize = newPixelSize;

        this.clamp();

        hic.GlobalEventBus.post(hic.Event("LocusChange", this.state));
    };

    hic.Browser.prototype.updateLayout = function () {
        this.state.pixelSize = Math.max(defaultPixelSize, minPixelSize.call(this, this.state.chr1, this.state.chr2, this.state.zoom));
        this.clamp();
        this.renderTracks(true);
        this.contactMatrixView.clearCaches();
        this.contactMatrixView.update();


    };

    hic.Browser.prototype.setChromosomes = function (chr1, chr2) {

        this.state.chr1 = Math.min(chr1, chr2);
        this.state.chr2 = Math.max(chr1, chr2);
        this.state.zoom = 0;
        this.state.x = 0;
        this.state.y = 0;

        this.state.pixelSize = Math.min(maxPixelSize, Math.max(defaultPixelSize, minPixelSize.call(this, this.state.chr1, this.state.chr2, this.state.zoom)));

        this.contactMatrixView.computeColorScale = true;

        hic.GlobalEventBus.post(hic.Event("LocusChange", this.state));
    };

    hic.Browser.prototype.updateLayout = function () {
        this.state.pixelSize = Math.max(defaultPixelSize, minPixelSize.call(this, this.state.chr1, this.state.chr2, this.state.zoom));
        this.clamp();
        this.renderTracks(true);
        this.layoutController.xAxisRuler.update();
        this.layoutController.yAxisRuler.update();
        this.contactMatrixView.clearCaches();
        this.contactMatrixView.update();
    };

    function minPixelSize(chr1, chr2, zoom) {
        var viewDimensions = this.contactMatrixView.getViewDimensions(),
            chr1Length = this.dataset.chromosomes[chr1].size,
            chr2Length = this.dataset.chromosomes[chr2].size,
            binSize = this.dataset.bpResolutions[zoom],
            nBins1 = chr1Length / binSize,
            nBins2 = chr2Length / binSize;

        // Crude test for "whole genome"
        var isWholeGenome = this.dataset.chromosomes[chr1].name === "All";
        if (isWholeGenome) {
            nBins1 *= 1000;
            nBins2 *= 1000;
        }

        return Math.min(viewDimensions.width / nBins1, viewDimensions.height / nBins2);
//        return Math.min(viewDimensions.width * (binSize / chr1Length), viewDimensions.height * (binSize / chr2Length));
    }

    hic.Browser.prototype.update = function () {
        hic.GlobalEventBus.post(hic.Event("LocusChange", this.state));
    };

    /**
     * Set the matrix state.  Used ot restore state from a bookmark
     * @param state  browser state
     */
    hic.Browser.prototype.setState = function (state) {

        this.state = state;

        // Possibly adjust pixel size
        this.state.pixelSize = Math.max(state.pixelSize, minPixelSize.call(this, this.state.chr1, this.state.chr2, this.state.zoom));

        hic.GlobalEventBus.post(hic.Event("LocusChange", this.state));

    };

    hic.Browser.prototype.setNormalization = function (normalization) {

        this.state.normalization = normalization;
        this.contactMatrixView.computeColorScale = true;
        hic.GlobalEventBus.post(hic.Event("NormalizationChange", this.state.normalization))

    };

    hic.Browser.prototype.shiftPixels = function (dx, dy) {

        this.state.x += dx;
        this.state.y += dy;
        this.clamp();

        var locusChangeEvent = hic.Event("LocusChange", this.state);
        locusChangeEvent.dragging = true;
        hic.GlobalEventBus.post(locusChangeEvent);
    };


    hic.Browser.prototype.goto = function (chr1, bpX, bpXMax, chr2, bpY, bpYMax, minResolution) {


        var self = this,
            xCenter,
            yCenter,
            targetResolution,
            viewDimensions = this.contactMatrixView.getViewDimensions(),
            viewWidth = viewDimensions.width,
            maxExtent;

        if (minResolution === undefined) minResolution = 200;

        targetResolution = Math.max((bpXMax - bpX) / viewDimensions.width, (bpYMax - bpY) / viewDimensions.height);


        if (targetResolution < minResolution) {
            maxExtent = viewWidth * minResolution;
            xCenter = (bpX + bpXMax) / 2;
            yCenter = (bpY + bpYMax) / 2;
            bpX = Math.max(xCenter - maxExtent / 2);
            bpY = Math.max(0, yCenter - maxExtent / 2);
            targetResolution = minResolution;
        }

        var bpResolutions = self.dataset.bpResolutions,
            newZoom = self.findMatchingZoomIndex(targetResolution, bpResolutions),
            newResolution = bpResolutions[newZoom],
            newPixelSize = Math.max(1, newResolution / targetResolution),
            newXBin = bpX / newResolution,
            newYBin = bpY / newResolution;

        self.state.chr1 = chr1;
        self.state.chr2 = chr2;
        self.state.zoom = newZoom;
        self.state.x = newXBin;
        self.state.y = newYBin;
        self.state.pixelSize = newPixelSize;

        self.contactMatrixView.clearCaches();
        self.contactMatrixView.computeColorScale = true;
        hic.GlobalEventBus.post(hic.Event("LocusChange", self.state));

    };

    hic.Browser.prototype.clamp = function () {
        var viewDimensions = this.contactMatrixView.getViewDimensions(),
            chr1Length = this.dataset.chromosomes[this.state.chr1].size,
            chr2Length = this.dataset.chromosomes[this.state.chr2].size,
            binSize = this.dataset.bpResolutions[this.state.zoom],
            maxX = (chr1Length / binSize) - (viewDimensions.width / this.state.pixelSize),
            maxY = (chr2Length / binSize) - (viewDimensions.height / this.state.pixelSize);

        // Negative maxX, maxY indicates pixelSize is not enough to fill view.  In this case we clamp x, y to 0,0
        maxX = Math.max(0, maxX);
        maxY = Math.max(0, maxY);

        this.state.x = Math.min(Math.max(0, this.state.x), maxX);
        this.state.y = Math.min(Math.max(0, this.state.y), maxY);
    };

    hic.Browser.prototype.receiveEvent = function (event) {

        if (event.dragging) return;

        this.updateHref(event);
    };


    hic.Browser.prototype.resolution = function () {
        return this.dataset.bpResolutions[this.state.zoom];
    };

    function gup(href, name) {
        name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
        var regexS = "[\\?&]" + name + "=([^&#]*)";
        var regex = new RegExp(regexS);
        var results = regex.exec(href);
        if (results == null)
            return undefined;
        else
            return results[1];
    }

    function replaceURIParameter(key, newValue, href) {


        var oldValue = gup(href, key);
        if (oldValue) {
            href = href.replace(key + "=" + oldValue, key + "=" + encodeURIComponent(newValue));
        }
        else {
            var delim = href.includes("?") ? "&" : "?";
            href += delim + key + "=" + encodeURIComponent(newValue);
        }

        return href;

    }

    hic.State = function (chr1, chr2, zoom, x, y, pixelSize) {

        this.chr1 = chr1;
        this.chr2 = chr2;
        this.zoom = zoom;
        this.x = x;
        this.y = y;
        this.pixelSize = pixelSize;
    };

    // Set default values for config properties
    function setDefaults(config) {
        if (config.showChromosomeSelector === undefined) {
            config.showChromosomeSelector = true;
        }
    }


    return hic;

})
(hic || {});

/*
 *  The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 The Regents of the University of California
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated documentation files (the "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the
 * following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial
 * portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,  FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */

/**
 * Created by dat on 3/3/17.
 */

var hic = (function (hic) {

    hic.ColorScaleWidget = function (browser, $container) {

        var $label;

        this.browser = browser;

        this.$container = $('<div class="hic-colorscale-widget-container">');
        $container.append(this.$container);

        $label = $('<div>');
        this.$container.append($label);
        $label.text('Color Scale');

        this.$high_colorscale_input = $('<input type="text" placeholder="high">');
        this.$container.append(this.$high_colorscale_input);
        this.$high_colorscale_input.on('change', function(e){
            var value = $(this).val(),
                numeric = value.replace(/\,/g, '');
            if (isNaN(numeric)) {
   // Error message ?
            }
            else {
                browser.updateColorScale(parseInt(numeric, 10))
            }
        });

        hic.GlobalEventBus.subscribe("MapLoad", this);
        hic.GlobalEventBus.subscribe("ColorScale", this);
    };

    hic.ColorScaleWidget.prototype.receiveEvent = function(event) {

        var colorScale;
        if (event.type === "MapLoad" || event.type === "ColorScale") {

            colorScale = Math.round( this.browser.getColorScale().high );

            this.$high_colorscale_input.val(igv.numberFormatter(colorScale));
        }

    };

    return hic;

})
(hic || {});

/*
 *  The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 The Regents of the University of California
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated documentation files (the "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the
 * following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial
 * portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,  FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */


/**
 * @author Jim Robinson
 */


var hic = (function (hic) {


    hic.Dataset = function (hicReader) {
        this.hicReader = hicReader;
        this.url = hicReader.path;
        this.matrixCache = {};
        this.blockCache = {};
        this.blockCacheKeys = [];
        this.normVectorCache = {};
    };

    /* ------- Begin modifications by Silas Hsu ------- */
    // Additionally, I modified getBlock, which wasn't clearing blocks out of the cache properly.

    hic.Dataset.MIN_BINS_PER_REGION = 50;
    hic.Dataset.BLOCK_CACHE_SIZE = 20;

    hic.Dataset.prototype.findChromosomeIndex = function(name) {
        var nameToFind = name.replace("chr", "");
        nameToFind = nameToFind.replace("M", "MT");
        let found = this.chromosomes.find(function (chromosome) {
            return chromosome.name == nameToFind;
        });
        if (found) {
            return found.index;
        }
        return -1;
    }

    /**
     * Returns the largest bin size for a region such that there are at least MIN_BINS_PER_REGION in the region.
     * @param {number} regionLength - the length of the region
     * @returns {number} the bin size for the region
     */
    hic.Dataset.prototype.regionLengthToZoomIndex = function(regionLength) {
        for (let i = 0; i < this.bpResolutions.length; i++) { // Iterate through bin sizes, largest to smallest
            if (regionLength > hic.Dataset.MIN_BINS_PER_REGION * this.bpResolutions[i]) {
                return i;
            }
        }
        return this.bpResolutions.length - 1;
    }

    hic.Dataset.prototype.binsizeToZoomIndex = function(targetResolution) { // findMatchingZoomIndex
        for (let z = this.bpResolutions.length - 1; z > 0; z--) {
            if (this.bpResolutions[z] >= targetResolution) {
                return z;
            }
        }
        return 0;
    }
    /* ------- End modifications by Silas Hsu ------- */

    hic.Dataset.prototype.clearCaches = function () {
        this.matrixCache = {};
        this.blockCache = {};
        this.normVectorCache = {};

    };

    hic.Dataset.prototype.getMatrix = function (chr1, chr2) {

        var self = this,
            reader = this.hicReader,
            key = "" + Math.min(chr1, chr2) + "_" + Math.max(chr1, chr2);
        if (this.matrixCache.hasOwnProperty(key)) {
            return Promise.resolve(self.matrixCache[key]);
        } else {
            return new Promise(function (fulfill, reject) {


                reader
                    .readMatrix(key)
                    .then(function (matrix) {


                        self.matrixCache[key] = matrix;
                        fulfill(matrix);
                    })
                    .catch(reject);
            })

        }
    };


    hic.Dataset.prototype.getNormalizedBlock = function (zd, blockNumber, normalization) {

        var self = this;

        return new Promise(function (fulfill, reject) {

            self.getBlock(zd, blockNumber)

                .then(function (block) {

                    if (normalization === undefined || "NONE" === normalization || block === null || block === undefined) {
                        fulfill(block);
                    }
                    else {

                        // Get the norm vectors serially, its very likely they are the same and the second will be cached
                        self.getNormalizationVector(normalization, zd.chr1.index, zd.zoom.unit, zd.zoom.binSize)

                            .then(function (nv1) {

                                self.getNormalizationVector(normalization, zd.chr2.index, zd.zoom.unit, zd.zoom.binSize)

                                    .then(function (nv2) {
                                        var normRecords = [],
                                            normBlock;

                                        if(nv1 == undefined ||nv2 == undefined) {
                                            console.log("Undefined normalization vector for: " + normalization);
                                            fulfill(block);
                                        }

                                        else {
                                            block.records.forEach(function (record) {

                                                var x = record.bin1,
                                                    y = record.bin2,
                                                    counts,
                                                    nvnv = nv1.data[x] * nv2.data[y];

                                                if (nvnv[x] !== 0 && !isNaN(nvnv)) {
                                                    counts = record.counts / nvnv;
                                                    //countArray.push(counts);
                                                    normRecords.push(new hic.ContactRecord(x, y, counts));
                                                }
                                            })

                                            normBlock = new hic.Block(blockNumber, zd, normRecords);   // TODO - cache this?

                                            normBlock.percentile95 = block.percentile95;

                                            fulfill(normBlock);
                                        }
                                    })
                                    .catch(reject)

                            }).catch(reject);
                    }
                })
                .catch(reject);
        })
    }

    hic.Dataset.prototype.getBlock = function (zd, blockNumber) {

        var self = this,
            key = "" + zd.chr1.name + "_" + zd.chr2.name + "_" + zd.zoom.binSize + "_" + zd.zoom.unit + "_" + blockNumber;


        if (this.blockCache.hasOwnProperty(key)) {
            return Promise.resolve(this.blockCache[key]);
        } else {
            return new Promise(function (fulfill, reject) {

                var reader = self.hicReader;

                reader.readBlock(blockNumber, zd)

                    .then(function (block) {

                        // Cache at most BLOCK_CACHE_SIZE blocks
                        if(self.blockCacheKeys.length > hic.Dataset.BLOCK_CACHE_SIZE) {
                            //self.blockCache[self.blockCacheKeys[0]] = undefined;
                            delete self.blockCache[self.blockCacheKeys[0]]; // Added by Silas Hsu
                            self.blockCacheKeys.shift();
                        }

                        self.blockCacheKeys.push(key);
                        self.blockCache[key] = block;

                        fulfill(block);

                    })
                    .catch(function (error) {
                        reject(error);
                    })
            })
        }
    };

    hic.Dataset.prototype.getNormalizationVector = function (type, chrIdx, unit, binSize) {

        var self = this,
            key = hic.getNormalizationVectorKey(type, chrIdx, unit, binSize);


        if (this.normVectorCache.hasOwnProperty(key)) {
            return Promise.resolve(this.normVectorCache[key]);
        } else {
            return new Promise(function (fulfill, reject) {

                var reader = self.hicReader;

                reader.readNormalizationVector(type, chrIdx, unit, binSize)

                    .then(function (nv) {

                        self.normVectorCache[key] = nv;

                        fulfill(nv);

                    })
                    .catch(reject)
            })
        }
    };

    hic.Block = function (blockNumber, zoomData, records) {
        this.blockNumber = blockNumber;
        this.zoomData = zoomData;
        this.records = records;
    };


    hic.ContactRecord = function (bin1, bin2, counts) {
        this.bin1 = bin1;
        this.bin2 = bin2;
        this.counts = counts;
    };


    return hic;

})
(hic || {});

/*
 *  The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 The Regents of the University of California
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated documentation files (the "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the
 * following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial
 * portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,  FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */

/**
 * Created by dat on 3/3/17.
 */

var hic = (function (hic) {

    hic.LocusGoto = function (browser, $container) {
        var $label;

        this.browser = browser;

        this.$container = $('<div class="hic-chromosome-goto-container">');
        $container.append(this.$container);

        // shim for nav alignment purposes
        $label = $('<div>');
        this.$container.append($label);
        $label.text('shim');

        this.$resolution_selector = $('<input type="text" placeholder="chr-x-axis chr-y-axis">');
        this.$container.append(this.$resolution_selector);

        this.$resolution_selector.on('change', function (e) {
            var value = $(this).val();
            browser.parseGotoInput(value);
        });

        hic.GlobalEventBus.subscribe("LocusChange", this);
    };

    hic.LocusGoto.prototype.receiveEvent = function (event) {

        var self = this,
            bpPerBin,
            pixelsPerBin,
            dimensionsPixels,
            chrs,
            startBP1,
            startBP2,
            endBP1,
            endBP2,
            xy,
            state,
            chr1,
            chr2;

        if (event.type === "LocusChange") {

            state = event.data,
            chr1 = self.browser.dataset.chromosomes[state.chr1];
            chr2 = self.browser.dataset.chromosomes[state.chr2];

            bpPerBin = this.browser.dataset.bpResolutions[state.zoom];
            dimensionsPixels = this.browser.contactMatrixView.getViewDimensions();
            pixelsPerBin = state.pixelSize;

            startBP1 = 1 + Math.round(state.x * bpPerBin);
            startBP2 = 1 + Math.round(state.y * bpPerBin);

            endBP1 = Math.min(chr1.size, Math.round(((dimensionsPixels.width / pixelsPerBin) * bpPerBin)) + startBP1 - 1);
            endBP2 = Math.min(chr2.size, Math.round(((dimensionsPixels.height / pixelsPerBin) * bpPerBin)) + startBP2 - 1);

            xy = chr1.name + ":" + igv.numberFormatter(startBP1) + "-" + igv.numberFormatter(endBP1) + " " +
                chr2.name + ":" + igv.numberFormatter(startBP2) + "-" + igv.numberFormatter(endBP2);


            this.$resolution_selector.val(xy);
        }


    };

    return hic;

})
(hic || {});

/*
 *  The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 The Regents of the University of California
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated documentation files (the "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the
 * following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial
 * portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,  FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */


/**
 * @author Jim Robinson
 */


var hic = (function (hic) {

    var Short_MIN_VALUE = -32768;

    hic.HiCReader = function (config) {

        this.path = config.url;
        this.headPath = config.headURL || this.path;
        this.config = config;
        this.fragmentSitesCache = {};

    };

    hic.HiCReader.prototype.loadDataset = function () {

        var self = this,
            dataset = new hic.Dataset(this);

        return new Promise(function (fulfill, reject) {

            self.readHeader(dataset)
                .then(function () {
                    self.readFooter(dataset)
                        .then(function () {
                            fulfill(dataset);
                        })
                        .catch(reject)
                })
                .catch(reject)
        });
    }

    hic.HiCReader.prototype.readHeader = function (dataset) {

        var self = this;

        return new Promise(function (fulfill, reject) {

            igvxhr.loadArrayBuffer(self.path,
                {
                    headers: self.config.headers,
                    range: {start: 0, size: 64000},                     // TODO -- a guess, what if not enough ?
                    withCredentials: self.config.withCredentials
                }).then(function (data) {

                if (!data) {
                    fulfill(null);
                    return;
                }

                var binaryParser = new igv.BinaryParser(new DataView(data));

                self.magic = binaryParser.getString();
                self.version = binaryParser.getInt();
                self.masterIndexPos = binaryParser.getLong();

                dataset.genomeId = binaryParser.getString();
                dataset.attributes = {};
                var nAttributes = binaryParser.getInt();
                while (nAttributes-- > 0) {
                    dataset.attributes[binaryParser.getString()] = binaryParser.getString();
                }

                dataset.chromosomes = [];
                var nChrs = binaryParser.getInt(), i = 0;
                while (nChrs-- > 0) {
                    dataset.chromosomes.push({index: i, name: binaryParser.getString(), size: binaryParser.getInt()});
                    i++;
                }
                self.chromosomes = dataset.chromosomes;  // Needed for certain reading functions

                dataset.bpResolutions = [];
                var nBpResolutions = binaryParser.getInt();
                while (nBpResolutions-- > 0) {
                    dataset.bpResolutions.push(binaryParser.getInt());
                }

                // We don't need frag level data yet, so don't load it
                // self.fragResolutions = [];
                // var nFragResolutions = binaryParser.getInt();
                // while (nFragResolutions-- > 0) {
                //     self.fragResolutions.push(binaryParser.getInt());
                // }
                //
                // if (nFragResolutions > 0) {
                //     self.sites = [];
                //     var nSites = binaryParser.getInt();
                //     while (nSites-- > 0) {
                //         self.sites.push(binaryParser.getInt());
                //     }
                // }


                fulfill(self);

            }).catch(function (error) {
                reject(error);
            });

        });
    };

    hic.HiCReader.prototype.readFooter = function (dataset) {

        var self = this,
            range = {start: this.masterIndexPos, size: 60000000};   // 60 mb,  hopefully enough but we can't really know for sure

        return new Promise(function (fulfill, reject) {

            igvxhr.loadArrayBuffer(self.path,
                {
                    headers: self.config.headers,
                    range: range,
                    withCredentials: self.config.withCredentials
                }).then(function (data) {

                var key, pos, size;

                if (!data) {
                    fulfill(null);
                    return;
                }

                var binaryParser = new igv.BinaryParser(new DataView(data));

                var nBytes = binaryParser.getInt();


                self.masterIndex = {};
                var nEntries = binaryParser.getInt();
                while (nEntries-- > 0) {
                    key = binaryParser.getString();
                    pos = binaryParser.getLong();
                    size = binaryParser.getInt();
                    self.masterIndex[key] = {start: pos, size: size};
                }


                self.expectedValueVectorsPosition = self.masterIndexPos + binaryParser.position;

                dataset.expectedValueVectors = {};
                nEntries = binaryParser.getInt();
                while (nEntries-- > 0) {
                    var type = "NONE";
                    var unit = binaryParser.getString();
                    var binSize = binaryParser.getInt();
                    var nValues = binaryParser.getInt();
                    var values = [];
                    while (nValues-- > 0) {
                        values.push(binaryParser.getDouble());
                    }
                    var nChrScaleFactors = binaryParser.getInt();
                    var normFactors = {};
                    while (nChrScaleFactors-- > 0) {
                        normFactors[binaryParser.getInt()] = binaryParser.getDouble();
                    }
                    var key = unit + "_" + binSize + "_" + type;
                    //  dataset.expectedValueVectors[key] =
                    //      new ExpectedValueFunction(type, unit, binSize, values, normFactors);
                }

                if (self.version >= 6) { //binaryParser.position = 11025066
                    dataset.normalizedExpectedValueVectors = {};
                    nEntries = binaryParser.getInt();
                    while (nEntries-- > 0) {
                        var type = binaryParser.getString();
                        var unit = binaryParser.getString();
                        var binSize = binaryParser.getInt();
                        var nValues = binaryParser.getInt();
                        var values = [];
                        while (nValues-- > 0) {
                            values.push(binaryParser.getDouble());
                        }
                        var nChrScaleFactors = binaryParser.getInt();
                        var normFactors = {};
                        while (nChrScaleFactors-- > 0) {
                            normFactors[binaryParser.getInt()] = binaryParser.getDouble();
                        }
                        var key = unit + "_" + binSize + "_" + type;
                        //   dataset.normalizedExpectedValueVectors[key] =
                        //       new ExpectedValueFunction(type, unit, binSize, values, normFactors);
                    }

                    // Normalization vector index

                    self.normVectorIndex = {};
                    dataset.normalizationTypes = ['NONE'];
                    nEntries = binaryParser.getInt();
                    while (nEntries-- > 0) {
                        type = binaryParser.getString();
                        var chrIdx = binaryParser.getInt();
                        unit = binaryParser.getString();
                        binSize = binaryParser.getInt();
                        var filePosition = binaryParser.getLong();
                        var sizeInBytes = binaryParser.getInt();
                        key = hic.getNormalizationVectorKey(type, chrIdx, unit, binSize);

                        if (_.contains(dataset.normalizationTypes, type) === false) {
                            dataset.normalizationTypes.push(type);
                        }
                        self.normVectorIndex[key] = {filePosition: filePosition, size: sizeInBytes};
                    }
                }

                fulfill(self); //binaryParser.position = 42473140   masterIndexPos = 54343629146

            }).catch(function (error) {
                reject(error);
            });

        });
    };

    hic.HiCReader.prototype.readNormVectorIndex = function (dataset) {

        if (this.expectedValueVectorsPosition === undefined) {
            return Promise.resolve();
        }

        if (this.normVectorIndex) {
            return Promise.resolve(normVectorIndex);
        }

        var self = this,
            range = {start: this.expectedValueVectorsPosition, size: 60000000};   // 60 mb,  hopefully enough but we can't really know for sure

        return new Promise(function (fulfill, reject) {

            igvxhr.loadArrayBuffer(self.path,
                {
                    headers: self.config.headers,
                    range: range,
                    withCredentials: self.config.withCredentials
                }).then(function (data) {

                var key, pos, size;

                if (!data) {
                    fulfill(null);
                    return;
                }

                var binaryParser = new igv.BinaryParser(new DataView(data));

                dataset.expectedValueVectors = {};
                nEntries = binaryParser.getInt();
                while (nEntries-- > 0) {
                    var type = "NONE";
                    var unit = binaryParser.getString();
                    var binSize = binaryParser.getInt();
                    var nValues = binaryParser.getInt();
                    var values = [];
                    while (nValues-- > 0) {
                        values.push(binaryParser.getDouble());
                    }
                    var nChrScaleFactors = binaryParser.getInt();
                    var normFactors = {};
                    while (nChrScaleFactors-- > 0) {
                        normFactors[binaryParser.getInt()] = binaryParser.getDouble();
                    }
                    var key = unit + "_" + binSize + "_" + type;
                    //  dataset.expectedValueVectors[key] =
                    //      new ExpectedValueFunction(type, unit, binSize, values, normFactors);
                }

                if (self.version >= 6) { //binaryParser.position = 11025066
                    dataset.normalizedExpectedValueVectors = {};
                    nEntries = binaryParser.getInt();
                    while (nEntries-- > 0) {
                        var type = binaryParser.getString();
                        var unit = binaryParser.getString();
                        var binSize = binaryParser.getInt();
                        var nValues = binaryParser.getInt();
                        var values = [];
                        while (nValues-- > 0) {
                            values.push(binaryParser.getDouble());
                        }
                        var nChrScaleFactors = binaryParser.getInt();
                        var normFactors = {};
                        while (nChrScaleFactors-- > 0) {
                            normFactors[binaryParser.getInt()] = binaryParser.getDouble();
                        }
                        var key = unit + "_" + binSize + "_" + type;
                        //   dataset.normalizedExpectedValueVectors[key] =
                        //       new ExpectedValueFunction(type, unit, binSize, values, normFactors);
                    }

                    // Normalization vector index

                    self.normVectorIndex = {};
                    dataset.normalizationTypes = ['NONE'];
                    nEntries = binaryParser.getInt();
                    while (nEntries-- > 0) {
                        type = binaryParser.getString();
                        var chrIdx = binaryParser.getInt();
                        unit = binaryParser.getString();
                        binSize = binaryParser.getInt();
                        var filePosition = binaryParser.getLong();
                        var sizeInBytes = binaryParser.getInt();
                        key = hic.getNormalizationVectorKey(type, chrIdx, unit, binSize);

                        if (_.contains(dataset.normalizationTypes, type) === false) {
                            dataset.normalizationTypes.push(type);
                        }
                        self.normVectorIndex[key] = {filePosition: filePosition, size: sizeInBytes};
                    }
                }

                fulfill(self); //binaryParser.position = 42473140   masterIndexPos = 54343629146

            }).catch(function (error) {
                reject(error);
            });

        });
    };

    hic.HiCReader.prototype.readMatrix = function (key) {

        var self = this;
        var idx = self.masterIndex[key];
        if (idx == null) {
            return Promise.resolve(undefined);
        }

        return new Promise(function (fulfill, reject) {

            igvxhr.loadArrayBuffer(self.path,
                {
                    headers: self.config.headers,
                    range: {start: idx.start, size: idx.size},
                    withCredentials: self.config.withCredentials
                })
                .then(function (data) {

                        if (!data) {
                            fulfill(null);
                            return;
                        }


                        var dis = new igv.BinaryParser(new DataView(data));

                        var c1 = dis.getInt();
                        var c2 = dis.getInt();

                        var chr1 = self.chromosomes[c1];
                        var chr2 = self.chromosomes[c2];

                        // # of resolution levels (bp and frags)
                        var nResolutions = dis.getInt();

                        var zdList = [];

                        var p1 = getSites.call(self, chr1.name);
                        var p2 = getSites.call(self, chr2.name);

                        Promise.all([p1, p2])
                            .then(function (results) {
                                var sites1 = results[0];
                                var sites2 = results[1];

                                while (nResolutions-- > 0) {
                                    var zd = parseMatixZoomData(chr1, chr2, sites1, sites2, dis);
                                    zdList.push(zd);
                                }

                                fulfill(new Matrix(c1, c2, zdList));

                            })
                            .catch(function (err) {
                                reject(err);
                            });
                    }
                ).catch(reject)
        });
    };

    hic.HiCReader.prototype.readBlock = function (blockNumber, zd) {

        var self = this,
            idx = null,
            i, j;

        var blockIndex = zd.blockIndexMap;
        if (blockIndex) {
            var idx = blockIndex[blockNumber];
        }
        if (!idx) {
            return Promise.resolve(null);
        }
        else {

            return new Promise(function (fulfill, reject) {

                igvxhr.loadArrayBuffer(self.path,
                    {
                        headers: self.config.headers,
                        range: {start: idx.filePosition, size: idx.size},
                        withCredentials: self.config.withCredentials
                    })
                    .then(function (data) {

                        if (!data) {
                            fulfill(null);
                            return;
                        }

                        var inflate = new Zlib.Inflate(new Uint8Array(data));
                        var plain = inflate.decompress();
                        data = plain.buffer;


                        var parser = new igv.BinaryParser(new DataView(data));
                        var nRecords = parser.getInt();
                        var records = [];

                        if (self.version < 7) {
                            for (i = 0; i < nRecords; i++) {
                                var binX = parser.getInt();
                                var binY = parser.getInt();
                                var counts = parser.getFloat();
                                records.push(new hic.ContactRecord(binX, binY, counts));
                            }
                        } else {

                            var binXOffset = parser.getInt();
                            var binYOffset = parser.getInt();

                            var useShort = parser.getByte() == 0;
                            var type = parser.getByte();

                            if (type === 1) {
                                // List-of-rows representation
                                var rowCount = parser.getShort();

                                for (i = 0; i < rowCount; i++) {

                                    binY = binYOffset + parser.getShort();
                                    var colCount = parser.getShort();

                                    for (j = 0; j < colCount; j++) {

                                        binX = binXOffset + parser.getShort();
                                        counts = useShort ? parser.getShort() : parser.getFloat();
                                        records.push(new hic.ContactRecord(binX, binY, counts));
                                    }
                                }
                            } else if (type == 2) {

                                var nPts = parser.getInt();
                                var w = parser.getShort();

                                for (i = 0; i < nPts; i++) {
                                    //int idx = (p.y - binOffset2) * w + (p.x - binOffset1);
                                    var row = Math.floor(i / w);
                                    var col = i - row * w;
                                    var bin1 = binXOffset + col;
                                    var bin2 = binYOffset + row;

                                    if (useShort) {
                                        counts = parser.getShort();
                                        if (counts != Short_MIN_VALUE) {
                                            records.push(new hic.ContactRecord(bin1, bin2, counts));
                                        }
                                    } else {
                                        counts = parser.getFloat();
                                        if (!isNaN(counts)) {
                                            records.push(new hic.ContactRecord(bin1, bin2, counts));
                                        }
                                    }

                                }

                            } else {
                                reject("Unknown block type: " + type);
                            }

                        }

                        var block = new hic.Block(blockNumber, zd, records);

                        fulfill(block);
                    })
                    .catch(reject);
            });
        }
    };



    function getSites(chrName) {

        var self = this;

        return new Promise(function (fulfill, reject) {

            var sites = self.fragmentSitesCache[chrName];
            if (sites) {
                fulfill(sites);
            }
            else if (self.fragmentSitesIndex) {
                var entry = self.fragmentSitesIndex[chrName];
                if (entry !== undefined && entry.nSites > 0) {
                    readSites(entry.position, entry.nSites).then(function (sites) {
                        self.fragmentSitesCache[chrName] = sites;
                        fulfill(sites);

                    }).catch(reject);
                }
            }
            else {
                fulfill(undefined);
            }
        });
    }

    function parseMatixZoomData(chr1, chr2, chr1Sites, chr2Sites, dis) {

        var unit = dis.getString();
        dis.getInt();                // Old "zoom" index -- not used

        // Stats.  Not used yet, but we need to read them anyway
        var sumCounts = dis.getFloat();
        var occupiedCellCount = dis.getFloat();
        var stdDev = dis.getFloat();
        var percent95 = dis.getFloat();

        var binSize = dis.getInt();
        var zoom = {unit: unit, binSize: binSize};

        var blockBinCount = dis.getInt();
        var blockColumnCount = dis.getInt();

        var zd = new MatrixZoomData(chr1, chr2, zoom, blockBinCount, blockColumnCount, chr1Sites, chr2Sites);

        var nBlocks = dis.getInt();
        var blockIndex = {};

        while (nBlocks-- > 0) {
            var blockNumber = dis.getInt();
            var filePosition = dis.getLong();
            var blockSizeInBytes = dis.getInt();
            blockIndex[blockNumber] = {filePosition: filePosition, size: blockSizeInBytes};
        }
        zd.blockIndexMap = blockIndex;

        var nBins1 = (chr1.size / binSize);
        var nBins2 = (chr2.size / binSize);
        var avgCount = (sumCounts / nBins1) / nBins2;   // <= trying to avoid overflows
        zd.averageCount = avgCount;
        zd.sumCounts = sumCounts;
        zd.stdDev = stdDev;
        zd.occupiedCellCount = occupiedCellCount;
        zd.percent95 = percent95;

        return zd;
    }

    hic.HiCReader.prototype.readNormalizationVector = function (type, chrIdx, unit, binSize) {

        var self = this,
            key = hic.getNormalizationVectorKey(type, chrIdx, unit.toString(), binSize);


        if (this.normVectorIndex == null) {
            return Promise.resolve(undefined);
        }

        var idx = this.normVectorIndex[key];
        if (!idx) {
            alert("Normalization option " + type + " not available at this resolution");
            return Promise.resolve(undefined);
        }

        return new Promise(function (fulfill, reject) {

            igvxhr.loadArrayBuffer(self.path,
                {
                    headers: self.config.headers,
                    range: {start: idx.filePosition, size: idx.size},
                    withCredentials: self.config.withCredentials
                })
                .then(function (data) {

                    if (!data) {
                        fulfill(null);
                        return;
                    }

                    // var inflate = new Zlib.Inflate(new Uint8Array(data));
                    // var plain = inflate.decompress();
                    // data = plain.buffer;

                    var parser = new igv.BinaryParser(new DataView(data));
                    var nValues = parser.getInt();
                    var values = [];
                    var allNaN = true;
                    for (var i = 0; i < nValues; i++) {
                        values[i] = parser.getDouble();
                        if (!isNaN(values[i])) {
                            allNaN = false;
                        }
                    }
                    if (allNaN) fulfill(null);
                    fulfill(new hic.NormalizationVector(type, chrIdx, unit, binSize, values));


                })
                .catch(reject);
        })
    }


    function ExpectedValueFunction(normType, unit, binSize, values, normFactors) {
        this.normType = normType;
        this.unit = unit;
        this.binSize = binSize;
        this.values = values;
        this.normFactors = normFactors;
    }

    function MatrixZoomData(chr1, chr2, zoom, blockBinCount, blockColumnCount, chr1Sites, chr2Sites) {
        this.chr1 = chr1;
        this.chr2 = chr2;
        this.zoom = zoom;
        this.blockBinCount = blockBinCount;
        this.blockColumnCount = blockColumnCount;
        this.chr1Sites = chr1Sites;
        this.chr2Sites = chr2Sites;
    }

    MatrixZoomData.prototype.getKey = function () {
        return this.chr1.name + "_" + this.chr2.name + "_" + this.zoom.unit + "_" + this.zoom.binSize;
    };

    function Matrix(chr1, chr2, zoomDataList) {

        var self = this;

        this.chr1 = chr1;
        this.chr2 = chr2;
        this.bpZoomData = [];
        this.fragZoomData = [];

        _.each(zoomDataList, function (zd) {
            if (zd.zoom.unit === "BP") {
                self.bpZoomData.push(zd);
            } else {
                self.fragZoomData.push(zd);
            }
        });
    }

    Matrix.prototype.getZoomData = function (zoom) {

        var zdArray = zoom.unit === "BP" ? this.bpZoomData : this.fragZoomData,
            i;

        for (i = 0; i < zdArray.length; i++) {
            var zd = zdArray[i];
            if (zoom.binSize === zd.zoom.binSize) {
                return zd;
            }
        }

        return undefined;
    };


    return hic;

})
(hic || {});

/*
 *  The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 The Regents of the University of California
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated documentation files (the "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the
 * following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial
 * portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,  FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */

/**
 * Created by dat on 3/4/17.
 */

var hic = (function (hic) {

    hic.ResolutionSelector = function (browser) {
        var self = this,
            elements,
            $label;

        this.browser = browser;

        $label = $('<div>');
        $label.text('Resolution (kb)');

        this.$resolution_selector = $('<select name="select">');
        this.$resolution_selector.attr('name', 'resolution_selector');

        this.$resolution_selector.on('change', function (e) {
            var zoomIndex = parseInt($(this).val());
            self.browser.setZoom(zoomIndex);
        });

        this.$container = $('<div class="hic-resolution-selector-container">');
        this.$container.append($label);
        this.$container.append(this.$resolution_selector);

        hic.GlobalEventBus.subscribe("LocusChange", this);
        hic.GlobalEventBus.subscribe("MapLoad", this);
    };

    hic.ResolutionSelector.prototype.receiveEvent = function (event) {

        if (event.type === "LocusChange") {
            var state = event.data;

            this.$resolution_selector
                .find('option')
                .filter(function (index) {
                    return index === state.zoom;
                })
                .prop('selected', true);
        } else if (event.type === "MapLoad") {

            var zoom =  this.browser.state.zoom;

            var elements = _.map(this.browser.dataset.bpResolutions, function (resolution, index) {
                var selected = zoom === index;

                return '<option' + ' value=' + index +  (selected ? ' selected': '') + '>' + igv.numberFormatter(Math.floor(resolution / 1e3)) + '</option>';
            });




            this.$resolution_selector.empty();
            this.$resolution_selector.append(elements.join(''));

        }

    };

    return hic;

})
(hic || {});

/*
 *  The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 The Regents of the University of California
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated documentation files (the "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the
 * following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial
 * portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,  FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */


/**
 * @author Jim Robinson
 */

var hic = (function (hic) {

    hic.Ruler = function (browser, $axis, whichAxis) {

        this.browser = browser;
        this.$axis = $axis;
        this.axis = whichAxis;

        this.$canvas = $('<canvas>');
        $axis.append(this.$canvas);

        this.$canvas.width(        $axis.width());
        this.$canvas.attr('width', $axis.width());

        this.$canvas.height(        $axis.height());
        this.$canvas.attr('height', $axis.height());

        this.ctx = this.$canvas.get(0).getContext("2d");

        this.yAxisTransformWithContext = function(context) {
            context.scale(-1, 1);
            context.rotate(Math.PI/2.0);
        };

        this.setAxis( whichAxis );

        hic.GlobalEventBus.subscribe('LocusChange', this);

    };

    hic.Ruler.prototype.setAxis = function (axis) {

        this.canvasTransform = ('y' === axis) ? this.yAxisTransformWithContext : identityTransformWithContext;

        this.labelReflectionTransform = ('y' === axis) ? reflectionTransformWithContext : function (context, exe) { };

    };

    hic.Ruler.prototype.receiveEvent = function(event) {

        if (event.type === 'LocusChange') {
            this.update();
        }

    };

    hic.Ruler.prototype.updateWidthWithCalculation = function (calc) {

        this.$axis.css( 'width', calc );

        this.$canvas.width(        this.$axis.width());
        this.$canvas.attr('width', this.$axis.width());

        this.update();
    };

    hic.Ruler.prototype.updateHeight = function (height) {

        this.$canvas.height(        height);
        this.$canvas.attr('height', height);

        this.update();
    };

    hic.Ruler.prototype.update = function () {

        var bin,
            config = {},
            browser = this.browser;

        identityTransformWithContext(this.ctx);
        igv.graphics.fillRect(this.ctx, 0, 0, this.$canvas.width(), this.$canvas.height(), { fillStyle: igv.rgbColor(255, 255, 255) });

        this.canvasTransform(this.ctx);

        if ('x' === this.axis) {
            igv.graphics.fillRect(this.ctx, 0, 0, this.$canvas.width(), this.$canvas.height(), { fillStyle: igv.rgbColor(255, 255, 255) });
        } else {
            igv.graphics.fillRect(this.ctx, 0, 0, this.$canvas.height(), this.$canvas.width(), { fillStyle: igv.rgbColor(255, 255, 255) });
        }

        config.bpPerPixel = browser.dataset.bpResolutions[ browser.state.zoom ] / browser.state.pixelSize;
        config.viewportWidth = Math.max(this.$canvas.width(), this.$canvas.height());

        bin = ('x' === this.axis) ? browser.state.x : browser.state.y;
        config.bpStart = bin * browser.dataset.bpResolutions[ browser.state.zoom ];

        config.pixelWidth = config.viewportWidth;
        config.height = Math.min(this.$canvas.width(), this.$canvas.height());

        this.draw(config);
    };

    hic.Ruler.prototype.draw = function (options) {

        var self = this,
            fontStyle,
            ts,
            spacing,
            nTick,
            pixel,
            l,
            yShim,
            tickHeight,
            chrPosition,
            chrSize,
            chrName,
            chromosomes = this.browser.hicReader.chromosomes;

        chrName = ('x' === this.axis) ? chromosomes[ this.browser.state.chr1 ].name : chromosomes[ this.browser.state.chr2 ].name;
        chrSize = ('x' === this.axis) ? chromosomes[ this.browser.state.chr1 ].size : chromosomes[ this.browser.state.chr2 ].size;

        if (options.chrName === "all") {
            // drawAll.call(this);
        } else {

            fontStyle = {
                textAlign: 'center',
                font: '9px PT Sans',
                fillStyle: "rgba(64, 64, 64, 1)",
                strokeStyle: "rgba(64, 64, 64, 1)"
            };

            ts = findSpacing( Math.floor(options.viewportWidth * options.bpPerPixel) );
            spacing = ts.majorTick;

            // Find starting point closest to the current origin
            nTick = Math.floor(options.bpStart / spacing) - 1;
            pixel = 0;

            igv.graphics.setProperties(this.ctx, fontStyle);
            this.ctx.lineWidth = 1.0;

            yShim = 1;
            tickHeight = 8;
            while (pixel < options.pixelWidth) {

                l = Math.floor(nTick * spacing);

                pixel = Math.round(((l - 1) - options.bpStart + 0.5) / options.bpPerPixel);


                chrPosition = formatNumber(l / ts.unitMultiplier, 0) + " " + ts.majorUnit;

                // console.log(this.axis + ' chr ' + chrName + ' bp ' + igv.numberFormatter(Math.floor((pixel * options.bpPerPixel) + options.bpStart)) + ' size-bp ' + igv.numberFormatter(chrSize));

                if (nTick % 1 === 0) {
                    this.ctx.save();
                    this.labelReflectionTransform(this.ctx, pixel);

                    if (Math.floor((pixel * options.bpPerPixel) + options.bpStart) < chrSize) {
                        igv.graphics.fillText(this.ctx, chrPosition, pixel, options.height - (tickHeight / 0.75));
                    }

                    this.ctx.restore();
                }

                if (Math.floor((pixel * options.bpPerPixel) + options.bpStart) < chrSize) {
                    igv.graphics.strokeLine(this.ctx,
                        pixel, options.height - tickHeight,
                        pixel, options.height - yShim);
                }

                nTick++;

            } // while (pixel < options.pixelWidth)

            igv.graphics.strokeLine(this.ctx,
                0, options.height - yShim,
                options.pixelWidth, options.height - yShim);

        }

        function formatNumber(anynum, decimal) {
            //decimal  - the number of decimals after the digit from 0 to 3
            //-- Returns the passed number as a string in the xxx,xxx.xx format.
            //anynum = eval(obj.value);
            var divider = 10;
            switch (decimal) {
                case 0:
                    divider = 1;
                    break;
                case 1:
                    divider = 10;
                    break;
                case 2:
                    divider = 100;
                    break;
                default:       //for 3 decimal places
                    divider = 1000;
            }

            var workNum = Math.abs((Math.round(anynum * divider) / divider));

            var workStr = "" + workNum;

            if (workStr.indexOf(".") == -1) {
                workStr += "."
            }

            var dStr = workStr.substr(0, workStr.indexOf("."));
            var dNum = dStr - 0;
            var pStr = workStr.substr(workStr.indexOf("."));

            while (pStr.length - 1 < decimal) {
                pStr += "0"
            }

            if (pStr == '.') pStr = '';

            //--- Adds a comma in the thousands place.
            if (dNum >= 1000) {
                var dLen = dStr.length;
                dStr = parseInt("" + (dNum / 1000)) + "," + dStr.substring(dLen - 3, dLen)
            }

            //-- Adds a comma in the millions place.
            if (dNum >= 1000000) {
                dLen = dStr.length;
                dStr = parseInt("" + (dNum / 1000000)) + "," + dStr.substring(dLen - 7, dLen)
            }
            var retval = dStr + pStr;
            //-- Put numbers in parentheses if negative.
            if (anynum < 0) {
                retval = "(" + retval + ")";
            }

            //You could include a dollar sign in the return value.
            //retval =  "$"+retval
            return retval;
        }

        function drawAll() {

            var self = this,
                lastX = 0,
                yShim = 2,
                tickHeight = 10;

            _.each(self.browser.genome.chromosomes, function (chromosome) {

                var chrName = chromosome.name,
                    bp = self.browser.genome.getGenomeCoordinate(chrName, chromosome.size),
                    x = Math.round((bp - options.bpStart ) / options.bpPerPixel),
                    chrLabel = chrName.startsWith("chr") ? chrName.substr(3) : chrName;

                self.ctx.textAlign = 'center';
                igv.graphics.strokeLine(self.ctx, x, self.height - tickHeight, x, self.height - yShim);
                igv.graphics.fillText(self.ctx, chrLabel, (lastX + x) / 2, self.height - (tickHeight / 0.75));

                lastX = x;

            });
            igv.graphics.strokeLine(self.ctx, 0, self.height - yShim, options.pixelWidth, self.height - yShim);
        }

    };

    function TickSpacing(majorTick, majorUnit, unitMultiplier) {
        this.majorTick = majorTick;
        this.majorUnit = majorUnit;
        this.unitMultiplier = unitMultiplier;
    }

    function findSpacing(maxValue) {

        if (maxValue < 10) {
            return new TickSpacing(1, "", 1);
        }


        // Now man zeroes?
        var nZeroes = Math.floor(log10(maxValue));
        var majorUnit = "";
        var unitMultiplier = 1;
        if (nZeroes > 9) {
            majorUnit = "gb";
            unitMultiplier = 1000000000;
        }
        if (nZeroes > 6) {
            majorUnit = "mb";
            unitMultiplier = 1000000;
        } else if (nZeroes > 3) {
            majorUnit = "kb";
            unitMultiplier = 1000;
        }

        var nMajorTicks = maxValue / Math.pow(10, nZeroes - 1);
        if (nMajorTicks < 25) {
            return new TickSpacing(Math.pow(10, nZeroes - 1), majorUnit, unitMultiplier);
        } else {
            return new TickSpacing(Math.pow(10, nZeroes) / 2, majorUnit, unitMultiplier);
        }

        function log10(x) {
            var dn = Math.log(10);
            return Math.log(x) / dn;
        }
    }

    function reflectionTransformWithContext(context, exe) {
        context.translate(exe, 0);
        context.scale(-1, 1);
        context.translate(-exe, 0);
    }

    function identityTransformWithContext(context) {
        // 3x2 matrix. column major. (sx 0 0 sy tx ty).
        context.setTransform(1, 0, 0, 1, 0, 0);
    }

    return hic;
})(hic || {});

/*
 *  The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 The Regents of the University of California
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated documentation files (the "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the
 * following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial
 * portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,  FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */


/**
 * @author Jim Robinson
 */


var hic = (function (hic) {


    hic.State = function (chr1, chr2, zoom, x, y, pixelSize, normalization) {

        if(chr1 <= chr2) {
            this.chr1 = chr1;
            this.chr2 = chr2;
            this.x = x;
            this.y = y;
        }
        else {
            // Transpose
            this.chr1 = chr2;
            this.chr2 = chr1;
            this.x = y;
            this.y = x;
        }
        this.zoom = zoom;
        this.pixelSize = pixelSize;

        if("undefined" === normalization) {
            console.log("No normalization defined !!!");
            normalization = undefined;
        }

        this.normalization = normalization;
    };

    hic.State.prototype.stringify = function () {
        return "" + this.chr1 + "," + this.chr2 + "," + this.zoom + "," + this.x + "," + this.y + "," + this.pixelSize + "," + this.normalization;
    }

    hic.State.prototype.clone = function () {
        return new hic.State(this.chr1, this.chr2, this.zoom, this.x, this.y, this.pixelSize, this.normalization)
    }


    hic.destringifyState = function (string) {

        var tokens = string.split(",");
        return new hic.State(
            tokens[0],    // chr1
            tokens[1],    // chr2
            parseFloat(tokens[2]), // zoom
            parseFloat(tokens[3]), // x
            parseFloat(tokens[4]), // y
            parseFloat(tokens[5]), // pixelSize
            tokens.length > 6 ? tokens[6] : "NONE"   // normalization
        )

    }

    return hic;

})
(hic || {});

/**
 * Created by dat on 4/28/17.
 */
var hic = (function (hic) {

    hic.trackMenu = function ($container, x, y) {


    };

    return hic;

})(hic || {});
/*
 *  The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 The Regents of the University of California
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated documentation files (the "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the
 * following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial
 * portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,  FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */

/**
 * Created by dat on 3/8/17.
 */
var hic = (function (hic) {

    hic.throttle = function (fn, threshhold, scope) {
        var last,
            deferTimer;

        threshhold || (threshhold = 200);

        return function () {
            var context,
                now,
                args;

            context = scope || this;
            now = +new Date;
            args = arguments;

            if (last && now < last + threshhold) {
                // hold on to it
                clearTimeout(deferTimer);
                deferTimer = setTimeout(function () {
                    last = now;
                    fn.apply(context, args);
                }, threshhold);
            } else {
                last = now;
                fn.apply(context, args);
            }
        }
    };

    hic.translateMouseCoordinates = function(e, $target) {

        var eFixed,
            posx,
            posy;

        // Sets pageX and pageY for browsers that don't support them
        eFixed = $.event.fix(e);

        if (undefined === $target.offset()) {
            console.log('igv.translateMouseCoordinates - $target.offset() is undefined.');
        }
        posx = eFixed.pageX - $target.offset().left;
        posy = eFixed.pageY - $target.offset().top;

        return {x: posx, y: posy}
    };

    hic.reflectionRotationWithContext = function(context) {
        context.scale(-1, 1);
        context.rotate(Math.PI/2.0);
    };

    hic.reflectionAboutYAxisAtOffsetWithContext = function(context, exe) {
        context.translate(exe, 0);
        context.scale(-1, 1);
        context.translate(-exe, 0);
    };

    hic.identityTransformWithContext = function(context) {
        // 3x2 matrix. column major. (sx 0 0 sy tx ty).
        context.setTransform(1, 0, 0, 1, 0, 0);
    };

    return hic;

}) (hic || {});

/**
 * Created by dat on 4/4/17.
 */
var hic = (function (hic) {

    hic.LayoutController = function (browser, $root) {

        this.browser = browser;

        createNavBar.call(this, browser, $root);

        createAllContainers.call(this, browser, $root);

        // Compatibility wit igv menus
        igv.browser.trackContainerDiv = this.$x_track_container.get(0);

        // Dupes of corresponding juicebox.scss variables
        // Invariant during app running. If edited in juicebox.scss they MUST be kept in sync
        this.nav_bar_height = 70;
        this.nav_bar_padding_bottom = 8;

        this.axis_height = 32;
        this.scrollbar_height = 20;

        this.track_height = 32;

        hic.GlobalEventBus.subscribe('TrackLoad', this);
        hic.GlobalEventBus.subscribe('LocusChange', this);

    };

    function createNavBar(browser, $root) {

        var $navbar_container = $('<div class="hic-navbar-container">');
        $root.append($navbar_container);

        // logo
        // $navbar_container.append($('<div class="hic-logo-container">'));

        // chromosome selector
        if (browser.config.showChromosomeSelector) {
            browser.chromosomeSelector = new hic.ChromosomeSelectorWidget(browser, $navbar_container);
        }

        // location box / goto
        browser.locusGoto = new hic.LocusGoto(browser, $navbar_container);

        // colorscale widget
        browser.colorscaleWidget = new hic.ColorScaleWidget(browser, $navbar_container);

        // resolution widget
        browser.normalizationSelector = new hic.NormalizationWidget(browser);
        $navbar_container.append(browser.normalizationSelector.$container);

        // resolution widget
        browser.resolutionSelector = new hic.ResolutionSelector(browser);
        $navbar_container.append(browser.resolutionSelector.$container);

    }

    function createAllContainers(browser, $root) {

        var $container,
        $e;

        // .hic-x-track-container
        this.$x_track_container = $('<div id="x-track-container">');
        $root.append(this.$x_track_container);

        // track labels
        this.$track_shim = $('<div id="track-shim">');
        this.$x_track_container.append(this.$track_shim);

        // x-tracks
        this.$x_tracks = $('<div id="x-tracks">');
        this.$x_track_container.append(this.$x_tracks);

        // crosshairs guide
        $e = $('<div id="y-track-guide">');
        this.$x_tracks.append($e);

        // content container
        this.$content_container = $('<div id="content-container">');
        $root.append(this.$content_container);

        // container: x-axis
        $container = $('<div id="x-axis-container">');
        this.$content_container.append($container);
        xAxis.call(this, browser, $container);


        // container: y-tracks | y-axis | viewport | y-scrollbar
        $container = $('<div id="y-tracks-y-axis-viewport-y-scrollbar">');
        this.$content_container.append($container);

        // y-tracks
        this.$y_tracks = $('<div id="y-tracks">');
        $container.append(this.$y_tracks);

        // crosshairs guide
        $e = $('<div id="x-track-guide">');
        this.$y_tracks.append($e);

        // y-axis
        yAxis.call(this, browser, $container);

        // viewport | y-scrollbar
        browser.contactMatrixView = new hic.ContactMatrixView(browser, $container);

        // container: x-scrollbar
        $container = $('<div id="x-scrollbar-container">');
        this.$content_container.append($container);

        // x-scrollbar
        $container.append(browser.contactMatrixView.scrollbarWidget.$x_axis_scrollbar_container);

        function xAxis(browser, $container) {
            var $xAxis = $('<div id="x-axis">');
            $container.append($xAxis);

            this.xAxisRuler = new hic.Ruler(browser, $xAxis, 'x');
        }

        function yAxis(browser, $container) {
            var $yAxis = $('<div id="y-axis">');
            $container.append($yAxis);

            this.yAxisRuler = new hic.Ruler(browser, $yAxis, 'y');
        }

    }

    hic.LayoutController.prototype.receiveEvent = function(event) {
        var self = this,
            trackRendererPair;

        if ('TrackLoad' === event.type) {

            _.each(event.data.trackXYPairs, function (trackPair) {

                var w,
                    h;

                self.doLayoutTrackXYPairCount(1 + _.size(self.browser.trackRenderers));

                // append tracks
                trackRendererPair = {};
                w = h = self.track_height;
                trackRendererPair.x = new hic.TrackRenderer(self.browser, {width: undefined, height: h}, self.$x_tracks, trackRendererPair, trackPair, 'x');
                trackRendererPair.y = new hic.TrackRenderer(self.browser, {width: w, height: undefined}, self.$y_tracks, trackRendererPair, trackPair, 'y');

                self.browser.trackRenderers.push(trackRendererPair);

                self.browser.updateHref();
            });

            this.browser.updateLayout();

        } else if ('LocusChange' === event.type) {
            this.browser.renderTracks(false);
        }


    };

    hic.LayoutController.prototype.removeAllTrackXYPairs = function () {
        var self = this,
            indices;

        indices = _.range(_.size(this.browser.trackRenderers));

        if (0 === _.size(indices)) {
            return;
        }

        _.each(indices, function(unused) {
            var discard,
                index;

            // select last track to dicard
            discard = _.last(self.browser.trackRenderers);

            // discard DOM element's
            discard[ 'x' ].$viewport.remove();
            discard[ 'y' ].$viewport.remove();

            // remove discard from list
            index = self.browser.trackRenderers.indexOf(discard);
            self.browser.trackRenderers.splice(index, 1);

            discard = undefined;
            self.doLayoutTrackXYPairCount( _.size(self.browser.trackRenderers) );
        });

        this.browser.updateHref();

        // this.browser.updateLayout();
    };

    hic.LayoutController.prototype.removeLastTrackXYPair = function () {
        var index,
            discard;

        if (_.size(this.browser.trackRenderers) > 0) {

            // select last track to dicard
            discard = _.last(this.browser.trackRenderers);

            // discard DOM element's
            discard[ 'x' ].$viewport.remove();
            discard[ 'y' ].$viewport.remove();

            // remove discard from list
            index = this.browser.trackRenderers.indexOf(discard);
            this.browser.trackRenderers.splice(index, 1);

            discard = undefined;
            this.doLayoutTrackXYPairCount( _.size(this.browser.trackRenderers) );

            this.browser.updateLayout();

            this.browser.updateHref();

        } else {
            console.log('No more tracks.');
        }

    };

    hic.LayoutController.prototype.removeTrackRendererPair = function (trackRendererPair) {

        var index,
            discard;

        if (_.size(this.browser.trackRenderers) > 0) {

            discard = trackRendererPair;

            // discard DOM element's
            discard[ 'x' ].$viewport.remove();
            discard[ 'y' ].$viewport.remove();

            // remove discard from list
            index = this.browser.trackRenderers.indexOf(discard);
            this.browser.trackRenderers.splice(index, 1);

            this.doLayoutTrackXYPairCount( _.size(this.browser.trackRenderers) );

            this.browser.updateLayout();

            this.browser.updateHref();

        } else {
            console.log('No more tracks.');
        }

    };

    hic.LayoutController.prototype.doLayoutTrackXYPairCount = function (trackXYPairCount) {

        var track_aggregate_height,
            tokens,
            width_calc,
            height_calc;


        track_aggregate_height = trackXYPairCount * this.track_height;

        tokens = _.map([ this.nav_bar_height, this.nav_bar_padding_bottom, track_aggregate_height ], function(number){ return number.toString() + 'px'; });
        height_calc = 'calc(100% - (' + tokens.join(' + ') + '))';

        tokens = _.map([ track_aggregate_height, this.axis_height, this.scrollbar_height ], function(number){ return number.toString() + 'px'; });
        width_calc = 'calc(100% - (' + tokens.join(' + ') + '))';

        // x-track container
        this.$x_track_container.height(track_aggregate_height);

        // track labels
        this.$track_shim.width(track_aggregate_height);
        // x-tracks
        this.$x_tracks.css( 'width', width_calc );


        // content container
        this.$content_container.css( 'height', height_calc );

        // x-axis - repaint canvas
        this.xAxisRuler.updateWidthWithCalculation(width_calc);

        // y-tracks
        this.$y_tracks.width(track_aggregate_height);

        // y-axis - repaint canvas
        this.yAxisRuler.updateHeight(this.yAxisRuler.$axis.height());

        // viewport
        this.browser.contactMatrixView.$viewport.css( 'width', width_calc );

        // x-scrollbar
        this.browser.contactMatrixView.scrollbarWidget.$x_axis_scrollbar_container.css( 'width', width_calc );



    };

    return hic;
})(hic || {});

/*
 *  The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 The Regents of the University of California
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated documentation files (the "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the
 * following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial
 * portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,  FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */


/**
 * @author Jim Robinson
 */


var hic = (function (hic) {


    hic.NormalizationVector = function (type, chrIdx, unit, resolution, data) {
        this.type = type;
        this.chrIdx = chrIdx;
        this.unit = unit;
        this.resolution = resolution;
        this.data = data;
    }

    hic.getNormalizationVectorKey = function (type, chrIdx, unit, resolution) {
        return type + "_" + chrIdx + "_" + unit + "_" + resolution;
    }

    hic.NormalizationVector.prototype.getKey = function () {
        return NormalizationVector.getKey(this.type, this.chrIdx, this.unit, this.resolution);
    }

    return hic;

})
(hic || {});

/*
 *  The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 The Regents of the University of California
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated documentation files (the "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the
 * following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial
 * portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,  FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */

/**
 * Created by dat on 3/21/17.
 */
var hic = (function (hic) {

    var labels =
        {
                     NONE: 'None',
                       VC: 'Coverage',
                  VC_SQRT: 'Coverage - Sqrt',
                       KR: 'Balanced',
                 INTER_VC: 'Interchromosomal Coverage',
            INTER_VC_SQRT: 'Interchromosomal Coverage - Sqrt',
                 INTER_KR: 'Interchromosomal Balanced',
                    GW_VC: 'Genome-wide Coverage',
               GW_VC_SQRT: 'Genome-wide Coverage - Sqrt',
                    GW_KR: 'Genome-wide Balanced'
        };

    hic.NormalizationWidget = function (browser) {
        var self = this,
            $label,
            $option,
            config;

        this.browser = browser;

        $label = $('<div>');
        $label.text('Normalization');

        this.$normalization_selector = $('<select name="select">');
        this.$normalization_selector.attr('name', 'dataset_selector');
        this.$normalization_selector.on('change', function (e) {
            self.browser.setNormalization($(this).val());
        });

        this.$container = $('<div class="hic-normalization-selector-container">');
        this.$container.append($label);
        this.$container.append(this.$normalization_selector);

        hic.GlobalEventBus.subscribe("MapLoad", this);

    };

    hic.NormalizationWidget.prototype.receiveEvent = function (event) {

        if (event.type === "MapLoad") {

            var dataset = event.data,
                normalizationTypes,
                elements,
                norm = this.browser.state.normalization;

            normalizationTypes = dataset.normalizationTypes;
            elements = _.map(normalizationTypes, function (normalization) {
                var label,
                    labelPresentation,
                    isSelected,
                    titleString,
                    valueString;

                label = labels[ normalization ];
                isSelected = (norm === normalization);
                titleString = (label === undefined ? '' : ' title = "' + label + '" ');
                valueString = ' value=' + normalization + (isSelected ? ' selected' : '');

                labelPresentation = '&nbsp &nbsp' + label + '&nbsp &nbsp';
                return '<option' + titleString + valueString + '>' + labelPresentation + '</option>';
            });

            this.$normalization_selector.empty();
            this.$normalization_selector.append(elements.join(''));
        }
    };

    return hic;

})
(hic || {});

/*
 *  The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 The Regents of the University of California
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated documentation files (the "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the
 * following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial
 * portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,  FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */

/**
 * Created by dat on 3/7/17.
 */
var hic = (function (hic) {

    hic.ScrollbarWidget = function (browser) {

        var self = this;

        this.browser = browser;
        this.isDragging = false;

        // x-axis
        this.$x_axis_scrollbar_container = $('<div id="x-axis-scrollbar-container">');

        this.$x_axis_scrollbar = $('<div id="x-axis-scrollbar">');
        this.$x_axis_scrollbar_container.append(this.$x_axis_scrollbar);

        this.$x_label = $('<div>');
        this.$x_label.text('');
        this.$x_axis_scrollbar.append(this.$x_label);

        // y-axis
        this.$y_axis_scrollbar_container = $('<div id="y-axis-scrollbar-container">');

        this.$y_axis_scrollbar = $('<div id="y-axis-scrollbar">');
        this.$y_axis_scrollbar_container.append(this.$y_axis_scrollbar);

        this.$y_label = $('<div class="scrollbar-label-rotation-in-place">');
        this.$y_label.text('');
        this.$y_axis_scrollbar.append(this.$y_label);

        // this.$x_axis_scrollbar_container.hide();
        // this.$y_axis_scrollbar_container.hide();

        // this.$x_axis_scrollbar.draggable({
        //     containment: 'parent',
        //     start: function() {
        //         self.isDragging = true;
        //     },
        //     drag: hic.throttle(xAxisDragger, 250),
        //     stop: function() {
        //         self.isDragging = false;
        //     }
        // });

        // this.$y_axis_scrollbar.draggable({
        //
        //     containment: 'parent',
        //     start: function() {
        //         self.isDragging = true;
        //     },
        //     drag: hic.throttle(yAxisDragger, 250),
        //     stop: function() {
        //         self.isDragging = false;
        //     }
        // });

        hic.GlobalEventBus.subscribe("LocusChange", this);

        // function xAxisDragger () {
        //     var bin,
        //         st = self.browser.state;
        //
        //     bin = self.css2Bin(self.browser.hicReader.chromosomes[ self.browser.state.chr1 ], self.$x_axis_scrollbar, 'left');
        //     self.browser.setState( new hic.State(st.chr1, st.chr2, st.zoom, bin, st.y, st.pixelSize) );
        // }

        // function yAxisDragger () {
        //     var bin,
        //         st = self.browser.state;
        //
        //     bin = self.css2Bin(self.browser.hicReader.chromosomes[ self.browser.state.chr2 ], self.$y_axis_scrollbar, 'top');
        //     self.browser.setState( new hic.State(st.chr1, st.chr2, st.zoom, st.x, bin, st.pixelSize) );
        // }
    };

    hic.ScrollbarWidget.prototype.css2Bin = function(chromosome, $element, attribute) {
        var numer,
            denom,
            percentage;

        numer = $element.css(attribute).slice(0, -2);
        denom = $element.parent().css('left' === attribute ? 'width' : 'height').slice(0, -2);
        percentage = parseInt(numer, 10)/parseInt(denom, 10);

        return percentage * chromosome.size / this.browser.dataset.bpResolutions[ this.browser.state.zoom ];
    };

    hic.ScrollbarWidget.prototype.receiveEvent = function(event) {
        var self = this,
            chromosomeLengthsBin,
            chromosomeLengthsPixel,
            width,
            height,
            pixels,
            widthBin,
            heightBin,
            bins,

            percentage,
            percentages;

        if (false === this.isDragging && event.type === "LocusChange") {

            var state = event.data,
                dataset = self.browser.dataset;

            this.$x_axis_scrollbar_container.show();
            this.$y_axis_scrollbar_container.show();

            chromosomeLengthsBin = _.map([state.chr1, state.chr2], function (index) {
                // bp / bp-per-bin -> bin
                return dataset.chromosomes[index].size / dataset.bpResolutions[state.zoom];
            });

            chromosomeLengthsPixel = _.map(chromosomeLengthsBin, function (bin) {
                // bin * pixel-per-bin -> pixel
                return bin * state.pixelSize;
            });

            pixels = [this.browser.contactMatrixView.getViewDimensions().width, this.browser.contactMatrixView.getViewDimensions().height];

            // pixel / pixel-per-bin -> bin
            bins = [ _.first(pixels)/state.pixelSize, _.last(pixels)/state.pixelSize ];

            // bin / bin -> percentage
            percentages = _.map(bins, function(bin, i){
                var binPercentage,
                    pixelPercentage;

                binPercentage = Math.min(bin, chromosomeLengthsBin[ i ]) / chromosomeLengthsBin[ i ];
                pixelPercentage = Math.min(chromosomeLengthsPixel[ i ], pixels[ i ])/pixels[ i ];
                return Math.max(1, Math.round(100 * binPercentage * pixelPercentage));
            });
            this.$x_axis_scrollbar.css('width', (_.first(percentages).toString() + '%'));
            this.$y_axis_scrollbar.css('height', (_.last(percentages).toString() + '%'));










            // bin / bin -> percentage
            percentage = Math.round(100 * state.x / _.first(chromosomeLengthsBin));
            percentage = percentage.toString() + '%';
            this.$x_axis_scrollbar.css('left', percentage);

            // bin / bin -> percentage
            percentage = Math.round(100 * state.y / _.last(chromosomeLengthsBin));
            percentage = percentage.toString() + '%';
            this.$y_axis_scrollbar.css('top', percentage);

            this.$x_label.text( dataset.chromosomes[ state.chr1 ].name );
            this.$y_label.text( dataset.chromosomes[ state.chr2 ].name );

        }
    };

    return hic;
})(hic || {});

/*
 *  The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 The Regents of the University of California
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated documentation files (the "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the
 * following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial
 * portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,  FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */

/**
 * Created by dat on 3/14/17.
 */
var hic = (function (hic) {

    hic.SweepZoom = function (browser) {

        this.browser = browser;

        this.$rulerSweeper = $('<div id="sweep-zoom-container">');
        this.$rulerSweeper.hide();

        this.sweepRect = {};

    };

    hic.SweepZoom.prototype.reset = function () {
        this.coordinateFrame = this.$rulerSweeper.parent().offset();
        this.aspectRatio = this.browser.contactMatrixView.getViewDimensions().width / this.browser.contactMatrixView.getViewDimensions().height;
        this.sweepRect.origin = {     x: 0,      y: 0 };
        this.sweepRect.size   = { width: 1, height: 1 };
        this.clipped = { value: false };
    };

    hic.SweepZoom.prototype.update = function (mouseDown, coords, viewportBBox) {
        var delta,
            multiplier,
            displacement,
            dominantAxis,
            aspectRatioScale;

        if (true === this.clipped.value) {
            return;
        }

        delta =
            {
                x: (coords.x - mouseDown.x),
                y: (coords.y - mouseDown.y)
            };

        multiplier = { x: sign(delta.x), y: sign(delta.y) };

        dominantAxis = Math.abs(delta.x) > Math.abs(delta.y) ? 'x' : 'y';

        displacement = 'x' === dominantAxis ? Math.abs(delta.x) : Math.abs(delta.y);

        this.sweepRect.size =
            {
                width : multiplier.x * displacement,
                height : multiplier.y * displacement
            };

        // if ('x' === dominantAxis) {
        //
        //     this.sweepRect.size =
        //         {
        //             width: delta.x,
        //             height: delta.x / this.aspectRatio
        //         };
        //
        // } else {
        //
        //     this.sweepRect.size =
        //         {
        //             width: delta.y * this.aspectRatio,
        //             height: delta.y
        //         };
        // }

        this.sweepRect.origin.x = Math.min(mouseDown.x, mouseDown.x + this.sweepRect.size.width);
        this.sweepRect.origin.y = Math.min(mouseDown.y, mouseDown.y + this.sweepRect.size.height);

        this.sweepRect.size.width = Math.abs(this.sweepRect.size.width);
        this.sweepRect.size.height = Math.abs(this.sweepRect.size.height);

        this.sweepRect = clip(this.sweepRect, viewportBBox, this.clipped);

        this.$rulerSweeper.width( this.sweepRect.size.width);
        this.$rulerSweeper.height(this.sweepRect.size.height);

        this.$rulerSweeper.offset(
            {
                left: this.coordinateFrame.left + this.sweepRect.origin.x,
                top: this.coordinateFrame.top  + this.sweepRect.origin.y
            }
        );
        this.$rulerSweeper.show();

    };

    hic.SweepZoom.prototype.dismiss = function () {
        var state,
            resolution,
            X,
            Y,
            Width,
            Height,
            XMax,
            YMax;

        this.$rulerSweeper.hide();

        state = this.browser.state;

        // bp-per-bin
        resolution = this.browser.resolution();

        // bp = ((bin + pixel/pixel-per-bin) / bp-per-bin)
        X = (state.x + (this.sweepRect.origin.x / state.pixelSize)) * resolution;
        Y = (state.y + (this.sweepRect.origin.y / state.pixelSize)) * resolution;

        // bp = ((bin + pixel/pixel-per-bin) / bp-per-bin)
        Width  = (this.sweepRect.size.width  / state.pixelSize) * resolution;
        Height = (this.sweepRect.size.height / state.pixelSize) * resolution;

        // bp = bp + bp
        XMax = X + Width;
        YMax = Y + Height;

        this.browser.goto(state.chr1, X, XMax, state.chr2, Y, YMax);

    };

    function sign(s) {
        return s < 0 ? -1 : 1;
    }

    function clip(rect, bbox, clipped) {
        var r,
            result,
            w,
            h;

        r = _.extend({}, { min : { x: rect.origin.x, y: rect.origin.y } });
        r = _.extend(r, { max : { x: rect.origin.x + rect.size.width, y: rect.origin.y + rect.size.height } });

        if (r.min.x <= bbox.min.x || r.min.y <= bbox.min.y) {
            clipped.value = true;
        } else if (bbox.max.x <= r.max.x || bbox.max.y <= r.max.y) {
            clipped.value = true;
        }

        r.min.x = Math.max(r.min.x, bbox.min.x);
        r.min.y = Math.max(r.min.y, bbox.min.y);

        r.max.x = Math.min(r.max.x, bbox.max.x);
        r.max.y = Math.min(r.max.y, bbox.max.y);

        result = {};
        result.origin =
            {
                x: r.min.x,
                y: r.min.y
            };

        w = r.max.x - r.min.x;
        h = r.max.y - r.min.y;

        result.size =
            {
                width: Math.min(w, h),
                height: Math.min(w, h)
            };

        return result;
    }

    return hic;
})(hic || {});

/**
 * Created by dat on 5/3/17.
 */

var hic = (function (hic) {

    hic.TrackLabel = function ($track) {

        var $container;

        this.$track = $track;

        $('.clickedit')
            .hide()
            .focusout(endEdit)
            .keyup(function(e) {
                if ((e.which && 13 === e.which) || (e.keyCode && 13 === e.keyCode)) {
                    endEdit(e);
                    return false;
                } else {
                    return true;
                }
            })
            .prev()
            .click(function() {
                $(this).hide();
                $(this)
                    .next()
                    .show()
                    .focus();
            });

        function endEdit(e) {
            var input,
                label,
                str;

            input = $(e.target);
            str = ('' === input.val()) ? hic.TrackLabel.defaultText() : input.val();

            label = input && input.prev();
            label.text(str);

            input.hide();
            label.show();
        }

    };

    hic.TrackLabel.defaultText = function () {
        return 'Untitled';
    };

    return hic;
})(hic || {});








/**
 * Created by dat on 5/7/17.
 */

hic.popoverPresentTrackGearMenuReplacement = function (pageX, pageY, trackView) {

    var $container,
        items;

    items = igv.trackMenuItemList(this, trackView);
    if (_.size(items) > 0) {

        this.$popoverContent.empty();
        this.$popoverContent.removeClass("igv-popover-track-popup-content");

        $container = $('<div class="igv-track-menu-container">');
        this.$popoverContent.append($container);

        _.each(items, function(item) {

            if (item.init) {
                item.init(undefined);
            }

            $container.append(item.object);

        });

        this.$popover.css({ left: pageX + 'px', top: pageY + 'px' });
        this.$popover.show();
        // this.$popover.offset( igv.constrainBBox(this.$popover, $(igv.browser.trackContainerDiv)) );

    }
};

hic.trackMenuItemListReplacement = function (popover, trackRenderer) {

    var menuItems = [],
        all;

    menuItems.push(
        igv.trackMenuItem(
            popover,
            trackRenderer,
            "Set track name",
            function () {
                return "Track Name"
            },
            trackRenderer.track.name,
            function () {

                var alphanumeric = parseAlphanumeric(igv.dialog.$dialogInput.val());

                if (undefined !== alphanumeric) {
                    trackRenderer.$label.text(alphanumeric);
                }

                function parseAlphanumeric(value) {

                    var alphanumeric_re = /(?=.*[a-zA-Z].*)([a-zA-Z0-9 ]+)/,
                        alphanumeric = alphanumeric_re.exec(value);

                    return (null !== alphanumeric) ? alphanumeric[0] : "untitled";
                }

            },
            undefined));

    all = [];
    if (trackRenderer.track.menuItemList) {
        all = menuItems.concat( igv.trackMenuItemListHelper(trackRenderer.track.menuItemList(popover)) );
    }

    all.push(
        igv.trackMenuItem(
            popover,
            trackRenderer,
            "Remove track",
            function () {
                var label = "Remove " + trackRenderer.track.name;
                return '<div class="igv-dialog-label-centered">' + label + '</div>';
            },
            undefined,
            function () {
                popover.hide();
                hic.browser.layoutController.removeTrackRendererPair(trackRenderer.trackRenderPair);
            },
            true));

    return all;
};

hic.trackMenuItemReplacement = function (popover, trackRenderer, menuItemLabel, dialogLabelHandler, dialogInputValue, dialogClickHandler, doAddTopBorder) {

    var $e,
        clickHandler;

    $e = $('<div>');

    if (true === doAddTopBorder) {
        $e.addClass('igv-track-menu-border-top');
    }

    $e.text(menuItemLabel);


    clickHandler = function(){

        var $element;

        // $element = $(trackRenderer.trackDiv);
        $element = trackRenderer.$viewport;

        igv.dialog.configure(dialogLabelHandler, dialogInputValue, dialogClickHandler);
        igv.dialog.show($element);
        popover.hide();
    };

    $e.click(clickHandler);

    return { object: $e, init: undefined };
};

/**
 * Created by dat on 4/5/17.
 */
var hic = (function (hic) {

    hic.TrackRenderer = function (browser, size, $container, trackRenderPair, trackPair, axis) {

        this.browser = browser;

        this.trackRenderPair = trackRenderPair;

        this.track = trackPair[ axis ];

        this.id = _.uniqueId('trackRenderer_');
        this.axis = axis;
        this.initializationHelper($container, size);
    };

    hic.TrackRenderer.prototype.initializationHelper = function ($container, size) {

        var self = this,
            str,
        doShowLabelAndGear,
        $x_track_label;

        // track canvas container
        this.$viewport = ('x' === this.axis) ? $('<div class="x-track-canvas-container">') : $('<div class="y-track-canvas-container">');
        if (size.width) {
            this.$viewport.width(size.width);
        }
        if (size.height) {
            this.$viewport.height(size.height);
        }
        $container.append(this.$viewport);

        // canvas
        this.$canvas = $('<canvas>');
        this.$viewport.append(this.$canvas);
        this.ctx = this.$canvas.get(0).getContext("2d");

        if ('x' === this.axis) {

            // note the pre-existing state of track labels/gear. hide/show accordingly.
            $x_track_label = $('.x-track-label');
            doShowLabelAndGear = (0 === _.size($x_track_label)) ? true : $x_track_label.is(':visible');

            // label
            this.$label = $('<div class="x-track-label">');
            str = this.track.name || 'untitled';
            this.$label.text(str);
            this.$viewport.append(this.$label);

            this.$viewport.on('click', function (e) {
                e.stopPropagation();
                $('.x-track-label').toggle();
                $('.x-track-menu-container').toggle();
            });
        }

        // track spinner container
        this.$spinner = ('x' === this.axis) ? $('<div class="x-track-spinner">') : $('<div class="y-track-spinner">');
        this.$viewport.append(this.$spinner);

        // throbber
        // size: see $hic-viewport-spinner-size in .scss files
        this.throbber = Throbber({ color: 'rgb(64, 64, 64)', size: 32 , padding: 7 });
        this.throbber.appendTo( this.$spinner.get(0) );
        this.stopSpinner();

        if ('x' === this.axis) {

            this.$menu_container = $('<div class="x-track-menu-container">');
            this.$viewport.append(this.$menu_container);

            this.$menu_button = $('<i class="fa fa-cog" aria-hidden="true">');
            this.$menu_container.append(this.$menu_button);

            this.$menu_button.click(function (e) {
                e.stopPropagation();
                igv.popover.presentTrackGearMenu(e.pageX, e.pageY, self);
            });

            if ( doShowLabelAndGear ) {
                this.$label.show();
                this.$menu_container.show();
            } else {
                this.$label.hide();
                this.$menu_container.hide();
            }

        }

        // compatibility with igv menus
        this.track.trackView = this;
        this.track.trackView.trackDiv = this.$viewport.get(0);

        this.configTrackTransforms();

    };

    hic.TrackRenderer.prototype.configTrackTransforms = function() {

        this.canvasTransform = ('y' === this.axis) ? hic.reflectionRotationWithContext : hic.identityTransformWithContext;

        this.labelReflectionTransform = ('y' === this.axis) ? hic.reflectionAboutYAxisAtOffsetWithContext : function (context, exe) { /* nuthin */ };

    };

    hic.TrackRenderer.prototype.syncCanvas = function () {

        this.tile = null;

        this.$canvas.width(this.$viewport.width());
        this.$canvas.attr('width', this.$viewport.width());

        this.$canvas.height(this.$viewport.height());
        this.$canvas.attr('height', this.$viewport.height());

        igv.graphics.fillRect(this.ctx, 0, 0, this.$canvas.width(), this.$canvas.height(), { fillStyle: igv.rgbColor(255, 255, 255) });
    };

    hic.TrackRenderer.prototype.setColor = function (color) {

        _.each(this.trackRenderPair, function (trackRenderer) {
            trackRenderer.tile = undefined;
            trackRenderer.track.color = color;
        });

        this.browser.renderTrackXY(this.trackRenderPair);
    };

    hic.TrackRenderer.prototype.dataRange = function () {
        return this.track.dataRange ? this.track.dataRange : undefined;
    };

    hic.TrackRenderer.prototype.setDataRange = function (min, max, autoscale) {

        _.each(this.trackRenderPair, function (trackRenderer) {
            trackRenderer.tile = undefined;
            trackRenderer.track.dataRange = { min: min, max: max };
            trackRenderer.track.autscale = autoscale;
        });

        this.browser.renderTrackXY(this.trackRenderPair);

    };

    hic.TrackRenderer.prototype.update = function () {
        this.tile = null;
        this.promiseToRepaint();
    };

    hic.TrackRenderer.prototype.repaint = function () {
        this.promiseToRepaint();
    };

    hic.TrackRenderer.prototype.promiseToRepaint = function () {

        var self = this;

        return new Promise(function(fulfill, reject) {

            var lengthPixel,
                lengthBP,
                startBP,
                endBP,
                genomicState,
                chrName;

            genomicState = _.mapObject(self.browser.genomicState(), function(val) {
                return _.isObject(val) ? val[ self.axis ] : val;
            });

            if (/*this.$zoomInNotice &&*/ self.track.visibilityWindow && self.track.visibilityWindow > 0) {

                if ((genomicState.bpp * Math.max(self.$canvas.width(), self.$canvas.height()) > self.track.visibilityWindow) /*|| ('all' === genomicState.chromosome.name && !self.track.supportsWholeGenome)*/) {

                    self.tile = undefined;
                    self.ctx.clearRect(0, 0, self.$canvas.width(), self.$canvas.height());

                    self.stopSpinner();
                    // self.$zoomInNotice.show();

                    fulfill(self.id + '.' + self.axis + ' zoom in to see features');

                    // RETURN RETURN RETURN RETURN
                    return;

                } else {
                    // self.$zoomInNotice.hide();
                }

            } // if (/*this.$zoomInNotice &&*/ self.track.visibilityWindow && self.track.visibilityWindow > 0)

            chrName = genomicState.chromosome.name;

            if (self.tile && self.tile.containsRange(chrName, genomicState.startBP, genomicState.endBP, genomicState.bpp)) {
                self.drawTileWithGenomicState(self.tile, genomicState);
                fulfill(self.id + '.' + self.axis + ' drawTileWithGenomicState(repaint)');
            } else {

                // Expand the requested range so we can pan a bit without reloading
                lengthPixel = 3 * Math.max(self.$canvas.width(), self.$canvas.height());
                // lengthPixel = Math.max(self.$canvas.width(), self.$canvas.height());

                lengthBP = Math.round(genomicState.bpp * lengthPixel);

                startBP = Math.max(0, Math.round(genomicState.startBP - lengthBP/3));
                // startBP = Math.round(genomicState.startBP);

                endBP = startBP + lengthBP;

                if (self.loading && self.loading.start === startBP && self.loading.end === endBP) {
                    fulfill(self.id + '.' + self.axis + ' loading ...');
                } else {

                    self.loading =
                        {
                            start: startBP,
                            end: endBP
                        };

                    self.startSpinner();
                    // console.log(self.id + ' will get features');
                    self.track
                        .getFeatures(genomicState.chromosome.name, startBP, endBP, genomicState.bpp)
                        .then(function (features) {

                            var buffer,
                                ctx;

                            // console.log(self.id + '  did get features');
                            self.loading = undefined;

                            self.stopSpinner();

                            if (features) {

                                buffer = document.createElement('canvas');
                                buffer.width  = 'x' === self.axis ? lengthPixel           : self.$canvas.width();
                                buffer.height = 'x' === self.axis ? self.$canvas.height() : lengthPixel;
                                ctx = buffer.getContext("2d");

                                self.canvasTransform(ctx);

                                self.drawConfiguration =
                                    {
                                        features: features,

                                        context: ctx,

                                        pixelWidth:  lengthPixel,
                                        pixelHeight: Math.min(buffer.width, buffer.height),

                                        bpStart: startBP,
                                        bpEnd:   endBP,

                                        bpPerPixel: genomicState.bpp,

                                        genomicState: genomicState,

                                        viewportContainerX: (genomicState.startBP - startBP) / genomicState.bpp,

                                        viewportContainerWidth: Math.max(self.$canvas.width(), self.$canvas.height()),

                                        labelTransform: self.labelReflectionTransform
                                    };

                                self.startSpinner();

                                // console.log(self.id + ' will draw');
                                self.track.draw(self.drawConfiguration);
                                self.tile = new Tile(chrName, startBP, endBP, genomicState.bpp, buffer);
                                self.drawTileWithGenomicState(self.tile, genomicState);

                                self.stopSpinner();
                                // console.log(self.id + '  did draw');

                                fulfill(self.id + '.' + self.axis + ' drawTileWithGenomicState(' + _.size(features) + ')');

                            } else {
                                self.ctx.clearRect(0, 0, self.$canvas.width(), self.$canvas.height());
                                fulfill(self.id + '.' + self.axis + ' no features');
                            }

                        })
                        .catch(function (error) {

                            self.stopSpinner();

                            self.loading = false;

                            reject(error);
                        });

                }
            }

        });
    };

    hic.TrackRenderer.prototype.drawTileWithGenomicState = function (tile, genomicState) {

        if (tile) {

            this.ctx.clearRect(0, 0, this.$canvas.width(), this.$canvas.height());

            this.offsetPixel = Math.round( (tile.startBP - genomicState.startBP) / genomicState.bpp );
            if ('x' === this.axis) {
                this.ctx.drawImage(tile.buffer, this.offsetPixel, 0);
            } else {
                this.ctx.drawImage(tile.buffer, 0, this.offsetPixel);
            }

            // this.ctx.save();
            // this.ctx.restore();
        }
    };

    hic.TrackRenderer.prototype.startSpinner = function () {
        this.$spinner.show();
        this.throbber.start();
    };

    hic.TrackRenderer.prototype.stopSpinner = function () {
        // this.startSpinner();
        this.throbber.stop();
        this.$spinner.hide();
    };

    hic.TrackRenderer.prototype.isLoading = function () {
        return !(undefined === this.loading);
    };

    Tile = function (chr, startBP, endBP, bpp, buffer) {
        this.chr = chr;
        this.startBP = startBP;
        this.endBP = endBP;
        this.bpp = bpp;
        this.buffer = buffer;
    };

    Tile.prototype.containsRange = function (chr, startBP, endBP, bpp) {
        return this.bpp === bpp && startBP >= this.startBP && endBP <= this.endBP && chr === this.chr;
    };

    return hic;

}) (hic || {});

/**
 * @preserve throbber.js v 0.0.2 2014-04-30
 * http://aino.com
 *
 * Copyright (c) Aino Aktiebolag
 * Licensed under the MIT license.
 *
 */

/*global Image, module, define, window */

(function(global, factory) {

    if ( typeof module === "object" && typeof module.exports === "object" ) {
        module.exports = factory( global );
    } else if ( typeof define == 'function' && define.amd ) {
        define( "throbber", [], function() {
            return factory( global );
        });
    } else {
        global.Throbber = factory( global );
    }

}(window || this, function( window ) {

    var document = window.document,

        M = Math,
        setTimeout = window.setTimeout,

        support = ( 'getContext' in document.createElement('canvas') ),

        _extend = function( defaults, obj ) {
            defaults = defaults || {};
            for (var i in obj) {
                defaults[i] = obj[i];
            }
            return defaults;
        },

        _animate = (function() {

            var loops = [];
            var animating = false;

            var requestFrame = (function(){
              var r = 'RequestAnimationFrame';
              return window.requestAnimationFrame ||
                window['webkit'+r] ||
                window['moz'+r] ||
                window['o'+r] ||
                window['ms'+r] ||
                function( callback ) {
                  window.setTimeout(callback, 1000 / 60);
                };
            }());

            function tick() {

                requestFrame(tick);
                var now = +(new Date());

                for(var i=0; i<loops.length; i++) {
                    var loop = loops[i];
                    loop.elapsed = now - loop.then;
                    if (loop.elapsed > loop.fpsInterval) {
                        loop.then = now - (loop.elapsed % loop.fpsInterval);
                        loop.fn();
                    }
                }
            }

            return function animate(fps, draw) {

                var now = +(new Date());
                loops.push({
                    fpsInterval: 1000/fps,
                    then: now,
                    startTime: now,
                    elapsed: 0,
                    fn: draw
                });
                if ( !animating ) {
                    animating = true;
                    tick();
                }
            };
        }()),

        // convert any color to RGB array
        _getRGB = function( color ) {
            if ( !support ) { return { rgb:false, alpha:1 }; }

            var t = document.createElement( 'i' ), rgb;

            t.style.display = 'none';
            t.style.color = color;
            document.body.appendChild( t );

            rgb = window.getComputedStyle( t, null )
                .getPropertyValue( 'color' )
                .replace( /^rgba?\(([^\)]+)\)/,'$1' ).replace( /\s/g, '' ).split(',').splice( 0, 4 );

            document.body.removeChild( t );
            t = null;

            return {
                alpha: rgb.length == 4 ? rgb.pop() : 1,
                rgb: rgb
            };
        },

        // used when rotating
        _restore = function( ctx, size, back ) {
            var n = back ? -2 : 2;
            ctx.translate( size/n, size/n );
        },

        // locar vars
        fade, i, l, ad, rd,

        // draw the frame
        _draw = function( alpha, o, ctx, step ) {

            fade = 1-alpha || 0;
            ad = 1; rd = -1;

            var size = o.size;

            if ( o.clockwise === false ) {
                ad = -1;
                rd = 1;
            }

            ctx.clearRect(0, 0, size, size);
            ctx.globalAlpha = o.alpha;
            ctx.lineWidth = o.strokewidth;

            for (i=0; i < o.lines; i++) {

                l = i+step >= o.lines ? i-o.lines+step : i+step;

                ctx.strokeStyle = 'rgba(' + o.color.join(',') + ',' + M.max(0, ((l/o.lines) - fade) ).toFixed(2) + ')';
                ctx.beginPath();

                ctx.moveTo( size/2, size/2-o.padding/2 );
                ctx.lineTo( size/2, 0 );
                ctx.lineWidth = o.strokewidth;
                ctx.stroke();
                _restore( ctx, size, false );
                ctx.rotate( ad * ( 360/o.lines ) * M.PI/180 );
                _restore( ctx, size, true );
            }

            if ( o.rotationspeed ) {
                ctx.save();
                _restore( ctx, size, false );

                ctx.rotate( rd * ( 360/o.lines/( 20-o.rotationspeed*2 ) ) * M.PI/180 ); //rotate in origin
                _restore( ctx, size, true );
            }
        };


    // Throbber constructor
    function Throbber( options ) {

        if ( !(this instanceof Throbber )) {
            return new Throbber( options );
        }

        var elem = this.elem = document.createElement('canvas'),
            scope = this;

        if ( !isNaN( options ) ) {
            options = { size: options };
        }

        // default options
        // note that some of these are placeholder and calculated against size if not defined
        this.o = {
            size: 34,           // diameter of loader
            rotationspeed: 6,   // rotation speed (1-10)
            clockwise: true,    // direction, set to false for counter clockwise
            color: '#fff',      // color of the spinner, can be any CSS compatible value
            fade: 300,          // duration of fadein/out when calling .start() and .stop()
            fallback: false,    // a gif fallback for non-supported browsers
            alpha: 1            // global alpha, can be defined using rgba as color or separatly
        };

        /*
        // more options, but these are calculated from size if not defined:

        fps                     // frames per second (~size)
        padding                 // diameter of clipped inner area (~size/2)
        strokewidth             // width of the lines (~size/30)
        lines                   // number of lines (~size/2+4)

        */

        // _extend options
        this.configure( options );

        // fade phase
        // 0 = idle
        // 1 = fadein
        // 2 = running
        // 3 = fadeout
        this.phase = -1;

        // references
        if ( support ) {
            this.ctx = elem.getContext('2d');
            elem.width = elem.height = this.o.size;
        } else if ( this.o.fallback ) {
            elem = this.elem = new Image();
            elem.src = this.o.fallback;
        }

        ///////////////////
        // the loop

        this.loop = (function() {

            var o = scope.o,
                alpha = 0,
                fade = 1000/o.fade/o.fps,
                interval = 1000/o.fps,
                step = scope.step,

                style = elem.style,
                currentStyle = elem.currentStyle,
                filter = currentStyle && currentStyle.filter || style.filter,
                ie = 'filter' in style && o.fallback && !support;

            // the canvas loop
            return function() {

                if ( scope.phase == 3 ) {

                    // fadeout
                    alpha -= fade;
                    if ( alpha <= 0 ) {
                        scope.phase = 0;
                    }

                }

                if ( scope.phase == 1 ) {

                    // fadein
                    alpha += fade;
                    if ( alpha >= 1 ) {
                        scope.phase = 2;
                    }
                }

                if ( ie ) {
                    style.filter = 'alpha(opacity=' + M.min( o.alpha*100, M.max(0, Math.round( alpha*100 ) ) ) + ')';
                } else if ( !support && o.fallback ) {
                    style.opacity = alpha;
                } else if ( support ) {
                    _draw( alpha, o, scope.ctx, step );
                    step = step === 0 ? scope.o.lines : step-1;
                }
            };
        }());

        _animate(this.o.fps, this.loop);

    }

    // Throbber prototypes
    Throbber.prototype = {

        constructor: Throbber,

        // append the loader to a HTML element
        appendTo: function( elem ) {

            this.elem.style.display = 'none';
            elem.appendChild( this.elem );

            return this;
        },

        // _extend options and apply calculate meassures
        configure: function( options ) {

            var o = this.o, color;

            _extend(o, options || {});

            color = _getRGB( o.color );

            // do some sensible calculations if not defined
            _extend( o, _extend({
                padding: o.size/2,
                strokewidth: M.max( 1, M.min( o.size/30, 3 ) ),
                lines: M.min( 30, o.size/2+4 ),
                alpha: color.alpha || 1,
                fps: M.min( 30, o.size+4 )
            }, options ));

            // grab the rgba array
            o.color = color.rgb;

            // copy the amount of lines into steps
            this.step = o.lines;

            // double-up for retina screens
            if (!!window.devicePixelRatio) {
                // lock element into desired end size
                this.elem.style.width = o.size + 'px';
                this.elem.style.height = o.size + 'px';

                o.size *= window.devicePixelRatio;
                o.padding *= window.devicePixelRatio;
                o.strokewidth *= window.devicePixelRatio;
            }

            return this;
        },

        // starts the animation
        start: function() {

            this.elem.style.display = 'block';
            if ( this.phase == -1 ) {
                this.loop();
            }
            this.phase = 1;

            return this;
        },

        // stops the animation
        stop: function() {
            this.phase = 3;
            return this;
        },

        toggle: function() {
            if ( this.phase == 2 ) {
                this.stop();
            } else {
                this.start();
            }
        }
    };

    return Throbber;

}));
