/*
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 Wolfgang Koller
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */

var XmlHttpRequestProxy = function () {};

XmlHttpRequestProxy.prototype = {
    // original XMLHttpRequest implementation
    delegate: window.XMLHttpRequest,
    // states
    states: {
        UNSENT: 0,
        OPENED: 1,
        HEADERS_RECEIVED: 2,
        LOADING: 3,
        DONE: 4
    },
    readyState: 0,
    // events
    onloadstart: null,
    onprogress: null,
    onabort: null,
    onerror: null,
    onload: null,
    ontimeout: null,
    onloadend: null,
    onreadystatechange: null,
    // response
    status: 0,
    statusText: "",
    responseText: null,
    // functions
    abort: function () {
        console.log('XmlHttpRequestProxy - abort');

        if (this.isLocal) {
            this.xmlHttpRequest.abort.apply(this.xmlHttpRequest, arguments);
        } else {

        }
    },
    getAllResponseHeaders: function () {
        console.log('XmlHttpRequestProxy - getAllResponseHeaders');

        if (this.isLocal) {
            this.xmlHttpRequest.getAllResponseHeaders.apply(this.xmlHttpRequest, arguments);
        } else {

        }
    },
    getResponseHeader: function () {
        console.log('XmlHttpRequestProxy - getResponseHeader');

        if (this.isLocal) {
            this.xmlHttpRequest.getResponseHeader.apply(this.xmlHttpRequest, arguments);
        } else {

        }
    },
    open: function (bstrMethod, bstrUrl, varAsync, bstrUser, bstrPassword) {
        console.log('XmlHttpRequestProxy - open');

        // check if request is local
        if (bstrUrl.indexOf("http") !== 0) {
            this.isLocal = true;

            // create normal XMLHttpRequest for local requests
            this.xmlHttpRequest = new this.delegate();
            this.xmlHttpRequest.onload = this.bind(this, function () {
                // mirror status etc.
                this.status = this.xmlHttpRequest.status;
                this.statusText = this.xmlHttpRequest.statusText;
                this.responseText = this.xmlHttpRequest.responseText;

                if (this.onload) {
                    this.onload.apply(this, arguments);
                }
            });

            // forward various callbacks
            this.forwardCallback("onloadstart");
            this.forwardCallback("onprogress");
            this.forwardCallback("onabort");
            this.forwardCallback("onerror");
            this.forwardCallback("ontimeout");
            this.forwardCallback("onloadend");
            this.forwardCallback("onreadystatechange");

            // forward open call
            this.xmlHttpRequest.open(bstrMethod, bstrUrl, varAsync, bstrUser, bstrPassword);

        } else {
            // create httpclient for remote requests
            this.isLocal = false;
            this.httpClient = new Windows.Web.Http.HttpClient();

            // remember request parameters
            this.method = bstrMethod;
            this.uri = new Windows.Foundation.Uri(window.location.href, bstrUrl);
            this.async = varAsync;
        }
    },
    send: function (data) {
        console.log('XmlHttpRequestProxy - send');

        if (this.isLocal) {
            this.xmlHttpRequest.send.apply(this.xmlHttpRequest, arguments);
        } else {

            if (this.method === 'GET') {
                this.httpClient.getStringAsync(this.uri).done(this.bind(this, function (response) {
                    console.log('XmlHttpRequestProxy - send - get - done');
                    this.status = 200;
                    this.statusText = "";
                    this.response = response;

                    if (this.onload) {
                        this.onload();
                    }
                }));
            } else {
                this.httpClient.postAsync(this.uri, data).done(this.bind(this, function (response) {
                    console.log('XmlHttpRequestProxy - send - post - done');
                    this.status = 200;
                    this.statusText = "";
                    this.response = response;

                    if (this.onload) {
                        this.onload();
                    }
                }));
            }
        }
    },
    setRequestHeader: function () {
        console.log('XmlHttpRequestProxy - setRequestHeader');

        if (this.isLocal) {
            this.xmlHttpRequest.setRequestHeader.apply(this.xmlHttpRequest, arguments);
        } else {

        }
    },
    // internal variables
    httpClient: null,
    xmlHttpRequest: null,
    method: 'GET',
    uri: null,
    async: true,
    isLocal: false,
    // helper functions
    bind: function (context, func) {
        return function () {
            func.apply(context, arguments);
        };
    },
    /**
     * Fowards a given callback from the internal XMLHttpRequest to our proxy
     * @param String name
     */
    forwardCallback: function (name) {
        this.xmlHttpRequest[name] = this.bind(this, function () {
            if (this[name]) {
                this[name].apply(this, arguments);
            }
        });
    }
};

module.exports = XmlHttpRequestProxy;
window.XMLHttpRequest = XmlHttpRequestProxy;
