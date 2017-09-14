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

var hic = (function (hic) {
    hic.AnnotationWidget = function (browser, $parent, title) {

        var self = this,
            modal_id,
            $container;

        this.browser = browser;

        $container = $("<div>", {class: 'hic-annotation-container'});
        $parent.append($container);

        modal_id = browser.id + '_' + 'modal';

        modalPresentationButton.call(this, modal_id, $container);

        modal.call(this, modal_id, $('body'), title);

        this.$modal.on('show.bs.modal', function () {
            browser.hideMenu();
            self.updateBody(self.browser.tracks2D);
        });

        this.$modal.on('hidden.bs.modal', function () {
            // do stuff
        });

    };

    hic.AnnotationWidget.prototype.updateBody = function (tracks2D) {

        var self = this, zi;

        self.$annotation_modal_container.empty();

        // Reverse list to present layers in "z" order.
        for(zi = tracks2D.length-1; zi>= 0; zi--) {
            modalBodyRow.call(self, self.$annotation_modal_container, tracks2D[ zi ]);
        }

    };

    function modalBodyRow($container, track) {
        var self = this,
            $row,
            $colorPicker,
            $hideShowTrack,
            $deleteTrack,
            $upTrack,
            $downTrack,
            $e,
            hidden_color = '#f7f7f7',
            str;

        $row = $('<div>', {class: 'hic-annotation-modal-row'});
        $container.append($row);

        $row.data('track2D', track);

        // track name
        $e = $("<div>");
        $e.text(track.config.name);
        $row.append($e);

        // track hide/show
        str = (true === track.isVisible) ? 'fa fa-eye fa-lg' : 'fa fa-eye-slash fa-lg';
        $hideShowTrack = $("<i>", {class: str, 'aria-hidden': 'true'});
        $row.append($hideShowTrack);
        $hideShowTrack.on('click', function (e) {
            var track2D;

            track2D = $row.data('track2D');

            if ($hideShowTrack.hasClass('fa-eye')) {
                $hideShowTrack.addClass('fa-eye-slash');
                $hideShowTrack.removeClass('fa-eye');
                track2D.isVisible = false;
            } else {
                $hideShowTrack.addClass('fa-eye');
                $hideShowTrack.removeClass('fa-eye-slash');
                track2D.isVisible = true;
            }

            self.browser.contactMatrixView.clearCaches();
            self.browser.contactMatrixView.update();

        });

        // color

        //
        // if (inputTypeColorSupport()) {
        //     $colorPicker = $("<input type='color' value='" + rgbToHex(track2D.color) + "'/>");
        //     $colorPicker.on("change", function () {
        //         var hexColor = $colorPicker.val(),
        //             rgb = hexToRgb(hexColor);
        //         track2D.color = rgb;
        //         self.browser.eventBus.post(hic.Event("TrackState2D", track2D))
        //     })
        // } else {
        $colorPicker = createGenericColorPicker(track.color, function (color) {
            track.color = color;
            self.browser.eventBus.post(hic.Event("TrackState2D", track));
        });
        //}

        $row.append($colorPicker);


        // track up/down
        $e = $('<div>');
        $row.append($e);

        $upTrack = $("<i>", {class: 'fa fa-arrow-up', 'aria-hidden': 'true'});
        $e.append($upTrack);

        $downTrack = $("<i>", {class: 'fa fa-arrow-down', 'aria-hidden': 'true'});
        $e.append($downTrack);

        if (1 === _.size(self.browser.tracks2D)) {
            $upTrack.css('color', hidden_color);
            $downTrack.css('color', hidden_color);
        } else if (track === _.first(self.browser.tracks2D)) {
            $downTrack.css('color', hidden_color);
        } else if (track === _.last(self.browser.tracks2D)) {
            $upTrack.css('color', hidden_color);
        }

        $upTrack.on('click', function (e) {
            var track2D,
                indexA,
                indexB;

            indexA = _.indexOf(self.browser.tracks2D, $row.data('track2D'));
            indexB = indexA + 1;

            track2D = self.browser.tracks2D[indexB];
            self.browser.tracks2D[indexB] = self.browser.tracks2D[indexA];
            self.browser.tracks2D[indexA] = track2D;

            self.browser.eventBus.post(hic.Event('TrackState2D', self.browser.tracks2D));
            self.updateBody(self.browser.tracks2D);
        });

        $downTrack.on('click', function (e) {
            var track2D,
                indexA,
                indexB;

            indexA = _.indexOf(self.browser.tracks2D, $row.data('track2D'));
            indexB = indexA - 1;

            track2D = self.browser.tracks2D[indexB];
            self.browser.tracks2D[indexB] = self.browser.tracks2D[indexA];
            self.browser.tracks2D[indexA] = track2D;

            self.browser.eventBus.post(hic.Event('TrackState2D', self.browser.tracks2D));
            self.updateBody(self.browser.tracks2D);
        });


        // track delete
        $deleteTrack = $("<i>", {class: 'fa fa-trash-o fa-lg', 'aria-hidden': 'true'});
        $row.append($deleteTrack);
        $deleteTrack.on('click', function (e) {
            var track2D,
                index;

            track2D = $row.data('track2D');
            index = _.indexOf(self.browser.tracks2D, track2D);

            self.browser.tracks2D.splice(index, 1);

            self.browser.contactMatrixView.clearCaches();
            self.browser.contactMatrixView.update();

            self.browser.eventBus.post(hic.Event('TrackLoad2D', self.browser.tracks2D));
        });

    }

    function modalPresentationButton(modal_id, $parent) {
        var str,
            $e;

        // annotation modal presentation button
        str = '#' + modal_id;
        $e = $('<button>', {type: 'button', class: 'btn btn-default', 'data-toggle': 'modal', 'data-target': str});
        $e.text('2D Annotations');

        $parent.append($e);

    }

    function modal(modal_id, $parent, title) {
        var modal_label,
            $modal,
            $modal_dialog,
            $modal_content,
            $modal_header,
            $modal_title,
            $close,
            $modal_body,
            $modal_footer,
            $e;

        modal_label = modal_id + 'Label';
        // modal
        $modal = $('<div>', {
            class: 'modal fade',
            'id': modal_id,
            tabindex: '-1',
            role: 'dialog',
            'aria-labelledby': modal_label,
            'aria-hidden': 'true'
        });
        $parent.append($modal);

        // modal-dialog
        $modal_dialog = $('<div>', {class: 'modal-dialog modal-lg', role: 'document'});
        $modal.append($modal_dialog);

        // modal-content
        $modal_content = $('<div>', {class: 'modal-content'});
        $modal_dialog.append($modal_content);

        // modal-header
        $modal_header = $('<div>', {class: 'modal-header', id: modal_label});
        $modal_content.append($modal_header);

        // modal-title
        $modal_title = $('<h4>', {class: 'modal-title'});
        $modal_title.text(title);
        $modal_header.append($modal_title);

        // close button
        $close = $('<button>', {type: 'button', class: 'close', 'data-dismiss': 'modal', 'aria-label': 'Close'});
        $e = $('<span>', {'aria-hidden': 'true'});
        $e.html('&times;');
        $close.append($e);
        $modal_header.append($close);

        // modal-body
        $modal_body = $('<div>', {class: 'modal-body'});
        $modal_content.append($modal_body);

        // modal-body - annotation container
        this.$annotation_modal_container = $("<div>", {class: 'hic-annotation-modal-container'});
        $modal_body.append(this.$annotation_modal_container);


        // modal-footer
        $modal_footer = $('<div>', {class: 'modal-footer'});
        $modal_content.append($modal_footer);

        // modal footer - close
        $e = $('<button>', {type: 'button', class: 'btn btn-secondary', 'data-dismiss': 'modal'});
        $e.text('Close');
        $modal_footer.append($e);

        // modal footer - save changes
        // $e = $('<button>', { type:'button', class:'btn btn-primary' });
        // $e.text('Save changes');
        // $modal_footer.append($e);

        this.$modal_body = $modal_body;
        this.$modal = $modal;

    }

    // Some conversion functions for the color input element -- spec says hex must be used
    function rgbToHex(rgb) {
        rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
        return (rgb && rgb.length === 4) ? "#" +
        ("0" + parseInt(rgb[1], 10).toString(16)).slice(-2) +
        ("0" + parseInt(rgb[2], 10).toString(16)).slice(-2) +
        ("0" + parseInt(rgb[3], 10).toString(16)).slice(-2) : '';
    }

    function hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return "rgb(" +
            parseInt(result[1], 16) + ", " +
            parseInt(result[2], 16) + ", " +
            parseInt(result[3], 16) + ")";
    }

    function inputTypeColorSupport() {
        if (typeof inputTypeColorSupport._cachedResult === "undefined") {
            var colorInput = $("<input type='color'/>")[0]; // if color element is supported, value will default to not null
            inputTypeColorSupport._cachedResult = colorInput.type === "color" && colorInput.value !== "";
        }
        return inputTypeColorSupport._cachedResult;
    }

    function createGenericColorPicker(currentColor, callback) {

        var $widget, $palletDiv, $buttonContainer, $showButton, $hideButton;

        $widget = $('<div/>')

        // Set position property to "fixed" to take it out of the page flow.  Otherwise it will move controls to the right
        $palletDiv = $('<div style="width: 300px; display:none; border: 2px black; margin: 5px; position: fixed">');

        $buttonContainer = $('<div style="width: 300px; display: flex; flex-wrap: wrap">');
        $palletDiv.append($buttonContainer);

        if(currentColor) {
            $buttonContainer.append(createColorRow(currentColor));  // self color, might be duplicated in CSS_NAMES but we don't care
        }

        //if(!WEB_SAFE_COLORS) createWebSafeColorArray();
        CSS_COLOR_NAMES.forEach(function (c) {
            $buttonContainer.append(createColorRow(c));
        });

        $hideButton = $('<input/>', {
            type: "button",
            value: "Close",
            style: "margin: 5px, border-radius: 5px"
        });
        $hideButton.click(function () {
            $palletDiv.css("display", "none");
        });
        $palletDiv.append($hideButton);

        $showButton = $('<button/>', {
            style: "width: 20px; height: 20px; background-color: " + currentColor
        });
        $showButton.on("click", function () {
            $palletDiv.css("display", "block");
        });


        $widget.append($showButton);
        $widget.append($palletDiv);
        return $widget;

        function createColorRow(color) {

            var $cell = $('<input>', {
                type: "button",
                style: "width: 20px; background-color:" + color + "; height: 20px",
            })
            $cell.click(function () {
                $showButton.css("background-color", color);
                $palletDiv.css("display", "none");
                callback(color);

            });
            return $cell;
        }

        function createWebSafeColorArray() {

            var safe = new Array('00', '33', '66', '99', 'CC', 'FF'),
                color, r, g, b;

            WEB_SAFE_COLORS = [];
            for (r = 0; r <= 5; r++) {
                for (g = 0; g <= 5; g++) {
                    for (b = 0; b <= 5; b++) {
                        color = "#" + safe[r] + safe[g] + safe[b];
                        WEB_SAFE_COLORS.push(color);
                    }

                }
            }
        }


    }

    var WEB_SAFE_COLORS;

    var CSS_COLOR_NAMES = ["Red", "Blue", "Green","AliceBlue", "AntiqueWhite", "Aqua", "Aquamarine", "Azure", "Beige",
        "Bisque", "Black", "BlanchedAlmond",  "BlueViolet", "Brown", "BurlyWood", "CadetBlue", "Chartreuse", "Chocolate",
        "Coral", "CornflowerBlue", "Cornsilk", "Crimson", "Cyan", "DarkBlue", "DarkCyan", "DarkGoldenRod", "DarkGray",
        "DarkGrey", "DarkGreen", "DarkKhaki", "DarkMagenta", "DarkOliveGreen", "Darkorange", "DarkOrchid", "DarkRed",
        "DarkSalmon", "DarkSeaGreen", "DarkSlateBlue", "DarkSlateGray", "DarkSlateGrey", "DarkTurquoise", "DarkViolet",
        "DeepPink", "DeepSkyBlue", "DimGray", "DimGrey", "DodgerBlue", "FireBrick", "FloralWhite", "ForestGreen", "Fuchsia",
        "Gainsboro", "GhostWhite", "Gold", "GoldenRod", "Gray", "Grey", "GreenYellow", "HoneyDew", "HotPink",
        "IndianRed", "Indigo", "Ivory", "Khaki", "Lavender", "LavenderBlush", "LawnGreen", "LemonChiffon", "LightBlue",
        "LightCoral", "LightCyan", "LightGoldenRodYellow", "LightGray", "LightGrey", "LightGreen", "LightPink",
        "LightSalmon", "LightSeaGreen", "LightSkyBlue", "LightSlateGray", "LightSlateGrey", "LightSteelBlue",
        "LightYellow", "Lime", "LimeGreen", "Linen", "Magenta", "Maroon", "MediumAquaMarine", "MediumBlue",
        "MediumOrchid", "MediumPurple", "MediumSeaGreen", "MediumSlateBlue", "MediumSpringGreen", "MediumTurquoise",
        "MediumVioletRed", "MidnightBlue", "MintCream", "MistyRose", "Moccasin", "NavajoWhite", "Navy", "OldLace",
        "Olive", "OliveDrab", "Orange", "OrangeRed", "Orchid", "PaleGoldenRod", "PaleGreen", "PaleTurquoise", "PaleVioletRed",
        "PapayaWhip", "PeachPuff", "Peru", "Pink", "Plum", "PowderBlue", "Purple", "RosyBrown", "RoyalBlue",
        "SaddleBrown", "Salmon", "SandyBrown", "SeaGreen", "SeaShell", "Sienna", "Silver", "SkyBlue", "SlateBlue",
        "SlateGray", "SlateGrey", "Snow", "SpringGreen", "SteelBlue", "Tan", "Teal", "Thistle", "Tomato", "Turquoise",
        "Violet", "Wheat", "White", "WhiteSmoke", "Yellow", "YellowGreen"];


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
 * Created by dat on 3/22/17.
 */
var hic = (function (hic) {

    hic.ChromosomeSelectorWidget = function (browser, $parent) {

        var self = this,
            $label,
            $selector_container,
            $doit;

        this.browser = browser;

        this.$container = $('<div class="hic-chromosome-selector-widget-container">');
        $parent.append(this.$container);

        $label = $('<div>');
        this.$container.append($label);
        $label.text('Chromosomes');

        $selector_container = $('<div>');
        this.$container.append($selector_container);

        this.$x_axis_selector = $('<select name="x-axis-selector">');
        $selector_container.append(this.$x_axis_selector);

        this.$y_axis_selector = $('<select name="y-axis-selector">');
        $selector_container.append(this.$y_axis_selector);

        $doit = $('<div>');
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
        
        this.browser.eventBus.subscribe("MapLoad", this.dataLoadConfig);

        this.locusChangeConfig = {
            receiveEvent: function (event) {
                if (event.type === "LocusChange") {
                    self.respondToLocusChangeWithState(event.data.state);
                }
            }
        };
        this.browser.eventBus.subscribe("LocusChange", this.locusChangeConfig);

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

    const DRAG_THRESHOLD = 2;
    const PINCH_THRESHOLD = 25;
    const DOUBLE_TAP_DIST_THRESHOLD = 20;
    const DOUBLE_TAP_TIME_THRESHOLD = 300;

    hic.ContactMatrixView = function (browser, $container) {
        var id;

        this.browser = browser;

        this.scrollbarWidget = new hic.ScrollbarWidget(browser);

        id = browser.id + '_' + 'viewport';
        this.$viewport = $("<div>", {id: id});
        $container.append(this.$viewport);

        //content canvas
        this.$canvas = $('<canvas>');
        this.$viewport.append(this.$canvas);

        // this.$canvas.attr('width', this.$viewport.width());
        // this.$canvas.attr('height', this.$viewport.height());
        // this.ctx = this.$canvas.get(0).getContext("2d");

        //spinner
        id = browser.id + '_' + 'viewport-spinner-container';
        this.$spinner = $("<div>", {id: id});
        this.$viewport.append(this.$spinner);

        // throbber
        // size: see $hic-viewport-spinner-size in .scss files
        // this.throbber = Throbber({color: 'rgb(64, 64, 64)', size: 120, padding: 40}).appendTo(this.$spinner.get(0));
        this.throbber = Throbber({color: 'rgb(64, 64, 64)', size: 64, padding: 16}).appendTo(this.$spinner.get(0));
        this.stopSpinner();

        // ruler sweeper widget surface
        this.sweepZoom = new hic.SweepZoom(browser, this.$viewport);
        this.$viewport.append(this.sweepZoom.$rulerSweeper);


        // x - guide
        id = browser.id + '_' + 'x-guide';
        this.$x_guide = $("<div>", {id: id});
        this.$viewport.append(this.$x_guide);

        // y - guide
        id = browser.id + '_' + 'y-guide';
        this.$y_guide = $("<div>", {id: id});
        this.$viewport.append(this.$y_guide);


        $container.append(this.scrollbarWidget.$y_axis_scrollbar_container);

        this.imageTileCache = {};
        this.imageTileCacheKeys = [];
        // Cache at most 20 image tiles
        this.imageTileCacheLimit = browser.isMobile ? 4 : 20;

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

        this.colorScaleCache = {};

        this.browser.eventBus.subscribe("LocusChange", this);
        this.browser.eventBus.subscribe("NormalizationChange", this);
        this.browser.eventBus.subscribe("TrackLoad2D", this);
        this.browser.eventBus.subscribe("TrackState2D", this);

    };

    hic.ContactMatrixView.prototype.setInitialImage = function (x, y, image, state) {
        this.initialImage = {
            x: x,
            y: y,
            state: state.clone(),
            img: image
        }
    }


    hic.ContactMatrixView.prototype.datasetUpdated = function () {
        // This should probably be an event
        // Don't enable mouse actions until we have a dataset.
        if (!this.mouseHandlersEnabled) {
            addMouseHandlers.call(this, this.$viewport);
            this.mouseHandlersEnabled = true;
        }

        this.updating = false;
        this.clearCaches();
        this.colorScaleCache = {};
        this.update();
    };

    hic.ContactMatrixView.prototype.setColorScale = function (value, state) {

        if (!state) {
            state = this.browser.state;
        }

        this.colorScale.high = value;
        this.colorScaleCache[colorScaleKey(state)] = value;
    }

    function colorScaleKey(state) {
        return "" + state.chr1 + "_" + state.chr2 + "_" + state.zoom + "_" + state.normalization;
    }

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

        if ("NormalizationChange" === event.type || "TrackLoad2D" === event.type || "TrackState2D" === event.type) {
            this.clearCaches();
        }

        if (this.initialImage) {
            if (!validateInitialImage.call(this, this.initialImage, event.data.state)) {
                this.initialImage = undefined;
                this.startSpinner();
            }
        }

        this.update();

    };

    function validateInitialImage(initialImage, state) {

        if (initialImage.state.equals(state)) return true;

        if (!(initialImage.state.chr1 === state.chr1 && initialImage.state.chr2 === state.chr2 &&
            initialImage.state.zoom === state.zoom && initialImage.state.pixelSize === state.pixelSize &&
            initialImage.state.normalization === state.normalization)) return false;

        // Now see if initial image fills view
        var offsetX = (initialImage.x - state.x) * state.pixelSize,
            offsetY = (initialImage.y - state.y) * state.pixelSize,
            width = initialImage.img.width,
            height = initialImage.img.height,
            viewportWidth = this.$viewport.width(),
            viewportHeight = this.$viewport.height();

        // Viewport rectangle must be completely contained in image rectangle
        return offsetX <= 0 && offsetY <= 0 && (width + offsetX) >= viewportWidth && (height + offsetY) >= viewportHeight;

    }

    function drawStaticImage(image) {
        var viewportWidth = this.$viewport.width(),
            viewportHeight = this.$viewport.height(),
            canvasWidth = this.$canvas.width(),
            canvasHeight = this.$canvas.height(),
            state = this.browser.state,
            offsetX = (image.x - state.x) * state.pixelSize,
            offsetY = (image.y - state.y) * state.pixelSize;
        if (canvasWidth !== viewportWidth || canvasHeight !== viewportHeight) {
            this.$canvas.width(viewportWidth);
            this.$canvas.height(viewportHeight);
            this.$canvas.attr('width', this.$viewport.width());
            this.$canvas.attr('height', this.$viewport.height());
        }
        this.ctx.drawImage(image.img, offsetX, offsetY);
    }

    hic.ContactMatrixView.prototype.update = function () {

        var self = this,
            state = this.browser.state;

        if (!self.browser.dataset) return;

        if (!self.ctx) {
            self.ctx = this.$canvas.get(0).getContext("2d");
        }

        if (self.initialImage) {
            drawStaticImage.call(this, this.initialImage);
            return;
        }

        if (self.updating) {
            return;
        }

        self.updating = true;

        self.startSpinner();

        self.browser.dataset.getMatrix(state.chr1, state.chr2)

            .then(function (matrix) {

                var zd = matrix.bpZoomData[state.zoom],
                    blockBinCount = zd.blockBinCount,   // Dimension in bins of a block (width = height = blockBinCount)
                    pixelSizeInt = Math.max(1, Math.floor(state.pixelSize)),
                    widthInBins = self.$viewport.width() / pixelSizeInt,
                    heightInBins = self.$viewport.height() / pixelSizeInt,
                    blockCol1 = Math.floor(state.x / blockBinCount),
                    blockCol2 = Math.floor((state.x + widthInBins) / blockBinCount),
                    blockRow1 = Math.floor(state.y / blockBinCount),
                    blockRow2 = Math.floor((state.y + heightInBins) / blockBinCount),
                    r, c, promises = [];

                self.checkColorScale(zd, blockRow1, blockRow2, blockCol1, blockCol2, state.normalization)

                    .then(function () {

                        for (r = blockRow1; r <= blockRow2; r++) {
                            for (c = blockCol1; c <= blockCol2; c++) {
                                promises.push(self.getImageTile(zd, r, c, state));
                            }
                        }

                        Promise.all(promises)
                            .then(function (imageTiles) {
                                self.updating = false;
                                self.draw(imageTiles, zd);
                                self.stopSpinner();
                            })
                            .catch(function (error) {
                                self.updating = false;
                                self.stopSpinner();
                                console.error(error);
                            })

                    })
                    .catch(function (error) {
                        self.updating = false;
                        self.stopSpinner(self);
                        console.error(error);
                    })
            })
            .catch(function (error) {
                self.updating = false;
                self.stopSpinner();
                console.error(error);
            })
    };

    hic.ContactMatrixView.prototype.checkColorScale = function (zd, row1, row2, col1, col2, normalization) {

        var self = this;

        var colorKey = colorScaleKey(self.browser.state);   // This doesn't feel right, state should be an argument
        if (self.colorScaleCache[colorKey]) {
            var changed = self.colorScale.high !== self.colorScaleCache[colorKey];
            self.colorScale.high = self.colorScaleCache[colorKey];
            if (changed) self.browser.eventBus.post(hic.Event("ColorScale", self.colorScale));
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

                        promises.push(self.browser.dataset.getNormalizedBlock(zd, blockNumber, normalization))
                    }
                }

                Promise.all(promises)
                    .then(function (blocks) {
                        var s = computePercentile(blocks, 95);
                        if (!isNaN(s)) {  // Can return NaN if all blocks are empty
                            self.colorScale.high = s;
                            self.computeColorScale = false;
                            self.colorScaleCache[colorKey] = s;
                            self.browser.eventBus.post(hic.Event("ColorScale", self.colorScale));
                        }

                        self.stopSpinner();

                        fulfill();

                    })
                    .catch(function (error) {
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

            var image = imageTile.image,
                pixelSizeInt = Math.max(1, Math.floor(state.pixelSize));

            if (image != null) {
                var row = imageTile.row,
                    col = imageTile.column,
                    x0 = blockBinCount * col,
                    y0 = blockBinCount * row;
                var offsetX = (x0 - state.x) * state.pixelSize;
                var offsetY = (y0 - state.y) * state.pixelSize;
                var scale = state.pixelSize / pixelSizeInt;
                var scaledWidth = image.width * scale;
                var scaledHeight =image.height * scale;
                if (offsetX <= viewportWidth && offsetX + scaledWidth >= 0 &&
                    offsetY <= viewportHeight && offsetY + scaledHeight >= 0) {
                    if (scale === 1) {
                        self.ctx.drawImage(image, offsetX, offsetY);
                    }
                    else {
                        self.ctx.drawImage(image, offsetX, offsetY, scaledWidth, scaledHeight);
                    }
                }
            }
        })

    };

    hic.ContactMatrixView.prototype.getImageTile = function (zd, row, column, state) {

        var self = this,
            sameChr = zd.chr1 === zd.chr2,
            pixelSizeInt = Math.max(1, Math.floor(state.pixelSize)),
            useImageData = pixelSizeInt === 1,
            key = "" + zd.chr1.name + "_" + zd.chr2.name + "_" + zd.zoom.binSize + "_" + zd.zoom.unit +
                "_" + row + "_" + column + "_" + pixelSizeInt + "_" + state.normalization;

        if (this.imageTileCache.hasOwnProperty(key)) {
            return Promise.resolve(this.imageTileCache[key]);
        } else {
            return new Promise(function (fulfill, reject) {

                var blockBinCount = zd.blockBinCount,
                    blockColumnCount = zd.blockColumnCount,
                    widthInBins = zd.blockBinCount,
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

                    var imageSize = Math.ceil(widthInBins * pixelSizeInt),
                        blockNumber, row, col, x0, y0, image, ctx, id, i, rec, x, y, color, px, py;

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

                    if (useImageData) {
                        id = ctx.getImageData(0, 0, image.width, image.height);
                    }

                    for (i = 0; i < block.records.length; i++) {
                        rec = block.records[i];
                        x = Math.floor((rec.bin1 - x0) * pixelSizeInt);
                        y = Math.floor((rec.bin2 - y0) * pixelSizeInt);

                        if (transpose) {
                            t = y;
                            y = x;
                            x = t;
                        }

                        color = self.colorScale.getColor(rec.counts);

                        if (useImageData) {
                            // TODO -- verify that this bitblting is faster than fillRect
                            setPixel(id, x, y, color.red, color.green, color.blue, 255);
                            if (sameChr && row === col) {
                                setPixel(id, y, x, color.red, color.green, color.blue, 255);
                            }
                        }
                        else {
                            ctx.fillStyle = color.rgb;
                            ctx.fillRect(x, y, pixelSizeInt, pixelSizeInt);
                            if (sameChr && row === col) {
                                ctx.fillRect(y, x, pixelSizeInt, pixelSizeInt);
                            }
                        }
                    }
                    if (useImageData) {
                        ctx.putImageData(id, 0, 0);
                    }

                    //Draw 2D tracks
                    ctx.save();
                    ctx.lineWidth = 2;
                    self.browser.tracks2D.forEach(function (track2D) {
                        var color;

                        if (track2D.isVisible) {
                            var features = track2D.getFeatures(zd.chr1.name, zd.chr2.name);

                            if (features) {
                                features.forEach(function (f) {

                                    var x1 = Math.round((f.x1 / zd.zoom.binSize - x0) * pixelSizeInt);
                                    var x2 = Math.round((f.x2 / zd.zoom.binSize - x0) * pixelSizeInt);
                                    var y1 = Math.round((f.y1 / zd.zoom.binSize - y0) * pixelSizeInt);
                                    var y2 = Math.round((f.y2 / zd.zoom.binSize - y0) * pixelSizeInt);
                                    var w = x2 - x1;
                                    var h = y2 - y1;

                                    if (transpose) {
                                        t = y1;
                                        y1 = x1;
                                        x1 = t;

                                        t = h;
                                        h = w;
                                        w = t;
                                    }

                                    var dim = Math.max(image.width, image.height);
                                    if (x2 > 0 && x1 < dim && y2 > 0 && y1 < dim) {

                                        ctx.strokeStyle = track2D.color ? track2D.color : f.color;
                                        ctx.strokeRect(x1, y1, w, h);
                                        if (sameChr && row === col) {
                                            ctx.strokeRect(y1, x1, h, w);
                                        }
                                    }
                                })
                            }
                        }
                    });

                    ctx.restore();

                    // Uncomment to reveal tile boundaries for debugging.
                    // ctx.fillStyle = "rgb(255,255,255)";
                    // ctx.strokeRect(0, 0, image.width - 1, image.height - 1)

                    var t1 = (new Date()).getTime();

                    //console.log(t1 - t0);

                    return image;
                }


                if (sameChr && row < column) {
                    blockNumber = column * blockColumnCount + row;
                }
                else {
                    blockNumber = row * blockColumnCount + column;
                }

                self.startSpinner();

                self.browser.dataset.getNormalizedBlock(zd, blockNumber, state.normalization)

                    .then(function (block) {

                        var image;
                        if (block && block.records.length > 0) {
                            image = drawBlock(block, transpose);
                        }
                        else {
                            //console.log("No block for " + blockNumber);
                        }

                        var imageTile = {row: row, column: column, image: image};


                        if (self.imageTileCacheKeys.length > self.imageTileCacheLimit) {
                            delete self.imageTileCache[self.imageTileCacheKeys[0]];
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

        var array = [];
        blockArray.forEach(function (block) {
            if (block) {
                for (i = 0; i < block.records.length; i++) {
                    array.push(block.records[i].counts);
                }
            }
        });

        return hic.Math.percentile(array, p);

    }

    hic.ContactMatrixView.prototype.startSpinner = function () {
        // console.log("Start spinner");
        if (this.$spinner.is(':visible') !== true) {
            this.$spinner.show();
            this.throbber.start();
        }
    };

    hic.ContactMatrixView.prototype.stopSpinner = function () {
        //  console.log("Stop spinner");
        this.throbber.stop();
        this.$spinner.hide();
    };

    function shiftCurrentImage(self, dx, dy) {
        var canvasWidth = self.$canvas.width(),
            canvasHeight = self.$canvas.height(),
            imageData;

        imageData = self.ctx.getImageData(0, 0, canvasWidth, canvasHeight);
        self.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        self.ctx.putImageData(imageData, dx, dy);
    }

    function addMouseHandlers($viewport) {

        var self = this,
            isMouseDown = false,
            isDragging = false,
            isSweepZooming = false,
            mouseDown,
            mouseLast,
            mouseOver,
            lastTouch,
            pinch,
            viewport = $viewport[0],
            lastWheelTime;

        viewport.ontouchstart = function (ev) {

            ev.preventDefault();
            ev.stopPropagation();

            var touchCoords = translateTouchCoordinates(ev.targetTouches[0], viewport),
                offsetX = touchCoords.x,
                offsetY = touchCoords.y,
                count = ev.targetTouches.length,
                timeStamp = ev.timeStamp || Date.now(),
                resolved = false,
                dx, dy, dist, direction;

            if (count === 2) {
                touchCoords = translateTouchCoordinates(ev.targetTouches[0], viewport);
                offsetX = (offsetX + touchCoords.x) / 2;
                offsetY = (offsetY + touchCoords.y) / 2;
            }

            // NOTE: If the user makes simultaneous touches, the browser may fire a
            // separate touchstart event for each touch point. Thus if there are
            // two simultaneous touches, the first touchstart event will have
            // targetTouches length of one and the second event will have a length
            // of two.  In this case replace previous touch with this one and return
            if (lastTouch && (timeStamp - lastTouch.timeStamp < DOUBLE_TAP_TIME_THRESHOLD) && ev.targetTouches.length > 1 && lastTouch.count === 1) {
                lastTouch = {x: offsetX, y: offsetY, timeStamp: timeStamp, count: ev.targetTouches.length};
                return;
            }


            if (lastTouch && (timeStamp - lastTouch.timeStamp < DOUBLE_TAP_TIME_THRESHOLD)) {

                direction = (lastTouch.count === 2 || count === 2) ? -1 : 1;
                dx = lastTouch.x - offsetX;
                dy = lastTouch.y - offsetY;
                dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < DOUBLE_TAP_DIST_THRESHOLD) {
                    self.browser.zoomAndCenter(direction, offsetX, offsetY);
                    lastTouch = undefined;
                    resolved = true;
                }
            }

            if (!resolved) {
                lastTouch = {x: offsetX, y: offsetY, timeStamp: timeStamp, count: ev.targetTouches.length};
            }
        }

        viewport.ontouchmove = hic.throttle(function (ev) {

            var touchCoords1, touchCoords2, t;

            ev.preventDefault();
            ev.stopPropagation();

            if (ev.targetTouches.length === 2) {

                // Update pinch  (assuming 2 finger movement is a pinch)
                touchCoords1 = translateTouchCoordinates(ev.targetTouches[0], viewport);
                touchCoords2 = translateTouchCoordinates(ev.targetTouches[1], viewport);

                t = {
                    x1: touchCoords1.x,
                    y1: touchCoords1.y,
                    x2: touchCoords2.x,
                    y2: touchCoords2.y
                };

                if (pinch) {
                    pinch.end = t;
                } else {
                    pinch = {start: t};
                }
            }

            else {
                // Assuming 1 finger movement is a drag

                if (self.updating) return;   // Don't overwhelm browser

                var touchCoords = translateTouchCoordinates(ev.targetTouches[0], viewport),
                    offsetX = touchCoords.x,
                    offsetY = touchCoords.y;
                if (lastTouch) {
                    var dx = lastTouch.x - offsetX,
                        dy = lastTouch.y - offsetY;
                    if (!isNaN(dx) && !isNaN(dy)) {
                        self.browser.shiftPixels(lastTouch.x - offsetX, lastTouch.y - offsetY);
                    }
                }

                lastTouch = {
                    x: offsetX,
                    y: offsetY,
                    timeStamp: ev.timeStamp || Date.now(),
                    count: ev.targetTouches.length
                };
            }

        }, 20);

        viewport.ontouchend = function (ev) {

            ev.preventDefault();
            ev.stopPropagation();

            if (pinch && pinch.end !== undefined) {

                var startT = pinch.start,
                    endT = pinch.end,
                    dxStart = startT.x2 - startT.x1,
                    dyStart = startT.y2 - startT.y1,
                    dxEnd = endT.x2 - endT.x1,
                    dyEnd = endT.y2 - endT.y1,
                    distStart = Math.sqrt(dxStart * dxStart + dyStart * dyStart),
                    distEnd = Math.sqrt(dxEnd * dxEnd + dyEnd * dyEnd),
                    scale = distEnd / distStart,
                    deltaX = (endT.x1 + endT.x2) / 2 - (startT.x1 + startT.x2) / 2,
                    deltaY = (endT.y1 + endT.y2) / 2 - (startT.y1 + startT.y2) / 2,
                    anchorPx = (startT.x1 + startT.x2) / 2,
                    anchorPy = (startT.y1 + startT.y2) / 2;

                if (scale < 0.8 || scale > 1.2) {
                    lastTouch = undefined;
                    self.browser.pinchZoom(anchorPx, anchorPy, scale);
                }
            }

            // a touch end always ends a pinch
            pinch = undefined;

        }

        if (!this.browser.isMobile) {


            $viewport.dblclick(function (e) {

                e.preventDefault();
                e.stopPropagation();

                var mouseX = e.offsetX || e.layerX,
                    mouseY = e.offsetY || e.layerX;

                self.browser.zoomAndCenter(1, mouseX, mouseY);

            });

            $viewport.on('mouseover', function (e) {
                mouseOver = true;
            });

            $viewport.on('mouseout', function (e) {
                mouseOver = undefined;
            });

            $viewport.on('mousedown', function (e) {
                var eFixed;

                e.preventDefault();
                e.stopPropagation();

                if (self.browser.$menu.is(':visible')) {
                    self.browser.hideMenu();
                }

                mouseLast = {x: e.offsetX, y: e.offsetY};
                mouseDown = {x: e.offsetX, y: e.offsetY};

                isSweepZooming = (true === e.altKey);
                if (isSweepZooming) {
                    eFixed = $.event.fix(e);
                    self.sweepZoom.reset({x: eFixed.pageX, y: eFixed.pageY});
                }

                isMouseDown = true;

            });

            $viewport.on('mousemove', hic.throttle(function (e) {

                var coords, eFixed;


                e.preventDefault();
                e.stopPropagation();
                coords = {x: e.offsetX, y: e.offsetY};

                self.browser.updateCrosshairs(coords);

                if (isMouseDown) { // Possibly dragging

                    if (isSweepZooming) {
                        // Sets pageX and pageY for browsers that don't support them
                        eFixed = $.event.fix(e);
                        self.sweepZoom.update({x: eFixed.pageX, y: eFixed.pageY});
                    }

                    else if (mouseDown.x && Math.abs(coords.x - mouseDown.x) > DRAG_THRESHOLD) {

                        isDragging = true;

                        var dx = mouseLast.x - coords.x;
                        var dy = mouseLast.y - coords.y;

                        // If matrix data is updating shift current map image while we wait
                        if (self.updating) {
                            shiftCurrentImage(self, -dx, -dy);
                        }

                        self.browser.shiftPixels(dx, dy);

                    }

                    mouseLast = coords;
                }


            }, 10));

            $viewport.on('mouseup', panMouseUpOrMouseOut);

            $viewport.on('mouseleave', panMouseUpOrMouseOut);

            // Mousewheel events -- ie exposes event only via addEventListener, no onwheel attribute
            // NOte from spec -- trackpads commonly map pinch to mousewheel + ctrl

            if (!self.browser.figureMode) {
                $viewport[0].addEventListener("wheel", mouseWheelHandler, 250, false);
            }

            // Document level events
            $(document).on({

                keydown: function (e) {
                    // shift key
                    if (true === mouseOver && 16 === e.keyCode) {
                        self.browser.showCrosshairs();
                    }
                },

                keyup: function (e) {
                    // shift key
                    if (16 === e.keyCode) {
                        self.browser.hideCrosshairs();
                    }
                },

                // for sweep-zoom allow user to sweep beyond viewport extent
                // sweep area clamps since viewport mouse handlers stop firing
                // when the viewport boundary is crossed.
                mouseup: function (e) {

                    e.preventDefault()
                    e.stopPropagation();

                    if (isSweepZooming) {
                        isSweepZooming = false;
                        self.sweepZoom.dismiss();
                    }

                }
            });

        }

        function panMouseUpOrMouseOut(e) {

            if (true === isDragging) {
                isDragging = false;
                self.browser.eventBus.post(hic.Event("DragStopped"));
            }

            isMouseDown = false;
            mouseDown = mouseLast = undefined;
        }

        function mouseWheelHandler(e) {

            e.preventDefault();
            e.stopPropagation();

            var t = Date.now();

            if (lastWheelTime === undefined || (t - lastWheelTime > 1000)) {
                console.log("Wheel " + t + "  " + lastWheelTime + "  " + (t - lastWheelTime));
                // cross-browser wheel delta  -- Firefox returns a "detail" object that is opposite in sign to wheelDelta
                var direction = e.deltaY < 0 ? 1 : -1,
                    coords = igv.translateMouseCoordinates(e, $viewport),
                    x = coords.x,
                    y = coords.y;
                self.browser.zoomAndCenter(direction, x, y);
                lastWheelTime = t;
            }

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

    hic.ColorScale.prototype.equals = function (cs) {
        return JSON.stringify(this) === JSON.stringify(cs);
    }

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

    function translateTouchCoordinates(e, target) {

        var $target = $(target),
            eFixed,
            posx,
            posy;

        posx = e.pageX - $target.offset().left;
        posy = e.pageY - $target.offset().top;

        return {x: posx, y: posy}
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


    hic.EventBus = function (browser) {

        this.browser = browser;

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

        var self = this,
            eventType = event.type,
            subscriberList = this.subscribers[eventType];

        if(subscriberList) {
            subscriberList.forEach(function (subscriber) {

                if ("function" === typeof subscriber.receiveEvent) {
                    subscriber.receiveEvent(event);
                }
            });
        }

        if(event.type === "LocusChange"  && event.propogate) {

            self.browser.synchedBrowsers.forEach(function (browser) {
                browser.syncState(self.browser.getSyncState());
            })

        }

    };

    hic.Event = function(type, data, propogate) {
        return {
            type: type,
            data: data || {},
            propogate: propogate !== undefined ? propogate : true     // Default to true
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
    
    hic.loadTrack2D = function (config) {

        return new Promise(function (fulfill, reject) {

            igvxhr
                .loadString(config.url, {})
                .then(function (data) {

                    var features = parseData(data);

                    fulfill(new Track2D(config, features));
                })
                .catch(reject);

        })
    }

    function parseData(data) {

        if (!data) return null;

        var feature,
            lines = data.splitLines(),
            len = lines.length,
            tokens,
            allFeatures = [],
            line,
            i,
            delimiter = "\t";


        for (i = 1; i < len; i++) {

            line = lines[i];

            tokens = lines[i].split(delimiter);
            if (tokens.length < 7) {
                //console.log("Could not parse line: " + line);
                continue;
            }

            feature = {
                chr1: tokens[0],
                x1: parseInt(tokens[1]),
                x2: parseInt(tokens[2]),
                chr2: tokens[3],
                y1: parseInt(tokens[4]),
                y2: parseInt(tokens[5]),
                color: "rgb(" + tokens[6] + ")"
            }
            allFeatures.push(feature);
        }

        return allFeatures;
    };

    function getKey(chr1, chr2) {
        return chr1 > chr2 ? chr2 + "_" + chr1 : chr1 + "_" + chr2;
    }

    function getAltKey(chr1, chr2) {
        var chr1Alt = chr1.startsWith("chr") ? chr1.substr(3) : "chr" + chr1,
            chr2Alt = chr2.startsWith("chr") ? chr2.substr(3) : "chr" + chr2;
        return chr1 > chr2 ? chr2Alt + "_" + chr1Alt : chr1Alt + "_" + chr2Alt;
    }


    function Track2D(config, features) {

        var self = this;

        this.config = config;
        this.name = config.name;
        this.featureMap = {};
        this.featureCount = 0;
        this.isVisible = true;
        this.color = config.color === undefined ? features[0].color : config.color;

        features.forEach(function (f) {

            self.featureCount++;

            var key = getKey(f.chr1, f.chr2),
                list = self.featureMap[key];

            if(!list) {
                list = [];
                self.featureMap[key] = list;
            }
            list.push(f);
        });
    }

    Track2D.prototype.getFeatures = function(chr1, chr2) {
        var key = getKey(chr1, chr2),
            features =  this.featureMap[key];

        return features || this.featureMap[getAltKey(chr1, chr2)];
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

    var defaultPixelSize, defaultState;
    var MAX_PIXEL_SIZE = 12;
    var DEFAULT_ANNOTATION_COLOR = "rgb(22, 129, 198)";
    var defaultSize =
    {
        width: 640,
        height: 640
    };


    var datasetCache = {};

    hic.allBrowsers = [];

    // mock igv browser objects for igv.js compatibility
    function createIGV($hic_container, hicBrowser, trackMenuReplacement) {

        igv.browser =
        {
            constants: {defaultColor: "rgb(0,0,150)"},

            // Compatibility wit igv menus
            trackContainerDiv: hicBrowser.layoutController.$x_track_container.get(0)
        };

        igv.trackMenuItem = function () {
            return trackMenuReplacement.trackMenuItemReplacement.apply(trackMenuReplacement, arguments);
        };

        igv.trackMenuItemList = function () {
            // var args;
            // args = Array.prototype.slice.call(arguments);
            // args.push(hicBrowser);
            return trackMenuReplacement.trackMenuItemListReplacement.apply(trackMenuReplacement, arguments);
        };

        // Popover object -- singleton shared by all components
        igv.popover = new igv.Popover($hic_container);

        // ColorPicker object -- singleton shared by all components
        igv.colorPicker = new igv.ColorPicker($hic_container, undefined);
        igv.colorPicker.hide();

        // Dialog object -- singleton shared by all components
        igv.dialog = new igv.Dialog($hic_container, igv.Dialog.dialogConstructor);
        igv.dialog.hide();

        // Data Range Dialog object -- singleton shared by all components
        igv.dataRangeDialog = new igv.DataRangeDialog($hic_container);
        igv.dataRangeDialog.hide();

        // alert object -- singleton shared by all components
        igv.alert = new igv.AlertDialog(hicBrowser.$root, "igv-alert");
        igv.alert.hide();

    }

    function destringifyTracks(trackString) {

        var trackTokens = trackString.split("|||"),
            configList = [];

        trackTokens.forEach(function (track) {
            var tokens = track.split("|"),
                url = tokens[0],
                config = {url: url},
                name, dataRangeString, color;

            if (url.trim().length > 0) {

                if (tokens.length > 1) name = tokens[1];
                if (tokens.length > 2) dataRangeString = tokens[2];
                if (tokens.length > 3) color = tokens[3];

                if (name) config.name = name;
                if (dataRangeString) {
                    var r = dataRangeString.split("-");
                    config.min = parseFloat(r[0]);
                    config.max = parseFloat(r[1])
                }
                if (color) config.color = color;

                configList.push(config);
            }
        });
        return configList;

    }

    hic.createBrowser = function ($hic_container, config) {

        var browser,
            uri,
            parts,
            query,
            uriDecode,
            hicUrl,
            name,
            stateString,
            colorScale,
            trackString,
            selectedGene,
            nvi,
            normVectorString,
            isMiniMode,
            initialImageImg,
            initialImageX,
            initialImageY;

        setDefaults(config);

        if (config.href && !config.href.includes("?")) {
            config.href = "?" + config.href;
        }

        uri = config.href || (config.initFromUrl !== false && window.location.href) || "";
        parts = parseUri(uri);
        query = parts.queryKey;
        uriDecode = uri.includes('%2C');   // for backward compatibility, all old state values will have this

        if (query) {
            hicUrl = query["hicUrl"],
                name = query["name"],
                stateString = query["state"],
                colorScale = query["colorScale"],
                trackString = query["tracks"],
                selectedGene = query["selectedGene"],
                nvi = query["nvi"],
                normVectorString = query["normVectorFiles"];
        }

        if (hicUrl) {
            config.url = paramDecode(hicUrl, uriDecode);
        }
        if (name) {
            config.name = paramDecode(name, uriDecode);
        }
        if (stateString) {
            stateString = paramDecode(stateString, uriDecode);
            config.state = hic.destringifyState(stateString);

        }
        if (colorScale) {
            config.colorScale = parseFloat(colorScale, uriDecode);
        }

        if (trackString) {
            trackString = paramDecode(trackString, uriDecode);
            config.tracks = destringifyTracks(trackString);
        }

        if (selectedGene) {
            igv.FeatureTrack.selectedGene = selectedGene;
        }

        if (normVectorString) {
            config.normVectorFiles = normVectorString.split("|||");
        }

        if (nvi) {
            config.nvi = nvi;
        }

        browser = new hic.Browser($hic_container, config);

        hic.allBrowsers.push(browser);

        hic.Browser.setCurrentBrowser(browser);

        isMiniMode = (config.miniMode && true === config.miniMode);
        if (!isMiniMode && _.size(hic.allBrowsers) > 1) {
            $('.hic-nav-bar-delete-button').show();
        }

        browser.trackMenuReplacement = new hic.TrackMenuReplacement(browser);

        createIGV($hic_container, browser, browser.trackMenuReplacement);


        if (config.initialImage) {

            initialImageImg = new Image();

            initialImageImg.onload = function () {

                if(typeof config.initialImage === 'string') {
                    initialImageX = browser.state.x;
                    initialImageY = browser.state.y;
                } else {
                    initialImageX = config.initialImage.left || browser.state.x;
                    initialImageY = config.initialImage.top || browser.state.y;
                }

                browser.contactMatrixView.setInitialImage(initialImageX, initialImageY, initialImageImg, browser.state);

                // Load hic file after initial image is loaded -- important
                if (config.url || config.dataset) {
                    browser.loadHicFile(config);
                }
            }
            initialImageImg.src = (typeof config.initialImage === 'string') ? config.initialImage : config.initialImage.imageURL;
        }
        else {
            if (config.url || config.dataset) {
                browser.loadHicFile(config);
            }
        }

        return browser;

    };

    hic.Browser = function ($app_container, config) {

        var self = this;

        this.config = config;
        this.figureMode = config.miniMode;
        this.resolutionLocked = false;
        this.eventBus = new hic.EventBus(this);
        this.updateHref = config.updateHref === undefined ? true : config.updateHref;
        this.updateHref_ = this.updateHref;   // Need to remember this to restore state on map load (after local file)

        this.id = _.uniqueId('browser_');
        this.trackRenderers = [];
        this.tracks2D = [];
        this.normVectorFiles = [];

        this.synchedBrowsers = [];

        this.isMobile = hic.isMobile();

        this.$root = $('<div class="hic-root unselect">');

        if (config.width) {
            this.$root.css("width", String(config.width));
        }
        if (config.height) {
            this.$root.css("height", String(config.height + hic.LayoutController.navbarHeight(this.config.miniMode)));
        }


        $app_container.append(this.$root);

        this.layoutController = new hic.LayoutController(this, this.$root);

        this.hideCrosshairs();

        this.state = config.state ? config.state : defaultState.clone();

        if (config.colorScale && !isNaN(config.colorScale)) {
            this.contactMatrixView.setColorScale(config.colorScale, this.state);
        }

        this.eventBus.subscribe("LocusChange", this);
        this.eventBus.subscribe("DragStopped", this);
        this.eventBus.subscribe("MapLoad", this);
        this.eventBus.subscribe("ColorScale", this);
        this.eventBus.subscribe("NormalizationChange", this);
        this.eventBus.subscribe("TrackLoad2D", this);
        this.eventBus.subscribe("TrackLoad", this);
        this.eventBus.subscribe("TrackState2D", this);
        this.eventBus.subscribe("GenomeChange", this);

        function configureHover($e) {

            var self = this;

            $e.hover(_in, _out);

            _out();

            function _in() {

                if (_.size(hic.allBrowsers) > 1) {
                    $e.css('border-color', '#df0000');
                }

            }

            function _out() {

                if (_.size(hic.allBrowsers) > 1) {
                    $e.css('border-color', '#5f5f5f');
                }

            }
        }

    };

    hic.Browser.prototype.toggleMenu = function () {

        if (this.$menu.is(':visible')) {
            this.hideMenu();
        } else {
            this.showMenu();
        }

    };

    hic.Browser.prototype.showMenu = function () {
        this.$menu.show();
    };

    hic.Browser.prototype.hideMenu = function () {
        this.$menu.hide();
    };

    /**
     * Load a dataset outside the context of a browser.  Purpose is to "pre load" a shared dataset when
     * instantiating multiple browsers in a page.
     *
     * @param config
     */
    hic.loadDataset = function (config) {

        return new Promise(function (fulfill, reject) {
            var hicReader = new hic.HiCReader(config);

            hicReader.loadDataset(config)

                .then(function (dataset) {

                    if (config.nvi) {
                        var nviArray = decodeURIComponent(config.nvi).split(","),
                            range = {start: parseInt(nviArray[0]), size: parseInt(nviArray[1])};

                        hicReader.readNormVectorIndex(dataset, range)
                            .then(function (ignore) {
                                fulfill(dataset);
                            })
                            .catch(function (error) {
                                self.contactMatrixView.stopSpinner();
                                console.log(error);
                            })
                    }
                    else {
                        fulfill(dataset);
                    }
                })
                .catch(reject)
        });
    };

    hic.syncBrowsers = function (browsers) {

        browsers.forEach(function (b1) {
            if (b1 === undefined) {
                console.log("Attempt to sync undefined browser");
            }
            else {
                browsers.forEach(function (b2) {
                    if (b2 === undefined) {
                        console.log("Attempt to sync undefined browser");
                    }
                    else {
                        if (b1 !== b2 && !b1.synchedBrowsers.includes(b2)) {
                            b1.synchedBrowsers.push(b2);
                        }
                    }
                })
            }
        })
    };

    hic.Browser.getCurrentBrowser = function () {

        if (hic.allBrowsers.length === 1) {
            return hic.allBrowsers[0];
        } else {
            return hic.Browser.currentBrowser;
        }

    };

    hic.Browser.setCurrentBrowser = function (browser) {

        if (undefined === browser) {

            $('.hic-root').removeClass('hic-root-selected');
            hic.Browser.currentBrowser = browser;
        } else if (browser === hic.Browser.currentBrowser) {

            // toggle state (turn selection off)
            $('.hic-root').removeClass('hic-root-selected');
            hic.Browser.currentBrowser = undefined;

        } else {

            if (hic.allBrowsers.length > 1) {
                $('.hic-root').removeClass('hic-root-selected');
                browser.$root.addClass('hic-root-selected');
            }

            hic.Browser.currentBrowser = browser;
        }

    };

    hic.Browser.prototype.updateUriParameters = function (event) {

        var href = window.location.href,
            nviString, trackString;

        if (event && event.type === "MapLoad") {
            if (this.url) {
                href = replaceURIParameter("hicUrl", this.url, href);
            }
            if (this.name) {
                href = replaceURIParameter("name", this.name, href);
            }
        }

        href = replaceURIParameter("state", (this.state.stringify()), href);

        href = replaceURIParameter("colorScale", "" + this.contactMatrixView.colorScale.high, href);

        if (igv.FeatureTrack.selectedGene) {
            href = replaceURIParameter("selectedGene", igv.FeatureTrack.selectedGene, href);
        }

        nviString = getNviString(this.dataset, this.state);
        if (nviString) {
            href = replaceURIParameter("nvi", nviString, href);
        }

        if (this.trackRenderers.length > 0 || this.tracks2D.length > 0) {
            trackString = "";

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

            this.tracks2D.forEach(function (track) {

                var config = track.config,
                    url = config.url,
                    name = track.name,
                    color = track.color;

                if (typeof url === "string") {
                    if (trackString.length > 0) trackString += "|||";
                    trackString += url;
                    trackString += "|" + (name ? name : "");
                    trackString += "|";   // Data range
                    trackString += "|" + (color ? color : "");
                }
            });

            if (trackString.length > 0) {
                href = replaceURIParameter("tracks", trackString, href);
            }
        }

        if (this.normVectorFiles.length > 0) {

            var normVectorString = "";
            this.normVectorFiles.forEach(function (url) {

                if (normVectorString.length > 0) normVectorString += "|||";
                normVectorString += url;

            });

            href = replaceURIParameter("normVectorFiles", normVectorString, href);

        }

        if (this.config.updateHref === false) {
            //         console.log(href);
        }
        else {
            window.history.replaceState("", "juicebox", href);
        }
    };


    stripUriParameters = function () {

        var href = window.location.href,
            idx = href.indexOf("?");

        if (idx > 0) window.history.replaceState("", "juicebox", href.substr(0, idx));

    };

    hic.Browser.prototype.updateCrosshairs = function (coords) {

        this.contactMatrixView.$x_guide.css({top: coords.y, left: 0});
        this.layoutController.$y_tracks.find("div[id$='x-track-guide']").css({top: coords.y, left: 0});

        this.contactMatrixView.$y_guide.css({top: 0, left: coords.x});
        this.layoutController.$x_tracks.find("div[id$='y-track-guide']").css({top: 0, left: coords.x});

    };

    hic.Browser.prototype.hideCrosshairs = function () {

        _.each([this.contactMatrixView.$x_guide, this.contactMatrixView.$y_guide, this.layoutController.$x_tracks.find("div[id$='y-track-guide']"), this.layoutController.$y_tracks.find("div[id$='x-track-guide']")], function ($e) {
            $e.hide();
        });

    };

    hic.Browser.prototype.showCrosshairs = function () {

        _.each([this.contactMatrixView.$x_guide, this.contactMatrixView.$y_guide, this.layoutController.$x_tracks.find("div[id$='y-track-guide']"), this.layoutController.$y_tracks.find("div[id$='x-track-guide']")], function ($e) {
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

        this.contactMatrixView.setColorScale(high);
        this.contactMatrixView.imageTileCache = {};
        this.contactMatrixView.initialImage = undefined;
        this.contactMatrixView.update();
        this.updateUriParameters();

        var self = this,
            state = this.state;
        this.dataset.getMatrix(state.chr1, state.chr2)
            .then(function (matrix) {
                var zd = matrix.bpZoomData[state.zoom];
                var colorKey = zd.getKey() + "_" + state.normalization;
                self.contactMatrixView.colorScaleCache[colorKey] = high;
                self.contactMatrixView.update();
            })
            .catch(function (error) {
                console.log(error);
                alert(error);
            })
    };

    hic.Browser.prototype.loadTrack = function (trackConfigurations) {

        var self = this,
            promises,
            promises2D;

        promises = [];
        promises2D = [];

        _.each(trackConfigurations, function (config) {

            var isLocal = config.url instanceof File,
                fn = isLocal ? config.url.name : config.url;
            if (fn.endsWith(".juicerformat") || fn.endsWith("nv") || fn.endsWith(".juicerformat.gz") || fn.endsWith("nv.gz")) {
                self.loadNormalizationFile(config.url);
                if (isLocal === false) {
                    self.normVectorFiles.push(config.url);
                    self.updateUriParameters();
                }
                return;
            }


            igv.inferTrackTypes(config);

            if ("annotation" === config.type && config.color === undefined) {
                config.color = DEFAULT_ANNOTATION_COLOR;
            }

            config.height = self.layoutController.track_height;

            if (config.type === undefined) {
                // Assume this is a 2D track
                promises2D.push(hic.loadTrack2D(config));
            }
            else {
                promises.push(loadIGVTrack(config));   // X track
                promises.push(loadIGVTrack(config));   // Y track
            }

        });

        // 1D tracks
        if (promises.length > 0) {
            Promise
                .all(promises)
                .then(function (tracks) {
                    var trackXYPairs = [],
                        index;

                    for (index = 0; index < tracks.length; index += 2) {
                        trackXYPairs.push({x: tracks[index], y: tracks[index + 1]});
                    }

                    self.eventBus.post(hic.Event("TrackLoad", {trackXYPairs: trackXYPairs}));
                })
                .catch(function (error) {
                    console.log(error.message);
                    alert(error.message);
                });
        }

        // 2D tracks
        if (promises2D.length > 0) {
            Promise.all(promises2D)
                .then(function (tracks2D) {
                    self.tracks2D = self.tracks2D.concat(tracks2D);
                    self.eventBus.post(hic.Event("TrackLoad2D", self.tracks2D));

                }).catch(function (error) {
                console.log(error.message);
                alert(error.message);
            });
        }

    };

    function loadIGVTrack(config) {

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

    }

    hic.Browser.prototype.loadNormalizationFile = function (url) {

        var self = this;

        if (!this.dataset) return;

        self.eventBus.post(hic.Event("NormalizationFileLoad", "start"));

        this.dataset.readNormalizationVectorFile(url)

            .then(function (ignore) {

                self.eventBus.post(hic.Event("NormVectorIndexLoad", self.dataset));

            })
            .catch(function (error) {
                self.eventBus.post(hic.Event("NormalizationFileLoad", "abort"));
                console.log(error);
            });
    };

    hic.Browser.prototype.renderTracks = function (doSyncCanvas) {

        var self = this;

        this.trackRenderers.forEach(function (xy) {

            // sync canvas size with container div if needed
            // jtr -- this is fragile, if "xy" contains any property other than track renderer it will blow up
            _.each(xy, function (r) {
                if (true === doSyncCanvas) {
                    r.syncCanvas();
                }
            });

            self.renderTrackXY(xy);
        });
    };

    hic.Browser.prototype.renderTrackXY = function (xy) {
        xy.x.repaint();
        xy.y.repaint();
    };

    hic.Browser.prototype.loadHicFile = function (config) {

        var self = this,
            hicReader,
            queryIdx,
            parts;


        if (!config.url && !config.dataset) {
            console.log("No .hic url specified");
            return;
        }

        if (config.url) {
            if (config.url instanceof File) {
                this.url = config.url;
                this.updateHref = false;
                stripUriParameters();
            } else {
                this.updateHref = this.updateHref_;
                queryIdx = config.url.indexOf("?");
                if (queryIdx > 0) {
                    this.url = config.url.substring(0, queryIdx);
                    parts = parseUri(config.url);
                    if (parts.queryKey) {
                        _.each(parts.queryKey, function (value, key) {
                            config[key] = value;
                        });
                    }
                }
                else {
                    this.url = config.url;
                }
            }
        }

        this.name = config.name;

        this.$contactMaplabel.text(config.name);

        this.layoutController.removeAllTrackXYPairs();

        this.contactMatrixView.clearCaches();

        if (!this.config.initialImage) {
            this.contactMatrixView.startSpinner();
        }

        this.tracks2D = [];

        if (config.dataset) {
            setDataset(config.dataset);
        }
        else {

            hicReader = new hic.HiCReader(config);

            hicReader.loadDataset(config)

                .then(function (dataset) {

                    self.dataset = dataset;

                    if (config.normVectorFiles) {

                        var promises = [];

                        config.normVectorFiles.forEach(function (f) {
                            promises.push(dataset.readNormalizationVectorFile(f));
                        })

                        self.eventBus.post(hic.Event("NormalizationFileLoad", "start"));

                        Promise.all(promises)

                            .then(function (ignore) {

                                setDataset(dataset);

                                self.eventBus.post(hic.Event("NormVectorIndexLoad", self.dataset));

                            })
                            .catch(function (error) {
                                throw new Error("Error");
                            });
                    }
                    else {
                        setDataset(dataset);
                    }

                })
                .catch(function (error) {
                    // Error getting dataset
                    self.contactMatrixView.stopSpinner();
                    console.log(error);
                });
        }

        function setDataset(dataset) {

            var previousGenomeId = self.genome ? self.genome.id : undefined;

            self.dataset = dataset;

            self.genome = new hic.Genome(self.dataset.genomeId, self.dataset.chromosomes);

            // TODO -- this is not going to work with browsers on different assemblies on the same page.
            igv.browser.genome = self.genome;

            if (config.state) {
                self.setState(config.state);
            } else if (config.synchState) {
                self.syncState(config.synchState);
            } else {
                self.setState(defaultState.clone());
            }
            self.contactMatrixView.datasetUpdated();

            if (self.genome.id !== previousGenomeId) {
                self.eventBus.post(hic.Event("GenomeChange", self.genome.id));
            }

            if (config.colorScale) {
                self.getColorScale().high = config.colorScale;
                self.contactMatrixView.setColorScale(config.colorScale, self.state);
            }

            if (config.tracks) {
                self.loadTrack(config.tracks);
            }

            if (dataset.hicReader.normVectorIndex) {
                self.eventBus.post(hic.Event("MapLoad", dataset));
                self.eventBus.post(hic.Event("NormVectorIndexLoad", dataset));
            }
            else {
                if (config.nvi) {

                    var nviArray = decodeURIComponent(config.nvi).split(","),
                        range = {start: parseInt(nviArray[0]), size: parseInt(nviArray[1])};

                    dataset.hicReader.readNormVectorIndex(dataset, range)
                        .then(function (ignore) {
                            self.eventBus.post(hic.Event("MapLoad", dataset));
                            self.eventBus.post(hic.Event("NormVectorIndexLoad", dataset));

                        })
                        .catch(function (error) {
                            self.contactMatrixView.stopSpinner();
                            console.log(error);
                        })
                } else {

                    self.eventBus.post(hic.Event("MapLoad", dataset));

                    // Load norm vector index in the background
                    dataset.hicReader.readExpectedValuesAndNormVectorIndex(dataset)
                        .then(function (ignore) {
                            self.eventBus.post(hic.Event("NormVectorIndexLoad", dataset));
                        })
                        .catch(function (error) {
                            self.contactMatrixView.stopSpinner();
                            console.log(error);
                        });
                }
            }

            $('.hic-root').removeClass('hic-root-selected');
            hic.Browser.setCurrentBrowser(undefined);

        }

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
                self.goto(xLocus.chr, xLocus.start, xLocus.end, yLocus.chr, yLocus.start, yLocus.end);
            }
        }

    };

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


    /**
     * @param scaleFactor Values range from greater then 1 to decimal values less then one
     *                    Value > 1 are magnification (zoom in)
     *                    Decimal values (.9, .75, .25, etc.) are minification (zoom out)
     * @param anchorPx -- anchor position in pixels (should not move after transformation)
     * @param anchorPy
     */
    hic.Browser.prototype.pinchZoom = function (anchorPx, anchorPy, scaleFactor) {

        var bpResolutions = this.dataset.bpResolutions,
            currentResolution,
            targetResolution,
            newResolution,
            viewDimensions = this.contactMatrixView.getViewDimensions(),
            newZoom,
            newPixelSize,
            zoomChanged, gx, gy;

        currentResolution = bpResolutions[this.state.zoom];

        if (this.resolutionLocked ||
            (this.state.zoom === bpResolutions.length - 1 && scaleFactor > 1) ||
            (this.state.zoom === 0 && scaleFactor < 1)) {
            // Can't change resolution level, must adjust pixel size
            newResolution = currentResolution;
            newPixelSize = Math.min(MAX_PIXEL_SIZE, this.state.pixelSize * scaleFactor);
            newZoom = this.state.zoom;
            zoomChanged = false;
        }
        else {
            targetResolution = (currentResolution / this.state.pixelSize) / scaleFactor;
            newZoom = this.findMatchingZoomIndex(targetResolution, bpResolutions);
            newResolution = bpResolutions[newZoom];
            zoomChanged = newZoom !== this.state.zoom;
            newPixelSize = Math.min(MAX_PIXEL_SIZE, newResolution / targetResolution);
        }

        newPixelSize = Math.max(newPixelSize, minPixelSize.call(this, this.state.chr1, this.state.chr2, newZoom));

        // Genomic anchor  -- this position should remain at anchorPx, anchorPy after state change
        gx = (this.state.x + anchorPx / this.state.pixelSize) * currentResolution;
        gy = (this.state.y + anchorPy / this.state.pixelSize) * currentResolution;

        this.state.x = gx / newResolution - anchorPx / newPixelSize;
        this.state.y = gy / newResolution - anchorPy / newPixelSize;

        this.state.zoom = newZoom;
        this.state.pixelSize = newPixelSize;

        this.clamp();
        this.eventBus.post(hic.Event("LocusChange", {state: this.state, resolutionChanged: zoomChanged}));

    };

    // Zoom in response to a double-click
    hic.Browser.prototype.zoomAndCenter = function (direction, centerPX, centerPY) {

        if (!this.dataset) return;

        var bpResolutions = this.dataset.bpResolutions,
            viewDimensions = this.contactMatrixView.getViewDimensions(),
            dx = centerPX === undefined ? 0 : centerPX - viewDimensions.width / 2,
            dy = centerPY === undefined ? 0 : centerPY - viewDimensions.height / 2,
            newPixelSize, shiftRatio;


        this.state.x += (dx / this.state.pixelSize);
        this.state.y += (dy / this.state.pixelSize);

        if (this.resolutionLocked ||
            (direction > 0 && this.state.zoom === bpResolutions.length - 1) ||
            (direction < 0 && this.state.zoom === 0)) {

            newPixelSize = Math.max(Math.min(MAX_PIXEL_SIZE, this.state.pixelSize * (direction > 0 ? 2 : 0.5)),
                minPixelSize.call(this, this.state.chr1, this.state.chr2, this.state.zoom));


            shiftRatio = (newPixelSize - this.state.pixelSize) / newPixelSize;
            this.state.pixelSize = newPixelSize;
            this.state.x += shiftRatio * (viewDimensions.width / this.state.pixelSize);
            this.state.y += shiftRatio * (viewDimensions.height / this.state.pixelSize);

            this.clamp();
            this.eventBus.post(hic.Event("LocusChange", {state: this.state, resolutionChanged: false}));
        } else {
            this.setZoom(this.state.zoom + direction);
        }
    };

    hic.Browser.prototype.setZoom = function (zoom) {

        // Shift x,y to maintain center, if possible
        var bpResolutions = this.dataset.bpResolutions,
            currentResolution = bpResolutions[this.state.zoom],
            viewDimensions = this.contactMatrixView.getViewDimensions(),
            xCenter = this.state.x + viewDimensions.width / (2 * this.state.pixelSize),    // center in bins
            yCenter = this.state.y + viewDimensions.height / (2 * this.state.pixelSize),    // center in bins
            newResolution = bpResolutions[zoom],
            newXCenter = xCenter * (currentResolution / newResolution),
            newYCenter = yCenter * (currentResolution / newResolution),
            newPixelSize = Math.max(defaultPixelSize, minPixelSize.call(this, this.state.chr1, this.state.chr2, zoom)),
            zoomChanged = (this.state.zoom !== zoom);


        this.state.zoom = zoom;
        this.state.x = Math.max(0, newXCenter - viewDimensions.width / (2 * newPixelSize));
        this.state.y = Math.max(0, newYCenter - viewDimensions.height / (2 * newPixelSize));
        this.state.pixelSize = newPixelSize;

        this.clamp();

        this.eventBus.post(hic.Event("LocusChange", {state: this.state, resolutionChanged: zoomChanged}));
    };

    hic.Browser.prototype.setChromosomes = function (chr1, chr2) {

        this.state.chr1 = Math.min(chr1, chr2);
        this.state.chr2 = Math.max(chr1, chr2);
        this.state.zoom = 0;
        this.state.x = 0;
        this.state.y = 0;

        this.state.pixelSize = Math.min(100, Math.max(defaultPixelSize, minPixelSize.call(this, this.state.chr1, this.state.chr2, this.state.zoom)));


        this.eventBus.post(hic.Event("LocusChange", {state: this.state, resolutionChanged: true}));
    };

    hic.Browser.prototype.updateLayout = function () {

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

    // TODO -- when is this called?
    hic.Browser.prototype.update = function () {
        this.eventBus.post(hic.Event("LocusChange", {state: this.state, resolutionChanged: false}));
    };

    /**
     * Set the matrix state.  Used ot restore state from a bookmark
     * @param state  browser state
     */
    hic.Browser.prototype.setState = function (state) {

        var zoomChanged = (this.state.zoom !== state.zoom);
        this.state = state;

        // Possibly adjust pixel size
        this.state.pixelSize = Math.max(state.pixelSize, minPixelSize.call(this, this.state.chr1, this.state.chr2, this.state.zoom));

        this.eventBus.post(hic.Event("LocusChange", {state: this.state, resolutionChanged: zoomChanged}));

    };


    /**
     * Return a modified state object used for synching.  Other datasets might have different chromosome ordering
     * and resolution arrays
     */
    hic.Browser.prototype.getSyncState = function () {
        return {
            chr1Name: this.dataset.chromosomes[this.state.chr1].name,
            chr2Name: this.dataset.chromosomes[this.state.chr2].name,
            binSize: this.dataset.bpResolutions[this.state.zoom],
            binX: this.state.x,            // TODO -- tranlsate to lower right corner
            binY: this.state.y,
            pixelSize: this.state.pixelSize
        };
    }

    /**
     * Used to synch state with other browsers
     * @param state  browser state
     */
    hic.Browser.prototype.syncState = function (syncState) {

        if (!this.dataset) return;

        var chr1 = this.dataset.getChrIndexFromName(syncState.chr1Name),
            chr2 = this.dataset.getChrIndexFromName(syncState.chr2Name),
            zoom = this.dataset.getZoomIndexForBinSize(syncState.binSize, "BP"),
            x = syncState.binX,
            y = syncState.binY,
            pixelSize = syncState.pixelSize;

        if (zoom === undefined) {
            // Get the closest zoom available and adjust pixel size.   TODO -- cache this somehow
            zoom = this.findMatchingZoomIndex(syncState.binSize, this.dataset.bpResolutions);

            // Compute equivalent in basepairs / pixel
            pixelSize = (syncState.pixelSize / syncState.binSize) * this.dataset.bpResolutions[zoom];

            // Translate bins so that origin is unchanged in basepairs
            x = (syncState.binX / syncState.pixelSize) * pixelSize;
            y = (syncState.binY / syncState.pixelSize) * pixelSize;

            if (pixelSize > MAX_PIXEL_SIZE) {
                console.log("Cannot synch map " + this.dataset.name + " (resolution " + syncState.binSize + " not available)");
                return;
            }
        }


        var zoomChanged = (this.state.zoom !== zoom);
        this.state.chr1 = chr1;
        this.state.chr2 = chr2;
        this.state.zoom = zoom;
        this.state.x = x;
        this.state.y = y;
        this.state.pixelSize = pixelSize;

        this.eventBus.post(hic.Event("LocusChange", {state: this.state, resolutionChanged: zoomChanged}, false));

    };

    hic.Browser.prototype.setNormalization = function (normalization) {

        this.state.normalization = normalization;
        this.eventBus.post(hic.Event("NormalizationChange", this.state.normalization))

    };


    hic.Browser.prototype.shiftPixels = function (dx, dy) {

        if (!this.dataset) return;

        this.state.x += (dx / this.state.pixelSize);
        this.state.y += (dy / this.state.pixelSize);
        this.clamp();

        var locusChangeEvent = hic.Event("LocusChange", {state: this.state, resolutionChanged: false, dragging: true});
        locusChangeEvent.dragging = true;
        this.eventBus.post(locusChangeEvent);
    };


    hic.Browser.prototype.goto = function (chr1, bpX, bpXMax, chr2, bpY, bpYMax, minResolution) {


        var xCenter,
            yCenter,
            targetResolution,
            newResolution,
            viewDimensions = this.contactMatrixView.getViewDimensions(),
            bpResolutions = this.dataset.bpResolutions,
            viewWidth = viewDimensions.width,
            maxExtent, newZoom, newPixelSize, newXBin, newYBin,
            zoomChanged;

        targetResolution = Math.max((bpXMax - bpX) / viewDimensions.width, (bpYMax - bpY) / viewDimensions.height);

        if (targetResolution < minResolution) {
            maxExtent = viewWidth * minResolution;
            xCenter = (bpX + bpXMax) / 2;
            yCenter = (bpY + bpYMax) / 2;
            bpX = Math.max(xCenter - maxExtent / 2);
            bpY = Math.max(0, yCenter - maxExtent / 2);
            targetResolution = minResolution;
        }


        if (true === this.resolutionLocked && minResolution === undefined) {
            zoomChanged = false;
            newZoom = this.state.zoom;
        } else {
            newZoom = this.findMatchingZoomIndex(targetResolution, bpResolutions);
            zoomChanged = (newZoom !== this.state.zoom);
        }

        newResolution = bpResolutions[newZoom];
        newPixelSize = Math.min(MAX_PIXEL_SIZE, Math.max(1, newResolution / targetResolution));
        newXBin = bpX / newResolution;
        newYBin = bpY / newResolution;

        this.state.chr1 = chr1;
        this.state.chr2 = chr2;
        this.state.zoom = newZoom;
        this.state.x = newXBin;
        this.state.y = newYBin;
        this.state.pixelSize = newPixelSize;

        this.contactMatrixView.clearCaches();
        this.eventBus.post(hic.Event("LocusChange", {state: this.state, resolutionChanged: zoomChanged}));

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

        if (this.updateHref) {
            this.updateUriParameters(event);
        }

        if (event.type === "TrackState2D") {
            this.updateUriParameters(event);
        }
    };


    hic.Browser.prototype.resolution = function () {
        return this.dataset.bpResolutions[this.state.zoom];
    };


    // Set default values for config properties
    function setDefaults(config) {

        defaultPixelSize = 1;
        defaultState = new hic.State(1, 1, 0, 0, 0, defaultPixelSize, "NONE");

        if (config.miniMode === true) {
            config.showLocusGoto = false;
            config.showHicContactMapLabel = false;
            config.showChromosomeSelector = false;
            config.updateHref = false;
        }
        else {
            if (undefined === config.width) {
                config.width = defaultSize.width;
            }
            if (undefined === config.height) {
                config.height = defaultSize.height;
            }
            if (undefined === config.updateHref) {
                config.updateHref = true;
            }
            if (undefined === config.showLocusGoto) {
                config.showLocusGoto = true;
            }
            if (undefined === config.showHicContactMapLabel) {
                config.showHicContactMapLabel = true;
            }
            if (undefined === config.showChromosomeSelector) {
                config.showChromosomeSelector = true
            }

        }
    }

    function getNviString(dataset, state) {

        if (dataset.hicReader.normalizationVectorIndexRange) {
            var range = dataset.hicReader.normalizationVectorIndexRange,
                nviString = String(range.start) + "," + String(range.size);
            return nviString
        }
        else {
            return undefined;
        }
    }

    // parseUri 1.2.2
    // (c) Steven Levithan <stevenlevithan.com>
    // MIT License

    function parseUri(str) {
        var o = parseUri.options,
            m = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
            uri = {},
            i = 14;

        while (i--) uri[o.key[i]] = m[i] || "";

        uri[o.q.name] = {};
        uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
            if ($1) uri[o.q.name][$1] = $2;
        });

        return uri;
    }

    parseUri.options = {
        strictMode: false,
        key: ["source", "protocol", "authority", "userInfo", "user", "password", "host", "port", "relative", "path", "directory", "file", "query", "anchor"],
        q: {
            name: "queryKey",
            parser: /(?:^|&)([^&=]*)=?([^&]*)/g
        },
        parser: {
            strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
            loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
        }
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
            href = href.replace(key + "=" + oldValue, key + "=" + paramEncode(newValue));
        }
        else {
            var delim = href.includes("?") ? "&" : "?";
            href += delim + key + "=" + paramEncode(newValue);
        }

        return href;
    }

    /**
     * Minimally encode a parameter string (i.e. value in a query string).  In general its not neccessary
     * to fully encode parameter values.
     *
     * @param str
     */
    function paramEncode(str) {
        var s = replaceAll(str, '&', '%26');
        s = replaceAll(s, ' ', '%20');
        return s;
    }

    function paramDecode(str, uriDecode) {

        if (uriDecode) {
            return decodeURIComponent(str);   // Backward compatibility
        }
        else {
            var s = replaceAll(str, '%26', '&');
            s = replaceAll(s, '%20', ' ');
            s = replaceAll(s, "%7C", "|");
            return s;
        }
    }


    function replaceAll(str, target, replacement) {
        return str.split(target).join(replacement);
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

        var self = this,
            $label,
            $fa,
            $e;

        this.browser = browser;

        this.$container = $('<div class="hic-colorscale-widget-container">');
        $container.append(this.$container);

        // color chip
        $e = $('<div>');
        this.$container.append($e);
        $e.html('X');

        // input
        this.$high_colorscale_input = $('<input type="text" placeholder="high">');
        this.$container.append(this.$high_colorscale_input);

        this.$high_colorscale_input.on('change', function(e){

            var value,
                numeric;

            value = $(this).val();
            numeric = value.replace(/\,/g, '');

            if (isNaN(numeric)) {
            } else {
                browser.updateColorScale(parseInt(numeric, 10))
            }
        });

        // -
        $fa = $("<i>", { class:'fa fa-minus', 'aria-hidden':'true' });
        $fa.on('click', function (e) {
            var value;

            value = Math.floor(browser.getColorScale().high / 2.0);
            self.$high_colorscale_input.val(value);
            browser.updateColorScale( value );

        });
        this.$container.append($fa);

        // +
        $fa = $("<i>", { class:'fa fa-plus', 'aria-hidden':'true' });
        $fa.on('click', function (e) {
            var value;

            value = Math.floor(browser.getColorScale().high * 2.0);
            self.$high_colorscale_input.val(value);
            browser.updateColorScale( value );

        });
        this.$container.append($fa);

        this.browser.eventBus.subscribe("MapLoad", this);
        this.browser.eventBus.subscribe("ColorScale", this);
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

        // Cache at most 10 blocks
        this.blockCacheLimit = hic.isMobile() ? 4 : 10;
    };

    hic.Dataset.prototype.clearCaches = function () {
        this.matrixCache = {};
        this.blockCache = {};
        this.normVectorCache = {};
        this.colorScaleCache = {};
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

                                        if (nv1 === undefined || nv2 === undefined) {
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

                            })
                            .catch(reject);
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

                        if (self.blockCacheKeys.length > self.blockCacheLimit) {
                            delete self.blockCache[self.blockCacheKeys[0]];
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

    hic.Dataset.prototype.readNormalizationVectorFile = function (url) {

        var self = this;

        return new Promise(function (fulfill, reject) {

            self.hicReader.readNormalizationVectorFile(url, self.chromosomes)

                .then(function (normVectors) {

                    _.extend(self.normVectorCache, normVectors);

                    normVectors["types"].forEach(function (type) {

                        if (!self.normalizationTypes) self.normalizationTypes = [];

                        if (_.contains(self.normalizationTypes, type) === false) {
                            self.normalizationTypes.push(type);
                        }

                    });

                    fulfill(self);

                })
                .catch(reject)
        });

    }

    hic.Dataset.prototype.getZoomIndexForBinSize = function (binSize, unit) {
        var i,
            resolutionArray;

        unit = unit || "BP";

        if (unit === "BP") {
            resolutionArray = this.bpResolutions;
        }
        else if (unit === "FRAG") {
            resolutionArray = this.fragResolutions;
        } else {
            throw new Error("Invalid unit: " + unit);
        }

        for (i = 0; i < resolutionArray.length; i++) {
            if (resolutionArray[i] === binSize) return i;
        }

        return -1;
    }

    hic.Dataset.prototype.getChrIndexFromName = function (chrName) {
        var i;
        for (i = 0; i < this.chromosomes.length; i++) {
            if (chrName === this.chromosomes[i].name) return i;
        }
        return undefined;
    }

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

        this.$resolution_selector = $('<input type="text" placeholder="chr-x-axis chr-y-axis">');
        this.$container.append(this.$resolution_selector);

        this.$resolution_selector.on('change', function (e) {
            var value = $(this).val();
            browser.parseGotoInput(value);
        });

        this.browser.eventBus.subscribe("LocusChange", this);
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

        if (event.type === "LocusChange") { //} && !event.data.dragging || event.type === "DragStopped") {

            state = event.data.state || self.browser.state,
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
        this.loadFragData = config.loadFragData;

    };

    hic.HiCReader.prototype.loadDataset = function (config) {

        var self = this,
            dataset = new hic.Dataset(this);

        return new Promise(function (fulfill, reject) {

            self.readHeader(dataset)
                .then(function () {
                    self.readFooter(dataset)
                        .then(function () {

                            if (config.normVectorFiles) {

                                var promises = [];
                                config.normVectorFiles.forEach(function (f) {
                                    promises.push(dataset.readNormalizationVectorFile(f));
                                });

                                Promise.all(promises)
                                    .then(function (ignore) {
                                        fulfill(dataset);
                                    })
                                    .catch(reject);
                            }
                            else {
                                fulfill(dataset);
                            }
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

                if (this.loadFragData) {
                    dataset.fragResolutions = [];
                    var nFragResolutions = binaryParser.getInt();
                    while (nFragResolutions-- > 0) {
                        dataset.fragResolutions.push(binaryParser.getInt());
                    }

                    if (nFragResolutions > 0) {
                        dataset.sites = [];
                        var nSites = binaryParser.getInt();
                        while (nSites-- > 0) {
                            dataset.sites.push(binaryParser.getInt());
                        }
                    }
                }

                fulfill(self);

            }).catch(function (error) {
                reject(error);
            });

        });
    };

    hic.HiCReader.prototype.readFooter = function (dataset) {

        var self = this,
            range = {start: this.masterIndexPos, size: 20000};

        return new Promise(function (fulfill, reject) {

            igvxhr.loadArrayBuffer(self.path,
                {
                    headers: self.config.headers,
                    range: range,
                    withCredentials: self.config.withCredentials
                })
                .then(function (data) {

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

                    fulfill(self);

                })
                .catch(function (error) {
                    reject(error);
                });

        });
    };

    /**
     * This function is used when the position of the norm vector index is unknown.  We must read through the expected
     * values to find the index
     *
     * @param dataset
     * @returns {Promise}
     */
    hic.HiCReader.prototype.readExpectedValuesAndNormVectorIndex = function (dataset) {

        if (this.expectedValueVectorsPosition === undefined) {
            Promise.resolve();
        }

        if (this.normVectorIndex) {
            Promise.resolve(this.normVectorIndex);
        }

        var self = this,
            range = {start: this.expectedValueVectorsPosition, size: 60000000};

        return new Promise(function (fulfill, reject) {

            igvxhr.loadArrayBuffer(self.path,
                {
                    headers: self.config.headers,
                    range: range,
                    withCredentials: self.config.withCredentials
                })
                .then(function (data) {

                    var key, pos, size, nEntries, type, unit, binSize, nValues, values, nChrScaleFactors, normFactors,
                        p0, chrIdx, filePosition, sizeInBytes;

                    if (!data) {
                        fulfill(null);
                        return;
                    }

                    var binaryParser = new igv.BinaryParser(new DataView(data));

                    dataset.expectedValueVectors = {};

                    nEntries = binaryParser.getInt();

                    while (nEntries-- > 0) {
                        type = "NONE";
                        unit = binaryParser.getString();
                        binSize = binaryParser.getInt();
                        nValues = binaryParser.getInt();
                        values = [];
                        while (nValues-- > 0) {
                            values.push(binaryParser.getDouble());
                        }

                        nChrScaleFactors = binaryParser.getInt();
                        normFactors = {};
                        while (nChrScaleFactors-- > 0) {
                            normFactors[binaryParser.getInt()] = binaryParser.getDouble();
                        }

                        // key = unit + "_" + binSize + "_" + type;
                        //  NOT USED YET SO DON'T STORE
                        //  dataset.expectedValueVectors[key] =
                        //      new ExpectedValueFunction(type, unit, binSize, values, normFactors);
                    }


                    dataset.normalizedExpectedValueVectors = {};

                    try {
                        nEntries = binaryParser.getInt();


                        while (nEntries-- > 0) {

                            type = binaryParser.getString();
                            unit = binaryParser.getString();
                            binSize = binaryParser.getInt();
                            nValues = binaryParser.getInt();
                            values = [];

                            while (nValues-- > 0) {
                                values.push(binaryParser.getDouble());
                            }

                            nChrScaleFactors = binaryParser.getInt();
                            normFactors = {};

                            while (nChrScaleFactors-- > 0) {
                                normFactors[binaryParser.getInt()] = binaryParser.getDouble();
                            }

                            // key = unit + "_" + binSize + "_" + type;
                            // NOT USED YET SO DON'T STORE
                            //   dataset.normalizedExpectedValueVectors[key] =
                            //       new ExpectedValueFunction(type, unit, binSize, values, normFactors);
                        }


                        // Normalization vector index
                        p0 = binaryParser.position;
                        self.normVectorIndex = {};

                        if (!dataset.normalizationTypes) {
                            dataset.normalizationTypes = [];
                        }
                        dataset.normalizationTypes.push('NONE');

                        nEntries = binaryParser.getInt();
                        while (nEntries-- > 0) {
                            type = binaryParser.getString();
                            chrIdx = binaryParser.getInt();
                            unit = binaryParser.getString();
                            binSize = binaryParser.getInt();
                            filePosition = binaryParser.getLong();
                            sizeInBytes = binaryParser.getInt();
                            key = hic.getNormalizationVectorKey(type, chrIdx, unit, binSize);

                            if (_.contains(dataset.normalizationTypes, type) === false) {
                                dataset.normalizationTypes.push(type);
                            }
                            self.normVectorIndex[key] = {filePosition: filePosition, size: sizeInBytes};
                        }

                        self.normalizationVectorIndexRange = {
                            start: range.start + p0,
                            size: binaryParser.position - p0
                        };
                    } catch (e) {
                        // This is normal, apparently, when there are no vectors.
                        self.normalizationVectorIndexRange = undefined;
                    }


                    fulfill(self);

                })
                .catch(function (error) {
                    reject(error);
                });

        });
    };


    hic.HiCReader.prototype.readNormVectorIndex = function (dataset, range) {

        if (this.normVectorIndex) {
            return Promise.resolve(this.normVectorIndex);
        }

        var self = this;
        self.normalizationVectorIndexRange = range;

        return new Promise(function (fulfill, reject) {

            igvxhr.loadArrayBuffer(self.path,
                {
                    headers: self.config.headers,
                    range: range,
                    withCredentials: self.config.withCredentials
                }).then(function (data) {

                var key, pos, size, binaryParser, p0, nEntries, type, chrIdx, unit, binSize, filePosition, sizeInBytes,
                    normalizationIndexPosition;

                if (!data) {
                    fulfill(null);
                    return;
                }

                binaryParser = new igv.BinaryParser(new DataView(data));


                // Normalization vector index
                if (undefined === self.normVectorIndex) self.normVectorIndex = {};

                if (!dataset.normalizationTypes) {
                    dataset.normalizationTypes = [];
                }
                dataset.normalizationTypes.push('NONE');

                p0 = binaryParser.position;
                normalizationIndexPosition = range.start + p0;

                nEntries = binaryParser.getInt();
                while (nEntries-- > 0) {
                    type = binaryParser.getString();
                    chrIdx = binaryParser.getInt();
                    unit = binaryParser.getString();
                    binSize = binaryParser.getInt();
                    filePosition = binaryParser.getLong();
                    sizeInBytes = binaryParser.getInt();

                    key = hic.getNormalizationVectorKey(type, chrIdx, unit, binSize);

                    if (_.contains(dataset.normalizationTypes, type) === false) {
                        dataset.normalizationTypes.push(type);
                    }
                    self.normVectorIndex[key] = {filePosition: filePosition, size: sizeInBytes};
                }

                //size = binaryParser.position - p0;

                fulfill(self); //binaryParser.position = 42473140   masterIndexPos = 54343629146

            }).catch(function (error) {
                reject(error);
            });

        });
    };

    hic.HiCReader.prototype.readMatrix = function (key) {

        var self = this,
            idx = self.masterIndex[key];

        if (idx === null || idx === undefined) {
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

            var sites, entry;

            sites = self.fragmentSitesCache[chrName];

            if (sites) {
                fulfill(sites);

            } else if (self.fragmentSitesIndex) {
                entry = self.fragmentSitesIndex[chrName];

                if (entry !== undefined && entry.nSites > 0) {
                    readSites(entry.position, entry.nSites)
                        .then(function (sites) {
                            self.fragmentSitesCache[chrName] = sites;
                            fulfill(sites);

                        })
                        .catch(reject);
                }
            }
            else {
                fulfill(undefined);
            }
        });
    }

    function parseMatixZoomData(chr1, chr2, chr1Sites, chr2Sites, dis) {

        var unit, sumCounts, occupiedCellCount, stdDev, percent95, binSize, zoom, blockBinCount,
            blockColumnCount, zd, nBlocks, blockIndex, nBins1, nBins2, avgCount, blockNumber,
            filePosition, blockSizeInBytes;

        unit = dis.getString();

        dis.getInt();                // Old "zoom" index -- not used, must be read

        // Stats.  Not used yet, but we need to read them anyway
        sumCounts = dis.getFloat();
        occupiedCellCount = dis.getFloat();
        stdDev = dis.getFloat();
        percent95 = dis.getFloat();

        binSize = dis.getInt();
        zoom = {unit: unit, binSize: binSize};

        blockBinCount = dis.getInt();
        blockColumnCount = dis.getInt();

        zd = new MatrixZoomData(chr1, chr2, zoom, blockBinCount, blockColumnCount, chr1Sites, chr2Sites);

        nBlocks = dis.getInt();
        blockIndex = {};

        while (nBlocks-- > 0) {
            blockNumber = dis.getInt();
            filePosition = dis.getLong();
            blockSizeInBytes = dis.getInt();
            blockIndex[blockNumber] = {filePosition: filePosition, size: blockSizeInBytes};
        }
        zd.blockIndexMap = blockIndex;

        nBins1 = (chr1.size / binSize);
        nBins2 = (chr2.size / binSize);
        avgCount = (sumCounts / nBins1) / nBins2;   // <= trying to avoid overflows

        zd.averageCount = avgCount;
        zd.sumCounts = sumCounts;
        zd.stdDev = stdDev;
        zd.occupiedCellCount = occupiedCellCount;
        zd.percent95 = percent95;

        return zd;
    }

    hic.HiCReader.prototype.readNormalizationVector = function (type, chrIdx, unit, binSize) {

        var self = this,
            idx,
            key = hic.getNormalizationVectorKey(type, chrIdx, unit.toString(), binSize);


        if (this.normVectorIndex == null) {
            return Promise.resolve(undefined);
        }

        idx = this.normVectorIndex[key];
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

                    var parser, nValues, values, allNaN, i;

                    if (!data) {
                        fulfill(null);
                        return;
                    }

                    // var inflate = new Zlib.Inflate(new Uint8Array(data));
                    // var plain = inflate.decompress();
                    // data = plain.buffer;

                    parser = new igv.BinaryParser(new DataView(data));
                    nValues = parser.getInt();
                    values = [];
                    allNaN = true;
                    for (i = 0; i < nValues; i++) {
                        values[i] = parser.getDouble();
                        if (!isNaN(values[i])) {
                            allNaN = false;
                        }
                    }
                    if (allNaN) {
                        fulfill(null);
                    } else {
                        fulfill(new hic.NormalizationVector(type, chrIdx, unit, binSize, values));
                    }


                })
                .catch(reject);
        })
    }

    hic.HiCReader.prototype.readNormalizationVectorFile = function (url, chromosomes) {
        
        return new Promise(function (fullfill, reject) {

            var options = igv.buildOptions({});    // Add oauth token, if any

            igvxhr
                .loadString(url, options)

                .then(function (data) {

                    var lines = data.splitLines(),
                        len = lines.length,
                        line, i, j, type, chr, binSize, unit, tokens, values, v, key, chrIdx, chrMap, vectors, types, mean;

                    types = new Set();
                    vectors = {};
                    chrMap = {};
                    chromosomes.forEach(function (chr) {
                        chrMap[chr.name] = chr.index;

                        // Hack for demo
                        if (chr.name.startsWith("chr")) {
                            chrMap[chr.name.substring(3)] = chr.index;
                        } else {
                            chrMap["chr" + chr.name] = chr.index;
                        }
                    });

                    for (i = 0; i < len; i++) {
                        line = lines[i].trim();
                        if (line.startsWith("vector")) {

                            if (key && values && chrIdx) {
                                vectors[key] = new hic.NormalizationVector(type, chrIdx, unit, binSize, values)
                            }
                            values = [];

                            tokens = line.split("\t");
                            type = tokens[1];
                            chr = tokens[2];
                            binSize = tokens[3];
                            unit = tokens[4];


                            chrIdx = chrMap[chr];
                            if (chrIdx) {
                                types.add(type);
                                key = hic.getNormalizationVectorKey(type, chrIdx, unit.toString(), binSize);
                            } else {
                                key = undefined;
                                console.log("Unknown chromosome: " + chr);
                            }


                        }
                        else {
                            if (key && values) {
                                v = (line.length === 0 || line == ".") ? NaN : parseFloat(line);
                                values.push(v);
                            }
                        }
                    }

                    // Last one
                    if (key && values && values.length > 0 && chrIdx) {
                        vectors[key] = new hic.NormalizationVector(type, chrIdx, unit, binSize, values);
                    }

                    vectors.types = types;

                    fullfill(vectors);
                })
                .catch(reject);

        });
    };


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

        zoomDataList.forEach(function (zd) {
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

    hic.ResolutionSelector = function (browser, $parent) {
        var self = this,
            $label,
            $label_container;

        this.browser = browser;

        this.$container = $('<div class="hic-resolution-selector-container">');
        $parent.append(this.$container);

        // label container
        $label_container = $('<div id="hic-resolution-label-container">');
        this.$container.append($label_container);

        // Resolution (kb)
        $label = $('<div>');
        $label_container.append($label);
        $label.text('Resolution (kb)');

        // lock/unlock
        this.$resolution_lock = $('<i id="hic-resolution-lock" class="fa fa-unlock" aria-hidden="true">');
        $label_container.append(this.$resolution_lock);
        $label_container.on('click', function (e) {
            self.browser.resolutionLocked = !(self.browser.resolutionLocked);
            self.setResolutionLock(self.browser.resolutionLocked);
        });

        this.$resolution_selector = $('<select name="select">');
        this.$container.append(this.$resolution_selector);

        this.$resolution_selector.attr('name', 'resolution_selector');

        this.$resolution_selector.on('change', function (e) {
            var zoomIndex = parseInt($(this).val());
            self.browser.setZoom(zoomIndex);
        });


        this.browser.eventBus.subscribe("LocusChange", this);
        this.browser.eventBus.subscribe("MapLoad", this);
    };

    hic.ResolutionSelector.prototype.setResolutionLock = function (resolutionLocked) {
        this.$resolution_lock.removeClass( (true === resolutionLocked) ? 'fa-unlock' : 'fa-lock');
        this.$resolution_lock.addClass(    (true === resolutionLocked) ? 'fa-lock' : 'fa-unlock');
    };

    hic.ResolutionSelector.prototype.receiveEvent = function (event) {

        var self = this;

        if (event.type === "LocusChange") {

            if (true === event.data.resolutionChanged) {
                this.browser.resolutionLocked = false;
                self.setResolutionLock(this.browser.resolutionLocked);
            }

            this.$resolution_selector
                .find('option')
                .filter(function (index) {
                    return index === event.data.state.zoom;
                })
                .prop('selected', true);

        } else if (event.type === "MapLoad") {

            var elements;

            this.browser.resolutionLocked = false;
            this.setResolutionLock(this.browser.resolutionLocked);

            elements = _.map(this.browser.dataset.bpResolutions, function (resolution, index) {
                var selected = self.browser.state.zoom === index;
                
                return '<option' + ' value=' + index +  (selected ? ' selected': '') + '>' + igv.numberFormatter(resolution / 1e3) + '</option>';
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

        this.browser.eventBus.subscribe('LocusChange', this);

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

        var w,
            h,
            bin,
            config = {},
            browser = this.browser;

        identityTransformWithContext(this.ctx);
        igv.graphics.fillRect(this.ctx, 0, 0, this.$canvas.width(), this.$canvas.height(), { fillStyle: igv.rgbColor(255, 255, 255) });

        this.canvasTransform(this.ctx);

        w = ('x' === this.axis) ? this.$canvas.width() : this.$canvas.height();
        h = ('x' === this.axis) ? this.$canvas.height() : this.$canvas.width();

        igv.graphics.fillRect(this.ctx, 0, 0, w, h, { fillStyle: igv.rgbColor(255, 255, 255) });

        config.bpPerPixel = browser.dataset.bpResolutions[ browser.state.zoom ] / browser.state.pixelSize;

        bin = ('x' === this.axis) ? browser.state.x : browser.state.y;
        config.bpStart = bin * browser.dataset.bpResolutions[ browser.state.zoom ];

        config.rulerTickMarkReferencePixels = Math.max(Math.max(this.$canvas.width(), this.$canvas.height()), Math.max(this.$otherRulerCanvas.width(), this.$otherRulerCanvas.height()));

        config.rulerLengthPixels = w;
        config.rulerHeightPixels = h;

        config.height = Math.min(this.$canvas.width(), this.$canvas.height());

        this.draw(config);
    };

    hic.Ruler.prototype.draw = function (options) {

        var self = this,
            fontStyle,
            tickSpec,
            majorTickSpacing,
            nTick,
            pixelLast,
            pixel,
            tickSpacingPixels,
            labelWidthPixels,
            modulo,
            l,
            yShim,
            tickHeight,
            rulerLabel,
            chrSize,
            chrName,
            chromosomes = this.browser.dataset.chromosomes;

        chrName = ('x' === this.axis) ? chromosomes[ this.browser.state.chr1 ].name : chromosomes[ this.browser.state.chr2 ].name;
        chrSize = ('x' === this.axis) ? chromosomes[ this.browser.state.chr1 ].size : chromosomes[ this.browser.state.chr2 ].size;

        if (options.chrName === "all") {
            // drawAll.call(this);
        } else {

            igv.graphics.fillRect(this.ctx, 0, 0, options.rulerLengthPixels, options.rulerHeightPixels, { fillStyle: igv.rgbColor(255, 255, 255) });

            fontStyle = {
                textAlign: 'center',
                font: '9px PT Sans',
                fillStyle: "rgba(64, 64, 64, 1)",
                strokeStyle: "rgba(64, 64, 64, 1)"
            };

            tickSpec = findSpacing(Math.floor(options.rulerTickMarkReferencePixels * options.bpPerPixel));
            majorTickSpacing = tickSpec.majorTick;

            // Find starting point closest to the current origin
            nTick = Math.floor(options.bpStart / majorTickSpacing) - 1;

            pixel = pixelLast = 0;

            igv.graphics.setProperties(this.ctx, fontStyle);
            this.ctx.lineWidth = 1.0;

            yShim = 1;
            tickHeight = 8;
            while (pixel < options.rulerLengthPixels) {

                l = Math.floor(nTick * majorTickSpacing);

                pixel = Math.round(((l - 1) - options.bpStart + 0.5) / options.bpPerPixel);

                rulerLabel = formatNumber(l / tickSpec.unitMultiplier, 0) + " " + tickSpec.majorUnit;

                tickSpacingPixels = Math.abs(pixel - pixelLast);
                labelWidthPixels = this.ctx.measureText(rulerLabel).width;

                if (labelWidthPixels > tickSpacingPixels) {

                    if (tickSpacingPixels < 32) {
                        modulo = 4;
                    } else {
                        modulo = 2;
                    }
                } else {
                    modulo = 1;
                }

                // modulo = 1;
                if (0 === nTick % modulo) {

                    if (Math.floor((pixel * options.bpPerPixel) + options.bpStart) < chrSize) {

                        // console.log('   label delta(' + Math.abs(pixel - pixelLast) + ') modulo(' + modulo + ') bpp(' + options.bpPerPixel + ')');

                        this.ctx.save();
                        this.labelReflectionTransform(this.ctx, pixel);
                        igv.graphics.fillText(this.ctx, rulerLabel, pixel, options.height - (tickHeight / 0.75));
                        this.ctx.restore();

                    }

                } else {
                    // console.log('no label');
                }

                if (Math.floor((pixel * options.bpPerPixel) + options.bpStart) < chrSize) {
                    igv.graphics.strokeLine(this.ctx,
                        pixel, options.height - tickHeight,
                        pixel, options.height - yShim);
                }

                pixelLast = pixel;
                nTick++;

            } // while (pixel < options.rulerLengthPixels)

            igv.graphics.strokeLine(this.ctx, 0, options.height - yShim, options.rulerLengthPixels, options.height - yShim);

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

            if (-1 === workStr.indexOf(".")) {
                workStr += "."
            }

            var dStr = workStr.substr(0, workStr.indexOf("."));
            var dNum = dStr - 0;
            var pStr = workStr.substr(workStr.indexOf("."));

            while (pStr.length - 1 < decimal) {
                pStr += "0"
            }

            if ('.' === pStr) {
                pStr = '';
            }

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
            igv.graphics.strokeLine(self.ctx, 0, self.height - yShim, options.rulerLengthPixels, self.height - yShim);
        }

    };

    function TickSpacing(majorTick, majorUnit, unitMultiplier) {
        this.majorTick = majorTick;
        this.majorUnit = majorUnit;
        this.unitMultiplier = unitMultiplier;
    }

    function findSpacing(rulerLengthBP) {

        if (rulerLengthBP < 10) {
            return new TickSpacing(1, "", 1);
        }


        // How many zeroes?
        var nZeroes = Math.floor(log10(rulerLengthBP));
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

        var nMajorTicks = rulerLengthBP / Math.pow(10, nZeroes - 1);
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

        if(chr1) {
            if (chr1 <= chr2) {
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

            if ("undefined" === normalization) {
                console.log("No normalization defined !!!");
                normalization = undefined;
            }

            this.normalization = normalization;
        }
    };

    hic.State.prototype.stringify = function () {
        return "" + this.chr1 + "," + this.chr2 + "," + this.zoom + "," + this.x + "," + this.y + "," + this.pixelSize + "," + this.normalization;
    }

    hic.State.prototype.clone = function () {
        return Object.assign(new hic.State(), this);
    }

    hic.State.prototype.equals = function(state) {
        var s1 = JSON.stringify(this);
        var s2 = JSON.stringify(state);
        return s1 === s2;
    }


    hic.destringifyState = function (string) {

        var tokens = string.split(",");
        return new hic.State(
            parseInt(tokens[0]),    // chr1
            parseInt(tokens[1]),    // chr2
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

var hic = (function (hic) {

    hic.Straw = function (config) {

        config.loadFragData = true;

        this.config = config;
        this.reader = new hic.HiCReader(config);

    }

//straw <NONE/VC/VC_SQRT/KR> <hicFile> <chr1>[:x1:x2] <chr2>[:y1:y2] <BP/FRAG> <binsize>
//     ​
    hic.Straw.prototype.getContactRecords = function (normalization, region1, region2, units, binsize) {

        var self = this,
            chr1 = region1.chr,
            chr2 = region2.chr,
            x1 = region1.start / binsize, 
            x2 = region1.end / binsize,
            y1 = region2.start / binsize,
            y2 = region2.end / binsize;

        return getDataset.call(self)
            .then(function (dataset) {

                self.dataset = dataset;

                var chr1idx = dataset.getChrIndexFromName(chr1),
                    chr2idx = dataset.getChrIndexFromName(chr2);

                if (chr1idx === undefined || chr2idx === undefined) {
                    throw new Error("One or both chromosomes not in this dataset");
                }

                return dataset.getMatrix(chr1idx, chr2idx)
            })
            .then(function (matrix) {
                // Find the requested resolution
                var z = self.dataset.getZoomIndexForBinSize(binsize, units);
                if (z === -1) {
                    throw new Error("Invalid bin size");
                }

                var zd = matrix.bpZoomData[z],
                    blockBinCount = zd.blockBinCount,   // Dimension in bins of a block (width = height = blockBinCount)
                    col1 = x1 === undefined ? 0 : Math.floor(x1 / blockBinCount),
                    col2 = x1 === undefined ? zd.blockColumnCount : Math.floor(x2 / blockBinCount),
                    row1 = Math.floor(y1 / blockBinCount),
                    row2 = Math.floor(y2 / blockBinCount),
                    row, column, sameChr, blockNumber,
                    promises = [];

                sameChr = chr1 === chr2;

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

                return Promise.all(promises);
            })
            .then(function (blocks) {
                var contactRecords = [];

                blocks.forEach(function (block) {
                    if (block === null) { // This is most likely caused by a base pair range outside the chromosome
                        return;
                    }
                    block.records.forEach(function(rec) {
                        // TODO -- transpose?
                        if(rec.bin1 >= x1 && rec.bin1 <= x2 && rec.bin2 >= y1 && rec.bin2 <= y2) {
                            contactRecords.push(rec);
                        }
                    });
                });
                
                return contactRecords;
            });
    }


    function getDataset() {

        if (this.dataset) {
            return Promise.resolve(this.dataset);
        }
        else {
            return this.reader.loadDataset(this.config);
        }
    }


    return hic;
})(hic || {});

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

    hic.extractFilename = function (urlString) {

        var idx = urlString.lastIndexOf("/");

        if(idx > 0) {
            return urlString.substring(idx + 1);
        }
        else {
            return urlString;
        }

    };

    hic.igvSupports = function (path) {
        var config = { url: path };
        igv.inferTrackTypes(config);
        return config.type !== undefined;
    };

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

    hic.reflectionRotationWithContext = function (context) {
        context.scale(-1, 1);
        context.rotate(Math.PI / 2.0);
    };

    hic.reflectionAboutYAxisAtOffsetWithContext = function (context, exe) {
        context.translate(exe, 0);
        context.scale(-1, 1);
        context.translate(-exe, 0);
    };

    hic.identityTransformWithContext = function (context) {
        // 3x2 matrix. column major. (sx 0 0 sy tx ty).
        context.setTransform(1, 0, 0, 1, 0, 0);
    };

    hic.Math = {

        mean: function(array) {

            var t = 0, n=0,
                i;
            for(i=0; i<array.length; i++) {
                if(!isNaN(array[i])) {
                    t += array[i];
                    n++;
                }
            }
            return n > 0 ? t / n : 0;
        },

        percentile: function (array, p) {

            if(array.length === 0) return undefined;

            var k = Math.floor(array.length * ((100 - p) / 100));
            if(k == 0) {
                array.sort(function (a,b) {return b-a});
                return array[0];
            }

            return this.selectElement(array, k);

        },

        selectElement: function (array, k) {

            // Credit Steve Hanov http://stevehanov.ca/blog/index.php?id=122
            var heap = new BinaryHeap(),
                i;

            for (i = 0; i < array.length; i++) {

                var item = array[i];

                // If we have not yet found k items, or the current item is larger than
                // the smallest item on the heap, add current item
                if (heap.content.length < k || item > heap.content[0]) {
                    // If the heap is full, remove the smallest element on the heap.
                    if (heap.content.length === k) {
                        var r = heap.pop();
                    }
                    heap.push(item)
                }
            }

            return heap.content[0];
        }
    };

    function BinaryHeap(){
        this.content = [];
    }

    BinaryHeap.prototype = {
        push: function(element) {
            // Add the new element to the end of the array.
            this.content.push(element);
            // Allow it to bubble up.
            this.bubbleUp(this.content.length - 1);
        },

        pop: function() {
            // Store the first element so we can return it later.
            var result = this.content[0];
            // Get the element at the end of the array.
            var end = this.content.pop();
            // If there are any elements left, put the end element at the
            // start, and let it sink down.
            if (this.content.length > 0) {
                this.content[0] = end;
                this.sinkDown(0);
            }
            return result;
        },

        remove: function(node) {
            var length = this.content.length;
            // To remove a value, we must search through the array to find
            // it.
            for (var i = 0; i < length; i++) {
                if (this.content[i] != node) continue;
                // When it is found, the process seen in 'pop' is repeated
                // to fill up the hole.
                var end = this.content.pop();
                // If the element we popped was the one we needed to remove,
                // we're done.
                if (i == length - 1) break;
                // Otherwise, we replace the removed element with the popped
                // one, and allow it to float up or sink down as appropriate.
                this.content[i] = end;
                this.bubbleUp(i);
                this.sinkDown(i);
                break;
            }
        },

        size: function() {
            return this.content.length;
        },

        bubbleUp: function(n) {
            // Fetch the element that has to be moved.
            var element = this.content[n], score = element;
            // When at 0, an element can not go up any further.
            while (n > 0) {
                // Compute the parent element's index, and fetch it.
                var parentN = Math.floor((n + 1) / 2) - 1,
                    parent = this.content[parentN];
                // If the parent has a lesser score, things are in order and we
                // are done.
                if (score >= parent)
                    break;

                // Otherwise, swap the parent with the current element and
                // continue.
                this.content[parentN] = element;
                this.content[n] = parent;
                n = parentN;
            }
        },

        sinkDown: function(n) {
            // Look up the target element and its score.
            var length = this.content.length,
                element = this.content[n],
                elemScore = element;

            while(true) {
                // Compute the indices of the child elements.
                var child2N = (n + 1) * 2, child1N = child2N - 1;
                // This is used to store the new position of the element,
                // if any.
                var swap = null;
                // If the first child exists (is inside the array)...
                if (child1N < length) {
                    // Look it up and compute its score.
                    var child1 = this.content[child1N],
                        child1Score = child1;
                    // If the score is less than our element's, we need to swap.
                    if (child1Score < elemScore)
                        swap = child1N;
                }
                // Do the same checks for the other child.
                if (child2N < length) {
                    var child2 = this.content[child2N],
                        child2Score = child2;
                    if (child2Score < (swap == null ? elemScore : child1Score))
                        swap = child2N;
                }

                // No need to swap further, we are done.
                if (swap == null) break;

                // Otherwise, swap and continue.
                this.content[n] = this.content[swap];
                this.content[swap] = element;
                n = swap;
            }
        }
    };

    hic.isMobile = function () {
        return (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    }

    return hic;

})(hic || {});

/**
 * Created by dat on 4/4/17.
 */
var hic = (function (hic) {

    hic.LayoutController = function (browser, $root) {

        this.browser = browser;

        createNavBar.call(this, browser, $root);

        createAllContainers.call(this, browser, $root);



        this.scrollbar_height = 20;
        this.axis_height = 32;

        this.track_height = 32;

        this.browser.eventBus.subscribe('TrackLoad', this);
        this.browser.eventBus.subscribe('LocusChange', this);

    };

    // Dupes of corresponding juicebox.scss variables
    // Invariant during app running. If edited in juicebox.scss they MUST be kept in sync
    hic.LayoutController.nav_bar_label_height = 36;
    hic.LayoutController.nav_bar_widget_container_height = 36;
    hic.LayoutController.nav_bar_shim_height = 4;

    hic.LayoutController.navbarHeight = function (miniMode) {
        var height;
        if (true === miniMode) {
            height =  hic.LayoutController.nav_bar_label_height;
        } else {
            height  = (2 * hic.LayoutController.nav_bar_widget_container_height) + hic.LayoutController.nav_bar_shim_height +  hic.LayoutController.nav_bar_label_height;
        }
        // console.log('navbar height ' + height);
        return height;
    };

    function createNavBar(browser, $root) {

        var id,
            $navbar_container,
            $label_delete_button_container,
            $upper_widget_container,
            $lower_widget_container,
            $navbar_shim,
            $e,
            $fa;

        $navbar_container = $('<div class="hic-navbar-container">');
        $root.append($navbar_container);

        if(true === browser.config.miniMode) {
            $navbar_container.height(hic.LayoutController.navbarHeight(browser.config.miniMode));
        } else {

            $navbar_container.on('click', function (e) {
                e.stopPropagation();
                e.preventDefault();
                hic.Browser.setCurrentBrowser(browser);
            });

        }

        // container: label | menu button | browser delete button
        id = browser.id + '_' + 'hic-nav-bar-contact-map-label-delete-button-container';
        $label_delete_button_container = $("<div>", { id:id });
        $navbar_container.append($label_delete_button_container);

        // label
        id = browser.id + '_' + 'hic-nav-bar-contact-map-label';
        browser.$contactMaplabel = $("<div>", { id:id });
        $label_delete_button_container.append(browser.$contactMaplabel);

        // menu button
        browser.$menuPresentDismiss = $("<div>", { class:'hic-nav-bar-menu-button' });
        $label_delete_button_container.append(browser.$menuPresentDismiss);

        $fa = $("<i>", { class:'fa fa-bars fa-lg' });
        browser.$menuPresentDismiss.append($fa);
        $fa.on('click', function (e) {
            browser.toggleMenu();
        });

        // browser delete button
        $e = $("<div>", { class:'hic-nav-bar-delete-button' });
        $label_delete_button_container.append($e);

        $fa = $("<i>", { class:'fa fa-minus-circle fa-lg' });
        // class="fa fa-plus-circle fa-lg" aria-hidden="true"
        $e.append($fa);

        $fa.on('click', function (e) {

            hic.allBrowsers.splice(_.indexOf(hic.allBrowsers, browser), 1);
            browser.$root.remove();
            browser = undefined;

            if (1 === _.size(hic.allBrowsers)) {
                $('.hic-nav-bar-delete-button').hide();
            }
        });

        // hide delete buttons for now. Delete button is only
        // if there is more then one browser instance.
        $e.hide();

        // upper widget container
        id = browser.id + '_upper_' + 'hic-nav-bar-widget-container';
        $upper_widget_container = $("<div>", { id:id });
        $navbar_container.append($upper_widget_container);

        // location box / goto
        browser.locusGoto = new hic.LocusGoto(browser, $upper_widget_container);

        if(true === browser.config.miniMode) {
            browser.$contactMaplabel.addClass('hidden-text');
            $upper_widget_container.hide();
        } else {

            // lower widget container
            id = browser.id + '_lower_' + 'hic-nav-bar-widget-container';
            $lower_widget_container = $("<div>", { id:id });
            $navbar_container.append($lower_widget_container);

            // colorscale
            browser.colorscaleWidget = new hic.ColorScaleWidget(browser, $lower_widget_container);

            // normalization
            browser.normalizationSelector = new hic.NormalizationWidget(browser, $lower_widget_container);

            // resolution widget
            browser.resolutionSelector = new hic.ResolutionSelector(browser, $lower_widget_container);
            browser.resolutionSelector.setResolutionLock(browser.resolutionLocked);

            // shim
            $navbar_shim = $('<div class="hic-nav-bar-shim">');
            $navbar_container.append($navbar_shim);

        }


    }

    function createAllContainers(browser, $root) {

        var id,
            tokens,
            height_calc,
            $container,
            $e;

        // .hic-x-track-container
        id = browser.id + '_' + 'x-track-container';
        this.$x_track_container = $("<div>", { id:id });
        $root.append(this.$x_track_container);

        // track labels
        id = browser.id + '_' + 'track-shim';
        this.$track_shim = $("<div>", { id:id });
        this.$x_track_container.append(this.$track_shim);

        // x-tracks
        id = browser.id + '_' + 'x-tracks';
        this.$x_tracks = $("<div>", { id:id });
        this.$x_track_container.append(this.$x_tracks);

        // crosshairs guide
        id = browser.id + '_' + 'y-track-guide';
        $e = $("<div>", { id:id });
        this.$x_tracks.append($e);

        // content container
        id = browser.id + '_' + 'content-container';
        this.$content_container = $("<div>", { id:id });
        $root.append(this.$content_container);

        // If we are in mini-mode we must recalculate the content container height
        // to coinside with the root browser container height
        if(true === browser.config.miniMode) {
            tokens = _.map([ hic.LayoutController.navbarHeight(browser.config.miniMode) ], function(number){
                return number.toString() + 'px';
            });
            height_calc = 'calc(100% - (' + tokens.join(' + ') + '))';

            this.$content_container.css( 'height', height_calc );
        }


        // menu
        createMenu(browser, $root);

        // container: x-axis
        id = browser.id + '_' + 'x-axis-container';
        $container = $("<div>", { id:id });
        this.$content_container.append($container);
        xAxis.call(this, browser, $container);


        // container: y-tracks | y-axis | viewport | y-scrollbar
        id = browser.id + '_' + 'y-tracks-y-axis-viewport-y-scrollbar';
        $container = $("<div>", { id:id });
        this.$content_container.append($container);

        // y-tracks
        id = browser.id + '_' + 'y-tracks';
        this.$y_tracks = $("<div>", { id:id });
        $container.append(this.$y_tracks);

        // crosshairs guide
        id = browser.id + '_' + 'x-track-guide';
        $e = $("<div>", { id:id });
        this.$y_tracks.append($e);

        // y-axis
        yAxis.call(this, browser, $container);

        this.xAxisRuler.$otherRulerCanvas = this.yAxisRuler.$canvas;
        this.yAxisRuler.$otherRulerCanvas = this.xAxisRuler.$canvas;

        // viewport | y-scrollbar
        browser.contactMatrixView = new hic.ContactMatrixView(browser, $container);

        // container: x-scrollbar
        id = browser.id + '_' + 'x-scrollbar-container';
        $container = $("<div>", { id:id });
        this.$content_container.append($container);

        // x-scrollbar
        $container.append(browser.contactMatrixView.scrollbarWidget.$x_axis_scrollbar_container);

    }

    function createMenu(browser, $root) {

        var $menu,
            $div,
            $fa;

        // menu
        $menu = $('<div>', { class:'hic-menu' });
        $root.append($menu);

        // menu close button
        $div = $('<div>', { class:'hic-menu-close-button' });
        $menu.append($div);

        // $fa = $("<i>", { class:'fa fa-minus-circle fa-lg' });
        $fa = $("<i>", { class:'fa fa-times' });
        $div.append($fa);

        $fa.on('click', function (e) {
            browser.toggleMenu();
        });















        // chromosome select widget
        browser.chromosomeSelector = new hic.ChromosomeSelectorWidget(browser, $menu);

        if(true === browser.config.miniMode) {

            browser.chromosomeSelector.$container.hide();

            // colorscale
            browser.colorscaleWidget = new hic.ColorScaleWidget(browser, $menu);

            // normalization
            browser.normalizationSelector = new hic.NormalizationWidget(browser, $menu);

            // resolution widget
            browser.resolutionSelector = new hic.ResolutionSelector(browser, $menu);
            browser.resolutionSelector.setResolutionLock(browser.resolutionLocked);
        }

        browser.annotationWidget = new hic.AnnotationWidget(browser, $menu, '2D Annotations');

        browser.$menu = $menu;

        browser.$menu.hide();

    }

    function xAxis(browser, $container) {
        var id,
            $xAxis;

        id = browser.id + '_' + 'x-axis';
        $xAxis = $("<div>", { id:id });
        $container.append($xAxis);

        this.xAxisRuler = new hic.Ruler(browser, $xAxis, 'x');
    }

    function yAxis(browser, $container) {
        var id,
            $yAxis;

        id = browser.id + '_' + 'y-axis';
        $yAxis = $("<div>", { id:id });
        $container.append($yAxis);

        this.yAxisRuler = new hic.Ruler(browser, $yAxis, 'y');
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

                self.browser.updateUriParameters();
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

        this.browser.updateUriParameters();

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

            this.browser.updateUriParameters();

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

            this.browser.updateUriParameters();

        } else {
            console.log('No more tracks.');
        }

    };

    hic.LayoutController.prototype.doLayoutTrackXYPairCount = function (trackXYPairCount) {

        var track_aggregate_height,
            tokens,
            width_calc,
            height_calc;


        track_aggregate_height = (0 === trackXYPairCount) ? 0 : trackXYPairCount * this.track_height;

        tokens = _.map([ hic.LayoutController.navbarHeight(this.browser.config.miniMode), track_aggregate_height ], function(number){
            return number.toString() + 'px';
        });
        height_calc = 'calc(100% - (' + tokens.join(' + ') + '))';

        tokens = _.map([ track_aggregate_height, this.axis_height, this.scrollbar_height ], function(number){
            return number.toString() + 'px';
        });
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

    hic.LayoutController.prototype.doLayoutWithRootContainerSize = function (size) {

        var count;

        this.browser.$root.width(size.width);
        this.browser.$root.height(size.height + hic.LayoutController.navbarHeight(this.browser.config.miniMode));

        count = _.size(this.browser.trackRenderers) > 0 ? _.size(this.browser.trackRenderers) : 0;
        this.doLayoutTrackXYPairCount(count);

        this.browser.updateLayout();
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


    hic.NormalizationVector = function (type, chrIdx, unit, resolution, values) {
     

        var mean = hic.Math.mean(values), i;
        if (mean > 0) {
            for (i = 0; i < values.length; i++) {
                values[i] /= mean;
            }
        }
        
        this.type = type;
        this.chrIdx = chrIdx;
        this.unit = unit;
        this.resolution = resolution;
        this.data = values;
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

    hic.NormalizationWidget = function (browser, $parent) {
        var self = this,
            $label;

        this.browser = browser;

        // container
        this.$container = $('<div class="hic-normalization-selector-container">');
        $parent.append(this.$container);

        // label
        $label = $('<div>');
        $label.text( (true === browser.config.miniMode) ? 'Normalization' : 'Norm');
        this.$container.append($label);

        // select
        this.$normalization_selector = $('<select name="select">');
        this.$normalization_selector.attr('name', 'normalization_selector');
        this.$normalization_selector.on('change', function (e) {
            self.browser.setNormalization($(this).val());
        });
        this.$container.append(this.$normalization_selector);

        // spinner
        this.$spinner = $('<div>');
        this.$spinner.text('Loading ...');
        this.$container.append(this.$spinner);
        this.$spinner.hide();

        this.browser.eventBus.subscribe("MapLoad", this);
        this.browser.eventBus.subscribe("NormVectorIndexLoad", this);
        this.browser.eventBus.subscribe("NormalizationFileLoad", this);

    };

    hic.NormalizationWidget.prototype.startNotReady = function () {
        this.$normalization_selector.hide();
        this.$spinner.show();
    };

    hic.NormalizationWidget.prototype.stopNotReady = function () {
        this.$spinner.hide();
        this.$normalization_selector.show();
    };

    hic.NormalizationWidget.prototype.receiveEvent = function (event) {

        function updateOptions() {
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

                label = labels[normalization] || normalization;
                isSelected = (norm === normalization);
                titleString = (label === undefined ? '' : ' title = "' + label + '" ');
                valueString = ' value=' + normalization + (isSelected ? ' selected' : '');

                labelPresentation = '&nbsp &nbsp' + label + '&nbsp &nbsp';
                return '<option' + titleString + valueString + '>' + labelPresentation + '</option>';
            });

            this.$normalization_selector.empty();
            this.$normalization_selector.append(elements.join(''));
        }

        if ("MapLoad" === event.type) {
            // TODO -- start norm widget "not ready" state
            this.startNotReady();

            updateOptions.call(this);

        } else if ("NormVectorIndexLoad" === event.type) {

            updateOptions.call(this);

            // TODO -- end norm widget "not ready" state
            this.stopNotReady();

        } else if ("NormalizationFileLoad" === event.type) {
            if(event.data === "start") {
                this.startNotReady();
            } else {
                this.stopNotReady();
            }
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

        var self = this,
            id;

        this.browser = browser;
        this.isDragging = false;

        // x-axis
        id = browser.id + '_' + 'x-axis-scrollbar-container';
        this.$x_axis_scrollbar_container = $("<div>", { id:id });

        id = browser.id + '_' + 'x-axis-scrollbar';
        this.$x_axis_scrollbar = $("<div>", { id:id });
        this.$x_axis_scrollbar_container.append(this.$x_axis_scrollbar);

        this.$x_label = $('<div>');
        this.$x_label.text('');
        this.$x_axis_scrollbar.append(this.$x_label);

        // y-axis
        id = browser.id + '_' + 'y-axis-scrollbar-container';
        this.$y_axis_scrollbar_container = $("<div>", { id:id });

        id = browser.id + '_' + 'y-axis-scrollbar';
        this.$y_axis_scrollbar = $("<div>", { id:id });
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

        this.browser.eventBus.subscribe("LocusChange", this);

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

            var state = event.data.state,
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

    hic.SweepZoom = function (browser, $target) {
        var id;

        id = browser.id + '_' + 'sweep-zoom-container';

        this.browser = browser;
        this.$rulerSweeper = $("<div>", {id: id});
        this.$rulerSweeper.hide();
        this.$target = $target;
        this.sweepRect = {};
    };

    hic.SweepZoom.prototype.reset = function (pageCoords) {

        this.anchor = pageCoords;
        this.coordinateFrame = this.$rulerSweeper.parent().offset();
        this.aspectRatio = this.$target.width() / this.$target.height();
        this.sweepRect.x = {
            x: pageCoords.x,
            y: pageCoords.y,
            width: 1,
            height: 1
        };
        this.clipped = {value: false};
    };

    hic.SweepZoom.prototype.update = function (pageCoords) {

        var anchor = this.anchor,
            dx = Math.abs(pageCoords.x - anchor.x),
            dy = Math.abs(pageCoords.y - anchor.y);

        // Adjust deltas to conform to aspect ratio
        if (dx / dy > this.aspectRatio) {
            dy = dx / this.aspectRatio;
        } else {
            dx = dy * this.aspectRatio;
        }

        this.sweepRect.width = dx;
        this.sweepRect.height = dy;
        this.sweepRect.x = anchor.x < pageCoords.x ? anchor.x : anchor.x - dx;
        this.sweepRect.y = anchor.y < pageCoords.y ? anchor.y : anchor.y - dy;


        this.$rulerSweeper.width(this.sweepRect.width);
        this.$rulerSweeper.height(this.sweepRect.height);


        this.$rulerSweeper.offset(
            {
                left: this.sweepRect.x,
                top: this.sweepRect.y
            }
        );
        this.$rulerSweeper.show();

    };

    hic.SweepZoom.prototype.dismiss = function () {
        var state,
            resolution,
            posX,
            posY,
            x,
            y,
            width,
            height,
            xMax,
            yMax;


        this.$rulerSweeper.hide();

        state = this.browser.state;

        // bp-per-bin
        resolution = this.browser.resolution();

        // Convert page -> offset coordinates
        posX = this.sweepRect.x - this.$target.offset().left;
        posY = this.sweepRect.y - this.$target.offset().top;


        // bp = ((bin + pixel/pixel-per-bin) / bp-per-bin)
        x = (state.x + (posX / state.pixelSize)) * resolution;
        y = (state.y + (posY / state.pixelSize)) * resolution;

        // bp = ((bin + pixel/pixel-per-bin) / bp-per-bin)
        width = (this.sweepRect.width / state.pixelSize) * resolution;
        height = (this.sweepRect.height / state.pixelSize) * resolution;

        // bp = bp + bp
        xMax = x + width;
        yMax = y + height;

        this.browser.goto(state.chr1, x, xMax, state.chr2, y, yMax);

    };


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

var hic = (function (hic) {

    hic.TrackMenuReplacement = function (browser) {
        this.browser = browser;
    };

    hic.TrackMenuReplacement.prototype.popoverPresentTrackGearMenuReplacement = function (pageX, pageY, trackView) {

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
                    item.init();
                }

                $container.append(item.object);

            });

            this.$popover.css({ left: pageX + 'px', top: pageY + 'px' });
            this.$popover.show();
        }
    };

    hic.TrackMenuReplacement.prototype.trackMenuItemListReplacement = function (popover, trackRenderer) {

        var self = this,
            menuItems = [],
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
                    self.browser.layoutController.removeTrackRendererPair(trackRenderer.trackRenderPair);
                },
                true));

        return all;
    };

    hic.TrackMenuReplacement.prototype.trackMenuItemReplacement = function (popover, trackRenderer, menuItemLabel, dialogLabelHandler, dialogInputValue, dialogClickHandler, doAddTopBorder) {

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


    return hic;
})(hic || {});


/**
 * Created by dat on 4/5/17.
 */
var hic = (function (hic) {

    hic.TrackRenderer = function (browser, size, $container, trackRenderPair, trackPair, axis) {

        this.browser = browser;

        this.trackRenderPair = trackRenderPair;

        this.track = trackPair[axis];

        this.id = _.uniqueId('trackRenderer_');
        this.axis = axis;
        this.initializationHelper($container, size);
    };

    hic.TrackRenderer.prototype.initializationHelper = function ($container, size) {

        var self = this,
            str,
            doShowLabelAndGear,
            $x_track_label,
            $x_track_menu_container;

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

            // label
            this.$label = $('<div class="x-track-label">');
            str = this.track.name || 'untitled';
            this.$label.text(str);

            // note the pre-existing state of track labels/gear. hide/show accordingly.
            $x_track_label = $container.find(this.$label);
            doShowLabelAndGear = (0 === _.size($x_track_label)) ? true : $x_track_label.is(':visible');

            this.$viewport.append(this.$label);
        }

        // track spinner container
        this.$spinner = ('x' === this.axis) ? $('<div class="x-track-spinner">') : $('<div class="y-track-spinner">');
        this.$viewport.append(this.$spinner);

        // throbber
        // size: see $hic-viewport-spinner-size in .scss files
        this.throbber = Throbber({color: 'rgb(64, 64, 64)', size: 32, padding: 7});
        this.throbber.appendTo(this.$spinner.get(0));
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

            this.$viewport.on('click', function (e) {

                e.stopPropagation();

                // self.$label.toggle();
                // self.$menu_container.toggle();

                $container.find('.x-track-label').toggle();
                $container.find('.x-track-menu-container').toggle();
            });

            if (doShowLabelAndGear) {
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

    hic.TrackRenderer.prototype.configTrackTransforms = function () {

        this.canvasTransform = ('y' === this.axis) ? hic.reflectionRotationWithContext : hic.identityTransformWithContext;

        this.labelReflectionTransform = ('y' === this.axis) ? hic.reflectionAboutYAxisAtOffsetWithContext : function (context, exe) { /* nuthin */
        };

    };

    hic.TrackRenderer.prototype.syncCanvas = function () {

        this.tile = null;

        this.$canvas.width(this.$viewport.width());
        this.$canvas.attr('width', this.$viewport.width());

        this.$canvas.height(this.$viewport.height());
        this.$canvas.attr('height', this.$viewport.height());

        igv.graphics.fillRect(this.ctx, 0, 0, this.$canvas.width(), this.$canvas.height(), {fillStyle: igv.rgbColor(255, 255, 255)});
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
            trackRenderer.track.dataRange = {min: min, max: max};
            trackRenderer.track.autscale = autoscale;
        });

        this.browser.renderTrackXY(this.trackRenderPair);

    };

    hic.TrackRenderer.prototype.repaint = function () {

        var self = this,
            lengthPixel,
            lengthBP,
            startBP,
            endBP,
            genomicState,
            chrName;

        genomicState = _.mapObject(self.browser.genomicState(), function (val) {
            return _.isObject(val) ? val[self.axis] : val;
        });

        if (/*this.$zoomInNotice &&*/ self.track.visibilityWindow && self.track.visibilityWindow > 0) {

            if ((genomicState.bpp * Math.max(self.$canvas.width(), self.$canvas.height()) > self.track.visibilityWindow) /*|| ('all' === genomicState.chromosome.name && !self.track.supportsWholeGenome)*/) {

                self.tile = undefined;
                self.ctx.clearRect(0, 0, self.$canvas.width(), self.$canvas.height());

                self.stopSpinner();
                // self.$zoomInNotice.show();

                return;

            } else {
                // self.$zoomInNotice.hide();
            }

        } // if (/*this.$zoomInNotice &&*/ self.track.visibilityWindow && self.track.visibilityWindow > 0)

        chrName = genomicState.chromosome.name;

        if (self.tile && self.tile.containsRange(chrName, genomicState.startBP, genomicState.endBP, genomicState.bpp)) {
            self.drawTileWithGenomicState(self.tile, genomicState);
            return;

        } else {

            // Expand the requested range so we can pan a bit without reloading
            lengthPixel = 3 * Math.max(self.$canvas.width(), self.$canvas.height());

            lengthBP = Math.round(genomicState.bpp * lengthPixel);

            startBP = Math.max(0, Math.round(genomicState.startBP - lengthBP / 3));

            endBP = startBP + lengthBP;

            if (self.loading) { //&& self.loading.start === startBP && self.loading.end === endBP) {
                return;
            } else {

                self.loading =
                {
                    start: startBP,
                    end: endBP
                };

                self.startSpinner();
                self.track
                    .getFeatures(genomicState.chromosome.name, startBP, endBP, genomicState.bpp)
                    .then(function (features) {

                        var buffer,
                            ctx;

                        self.loading = false;

                        self.stopSpinner();

                        buffer = document.createElement('canvas');
                        buffer.width = 'x' === self.axis ? lengthPixel : self.$canvas.width();
                        buffer.height = 'x' === self.axis ? self.$canvas.height() : lengthPixel;
                        ctx = buffer.getContext("2d");

                        if (features) {

                            self.canvasTransform(ctx);

                            self.drawConfiguration =
                            {
                                features: features,

                                context: ctx,

                                pixelWidth: lengthPixel,
                                pixelHeight: Math.min(buffer.width, buffer.height),

                                bpStart: startBP,
                                bpEnd: endBP,

                                bpPerPixel: genomicState.bpp,

                                genomicState: genomicState,

                                viewportContainerX: (genomicState.startBP - startBP) / genomicState.bpp,

                                viewportContainerWidth: Math.max(self.$canvas.width(), self.$canvas.height()),

                                labelTransform: self.labelReflectionTransform
                            };

                            self.track.draw(self.drawConfiguration);

                        } else {
                            ctx.clearRect(0, 0, self.$canvas.width(), self.$canvas.height());
                        }

                        self.tile = new Tile(chrName, startBP, endBP, genomicState.bpp, buffer);

                        self.repaint();

                    })
                    .catch(function (error) {

                        self.stopSpinner();
                        self.loading = false;
                        throw new Error(error);
                    });

            }
        }

    };

    hic.TrackRenderer.prototype.drawTileWithGenomicState = function (tile, genomicState) {

        if (tile) {

            this.ctx.clearRect(0, 0, this.$canvas.width(), this.$canvas.height());

            this.offsetPixel = Math.round((tile.startBP - genomicState.startBP) / genomicState.bpp);
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

})(hic || {});

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
               // ctx.save();   // TODO <- this is a resource leak,  ctx.restore() is never called.
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
